export interface ConstructorTotalPoints {
  id: number
  name: string
  total_points: number
}

export type ConstructorsById = Record<string, ConstructorTotalPoints>

export type IndexedRacePoints = Record<
  string,
  Record<string, Record<'race_points', number>>
>

export type ImageSize = 'xsmall' | 'small' | 'medium' | 'large'

export type GenericObject = Record<string, any>
