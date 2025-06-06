import requests
import fastf1
import pandas as pd
import os
from datetime import datetime
import json
import sendgrid
from sendgrid.helpers.mail import To, Email, Content, Mail

points_map = {
    "1.0": 20,
    "2.0": 19,
    "3.0": 18,
    "4.0": 17,
    "5.0": 16,
    "6.0": 15,
    "7.0": 14,
    "8.0": 13,
    "9.0": 12,
    "10.0": 11,
    "11.0": 10,
    "12.0": 9,
    "13.0": 8,
    "14.0": 7,
    "15.0": 6,
    "16.0": 5,
    "17.0": 4,
    "18.0": 3,
    "19.0": 2,
    "20.0": 1,
}

api_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sendgrid_api_key = os.environ["SENDGRID_API_KEY"]
season = os.environ["SEASON"]
api_base_url = "https://agvtgmdvbvjnmlooagll.supabase.co/rest/v1"
get_headers = {"apikey": api_key, "Authorization": f"Bearer {api_key}"}
post_headers = get_headers.copy()
post_headers["Content-Type"] = "application/json"
GET = "GET"
POST = "POST"


def get_race_ids_by_race_name(season_id):
    races = requests.request(
        GET,
        f"{api_base_url}/race?select=id,name&season_id=eq.{season_id}",
        headers=get_headers,
    )
    race_data = races.json()
    race_info = {race["name"]: race["id"] for race in race_data}
    return race_info


def get_season_id(szn):
    season_info = requests.request(
        GET,
        f"{api_base_url}/season?select=id&year=eq.{szn}",
        headers=get_headers,
    )
    season_data = season_info.json()
    return season_data[0]["id"]


def get_most_recent_event(schedule):
    now = datetime.now()
    times = schedule['Session5Date']
    latest_time = ''

    for time in times:
        now_sec = now.timestamp()
        race_sec = time.timestamp()
        if (race_sec < now_sec):
            latest_time = time

    return schedule[schedule['Session5Date'] == latest_time].iloc[0]


def get_driver_id_by_driver_number(season_id):
    driver_information = requests.request(
        GET,
        f"{api_base_url}/driver?select=id,number&season_id=eq.{season_id}",
        headers=get_headers,
    )
    driver_data = driver_information.json()
    driver_dict = {driver["number"]: driver["id"] for driver in driver_data}
    return driver_dict


def get_constructor_id_by_driver_id(season_id):
    constructor_driver_information = requests.request(
        GET,
        f"{api_base_url}/constructor_driver?select=*&season_id=eq.{season_id}",
        headers=get_headers,
    )
    driver_constructor_data = constructor_driver_information.json()

    constructor_id_by_driver_id = {}
    for drivers in driver_constructor_data:
        constructor_id_by_driver_id[drivers["driver_one_id"]] = drivers[
            "constructor_id"
        ]
        constructor_id_by_driver_id[drivers["driver_two_id"]] = drivers[
            "constructor_id"
        ]

    return constructor_id_by_driver_id


def ping_database():
    ping_db_response = requests.request(
        GET,
        f"https://fate-of-the-eight.vercel.app/api/get-seasons",
        timeout=60
    )
    if ping_db_response.ok:
        print("Ping database successful!")
    else:
        print(
            f"Ping database failed. Reason={ping_db_response.reason}, Error={ping_db_response.raise_for_status()}"
        )


def create_row_data(rowInfo, most_recent_race_id):
    constructor_id = rowInfo["constructor_id"]
    grid_diff = rowInfo["grid_difference"]
    grid_diff_points = grid_diff / 2 if grid_diff > 0 else 0
    data = {
        "finish_position": int(rowInfo["Position"]),
        "finish_position_points": int(rowInfo["Points"]),
        "grid_difference": int(grid_diff),
        "grid_difference_points": float(grid_diff_points),
        "is_dnf": rowInfo["is_dnf"],
        "race_id": most_recent_race_id,
        "constructor_id": None if constructor_id == "null" else constructor_id,
        "driver_id": rowInfo["driver_id"],
    }
    return data


def get_data_to_update_rows(dataframe, race_id):
    update_row_data = []

    for _, row in dataframe.iterrows():
        row_dict = create_row_data(row, race_id)
        update_row_data.append(row_dict)

    return update_row_data


def get_existing_race_data(race_id):
    race_data_raw = requests.request(
        GET,
        f"{api_base_url}/driver_race_result?race_id=eq.{race_id}&select=id",
        headers=get_headers,
    )
    race_data = race_data_raw.json()
    return race_data


