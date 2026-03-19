import fastf1
import pandas as pd
import os
import json
import requests
from supabase import create_client


def generate_replay(season, race_location, supabase_url, supabase_service_role_key, race_id=None):
    api_base_url = f"{supabase_url}/rest/v1"
    get_headers = {
        "apikey": supabase_service_role_key,
        "Authorization": f"Bearer {supabase_service_role_key}",
    }

    os.makedirs("cache", exist_ok=True)
    fastf1.Cache.enable_cache("cache")

    session = fastf1.get_session(int(season), race_location, "R")
    session.load(telemetry=True, laps=True)

    race_name = session.event.EventName
    print(f"Generating replay for: {race_name}")

    # Collect position data per driver via laps (FastF1 3.x compatible)
    all_x = []
    all_y = []
    driver_dfs = {}

    for driver_number in session.drivers:
        try:
            drv_laps = session.laps.pick_drivers(driver_number)
            pos = drv_laps.get_pos_data()
        except Exception as e:
            print(f"Warning: Could not get pos_data for driver {driver_number}: {e}")
            continue
        if pos is None or pos.empty:
            continue
        pos = pos.copy()
        if "X" not in pos.columns or "Y" not in pos.columns:
            continue
        pos = pos.dropna(subset=["X", "Y"])
        if pos.empty:
            continue
        all_x.extend(pos["X"].tolist())
        all_y.extend(pos["Y"].tolist())
        driver_dfs[str(driver_number)] = pos

    if not driver_dfs:
        print("Warning: No valid positional data found for any driver. Exiting without upload.")
        return

    if not all_x:
        print("Warning: No valid positional data found. Exiting without upload.")
        return

    x_min, x_max = min(all_x), max(all_x)
    y_min, y_max = min(all_y), max(all_y)
    x_range = x_max - x_min or 1
    y_range = y_max - y_min or 1

    abbrev_by_number = {}
    constructor_by_number = {}
    if session.results is not None and not session.results.empty:
        for _, row in session.results.iterrows():
            num = str(int(row["DriverNumber"])) if not pd.isna(row.get("DriverNumber", float("nan"))) else None
            if num:
                abbrev_by_number[num] = row.get("Abbreviation", "")
                team = row.get("TeamName", row.get("Constructor", ""))
                constructor_by_number[num] = str(team).lower().replace(" ", "-") if team else ""

    # Build driver_series keyed by integer seconds to avoid Timedelta precision issues
    driver_series = {}

    for driver_number, df in driver_dfs.items():
        # FastF1 pos_data uses a TimedeltaIndex (relative to session start)
        if "Time" in df.columns and not isinstance(df.index, pd.TimedeltaIndex):
            df = df.set_index("Time")
        # Drop negative times (before session start)
        df = df[df.index >= pd.Timedelta(0)]
        if df.empty:
            continue
        # Resample to 1Hz, then convert index to integer seconds for reliable alignment
        df_resampled = df[["X", "Y"]].resample("1s").mean().interpolate(method="linear")
        df_resampled.index = [round(td.total_seconds()) for td in df_resampled.index]
        driver_series[driver_number] = df_resampled

    if not driver_series:
        print("Warning: No resampled data found. Exiting.")
        return

    all_seconds = []
    for df in driver_series.values():
        all_seconds.extend(df.index.tolist())

    t_min_secs = max(0, min(all_seconds))
    t_max_secs = max(all_seconds)

    time_index_secs = list(range(t_min_secs, t_max_secs + 1))
    duration_seconds = len(time_index_secs)

    # Reindex each driver to the unified integer-second range
    for driver_number in driver_series:
        driver_series[driver_number] = (
            driver_series[driver_number]
            .reindex(time_index_secs)
            .interpolate(method="index")
        )

    drivers_info = []
    for driver_number in driver_series:
        drivers_info.append({
            "number": driver_number,
            "abbrev": abbrev_by_number.get(driver_number, driver_number),
            "constructor": constructor_by_number.get(driver_number, ""),
        })

    frames = []
    for i in range(len(time_index_secs)):
        positions = {}
        for driver_number, df in driver_series.items():
            row = df.iloc[i]
            x, y = row["X"], row["Y"]
            if pd.isna(x) or pd.isna(y):
                continue
            positions[driver_number] = [
                round((x - x_min) / x_range, 4),
                round((y - y_min) / y_range, 4),
            ]
        frames.append({"t": i, "positions": positions})

    # Build sparse lap events aligned to integer-second frame indices
    lap_events = []
    for driver_number in session.drivers:
        try:
            drv_laps = session.laps.pick_drivers(driver_number)
            for _, lap in drv_laps.iterlaps():
                lap_start = lap["LapStartTime"]
                lap_num = lap["LapNumber"]
                position = lap.get("Position", None)
                if pd.isna(lap_start) or pd.isna(lap_num):
                    continue
                # Offset by t_min_secs so t is in the same coordinate space as frame.t
                t_sec = int(lap_start.total_seconds()) - t_min_secs
                lap_events.append({
                    "t": max(0, t_sec),
                    "driver": str(driver_number),
                    "lap": int(lap_num),
                    "position": int(position) if position is not None and not pd.isna(position) else None,
                })
        except Exception as e:
            print(f"Warning: Could not get lap events for driver {driver_number}: {e}")

    lap_events.sort(key=lambda x: x["t"])
    print(f"lap_events: {len(lap_events)}, first t={lap_events[0]['t'] if lap_events else 'n/a'}, last t={lap_events[-1]['t'] if lap_events else 'n/a'}")

    output = {
        "race_name": race_name,
        "duration_seconds": duration_seconds,
        "sample_rate_hz": 1,
        "drivers": drivers_info,
        "frames": frames,
        "lap_events": lap_events,
    }

    # Resolve race_id from DB if not provided
    if race_id is None:
        season_resp = requests.get(
            f"{api_base_url}/season?select=id&year=eq.{season}",
            headers=get_headers,
        )
        season_id = season_resp.json()[0]["id"]
        races_resp = requests.get(
            f"{api_base_url}/race?select=id,name&season_id=eq.{season_id}",
            headers=get_headers,
        )
        race_id = next((r["id"] for r in races_resp.json() if r["name"] == race_name), None)

    if race_id is None:
        print(f"Warning: Could not find race ID for '{race_name}'. Exiting without upload.")
        return

    print(f"Race ID: {race_id}, frames: {len(frames)}, drivers: {len(drivers_info)}")

    json_bytes = json.dumps(output).encode("utf-8")
    print(f"JSON size: {len(json_bytes) / 1024 / 1024:.2f} MB")

    client = create_client(supabase_url, supabase_service_role_key)
    file_path = f"{race_id}.json"

    try:
        client.storage.from_("race-replays").remove([file_path])
    except Exception:
        pass

    client.storage.from_("race-replays").upload(
        file_path,
        json_bytes,
        file_options={"content-type": "application/json"},
    )
    print(f"Upload complete: race-replays/{file_path}")


if __name__ == "__main__":
    generate_replay(
        season=os.environ["SEASON"],
        race_location=os.environ["RACE_LOCATION"],
        supabase_url=os.environ["SUPABASE_URL"],
        supabase_service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
