import { readFile } from 'fs/promises'
import { google } from 'googleapis'
import fetch from 'node-fetch'
import { DRIVER_TO_ROW } from './helpers/drivers.mjs'
import {
  getFinishByRacer,
  getLatestCompletedRace,
  isDNF,
} from './helpers/races.mjs'
import { getRaceUrl } from './helpers/url.mjs'
import { COLUMN_BY_RACE_ID, races } from './races.mjs'
// import nodemailer from "nodemailer"
// import mg from "nodemailer-mailgun-transport"
// import mailgun from 'mailgun-js'
import formData from 'form-data'
import Mailgun from 'mailgun.js'

const sheets = google.sheets('v4')

const key = JSON.parse(
  await readFile(
    new URL('./f1-fantasy-2022-acf2e02d0d77.json', import.meta.url)
  )
)

const mailgun = new Mailgun(formData)
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY })

const auth = new google.auth.JWT({
  email: key.client_email,
  keyFile: 'f1-fantasy-2022-acf2e02d0d77.json',
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

google.options({ auth })

const lastCompletedRace = getLatestCompletedRace(races)
const columnToUpdate = COLUMN_BY_RACE_ID[lastCompletedRace.id]

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

if (raceFinishAndRows.length < 10) {
  console.log('\n')
  console.log('Mismatch driver length, manual update required :/')
  console.log(raceFinishAndRows)
  console.log('\n')
  const data = {
    from: `F1 FANTASY 2022 <mailgun@${process.env.MAILGUN_DOMAIN}>`,
    to: 'jeremyphilipson@gmail.com',
    subject: 'F1 Standings Update',
    text: 'Mismatch driver lenght, manual update required!',
  }
  mg.messages
    .create(process.env.MAILGUN_DOMAIN, data)
    .then((msg) => console.log(msg)) // logs response data
    .catch((err) => console.log(err)) // logs any error
} else {
  const sortedFinishByRow = [...raceFinishAndRows].sort((a, b) => a.row - b.row)
  const sheetFormattedArray = sortedFinishByRow.map(({ finish }) => ({
    values: [
      {
        userEnteredValue: isDNF(finish)
          ? { stringValue: finish }
          : { numberValue: finish },
      },
    ],
  }))

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
              startColumnIndex: columnToUpdate.columnIndex,
              endColumnIndex: columnToUpdate.columnIndex + 1,
            },
          },
        },
      ],
    },
  })

  if (res.status === 200 && res.statusText === 'OK') {
    console.log('Update successful! 🏎💨')
    const data = {
      from: `F1 FANTASY 2022 <mailgun@${process.env.MAILGUN_DOMAIN}>`,
      to: 'jeremyphilipson@gmail.com',
      subject: 'F1 Standings Update',
      text: 'Update successful! 🏎💨',
    }
    mg.messages
      .create(process.env.MAILGUN_DOMAIN, data)
      .then((msg) => console.log(msg)) // logs response data
      .catch((err) => console.log(err)) // logs any error
  } else {
    console.log(
      `Something went wrong: ${res.statusText} with error: ${res.data?.error?.message}`
    )
  }
}
