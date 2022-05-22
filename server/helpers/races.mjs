export const isDNF = (finish) => finish === 'DNF'

export const getRacersByFinish = (race) =>
  race.reduce((memo, finish) => {
    return Object.assign({}, memo, {
      [finish.position]: finish.driver.name,
    })
  }, {})

export const getFinishByRacer = (race) => {
  const totalLaps = race[0].laps
  return race.reduce((memo, finish) => {
    const position = finish.laps < totalLaps ? 'DNF' : finish.position
    return Object.assign({}, memo, {
      [finish.driver.name]: position,
    })
  }, {})
}

export const getLatestCompletedRace = (races) => {
  const now = new Date().getTime()
  const completedRaces = races.filter((race) => race.date_ms < now)
  const mostRecentRace = completedRaces.reduce((memo, race) => {
    return race.date_ms > memo.date_ms ? race : memo
  })
  return mostRecentRace
}
