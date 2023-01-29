import { Constructor } from './Constructor'
import { ConstructorDriver } from './ConstructorDriver'
import { Driver } from './Driver'
import { DriverRaceResult } from './DriverRaceResult'
import { Race } from './Race'
import { Season } from './Season'

export type ConstructorWithSeason = Constructor & { season: Season }
export type DriverWithSeason = Driver & { season: Season }
export type RaceWithSeason = Race & { season: Season }
export type ConstructorDriverWithJoins = ConstructorDriver & {
  season: Season
} & { constructor: Constructor } & { driver_one: Driver } & {
  driver_two: Driver
}
export type DriverRaceResultWithJoins = DriverRaceResultWithRaceAndSeason & {
  driver: Driver
}

export type DriverRaceResultWithRaceAndSeason = DriverRaceResult & {
  race: RaceWithSeason
}
