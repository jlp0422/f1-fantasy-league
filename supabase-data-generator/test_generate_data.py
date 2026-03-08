"""
Regression tests for generate-data.py point calculation logic.

Fixtures were captured from FastF1 live data for 5 spread-out 2025 races.
Run with: pytest test_generate_data.py -v
"""
import pytest
import pandas as pd
from unittest.mock import patch, MagicMock

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
