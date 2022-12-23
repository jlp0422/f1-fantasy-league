export interface Driver {
  id: number
  first_name: string
  last_name: string
  abbreviation: string
  number: number
  constructor_name: string
  season_id: number
  fast_f1_id?: number
  is_full_time: boolean
  image_url: string
}
