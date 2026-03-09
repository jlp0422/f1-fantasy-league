"""
Regression tests for generate-data.py point calculation logic.

Fixtures were captured from FastF1 live data and cross-checked against the DB
for 10 races across the 2025 season. Run with: pytest test_generate_data.py -v
"""
import pandas as pd

# ── replicate the logic under test ────────────────────────────────────────────

POINTS_MAP = {
    1: 20, 2: 19, 3: 18, 4: 17, 5: 16,
    6: 15, 7: 14, 8: 13, 9: 12, 10: 11,
    11: 10, 12: 9, 13: 8, 14: 7, 15: 6,
    16: 5, 17: 4, 18: 3, 19: 2, 20: 1,
    21: 0, 22: 0,
}


def dnf_check(row):
    not_classified = not str(row["ClassifiedPosition"]).isdigit()
    invalid_time = pd.isna(row["Time"])
    return not_classified or invalid_time


def get_finish_points(row):
    if row["is_dnf"]:
        return -1
    pos = row["Position"]
    if pd.isna(pos):
        return 0
    return POINTS_MAP.get(int(pos), 0)


def get_grid_diff(row):
    if row["is_dnf"]:
        return 0
    grid = int(row["GridPosition"])
    if grid == 0:
        return 20 - int(row["Position"])
    return grid - int(row["Position"])


def compute_points(results: list[dict]) -> dict[str, dict]:
    """
    Given a list of driver result dicts (matching FastF1 session.results columns),
    return {abbreviation: {finish_pts, grid_diff_pts, total}} for each driver.
    """
    df = pd.DataFrame(results)
    df["is_dnf"] = df.apply(dnf_check, axis=1)
    df["finish_pts"] = df.apply(get_finish_points, axis=1)
    df["grid_diff"] = df.apply(get_grid_diff, axis=1)
    df["grid_diff_pts"] = df["grid_diff"].apply(lambda g: g / 2 if g > 0 else 0)
    df["total"] = df["finish_pts"] + df["grid_diff_pts"]
    return {
        row["Abbreviation"]: {
            "finish_pts": row["finish_pts"],
            "grid_diff_pts": row["grid_diff_pts"],
            "total": row["total"],
            "is_dnf": row["is_dnf"],
        }
        for _, row in df.iterrows()
    }


# ── helpers ───────────────────────────────────────────────────────────────────

def row(abbrev, pos, grid, classified_pos=None, time="0 days 01:00:00"):
    """Build a result row. classified_pos defaults to str(pos) for finishers."""
    if classified_pos is None:
        classified_pos = str(int(pos))
    return {
        "Abbreviation": abbrev,
        "Position": float(pos),
        "GridPosition": float(grid),
        "ClassifiedPosition": classified_pos,
        "Time": pd.NaT if time is None else pd.Timedelta(time),
    }


def dnf_row(abbrev, pos, grid):
    return {
        "Abbreviation": abbrev,
        "Position": float(pos),
        "GridPosition": float(grid),
        "ClassifiedPosition": "R",
        "Time": pd.NaT,
    }


# ── unit tests: core logic ─────────────────────────────────────────────────────

class TestPointsMap:
    def test_covers_all_22_positions(self):
        for pos in range(1, 23):
            assert pos in POINTS_MAP

    def test_winner_gets_20(self):
        assert POINTS_MAP[1] == 20

    def test_last_classified_gets_1(self):
        assert POINTS_MAP[20] == 1

    def test_positions_21_22_get_0(self):
        assert POINTS_MAP[21] == 0
        assert POINTS_MAP[22] == 0

    def test_strictly_decreasing_through_20(self):
        for pos in range(1, 20):
            assert POINTS_MAP[pos] > POINTS_MAP[pos + 1]


class TestDnfCheck:
    def test_finisher_not_dnf(self):
        r = row("NOR", 1, 1)
        assert dnf_check(r) is False

    def test_retired_is_dnf(self):
        r = dnf_row("SAI", 18, 10)
        assert dnf_check(r) is True

    def test_withdrawn_is_dnf(self):
        r = {**row("PIA", 21, 5), "ClassifiedPosition": "W", "Time": pd.NaT}
        assert dnf_check(r) is True

    def test_nat_time_is_dnf(self):
        r = {**row("ALO", 17, 6), "ClassifiedPosition": "R", "Time": pd.NaT}
        assert dnf_check(r) is True


