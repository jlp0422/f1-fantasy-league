import requests
import fastf1
from datetime import datetime
import json

year = 2022

fastf1.Cache.enable_cache('cache')
schedule = fastf1.get_event_schedule(year, include_testing=False)
# print(schedule)

today = datetime.now()
# print("Today's date:", today)

# for index, row in schedule.iterrows():
# 	print("\n",
# 		# "round: ", row["RoundNumber"],"\n",
# 		# "country: ", row["Country"],"\n",
# 		# "location: ", row["Location"],"\n",
# 		"event name: ", row["EventName"],"\n",
# 		# "event type: ", row["Session5"],"\n",
# 		"start date: ", row["Session5Date"],"\n",
# 		"in past? ", today > row["Session5Date"])
# 	# print(row)


old_events = schedule[schedule['Session5Date'] < today]
most_recent_event = old_events.iloc[-1]

session = fastf1.get_session(year, most_recent_event["Location"], 'R')
session.load(telemetry=False, laps=False, weather=False)

print(session.results)
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndnRnbWR2YnZqbm1sb29hZ2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTc4NTAzNzMsImV4cCI6MTk3MzQyNjM3M30.hpPZolMMWM5XVQnogL4dMwTbf50gp_IQ-lm3Kvt3pIk"

api_base_url = "https://agvtgmdvbvjnmlooagll.supabase.co/rest/v1"
headers = {
	"apikey": anon_key,
	"Authorization": f'Bearer {anon_key}'
}
get_response = requests.request("GET", f'{api_base_url}/constructor?select=name', headers=headers)
print(get_response.json())

# curl -X POST 'https://agvtgmdvbvjnmlooagll.supabase.co/rest/v1/driver_race_result' \
# -H "apikey: SUPABASE_KEY" \
# -H "Authorization: Bearer SUPABASE_KEY" \
# -H "Content-Type: application/json" \
# -d '[{ "some_column": "someValue" }, { "other_column": "otherValue" }]'

# curl -X POST 'https://agvtgmdvbvjnmlooagll.supabase.co/rest/v1/constructor' \
# -H "apikey: SUPABASE_KEY" \
# -H "Authorization: Bearer SUPABASE_KEY" \
# -H "Content-Type: application/json" \
# -d '[{ "some_column": "someValue" }, { "other_column": "otherValue" }]'

# post_data = {
# 	"id": 9,
# 	"name": "api post test",
# 	"season_id": 1,
# 	"team_principal": "replit",
# 	"number": 99,
# 	"sponsor": "ReplIT",
# 	"car_image_url": "",
# 	"number_image_url": ""
# }

# post_response = requests.request("POST", f'{api_base_url}/constructor', headers={
# 	"apikey": anon_key,
# 	"Authorization": f'Bearer {anon_key}',
# 	"Content-Type": "application/json"
# }, data=json.dumps(post_data))

# print(post_response.json())
