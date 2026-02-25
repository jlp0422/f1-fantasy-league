import requests
import fastf1
import pandas as pd
import os
from datetime import datetime
import json

points_map = {
    1: 20,
    2: 19,
    3: 18,
    4: 17,
    5: 16,
    6: 15,
    7: 14,
    8: 13,
    9: 12,
    10: 11,
    11: 10,
    12: 9,
    13: 8,
    14: 7,
    15: 6,
    16: 5,
    17: 4,
    18: 3,
    19: 2,
    20: 1,
}

api_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
mg_api_key = os.environ["MG_API_KEY"]
season = os.environ["SEASON"]
api_base_url = "https://agvtgmdvbvjnmlooagll.supabase.co/rest/v1"
get_headers = {"apikey": api_key, "Authorization": f"Bearer {api_key}"}
post_headers = {**get_headers, "Content-Type": "application/json"}

MAILGUN_API_URL = "https://api.mailgun.net/v3/mail.jeremyphilipson.com/messages"
FROM_EMAIL_ADDRESS = "JLP Mailgun <postmaster@mail.jeremyphilipson.com>"
TO_EMAIL_ADDRESS = "jeremyphilipson@gmail.com"
EMAIL_SUBJECT = "Race Standings Update"


def get_race_ids_by_race_name(season_id):
    races = requests.get(
        f"{api_base_url}/race?select=id,name&season_id=eq.{season_id}",
        headers=get_headers,
    )
    return {race["name"]: race["id"] for race in races.json()}


def get_season_id(szn):
    season_info = requests.get(
        f"{api_base_url}/season?select=id&year=eq.{szn}",
        headers=get_headers,
    )
    return season_info.json()[0]["id"]


def get_most_recent_event(schedule):
    past = schedule[schedule["Session5Date"] < datetime.now()]
    return past.iloc[-1]


def get_driver_id_by_driver_number(season_id):
    driver_information = requests.get(
        f"{api_base_url}/driver?select=id,number&season_id=eq.{season_id}",
        headers=get_headers,
    )
    return {driver["number"]: driver["id"] for driver in driver_information.json()}


def get_constructor_id_by_driver_id(season_id):
    constructor_driver_information = requests.get(
        f"{api_base_url}/constructor_driver?select=*&season_id=eq.{season_id}",
        headers=get_headers,
    )
    constructor_id_by_driver_id = {}
    for drivers in constructor_driver_information.json():
        constructor_id_by_driver_id[drivers["driver_one_id"]] = drivers["constructor_id"]
        constructor_id_by_driver_id[drivers["driver_two_id"]] = drivers["constructor_id"]
    return constructor_id_by_driver_id


def ping_database():
    ping_db_response = requests.get(
        "https://fate-of-the-eight.vercel.app/api/get-seasons",
        timeout=60,
    )
    if ping_db_response.ok:
        print("Ping database successful!")
    else:
        print(f"Ping database failed. Status={ping_db_response.status_code}, Reason={ping_db_response.reason}")


def create_row_data(rowInfo, most_recent_race_id):
    constructor_id = rowInfo["constructor_id"]
    grid_diff = rowInfo["grid_difference"]
    grid_diff_points = grid_diff / 2 if grid_diff > 0 else 0
    return {
        "finish_position": int(rowInfo["Position"]),
        "finish_position_points": int(rowInfo["Points"]),
        "grid_difference": int(grid_diff),
        "grid_difference_points": float(grid_diff_points),
        "is_dnf": rowInfo["is_dnf"],
        "race_id": most_recent_race_id,
        "constructor_id": None if constructor_id == "null" else constructor_id,
        "driver_id": rowInfo["driver_id"],
    }


def get_data_to_update_rows(dataframe, race_id):
    return [create_row_data(row, race_id) for _, row in dataframe.iterrows()]


def get_existing_race_data(race_id):
    race_data_raw = requests.get(
        f"{api_base_url}/driver_race_result?race_id=eq.{race_id}&select=id",
        headers=get_headers,
    )
    return race_data_raw.json()