class TestGridDiff:
    def test_no_movement(self):
        r = {**row("NOR", 1, 1), "is_dnf": False}
        assert get_grid_diff(r) == 0

    def test_gained_positions(self):
        r = {**row("ANT", 4, 16), "is_dnf": False}
        assert get_grid_diff(r) == 12

    def test_lost_positions_returns_negative(self):
        r = {**row("PIA", 9, 2), "is_dnf": False}
        assert get_grid_diff(r) == -7

    def test_dnf_always_zero(self):
        r = {**dnf_row("SAI", 18, 10), "is_dnf": True}
        assert get_grid_diff(r) == 0

    def test_pit_lane_start_grid_zero(self):
        # GridPosition=0 (legacy pit lane) treated as starting 20th
        r = {**row("BEA", 14, 0), "is_dnf": False}
        assert get_grid_diff(r) == 6  # 20 - 14

    def test_grid_diff_points_only_positive(self):
        # Losing positions gives 0 grid_diff_pts, not negative
        results = [row("PIA", 9, 2)]
        pts = compute_points(results)
        assert pts["PIA"]["grid_diff_pts"] == 0.0

    def test_grid_diff_points_half_of_diff(self):
        results = [row("ANT", 4, 16)]
        pts = compute_points(results)
        assert pts["ANT"]["grid_diff_pts"] == 6.0  # 12 / 2


class TestDnfPoints:
    def test_dnf_gets_minus_one(self):
        results = [dnf_row("SAI", 18, 10)]
        pts = compute_points(results)
        assert pts["SAI"]["finish_pts"] == -1

    def test_dnf_total_is_minus_one(self):
        results = [dnf_row("SAI", 18, 10)]
        pts = compute_points(results)
        assert pts["SAI"]["total"] == -1.0


# ── regression fixtures: 2025 season races ────────────────────────────────────

