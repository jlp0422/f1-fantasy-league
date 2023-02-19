export const raceColumns =
  'id, location, country, start_date, season!inner(year)'

export const constructorColumns =
  'id, name, team_principal, season!inner(id, year)'

export const driverRaceResultColumns = `
  id,
  finish_position_points,
  grid_difference_points,
  race!inner(
    id,
    name,
    location,
    start_date,
    season!inner(
      id,
      year
    )
  ),
  driver(
    id,
    abbreviation,
    first_name,
    last_name,
    number,
    image_url
  )
`
