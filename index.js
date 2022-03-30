import sgMail from '@sendgrid/mail'
import { readFile } from 'fs/promises'
import { google } from 'googleapis'
import ms from 'ms'
import cron from 'node-cron'
import fetch from 'node-fetch'
import { DRIVER_TO_ROW } from './helpers/drivers.mjs'
import {
  getFinishByRacer,
  getLatestCompletedRace,
  isDNF,
} from './helpers/races.mjs'
import { getColumnValues } from './helpers/spreadsheet.mjs'
import { getRaceUrl } from './helpers/url.mjs'
import { COLUMN_BY_RACE_ID, races } from './races.mjs'

const NUM_DRIVERS = 20

const sheets = google.sheets('v4')

const key = JSON.parse(
  await readFile(
    new URL('./f1-fantasy-2022-da81751f791f.json', import.meta.url)
  )
)

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const MAIL_DATA = {
  from: 'F1 Fantasy 2022 <f1fantasy2022@em5638.m.jeremyphilipson.com>',
  to: ['jeremyphilipson@gmail.com'],
  replyTo: 'jeremyphilipson@gmail.com',
  subject: 'F1 Standings Update',
}

const auth = new google.auth.JWT({
  email: key.client_email,
  keyFile: 'f1-fantasy-2022-da81751f791f.json',
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

google.options({ auth })

const THREE_DAYS = ms('3d')

async function main() {
  const NOW_DATE = new Date().toUTCString()
  const log = (level) => (log) => {
    console[level](NOW_DATE, '::', log)
  }
  const LOG_INFO = log('log')
  const LOG_ERROR = log('error')

  const lastCompletedRace = getLatestCompletedRace(races)
  const columnToUpdate = COLUMN_BY_RACE_ID[lastCompletedRace.id]
  const { columnLetter, columnIndex } = columnToUpdate

  const nowMs = new Date().getTime()
  const isRaceOlderThanThreeDays =
    nowMs - lastCompletedRace.date_ms > THREE_DAYS

  if (isRaceOlderThanThreeDays) {
    const message = 'Race happened more than three days ago, no update required'
    LOG_INFO(message)

    const data = {
      ...MAIL_DATA,
      text: message,
    }
    sgMail.send(data).then(LOG_INFO).catch(LOG_ERROR)

    return
  }

  const raceFinish = await fetch(getRaceUrl(lastCompletedRace.id), {
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
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

  if (raceFinishAndRows.length < NUM_DRIVERS) {
    const message = 'Mismatch driver length, manual update required!'
    LOG_INFO(message)
    console.log('\n')
    LOG_INFO(raceFinishAndRows)

    const data = {
      ...MAIL_DATA,
      text: message,
    }
    sgMail.send(data).then(LOG_INFO).catch(LOG_ERROR)
  } else {
    const sortedFinishByRow = [...raceFinishAndRows].sort(
      (a, b) => a.row - b.row
    )
    const sheetFormattedArray = sortedFinishByRow.map(({ finish }) => ({
      values: [
        {
          userEnteredValue: isDNF(finish)
            ? { stringValue: finish }
            : { numberValue: finish },
        },
      ],
    }))

    const existingColumnData = await sheets.spreadsheets.get({
      ranges: [
        // change to 'RACE RESULTS' when going live
        `'TEST SHEET'!${columnLetter}2:${columnLetter}21`,
      ],
      spreadsheetId: process.env.SPREADSHEET_ID,
      includeGridData: true,
    })

    const existingFinishForRace = getColumnValues(existingColumnData)
    const hasRaceData =
      existingFinishForRace.filter(Boolean).length === NUM_DRIVERS

    if (hasRaceData) {
      LOG_INFO('Race has already been updated, exiting...')
      return
    }
    LOG_INFO('No race data, updating...')

    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            updateCells: {
              rows: sheetFormattedArray,
              fields: 'userEnteredValue',
              range: {
                // process.env.RACE_RESULTS_SHEET_ID
                sheetId: process.env.TEST_SHEET_ID,
                startRowIndex: 1,
                endRowIndex: 20,
                startColumnIndex: columnIndex,
                endColumnIndex: columnIndex + 1,
              },
            },
          },
        ],
      },
    })

    if (res.status === 200 && res.statusText === 'OK') {
      const message = 'Update successful! 🏎💨'
      LOG_INFO(message)

      const data = {
        ...MAIL_DATA,
        text: message,
      }
      sgMail.send(data).then(LOG_INFO).catch(LOG_ERROR)
    } else {
      LOG_INFO(
        `Something went wrong: ${res.statusText} with error: ${res.data?.error?.message}`
      )
    }
  }
}

const cronOptions = {
  timezone: 'America/New_York',
}

if (process.env.NODE_ENV === 'production') {
  // run process from 12pm - 10pm on Sunday only
  cron.schedule(
    '0 12-22 * * SUN',
    () => {
      main()
    },
    cronOptions
  )
}

if (process.env.NODE_ENV === 'development') {
  // every minute
  cron.schedule(
    '* * * * *',
    () => {
      main()
    },
    cronOptions
  )
}
