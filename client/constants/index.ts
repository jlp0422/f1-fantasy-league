import { colors_2022 } from './colors/2022'
import { colors_2023 } from './colors/2023'

interface Colors {
  numberBackground: string
  numberText: string
  primary: string
  secondary: string
  tertiary: string
}

export const COLORS_BY_CONSTRUCTOR: Record<string, Record<string, Colors>> = {
  2022: colors_2022,
  2023: colors_2023,
}
