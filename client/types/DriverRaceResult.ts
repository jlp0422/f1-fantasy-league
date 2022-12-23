/**
 * | id | finish_position | finish_position_points | grid_difference | grid_difference_points | is_dnf | race_id | constructor_id | driver_id |
| -- | --------------- | ---------------------- | --------------- | ---------------------- | ------ | ------- | -------------- | --------- |
| 27 | 7               | 14                     | 0               | 1                      | false  | 2       | 6              | 7         |
 */

export interface DriverRaceResult {
  id: number
  finish_position: number
  finish_position_points: number
  grid_difference: number
  grid_difference_points: number
  is_dnf: boolean
  race_id: number
  constructor_id: number
  driver_id: number
}
