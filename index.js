// const { races } = require('./mock-races')
import { race } from './mock-race.mjs'
import fetch from 'node-fetch'
import { getRaceUrl, getRacesUrl, getUpdateSheetUrl } from './helpers/url.mjs'
import { getRacersByFinish, getFinishByRacer } from './helpers/races.mjs'

const apiKey = '1275df2d6f75b092d17e3de25bfbdc05'
const spreadsheetId = '1iZxeBzQ4tfAnhKghfBg-IsZLAWaeVODO3HLrJcxvKag'

const bahrainUrl = getUpdateSheetUrl(spreadsheetId, 'RACE RESULTS', 'D2:D21')

const raceFinish = await fetch('https://api.github.com/users/github', {
  // headers: {
  //   'x-rapidapi-key': apiKey,
  //   'x-rapidapi-host': 'v1.formula-1.api-sports.io',
  // },
})
  .then(() => race)
  .then(getFinishByRacer)
// .then((finish) => {})

console.log({ raceFinish })

const updated = await fetch(bahrainUrl, {
  method: 'PUT',
  body: {
    range: 'RACE RESULTS!D2:D21',
    majorDimension: 'COLUMNS',
    values: [[1, 2, 3, 4, 5, 6, 7, 8, 9]],
  },
})

console.log({ updated })

// const isStatus = (status) => (race) => status === race.status
// const isNotStatus = (status) => (race) => status !== race.status

// const eligibleRaces = races.filter(isNotStatus('Cancelled'))
// const completedRaces = eligibleRaces.filter(isStatus('Completed'))

// console.log({ eligibleRaces, completedRaces, racerByFinish })
