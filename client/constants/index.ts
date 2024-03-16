import { colors_2022, colors_2023, colors_2024 } from './colors'

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
  2024: colors_2024,
}

export const COLORS_BY_SEASON: Record<string, Partial<Colors>> = {
  2022: {
    primary: '#0891b2',
  },
  2023: {
    primary: '#ea580c',
  },
  2024: {
    primary: '#059669',
  },
}