def format_for_email(driver_id_by_driver_number, update_row_data, df):
    # Build a reverse lookup: driver_id -> driver_number
    driver_number_by_id = {v: k for k, v in driver_id_by_driver_number.items()}

    driver_id_to_start_position = {}
    string = "Sorted By Finish Position\n"

    for row in update_row_data:
        driver_number = str(driver_number_by_id[row["driver_id"]])
        df_driver = df.loc[df["DriverNumber"] == driver_number]
        driver_abbrev = df_driver["Abbreviation"].iloc[0]
        grid_pos = df_driver["GridPosition"].iloc[0]
        finish_pos = row["finish_position"]
        finish_pos_pts = row["finish_position_points"]
        grid_diff_pts = row["grid_difference_points"]
        grid_int = int(grid_pos)
        driver_id_to_start_position[row["driver_id"]] = grid_int if grid_int > 0 else 20

        finish_str = "DNF" if row["is_dnf"] else str(int(finish_pos))
        start_str = grid_int if grid_int > 0 else "Pit Lane (20th)"
        string += f'{finish_str}) {driver_abbrev}: Start: {start_str}, Result Pts: {int(finish_pos_pts)}, Grid Diff Pts: {float(grid_diff_pts)}, Total Points: {finish_pos_pts + grid_diff_pts}\n'

    string += "\nSorted by Start Position\n"
    start_order_sorted_data = sorted(
        update_row_data, key=lambda row: driver_id_to_start_position[row["driver_id"]]
    )
    for row in start_order_sorted_data:
        driver_number = str(driver_number_by_id[row["driver_id"]])
        df_driver = df.loc[df["DriverNumber"] == driver_number]
        driver_abbrev = df_driver["Abbreviation"].iloc[0]
        grid_pos = df_driver["GridPosition"].iloc[0]
        string += f'{int(grid_pos) if int(grid_pos) > 0 else "Pit Lane (20th)"}) {driver_abbrev}\n'

    return string


def do_the_update():
    os.makedirs("cache", exist_ok=True)
    fastf1.Cache.enable_cache("cache")
    schedule = fastf1.get_event_schedule(int(season), include_testing=False)

    season_id = get_season_id(season)
    most_recent_event = get_most_recent_event(schedule)
    race_ids_by_race_name = get_race_ids_by_race_name(season_id)
    most_recent_event_name = most_recent_event["EventName"]
    most_recent_race_id = race_ids_by_race_name[most_recent_event_name]
    existing_data = get_existing_race_data(most_recent_race_id)

    if len(existing_data) > 0:
        print(f"Found existing data for Race: {most_recent_event_name} (ID: {most_recent_race_id}), no update needed...")
        print("Pinging database anyway...")
        return ping_database()

    session = fastf1.get_session(int(season), most_recent_event["Location"], "R")
    session.load()

    if len(session.results) == 0:
        print(f"Found no results for Race: {session.event.EventName}, no update needed...")
        return

    print(f"Running update for Race: {session.event.EventName}...")

    driver_id_by_driver_number = get_driver_id_by_driver_number(season_id)
    constructor_id_by_driver_id = get_constructor_id_by_driver_id(season_id)

    df = session.results[
        ["DriverNumber", "Abbreviation", "Position", "ClassifiedPosition", "GridPosition", "Time"]
    ].copy()

    def dnf_check(row):
        # ClassifiedPosition is an int string if classified, otherwise a non-numeric string
        # Time is NaT if the driver did not finish
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

    def get_driver_id(driver_number):
        return driver_id_by_driver_number.get(int(driver_number))

    def get_constructor_id(driver_id):
        return constructor_id_by_driver_id.get(int(driver_id), "null")

    def get_grid_diff(row):
        if row["is_dnf"]:
            return 0
        row_grid = row["GridPosition"]
        row_pos = row["Position"]
        # GridPosition == 0 was used by older FastF1 versions to indicate a pit lane start.
        # Modern FastF1 assigns penalized back-of-grid positions instead, so this branch
        # is likely never triggered, but kept for backwards compatibility.
        if int(row_grid) == 0:
            return 20 - row_pos
        return row_grid - row_pos

    df["is_dnf"] = df.apply(dnf_check, axis=1)
    df["driver_id"] = df["DriverNumber"].map(get_driver_id)
    df["constructor_id"] = df["driver_id"].map(get_constructor_id)
    df["Points"] = df.apply(get_finish_points, axis=1)
    df["grid_difference"] = df.apply(get_grid_diff, axis=1)

    update_row_data = get_data_to_update_rows(df, most_recent_race_id)
    print(f"Updating rows with data={update_row_data}")

    insert_rows = requests.post(
        f"{api_base_url}/driver_race_result",
        headers=post_headers,
        data=json.dumps(update_row_data),
    )

    if insert_rows.status_code == 201:
        driver_updates = format_for_email(driver_id_by_driver_number, update_row_data, df)
        print("Row insertion successful, data is:")
        print(driver_updates)

        try:
            resp = requests.post(
                MAILGUN_API_URL,
                auth=("api", mg_api_key),
                data={
                    "from": FROM_EMAIL_ADDRESS,
                    "to": TO_EMAIL_ADDRESS,
                    "subject": EMAIL_SUBJECT,
                    "text": driver_updates,
                },
            )
            if resp.status_code == 200:
                print(f"Successfully sent an email to '{TO_EMAIL_ADDRESS}' via Mailgun API.")
            else:
                print(f"Could not send the email, reason: {resp.text}")
        except Exception as e:
            print(f"Error sending email: {e}")
    else:
        print(f"Row insertion failed. Status={insert_rows.status_code}, Reason={insert_rows.reason}")
        print(insert_rows.text)


do_the_update()
