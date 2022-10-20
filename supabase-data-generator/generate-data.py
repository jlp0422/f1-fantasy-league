import requests
import fastf1
import os
from datetime import datetime
import json

year = 2022
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

revalidate_token = os.environ["REVALIDATE_TOKEN"]
api_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
api_base_url = "https://agvtgmdvbvjnmlooagll.supabase.co/rest/v1"
get_headers = {"apikey": api_key, "Authorization": f"Bearer {api_key}"}
post_headers = get_headers.copy()
post_headers["Content-Type"] = "application/json"

race_ids_by_round_number = {
    18: 58,
    19: 59,  # | 59 | United States Grand Prix  |
    20: 60,  # | 60 | Mexico City Grand Prix    |
    21: 61,  # | 61 | São Paulo Grand Prix      |
    22: 62,  # | 62 | Abu Dhabi Grand Prix      |
}


def get_most_recent_event(schedule):
    now = datetime.now()
    old_events = schedule[schedule["Session5Date"] < now]
    return old_events.iloc[-1]


def get_driver_id_by_driver_number():
    driver_information = requests.request(
        "GET", f"{api_base_url}/driver?select=id,number", headers=get_headers
    )
    driver_data = driver_information.json()
    driver_dict = {driver["number"]: driver["id"] for driver in driver_data}
    return driver_dict


def get_constructor_id_by_driver_id():
    constructor_driver_information = requests.request(
        "GET", f"{api_base_url}/constructor_driver?select=*", headers=get_headers
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


def revalidate_pages():
    revalidate_response = requests.request(
        "GET",
        f"https://fate-of-the-eight.vercel.app/api/revalidate?secret={revalidate_token}",
    )
    if revalidate_response.ok:
        print("Revalidation successful!")
    else:
        print(
            f"Revalidation failed. Reason={revalidate_response.reason}, Error={revalidate_response.raise_for_status()}"
        )


def create_row_data(rowInfo, most_recent_race_id):
    data = {
        "finish_position": int(rowInfo["Position"]),
        "finish_position_points": int(rowInfo["Points"]),
        "grid_difference": 0,
        "grid_difference_points": 0,
        "is_dnf": rowInfo["is_dnf"],
        "race_id": most_recent_race_id,
        "constructor_id": None
        if rowInfo["constructor_id"] == "null"
        else rowInfo["constructor_id"],
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
        "GET",
        f"{api_base_url}/driver_race_result?race_id=eq.{race_id}&select=id",
        headers=get_headers,
    )
    race_data = race_data_raw.json()
    return race_data


def do_the_update():
    fastf1.Cache.enable_cache("cache")
    schedule = fastf1.get_event_schedule(year, include_testing=False)

    most_recent_event = get_most_recent_event(schedule)
    most_recent_race_id = race_ids_by_round_number[most_recent_event["RoundNumber"]]
    existing_data = get_existing_race_data(most_recent_race_id)

    if len(existing_data) > 0:
        print(
            f"Found existing data for RaceId={most_recent_race_id}, no update needed..."
        )
        print("Revalidating anyway...")
        return revalidate_pages()

    session = fastf1.get_session(year, most_recent_event["Location"], "R")
    session.load(telemetry=False, laps=False, weather=False)

    driver_id_by_driver_number = get_driver_id_by_driver_number()
    constructor_id_by_driver_id = get_constructor_id_by_driver_id()

    # session includes GridPosition, use to calculate grid diff for points
    df = session.results[["DriverNumber", "Abbreviation", "Position", "Status"]]

    def dnf_check(x):
        if x.startswith("Finished"):
            return False
        if x.startswith("+"):
            return False
        return True

    def dnf_points(row):
        if row["is_dnf"] is True:
            return -1
        return row["Points"]

    def get_driver_id(x):
        return driver_id_by_driver_number.get(int(x))

    def get_constructor_id(x):
        return constructor_id_by_driver_id.get(int(x), "null")

    df["Points"] = df["Position"].map(lambda x: points_map[str(x)])
    df["is_dnf"] = df["Status"].map(dnf_check)
    df["driver_id"] = df["DriverNumber"].map(get_driver_id)
    df["constructor_id"] = df["driver_id"].map(get_constructor_id)
    df["Points"] = df.apply(dnf_points, axis=1)
    df[["Position", "Points", "is_dnf", "driver_id", "constructor_id"]]

    update_row_data = get_data_to_update_rows(df, most_recent_race_id)
    print(f"Updating rows with data={update_row_data}")

    insert_rows = requests.request(
        "POST",
        f"{api_base_url}/driver_race_result",
        headers=post_headers,
        data=json.dumps(update_row_data),
    )

    if insert_rows.status_code == 201:
        revalidate_pages()
    else:
        print(
            f"Row insertion not successful. Reason={insert_rows.reason}, Error={insert_rows.raise_for_status()}"
        )


do_the_update()
