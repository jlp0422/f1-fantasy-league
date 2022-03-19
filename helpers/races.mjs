export const getRacersByFinish = (race) =>
  race.reduce((memo, finish) => {
    return Object.assign({}, memo, {
      [finish.position]: finish.driver.name,
    })
  }, {})

export const getFinishByRacer = (race) =>
  race.reduce((memo, finish) => {
    return Object.assign({}, memo, {
      [finish.driver.name]: finish.position,
    })
  }, {})
