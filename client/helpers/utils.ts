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

export const makeName = (driver: Driver) =>
  `${driver.first_name} ${driver.last_name}`
