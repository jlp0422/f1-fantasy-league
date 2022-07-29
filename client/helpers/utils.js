export const toNum = (stringNumber) => +stringNumber

export const sortArray = (array, sortFn) => {
  const copy = [...array]
  copy.sort(sortFn)
  return copy
}

export const sum = (array) => array.reduce((sum, number) => (sum += number), 0)

export const indexBy = (key) => (array) =>
  array.reduce((memo, item) => {
    const itemKey = item[key]
    return Object.assign({}, memo, {
      [itemKey]: item,
    })
  }, {})
