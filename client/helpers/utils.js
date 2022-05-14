export const toNum = (stringNumber) => +stringNumber

export const sortArray = (array, sortFn) => {
  const copy = [...array]
  copy.sort(sortFn)
  return copy
}

export const sum = (array) => array.reduce((sum, number) => (sum += number), 0)
