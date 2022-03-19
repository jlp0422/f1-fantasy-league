export const getRacesUrl = (season) =>
  `https://v1.formula-1.api-sports.io/races?type=race&season=${season}`

export const getRaceUrl = (raceId) =>
  `https://v1.formula-1.api-sports.io/rankings/races?race=${raceId}`

export const getUpdateSheetUrl = (spreadsheetId, sheet, range) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheet}!${range}?valueInputOption=USER_ENTERED`