def format_for_email(driver_id_by_driver_number, update_row_data, df):
    driver_id_by_driver_number_keys = list(driver_id_by_driver_number.keys())
    driver_id_by_driver_number_values = list(driver_id_by_driver_number.values())
    driver_id_to_start_position = {}
    string = "Sorted By Finish Position\n"
    for row in update_row_data:
        position = driver_id_by_driver_number_values.index(row["driver_id"])
        driver_number = str(driver_id_by_driver_number_keys[position])
        df_driver = df.loc[df["DriverNumber"] == driver_number]
        driver_abbrev = df_driver["Abbreviation"][0]
        grid_pos = df_driver["GridPosition"][0]
        finish_pos = row["finish_position"]
        finish_pos_pts = row["finish_position_points"]
        grid_diff_pts = row["grid_difference_points"]
        grid_int = int(grid_pos)
        driver_id_to_start_position[row["driver_id"]] = (
            grid_int if grid_int > 0 else 20
        )

        finish_str = "DNF" if row["is_dnf"] else int(finish_pos)
        start_str = grid_int if grid_int > 0 else "Pit Lane (20th)"
        string = (
            string
            + f'{finish_str}) {driver_abbrev}: Start: {start_str}, Result Pts: {int(finish_pos_pts)}, Grid Diff Pts: {float(grid_diff_pts)}, Total Points: {finish_pos_pts + grid_diff_pts}\n'
        )

    string = string + "\nSorted by Start Position\n"
    start_order_sorted_data = sorted(
        update_row_data, key=lambda row: driver_id_to_start_position[row["driver_id"]]
    )
    for row in start_order_sorted_data:
        position = driver_id_by_driver_number_values.index(row["driver_id"])
        driver_number = str(driver_id_by_driver_number_keys[position])
        df_driver = df.loc[df["DriverNumber"] == driver_number]
        driver_abbrev = df_driver["Abbreviation"][0]
        grid_pos = df_driver["GridPosition"][0]
        string = (
            string
            + f'{int(grid_pos) if int(grid_pos) > 0 else "Pit Lane (20th)"}) {driver_abbrev}\n'
        )
    from_email = Email("f1fantasy2022@em5638.m.jeremyphilipson.com")
    to_email = To("jeremyphilipson@gmail.com")
    subject = "Race Standings Update"
    content = Content("text/plain", string)
    return Mail(from_email, to_email, subject, content)


def do_the_update():
    os.mkdir("cache")
    fastf1.Cache.enable_cache("cache")
    schedule = fastf1.get_event_schedule(int(season), include_testing=False)

    season_id = get_season_id(season)
    most_recent_event = get_most_recent_event(schedule)
    race_ids_by_race_name = get_race_ids_by_race_name(season_id)
    most_recent_event_name = most_recent_event["EventName"]
    most_recent_race_id = race_ids_by_race_name[most_recent_event_name]
    existing_data = get_existing_race_data(most_recent_race_id)

    if len(existing_data) > 0:
        print(
            f"Found existing data for Race: {most_recent_event_name} (ID: {most_recent_race_id}), no update needed..."
        )
        print("Pinging database anyway...")
        return ping_database()

    session = fastf1.get_session(int(season), most_recent_event["Location"], "R")
    session.load()

    if len(session.results) == 0:
        print(
            f"Found no results for Race: {session.event.EventName}, no update needed..."
        )
        return

    print(f"Running update for Race: {session.event.EventName}...")

    driver_id_by_driver_number = get_driver_id_by_driver_number(season_id)
    constructor_id_by_driver_id = get_constructor_id_by_driver_id(season_id)

    df = session.results[
        ["DriverNumber", "Abbreviation", "Position", "ClassifiedPosition", "GridPosition", "Time"]
    ]

    def dnf_check(row):
        # "ClassifiedPosition" is int if driver was classified, otherwise it is a string
        # "Time" is a valid time if driver finished race, otherwise it is NaT
        not_classified = not row["ClassifiedPosition"].isdigit()
        invalid_time = pd.isna(row["Time"])
        return not_classified or invalid_time

    def dnf_points(row):
        return -1 if row["is_dnf"] else row["Points"]

    def get_driver_id(driver_number):
        return driver_id_by_driver_number.get(int(driver_number))

    def get_constructor_id(driver_id):
        return constructor_id_by_driver_id.get(int(driver_id), "null")

    def get_grid_diff(row):
        if row["is_dnf"]:
            return 0
        row_grid = row["GridPosition"]
        row_pos = row["Position"]

        # indicates pit lane start
        if int(row_grid) == 0:
            return 20 - row_pos
        return row_grid - row_pos

    df["Points"] = df["Position"].map(lambda x: points_map[str(x)])
    df["is_dnf"] = df.apply(dnf_check, axis=1)
    df["driver_id"] = df["DriverNumber"].map(get_driver_id)
    df["constructor_id"] = df["driver_id"].map(get_constructor_id)
    df["Points"] = df.apply(dnf_points, axis=1)
    df["grid_difference"] = df.apply(get_grid_diff, axis=1)
    df[
        [
            "Position",
            "Points",
            "is_dnf",
            "driver_id",
            "constructor_id",
            "grid_difference",
        ]
    ]

    update_row_data = get_data_to_update_rows(df, most_recent_race_id)
    print(f"Updating rows with data={update_row_data}")

    insert_rows = requests.request(
        POST,
        f"{api_base_url}/driver_race_result",
        headers=post_headers,
        data=json.dumps(update_row_data),
    )

    if insert_rows.status_code == 201:
        sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
        mail = format_for_email(driver_id_by_driver_number, update_row_data, df)
        response = sg.client.mail.send.post(request_body=mail.get())
        print(
            f"SG status_code={response.status_code}, body={response.body}, headers={response.headers}"
        )
    else:
        print(
            f"Row insertion failed. Reason={insert_rows.reason}, Error={insert_rows.raise_for_status()}"
        )


do_the_update()