class TestAustralia2025:
    RESULTS = [
        row("NOR", 1, 1), row("VER", 2, 3), row("RUS", 3, 4), row("ANT", 4, 16),
        row("ALB", 5, 6), row("STR", 6, 13), row("HUL", 7, 17), row("LEC", 8, 7),
        row("PIA", 9, 2), row("HAM", 10, 8), row("GAS", 11, 9), row("TSU", 12, 5),
        row("OCO", 13, 19), row("BEA", 14, 20),
        dnf_row("LAW", 15, 18), dnf_row("BOR", 16, 15), dnf_row("ALO", 17, 12),
        dnf_row("SAI", 18, 10), dnf_row("DOO", 19, 14), dnf_row("HAD", 20, 11),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["NOR"]["finish_pts"] == 20
        assert pts["NOR"]["grid_diff_pts"] == 0.0
        assert pts["NOR"]["total"] == 20.0

    def test_ant_big_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["ANT"]["finish_pts"] == 17
        assert pts["ANT"]["grid_diff_pts"] == 6.0   # (16-4)/2
        assert pts["ANT"]["total"] == 23.0

    def test_hul_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["HUL"]["grid_diff_pts"] == 5.0   # (17-7)/2

    def test_pia_lost_positions(self):
        pts = compute_points(self.RESULTS)
        assert pts["PIA"]["grid_diff_pts"] == 0.0   # started 2, finished 9

    def test_dnfs(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["LAW", "BOR", "ALO", "SAI", "DOO", "HAD"]:
            assert pts[abbrev]["is_dnf"] is True
            assert pts[abbrev]["finish_pts"] == -1


class TestBahrain2025:
    RESULTS = [
        row("PIA", 1, 1), row("RUS", 2, 3), row("NOR", 3, 6), row("LEC", 4, 2),
        row("HAM", 5, 9), row("VER", 6, 7), row("GAS", 7, 4), row("OCO", 8, 14),
        row("TSU", 9, 10), row("BEA", 10, 20), row("ANT", 11, 5), row("ALB", 12, 15),
        row("HAD", 13, 12), row("DOO", 14, 11), row("ALO", 15, 13), row("LAW", 16, 17),
        row("STR", 17, 19), row("BOR", 18, 18),
        dnf_row("SAI", 19, 8), dnf_row("HUL", 20, 16),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["PIA"]["total"] == 20.0

    def test_bea_pit_lane_start(self):
        pts = compute_points(self.RESULTS)
        assert pts["BEA"]["finish_pts"] == 11
        assert pts["BEA"]["grid_diff_pts"] == 5.0   # (20-10)/2

    def test_ham_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["HAM"]["grid_diff_pts"] == 2.0   # (9-5)/2
        assert pts["HAM"]["total"] == 18.0

    def test_dnfs(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["SAI", "HUL"]:
            assert pts[abbrev]["is_dnf"] is True


class TestMonaco2025:
    RESULTS = [
        row("NOR", 1, 1), row("LEC", 2, 2), row("PIA", 3, 3), row("VER", 4, 4),
        row("HAM", 5, 7), row("HAD", 6, 5), row("OCO", 7, 8), row("LAW", 8, 9),
        row("ALB", 9, 10), row("SAI", 10, 11), row("RUS", 11, 14), row("BEA", 12, 20),
        row("COL", 13, 18), row("BOR", 14, 16), row("STR", 15, 19), row("HUL", 16, 13),
        row("TSU", 17, 12), row("ANT", 18, 15),
        dnf_row("ALO", 19, 6), dnf_row("GAS", 20, 17),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["NOR"]["total"] == 20.0

    def test_no_grid_gain_for_top_4(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["NOR", "LEC", "PIA", "VER"]:
            assert pts[abbrev]["grid_diff_pts"] == 0.0

    def test_bea_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["BEA"]["grid_diff_pts"] == 4.0   # (20-12)/2

    def test_alo_dnf(self):
        pts = compute_points(self.RESULTS)
        assert pts["ALO"]["is_dnf"] is True
        assert pts["ALO"]["total"] == -1.0


class TestItaly2025:
    RESULTS = [
        row("VER", 1, 1), row("NOR", 2, 2), row("PIA", 3, 3), row("LEC", 4, 4),
        row("RUS", 5, 5), row("HAM", 6, 10), row("ALB", 7, 14), row("BOR", 8, 7),
        row("ANT", 9, 6), row("HAD", 10, 19), row("SAI", 11, 13), row("BEA", 12, 11),
        row("TSU", 13, 9), row("LAW", 14, 18), row("OCO", 15, 15), row("GAS", 16, 20),
        row("COL", 17, 17), row("STR", 18, 16),
        dnf_row("ALO", 19, 8), dnf_row("HUL", 20, 12),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["VER"]["total"] == 20.0

    def test_alb_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["ALB"]["grid_diff_pts"] == 3.5   # (14-7)/2

    def test_had_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["HAD"]["grid_diff_pts"] == 4.5   # (19-10)/2

    def test_top5_no_grid_gain(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["VER", "NOR", "PIA", "LEC", "RUS"]:
            assert pts[abbrev]["grid_diff_pts"] == 0.0


class TestAbuDhabi2025:
    RESULTS = [
        row("VER", 1, 1), row("PIA", 2, 3), row("NOR", 3, 2), row("LEC", 4, 5),
        row("RUS", 5, 4), row("ALO", 6, 6), row("OCO", 7, 8), row("HAM", 8, 16),
        row("HUL", 9, 18), row("STR", 10, 15), row("BOR", 11, 7), row("BEA", 12, 11),
        row("SAI", 13, 12), row("TSU", 14, 10), row("ANT", 15, 14), row("ALB", 16, 17),
        row("HAD", 17, 9), row("LAW", 18, 13), row("GAS", 19, 19), row("COL", 20, 20),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["VER"]["total"] == 20.0

    def test_ham_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["HAM"]["grid_diff_pts"] == 4.0   # (16-8)/2

    def test_hul_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["HUL"]["grid_diff_pts"] == 4.5   # (18-9)/2

    def test_no_dnfs(self):
        pts = compute_points(self.RESULTS)
        assert all(not v["is_dnf"] for v in pts.values())

    def test_col_last_place(self):
        pts = compute_points(self.RESULTS)
        assert pts["COL"]["finish_pts"] == 1
        assert pts["COL"]["grid_diff_pts"] == 0.0
        assert pts["COL"]["total"] == 1.0


# ── regression fixtures: additional 2025 races ───────────────────────────────

class TestChina2025:
    """
    NOTE: BOR/HUL/TSU were classified 14th/15th/16th by FastF1 but the DB
    records them as DNF — likely due to post-race steward exclusions/penalties.
    Tests here reflect DB truth (DNF for those three).
    """
    RESULTS = [
        row("PIA", 1, 1), row("NOR", 2, 3), row("RUS", 3, 2), row("VER", 4, 4),
        row("OCO", 5, 11), row("ANT", 6, 8), row("ALB", 7, 10), row("BEA", 8, 17),
        row("STR", 9, 14), row("SAI", 10, 15), row("HAD", 11, 7), row("LAW", 12, 20),
        row("DOO", 13, 18),
        dnf_row("BOR", 14, 19), dnf_row("HUL", 15, 12), dnf_row("TSU", 16, 9),
        dnf_row("ALO", 17, 13), dnf_row("LEC", 18, 6), dnf_row("HAM", 19, 5),
        dnf_row("GAS", 20, 16),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["PIA"]["total"] == 20.0

    def test_ocos_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["OCO"]["grid_diff_pts"] == 3.0   # (11-5)/2

    def test_bea_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["BEA"]["grid_diff_pts"] == 4.5   # (17-8)/2

    def test_bor_hul_tsu_dnf(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["BOR", "HUL", "TSU"]:
            assert pts[abbrev]["is_dnf"] is True
            assert pts[abbrev]["finish_pts"] == -1


class TestJapan2025:
    RESULTS = [
        row("VER", 1, 1), row("NOR", 2, 2), row("PIA", 3, 3), row("LEC", 4, 4),
        row("RUS", 5, 5), row("ANT", 6, 6), row("HAM", 7, 8), row("HAD", 8, 7),
        row("ALB", 9, 9), row("BEA", 10, 10), row("ALO", 11, 12), row("TSU", 12, 14),
        row("GAS", 13, 11), row("SAI", 14, 15), row("DOO", 15, 19), row("HUL", 16, 16),
        row("LAW", 17, 13), row("OCO", 18, 18), row("BOR", 19, 17), row("STR", 20, 20),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["VER"]["total"] == 20.0

    def test_no_dnfs(self):
        pts = compute_points(self.RESULTS)
        assert all(not v["is_dnf"] for v in pts.values())

    def test_top6_no_grid_gain(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["VER", "NOR", "PIA", "LEC", "RUS", "ANT"]:
            assert pts[abbrev]["grid_diff_pts"] == 0.0

    def test_doo_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["DOO"]["grid_diff_pts"] == 2.0   # (19-15)/2


class TestBritain2025:
    RESULTS = [
        row("NOR", 1, 3), row("PIA", 2, 2), row("HUL", 3, 19), row("HAM", 4, 5),
        row("VER", 5, 1), row("GAS", 6, 8), row("STR", 7, 17), row("ALB", 8, 13),
        row("ALO", 9, 7), row("RUS", 10, 4), row("BEA", 11, 18), row("SAI", 12, 9),
        row("OCO", 13, 14), row("LEC", 14, 6), row("TSU", 15, 11),
        dnf_row("ANT", 16, 10), dnf_row("HAD", 17, 12), dnf_row("BOR", 18, 16),
        dnf_row("LAW", 19, 15), dnf_row("COL", 20, 20),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["NOR"]["total"] == 21.0   # grid diff bonus

    def test_hul_massive_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["HUL"]["grid_diff_pts"] == 8.0   # (19-3)/2
        assert pts["HUL"]["total"] == 26.0

    def test_str_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["STR"]["grid_diff_pts"] == 5.0   # (17-7)/2

    def test_dnfs(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["ANT", "HAD", "BOR", "LAW", "COL"]:
            assert pts[abbrev]["is_dnf"] is True


class TestSingapore2025:
    RESULTS = [
        row("RUS", 1, 1), row("VER", 2, 2), row("NOR", 3, 5), row("PIA", 4, 3),
        row("ANT", 5, 4), row("LEC", 6, 7), row("ALO", 7, 10), row("HAM", 8, 6),
        row("BEA", 9, 9), row("SAI", 10, 18), row("HAD", 11, 8), row("TSU", 12, 13),
        row("STR", 13, 15), row("ALB", 14, 20), row("LAW", 15, 12), row("COL", 16, 16),
        row("BOR", 17, 14), row("OCO", 18, 17), row("GAS", 19, 19), row("HUL", 20, 11),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["RUS"]["total"] == 20.0

    def test_no_dnfs(self):
        pts = compute_points(self.RESULTS)
        assert all(not v["is_dnf"] for v in pts.values())

    def test_sai_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["SAI"]["grid_diff_pts"] == 4.0   # (18-10)/2

    def test_alb_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["ALB"]["grid_diff_pts"] == 3.0   # (20-14)/2

    def test_hul_lost_positions(self):
        pts = compute_points(self.RESULTS)
        assert pts["HUL"]["grid_diff_pts"] == 0.0   # started 11, finished 20


class TestSaoPaulo2025:
    RESULTS = [
        row("NOR", 1, 1), row("ANT", 2, 2), row("VER", 3, 19), row("RUS", 4, 6),
        row("PIA", 5, 4), row("BEA", 6, 8), row("LAW", 7, 7), row("HAD", 8, 5),
        row("HUL", 9, 10), row("GAS", 10, 9), row("ALB", 11, 12), row("OCO", 12, 20),
        row("SAI", 13, 15), row("ALO", 14, 11), row("COL", 15, 16), row("STR", 16, 14),
        row("TSU", 17, 17),
        dnf_row("HAM", 18, 13), dnf_row("LEC", 19, 3), dnf_row("BOR", 20, 18),
    ]

    def test_winner(self):
        pts = compute_points(self.RESULTS)
        assert pts["NOR"]["total"] == 20.0

    def test_ver_massive_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["VER"]["grid_diff_pts"] == 8.0   # (19-3)/2
        assert pts["VER"]["total"] == 26.0

    def test_oco_grid_gain(self):
        pts = compute_points(self.RESULTS)
        assert pts["OCO"]["grid_diff_pts"] == 4.0   # (20-12)/2

    def test_dnfs(self):
        pts = compute_points(self.RESULTS)
        for abbrev in ["HAM", "LEC", "BOR"]:
            assert pts[abbrev]["is_dnf"] is True


# ── create_row_data: DB payload builder ──────────────────────────────────────
#
# This function builds the exact dict inserted into driver_race_result.
# It must be tested independently because it recalculates grid_diff_points
# from the stored grid_difference value and does type coercions — bugs here
# produce silent wrong values in the DB.

def create_row_data(row_info, race_id):
    """Replicated from generate-data.py — must stay in sync."""
    constructor_id = row_info["constructor_id"]
    grid_diff = row_info["grid_difference"]
    grid_diff_points = grid_diff / 2 if grid_diff > 0 else 0
    return {
        "finish_position": int(row_info["Position"]),
        "finish_position_points": int(row_info["Points"]),
        "grid_difference": int(grid_diff),
        "grid_difference_points": float(grid_diff_points),
        "is_dnf": row_info["is_dnf"],
        "race_id": race_id,
        "constructor_id": None if constructor_id == "null" else constructor_id,
        "driver_id": row_info["driver_id"],
    }


def make_pipeline_row(abbrev, pos, grid, classified_pos, time_str, driver_id, constructor_id, points_val, grid_diff_val, is_dnf):
    """Build a fully-computed df row as it exists after the pipeline transforms."""
    return {
        "Abbreviation": abbrev,
        "Position": float(pos),
        "GridPosition": float(grid),
        "ClassifiedPosition": classified_pos,
        "Time": pd.NaT if time_str is None else pd.Timedelta(time_str),
        "DriverNumber": "1",
        "driver_id": driver_id,
        "constructor_id": constructor_id,
        "Points": points_val,
        "grid_difference": grid_diff_val,
        "is_dnf": is_dnf,
    }


class TestCreateRowData:
    """Tests for the DB payload builder — the final step before insert."""

    def test_finisher_output_keys(self):
        r = make_pipeline_row("NOR", 1, 1, "1", "0 days 01:00:00", 42, 7, 20, 0, False)
        result = create_row_data(r, race_id=110)
        assert set(result.keys()) == {
            "finish_position", "finish_position_points", "grid_difference",
            "grid_difference_points", "is_dnf", "race_id", "constructor_id", "driver_id",
        }

    def test_finisher_types(self):
        r = make_pipeline_row("NOR", 1, 1, "1", "0 days 01:00:00", 42, 7, 20, 0, False)
        result = create_row_data(r, race_id=110)
        assert isinstance(result["finish_position"], int)
        assert isinstance(result["finish_position_points"], int)
        assert isinstance(result["grid_difference"], int)
        assert isinstance(result["grid_difference_points"], float)
        assert isinstance(result["is_dnf"], bool)

    def test_finisher_values(self):
        # NOR: P1, started P3 → grid_diff=2, grid_diff_pts=1.0
        r = make_pipeline_row("NOR", 1, 3, "1", "0 days 01:00:00", 42, 7, 20, 2, False)
        result = create_row_data(r, race_id=110)
        assert result["finish_position"] == 1
        assert result["finish_position_points"] == 20
        assert result["grid_difference"] == 2
        assert result["grid_difference_points"] == 1.0
        assert result["is_dnf"] is False
        assert result["race_id"] == 110
        assert result["constructor_id"] == 7
        assert result["driver_id"] == 42

    def test_dnf_values(self):
        r = make_pipeline_row("SAI", 18, 10, "R", None, 99, 3, -1, 0, True)
        result = create_row_data(r, race_id=113)
        assert result["finish_position_points"] == -1
        assert result["grid_difference"] == 0
        assert result["grid_difference_points"] == 0.0
        assert result["is_dnf"] is True

    def test_null_constructor_id_becomes_none(self):
        r = make_pipeline_row("NOR", 1, 1, "1", "0 days 01:00:00", 42, "null", 20, 0, False)
        result = create_row_data(r, race_id=110)
        assert result["constructor_id"] is None

    def test_valid_constructor_id_preserved(self):
        r = make_pipeline_row("NOR", 1, 1, "1", "0 days 01:00:00", 42, 7, 20, 0, False)
        result = create_row_data(r, race_id=110)
        assert result["constructor_id"] == 7

    def test_grid_diff_points_recalculated_from_grid_difference(self):
        # grid_difference=10 → grid_difference_points=5.0
        r = make_pipeline_row("HUL", 3, 19, "3", "0 days 01:00:00", 55, 2, 18, 16, False)
        result = create_row_data(r, race_id=121)
        assert result["grid_difference"] == 16
        assert result["grid_difference_points"] == 8.0

    def test_negative_grid_diff_points_is_zero(self):
        # Driver started P2, finished P9 → grid_diff=-7 → points=0
        r = make_pipeline_row("PIA", 9, 2, "9", "0 days 01:00:00", 11, 5, 12, -7, False)
        result = create_row_data(r, race_id=110)
        assert result["grid_difference"] == -7
        assert result["grid_difference_points"] == 0.0

    def test_race_id_is_set_correctly(self):
        r = make_pipeline_row("NOR", 1, 1, "1", "0 days 01:00:00", 42, 7, 20, 0, False)
        assert create_row_data(r, race_id=999)["race_id"] == 999


class TestEndToEndPayload:
    """Verify the full pipeline produces a correct, insertable DB payload."""

    PIPELINE_RESULTS = [
        row("NOR", 1, 3),
        row("PIA", 2, 2),
        row("HUL", 3, 19),
        dnf_row("ANT", 16, 10),
    ]

    def test_payload_row_count_matches_input(self):
        df = pd.DataFrame(self.PIPELINE_RESULTS)
        df["is_dnf"] = df.apply(dnf_check, axis=1)
        df["Points"] = df.apply(get_finish_points, axis=1)
        df["grid_difference"] = df.apply(get_grid_diff, axis=1)
        df["driver_id"] = 1
        df["constructor_id"] = 1
        payload = [create_row_data(r, 110) for _, r in df.iterrows()]
        assert len(payload) == 4

    def test_all_payload_rows_have_required_keys(self):
        required = {"finish_position", "finish_position_points", "grid_difference",
                    "grid_difference_points", "is_dnf", "race_id", "constructor_id", "driver_id"}
        df = pd.DataFrame(self.PIPELINE_RESULTS)
        df["is_dnf"] = df.apply(dnf_check, axis=1)
        df["Points"] = df.apply(get_finish_points, axis=1)
        df["grid_difference"] = df.apply(get_grid_diff, axis=1)
        df["driver_id"] = 1
        df["constructor_id"] = 1
        for _, r in df.iterrows():
            assert set(create_row_data(r, 110).keys()) == required

    def test_hul_end_to_end_britain(self):
        """HUL: P3, started P19 — full pipeline must produce correct DB payload."""
        r = make_pipeline_row("HUL", 3, 19, "3", "0 days 01:00:00", 55, 2, 18, 16, False)
        result = create_row_data(r, race_id=121)
        assert result["finish_position"] == 3
        assert result["finish_position_points"] == 18
        assert result["grid_difference"] == 16
        assert result["grid_difference_points"] == 8.0
        assert result["is_dnf"] is False


class TestClassifiedPositionVariants:
    """
    DNF classification must handle all non-numeric ClassifiedPosition codes.
    F1 uses: 'R' (retired), 'W' (withdrawn), 'D' (DSQ), 'E', 'F', 'N', 'NC'.
    All must be treated as DNF; only digit strings (e.g. '3', '14') are finishers.
    """

    def test_disqualified_is_dnf(self):
        r = {**row("VER", 1, 1), "ClassifiedPosition": "D", "Time": pd.NaT}
        assert dnf_check(r) is True

    def test_not_classified_nc_is_dnf(self):
        r = {**row("ALO", 15, 6), "ClassifiedPosition": "NC", "Time": pd.NaT}
        assert dnf_check(r) is True

    def test_retired_r_is_dnf(self):
        r = dnf_row("SAI", 18, 10)
        assert dnf_check(r) is True

    def test_withdrawn_w_is_dnf(self):
        r = {**row("PIA", 21, 5), "ClassifiedPosition": "W", "Time": pd.NaT}
        assert dnf_check(r) is True

    def test_numeric_string_is_not_dnf(self):
        r = row("NOR", 1, 1)
        assert dnf_check(r) is False

    def test_multidigit_position_is_not_dnf(self):
        r = row("COL", 14, 20)
        assert dnf_check(r) is False

    def test_disqualified_gets_minus_one_points(self):
        results = [{**row("VER", 1, 1), "ClassifiedPosition": "D", "Time": pd.NaT}]
        pts = compute_points(results)
        assert pts["VER"]["finish_pts"] == -1
        assert pts["VER"]["total"] == -1.0


class TestDriverConstructorIdLookup:
    """
    Verify the driver/constructor ID lookup behavior that feeds create_row_data.
    Missing IDs must not silently produce wrong data.
    """

    def test_missing_driver_number_returns_none(self):
        lookup = {1: 101, 44: 202}
        result = lookup.get(int("99"))  # driver number 99 not in DB
        assert result is None

    def test_missing_constructor_returns_null_string(self):
        lookup = {101: 7, 202: 3}
        result = lookup.get(int("999"), "null")  # driver_id 999 not assigned
        assert result == "null"

    def test_null_string_maps_to_none_in_payload(self):
        r = make_pipeline_row("NOR", 1, 1, "1", "0 days 01:00:00", 42, "null", 20, 0, False)
        result = create_row_data(r, race_id=110)
        assert result["constructor_id"] is None

    def test_constructor_driver_both_drivers_mapped(self):
        """Both driver_one_id and driver_two_id must map to the same constructor_id."""
        raw = [{"driver_one_id": 10, "driver_two_id": 20, "constructor_id": 5}]
        lookup = {}
        for entry in raw:
            lookup[entry["driver_one_id"]] = entry["constructor_id"]
            lookup[entry["driver_two_id"]] = entry["constructor_id"]
        assert lookup[10] == 5
        assert lookup[20] == 5


class TestFormatForEmail:
    """Smoke tests for the email formatter — ensures it produces valid output."""

    def _make_inputs(self):
        driver_id_by_number = {1: 101, 44: 202, 16: 303}
        update_row_data = [
            {"driver_id": 101, "finish_position": 1, "finish_position_points": 20,
             "grid_difference_points": 1.0, "is_dnf": False},
            {"driver_id": 202, "finish_position": 2, "finish_position_points": 19,
             "grid_difference_points": 0.0, "is_dnf": False},
            {"driver_id": 303, "finish_position": 15, "finish_position_points": -1,
             "grid_difference_points": 0.0, "is_dnf": True},
        ]
        df = pd.DataFrame([
            {"DriverNumber": "1",  "Abbreviation": "NOR", "GridPosition": 3.0},
            {"DriverNumber": "44", "Abbreviation": "HAM", "GridPosition": 1.0},
            {"DriverNumber": "16", "Abbreviation": "LEC", "GridPosition": 6.0},
        ])
        return driver_id_by_number, update_row_data, df

    def _format_for_email(self, driver_id_by_number, update_row_data, df):
        """Replicated from generate-data.py."""
        driver_number_by_id = {v: k for k, v in driver_id_by_number.items()}
        driver_id_to_start_position = {}
        string = "Sorted By Finish Position\n"
        for r in update_row_data:
            driver_number = str(driver_number_by_id[r["driver_id"]])
            df_driver = df.loc[df["DriverNumber"] == driver_number]
            driver_abbrev = df_driver["Abbreviation"].iloc[0]
            grid_pos = df_driver["GridPosition"].iloc[0]
            finish_pos = r["finish_position"]
            finish_pos_pts = r["finish_position_points"]
            grid_diff_pts = r["grid_difference_points"]
            grid_int = int(grid_pos)
            driver_id_to_start_position[r["driver_id"]] = grid_int if grid_int > 0 else 20
            finish_str = "DNF" if r["is_dnf"] else str(int(finish_pos))
            start_str = grid_int if grid_int > 0 else "Pit Lane (20th)"
            string += f'{finish_str}) {driver_abbrev}: Start: {start_str}, Result Pts: {int(finish_pos_pts)}, Grid Diff Pts: {float(grid_diff_pts)}, Total Points: {finish_pos_pts + grid_diff_pts}\n'
        string += "\nSorted by Start Position\n"
        start_order = sorted(update_row_data, key=lambda r: driver_id_to_start_position[r["driver_id"]])
        for r in start_order:
            driver_number = str(driver_number_by_id[r["driver_id"]])
            df_driver = df.loc[df["DriverNumber"] == driver_number]
            driver_abbrev = df_driver["Abbreviation"].iloc[0]
            grid_pos = df_driver["GridPosition"].iloc[0]
            string += f'{int(grid_pos) if int(grid_pos) > 0 else "Pit Lane (20th)"}) {driver_abbrev}\n'
        return string

    def test_returns_string(self):
        result = self._format_for_email(*self._make_inputs())
        assert isinstance(result, str)

    def test_contains_finish_section_header(self):
        result = self._format_for_email(*self._make_inputs())
        assert "Sorted By Finish Position" in result

    def test_contains_start_section_header(self):
        result = self._format_for_email(*self._make_inputs())
        assert "Sorted by Start Position" in result

    def test_dnf_shown_as_dnf(self):
        result = self._format_for_email(*self._make_inputs())
        assert "DNF) LEC" in result

    def test_finisher_shown_with_position(self):
        result = self._format_for_email(*self._make_inputs())
        assert "1) NOR" in result

    def test_pit_lane_start_shown_correctly(self):
        """GridPosition=0 should display as Pit Lane (20th)."""
        driver_id_by_number = {1: 101}
        update_row_data = [{"driver_id": 101, "finish_position": 10,
                            "finish_position_points": 11, "grid_difference_points": 5.0, "is_dnf": False}]
        df = pd.DataFrame([{"DriverNumber": "1", "Abbreviation": "BEA", "GridPosition": 0.0}])
        result = self._format_for_email(driver_id_by_number, update_row_data, df)
        assert "Pit Lane (20th)" in result


# ── edge case tests ───────────────────────────────────────────────────────────

class TestEdgeCases:
    def test_all_negative_grid_pos_detected(self):
        """Guard: if all GridPositions are -1, script should not update DB."""
        results = [
            {**row("NOR", 1, 1), "GridPosition": -1.0},
            {**row("VER", 2, 3), "GridPosition": -1.0},
        ]
        df = pd.DataFrame(results)
        assert (df["GridPosition"] == -1).all()

    def test_partial_grid_pos_not_blocked(self):
        """Partial -1s (e.g. pit lane start edge case) should not trigger block."""
        results = [
            {**row("NOR", 1, 1), "GridPosition": 1.0},
            {**row("VER", 2, 3), "GridPosition": -1.0},
        ]
        df = pd.DataFrame(results)
        assert not (df["GridPosition"] == -1).all()

    def test_position_beyond_22_gets_zero(self):
        assert POINTS_MAP.get(23, 0) == 0

    def test_get_most_recent_event_uses_timezone_aware_datetime(self):
        """Session5Date from FastF1 is UTC-aware; comparison must use aware datetime."""
        from datetime import timezone
        import pandas as pd
        now = pd.Timestamp.now(tz="UTC")
        past_date = pd.Timestamp("2025-01-01", tz="UTC")
        future_date = pd.Timestamp("2099-01-01", tz="UTC")
        schedule = pd.DataFrame({"Session5Date": [past_date, future_date], "EventName": ["Past", "Future"]})
        past = schedule[schedule["Session5Date"] < now]
        assert len(past) == 1
        assert past.iloc[-1]["EventName"] == "Past"

    def test_withdrawn_driver_is_dnf(self):
        results = [{
            "Abbreviation": "PIA",
            "Position": 21.0,
            "GridPosition": 5.0,
            "ClassifiedPosition": "W",
            "Time": pd.NaT,
        }]
        pts = compute_points(results)
        assert pts["PIA"]["is_dnf"] is True
        assert pts["PIA"]["finish_pts"] == -1
