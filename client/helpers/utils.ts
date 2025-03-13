import { GenericObject } from '@/types/Common'
import { Driver } from '@/types/Driver'

export const toNum = (stringNumber: string) => +stringNumber

export const sortArray = (array: any[], sortFn: (a: any, b: any) => any) => {
  const copy = [...array]
  copy.sort(sortFn)
  return copy
}

export const sum = (array: number[]): number =>
  array.reduce((sum, number) => (sum += number), 0)

export const indexBy = (key: string) => (array: GenericObject[]) =>
  array.reduce((memo, item) => {
    const itemKey = item[key]
    return Object.assign({}, memo, {
      [itemKey]: item,
    })
  }, {})

export const makeName = (driver?: Driver) => {
  if (!driver?.first_name || !driver?.last_name) return ''
  return `${driver.first_name} ${driver.last_name}`
}

export const sortAlpha = (a: string, b: string) => (a > b ? 1 : -1)

export const ordinal = (num: number) => {
  let j = num % 10
  let k = num % 100
  if (j === 1 && k !== 11) {
    return num + 'st'
  }
  if (j === 2 && k !== 12) {
    return num + 'nd'
  }
  if (j === 3 && k !== 13) {
    return num + 'rd'
  }
  return num + 'th'
}
