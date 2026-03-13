import fastf1
import pandas as pd
import os
import json
import requests
from supabase import create_client

season = os.environ["SEASON"]
race_location = os.environ["RACE_LOCATION"]
supabase_url = os.environ["SUPABASE_URL"]
supabase_service_role_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

api_base_url = f"{supabase_url}/rest/v1"
get_headers = {
    "apikey": supabase_service_role_key,
    "Authorization": f"Bearer {supabase_service_role_key}",
}


def get_season_id(szn):
    resp = requests.get(
        f"{api_base_url}/season?select=id&year=eq.{szn}",
        headers=get_headers,
    )
    return resp.json()[0]["id"]


def get_race_id(season_id, race_name):
    resp = requests.get(
        f"{api_base_url}/race?select=id,name&season_id=eq.{season_id}",
        headers=get_headers,
    )
    races = resp.json()
    for race in races:
        if race["name"] == race_name:
            return race["id"]
    return None


def normalize_x_y(all_x, all_y, x_vals, y_vals):
    x_min, x_max = min(all_x), max(all_x)
    y_min, y_max = min(all_y), max(all_y)
    x_range = x_max - x_min or 1
    y_range = y_max - y_min or 1
    norm_x = [(v - x_min) / x_range for v in x_vals]
    norm_y = [(v - y_min) / y_range for v in y_vals]
    return norm_x, norm_y


def generate_replay():
    os.makedirs("cache", exist_ok=True)
    fastf1.Cache.enable_cache("cache")

    session = fastf1.get_session(int(season), race_location, "R")
    session.load(telemetry=True, laps=True)

    race_name = session.event.EventName
    print(f"Generating replay for: {race_name}")

    # Collect pos_data for all drivers
    drivers_info = []
    all_pos_frames = {}

    try:
        pos_data = session.pos_data
    except Exception as e:
        print(f"Warning: Could not load pos_data: {e}")
        pos_data = {}

    if not pos_data:
        print("Warning: pos_data is empty or unavailable for this race. Exiting without upload.")
        return

    # Gather all X/Y for normalization
    all_x = []
    all_y = []
    driver_dfs = {}

    for driver_number, df in pos_data.items():
        if df is None or df.empty:
            continue
        df = df.copy()
        if "X" not in df.columns or "Y" not in df.columns:
            continue
        df = df.dropna(subset=["X", "Y"])
        if df.empty:
            continue
        all_x.extend(df["X"].tolist())
        all_y.extend(df["Y"].tolist())
        driver_dfs[str(driver_number)] = df

    if not all_x:
        print("Warning: No valid positional data found. Exiting without upload.")
        return

    x_min, x_max = min(all_x), max(all_x)
    y_min, y_max = min(all_y), max(all_y)
    x_range = x_max - x_min or 1
    y_range = y_max - y_min or 1

    # Get driver abbreviations from session results
    abbrev_by_number = {}
    constructor_by_number = {}
    if session.results is not None and not session.results.empty:
        for _, row in session.results.iterrows():
            num = str(int(row["DriverNumber"])) if not pd.isna(row.get("DriverNumber", float("nan"))) else None
            if num:
                abbrev_by_number[num] = row.get("Abbreviation", "")
                team = row.get("TeamName", row.get("Constructor", ""))
                # Normalize to slug: lowercase, replace spaces with hyphens
                constructor_by_number[num] = str(team).lower().replace(" ", "-") if team else ""

    # Build per-driver resampled 1Hz time series
    # Use session start as t=0 reference
    session_start = None
    driver_series = {}

    for driver_number, df in driver_dfs.items():
        # Convert index to datetime if needed
        if not isinstance(df.index, pd.DatetimeIndex):
            if "Time" in df.columns:
                df = df.set_index("Time")
            else:
                continue

        if session_start is None:
            session_start = df.index.min()

        # Resample to 1Hz
        df_resampled = df[["X", "Y"]].resample("1s").mean().interpolate(method="linear")
        driver_series[driver_number] = df_resampled

    if session_start is None:
        print("Warning: Could not determine session start time. Exiting.")
        return

    # Find global time range
    all_indices = []
    for df in driver_series.values():
        all_indices.extend(df.index.tolist())

    if not all_indices:
        print("Warning: No resampled data found. Exiting.")
        return

    t_min = min(all_indices)
    t_max = max(all_indices)

    # Build unified time index at 1Hz
    time_index = pd.date_range(start=t_min, end=t_max, freq="1s")
    duration_seconds = len(time_index)

    # Reindex all drivers to unified time index
    for driver_number in driver_series:
        driver_series[driver_number] = driver_series[driver_number].reindex(time_index).interpolate(method="linear")

    # Build drivers list
    for driver_number in driver_series:
        drivers_info.append({
            "number": driver_number,
            "abbrev": abbrev_by_number.get(driver_number, driver_number),
            "constructor": constructor_by_number.get(driver_number, ""),
        })

    # Build frames
    frames = []
    for i, ts in enumerate(time_index):
        positions = {}
        for driver_number, df in driver_series.items():
            row = df.iloc[i]
            x, y = row["X"], row["Y"]
            if pd.isna(x) or pd.isna(y):
                continue
            norm_x = round((x - x_min) / x_range, 4)
            norm_y = round((y - y_min) / y_range, 4)
            positions[driver_number] = [norm_x, norm_y]
        frames.append({"t": i, "positions": positions})

    output = {
        "race_name": race_name,
        "duration_seconds": duration_seconds,
        "sample_rate_hz": 1,
        "drivers": drivers_info,
        "frames": frames,
    }

    # Get race ID from DB
    season_id = get_season_id(season)
    race_id = get_race_id(season_id, race_name)

    if race_id is None:
        print(f"Warning: Could not find race ID for '{race_name}'. Exiting without upload.")
        return

    print(f"Race ID: {race_id}, frames: {len(frames)}, drivers: {len(drivers_info)}")

    json_bytes = json.dumps(output).encode("utf-8")
    print(f"JSON size: {len(json_bytes) / 1024 / 1024:.2f} MB")

    # Upload to Supabase Storage
    client = create_client(supabase_url, supabase_service_role_key)
    file_path = f"{race_id}.json"

    # Try remove first (upsert)
    try:
        client.storage.from_("race-replays").remove([file_path])
    except Exception:
        pass

    resp = client.storage.from_("race-replays").upload(
        file_path,
        json_bytes,
        file_options={"content-type": "application/json"},
    )
    print(f"Upload complete: race-replays/{file_path}")


generate_replay()
