import path from 'path'
import fs from 'fs'
import readline from 'readline'
import { fileURLToPath } from 'url'
import { races } from './races.mjs'
import { DRIVER_TO_ROW } from './helpers/drivers.mjs'
import { race } from './mock-race.mjs'
import fetch from 'node-fetch'
import { getRaceUrl, getUpdateSheetUrl } from './helpers/url.mjs'
import { getFinishByRacer, getLatestCompletedRace } from './helpers/races.mjs'
import { readFile } from 'fs/promises'

import { google } from 'googleapis'
import { authenticate } from '@google-cloud/local-auth'

const key = JSON.parse(
  await readFile(
    new URL('./f1-fantasy-2022-acf2e02d0d77.json', import.meta.url)
  )
)
const __dirname = fileURLToPath(import.meta.url)
const sheets = google.sheets('v4')

// Obtain user credentials to use for the request
const auth = new google.auth.JWT({
  //await authenticate({
  // keyfilePath: path.join(__dirname, '../f1-fantasy-2022-acf2e02d0d77.json'),
  // scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  email: key.client_email,
  keyFile: 'f1-fantasy-2022-acf2e02d0d77.json',
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

// auth.authorize()
google.options({ auth })

const apiKey = '1275df2d6f75b092d17e3de25bfbdc05'
const googleApiKey = 'AIzaSyB-c6U9_85vitO46wOMPvz3WjXxthXaR70'
const spreadsheetId = '1iZxeBzQ4tfAnhKghfBg-IsZLAWaeVODO3HLrJcxvKag'
const standingsSheetId = 240490020

const bahrainUrl = getUpdateSheetUrl(spreadsheetId, 'RACE RESULTS', 'D2:D21')

const lastCompletedRace = getLatestCompletedRace(races)

const raceFinish = await fetch(getRaceUrl(lastCompletedRace.id), {
  headers: {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': 'v1.formula-1.api-sports.io',
  },
})
  .then((res) => res.json())
  .then((race) => race.response)
  .then(getFinishByRacer)

const raceFinishAndRows = Object.keys(raceFinish)
  .map((driver) => ({
    driver,
    finish: raceFinish[driver],
    row: DRIVER_TO_ROW[driver],
  }))
  .filter(({ row }) => row > 0)

const sortedFinishByRow = [...raceFinishAndRows].sort((a, b) => a.row - b.row)
const sheetFormattedArray = sortedFinishByRow.map(({ finish }) => ({
  values: [
    {
      userEnteredValue:
        finish === 'DNF' ? { stringValue: finish } : { numberValue: finish },
    },
  ],
}))

const res = await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      {
        updateCells: {
          // goes in order of rows
          // rows 2 - 21
          // indices 1 - 20
          // overrrides prev value
          rows: sheetFormattedArray,
          fields: 'userEnteredValue',
          range: {
            sheetId: standingsSheetId,
            startRowIndex: 1,
            endRowIndex: 20,
            startColumnIndex: 3,
            endColumnIndex: 4,
          },
        },
      },
    ],
  },
})
console.info({ res })

// const updated = await fetch(bahrainUrl, {
//   method: 'PUT',
//   body: {
//     range: 'RACE RESULTS!E2:E21',
//     majorDimension: 'COLUMNS',
//     values: [[1, 2, 3, 4, 5, 6, 7, 8, 9]],
//   },
// })

// console.log({ updated })

// const isStatus = (status) => (race) => status === race.status
// const isNotStatus = (status) => (race) => status !== race.status

// const eligibleRaces = races.filter(isNotStatus('Cancelled'))
// const completedRaces = eligibleRaces.filter(isStatus('Completed'))

// console.log({ eligibleRaces, completedRaces, racerByFinish })
