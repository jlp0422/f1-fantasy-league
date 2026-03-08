import fastf1
import pandas as pd
import os

points_map = {
    1: 20, 2: 19, 3: 18, 4: 17, 5: 16,
    6: 15, 7: 14, 8: 13, 9: 12, 10: 11,
    11: 10, 12: 9, 13: 8, 14: 7, 15: 6,
    16: 5, 17: 4, 18: 3, 19: 2, 20: 1,
}

os.makedirs("cache", exist_ok=True)
fastf1.Cache.enable_cache("cache")

session = fastf1.get_session(2026, "Australia", "R")
session.load()

df = session.results[
    ["DriverNumber", "Abbreviation", "Position", "ClassifiedPosition", "GridPosition", "Time"]
].copy()

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
    return points_map.get(int(pos), 0)

def get_grid_diff(row):
    if row["is_dnf"]:
        return 0
    grid = int(row["GridPosition"])
    pos = row["Position"]
    if grid == 0:
        return 20 - pos
    return grid - pos

df["is_dnf"] = df.apply(dnf_check, axis=1)
df["Points"] = df.apply(get_finish_points, axis=1)
df["grid_difference"] = df.apply(get_grid_diff, axis=1)
df["grid_diff_points"] = df["grid_difference"].apply(lambda g: g / 2 if g > 0 else 0)
df["total_points"] = df["Points"] + df["grid_diff_points"]
df_sorted = df.sort_values("Position")

print(f"\n{'='*65}")
print(f"  DRY RUN — {session.event.EventName} {session.event.year} — Points Preview")
print(f"{'='*65}")
print(f"{'POS':<5} {'DRIVER':<8} {'START':<8} {'RESULT PTS':<12} {'GRID DIFF PTS':<16} {'TOTAL'}")
print(f"{'-'*65}")

for _, row in df_sorted.iterrows():
    pos = "DNF" if row["is_dnf"] else str(int(row["Position"]))
    abbrev = row["Abbreviation"]
    grid = int(row["GridPosition"])
    start_str = str(grid) if grid > 0 else "PL(20)"
    result_pts = int(row["Points"])
    grid_pts = float(row["grid_diff_points"])
    total = row["total_points"]
    print(f"{pos:<5} {abbrev:<8} {start_str:<8} {result_pts:<12} {grid_pts:<16} {total}")

print(f"{'='*65}\n")
