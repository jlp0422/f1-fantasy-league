import {
  colors_2022,
  colors_2023,
  colors_2024,
  colors_2025,
  colors_2026,
} from './colors'

interface ConstructorColors {
  numberBackground: string
  numberText: string
  primary: string
  secondary: string
  tertiary: string
}

interface SeasonColors {
  primary: string
  bg: string
  hover: string
}

export const COLORS_BY_CONSTRUCTOR: Record<
  string,
  Record<string, ConstructorColors>
> = {
  2022: colors_2022,
  2023: colors_2023,
  2024: colors_2024,
  2025: colors_2025,
  2026: colors_2026,
}

export const COLORS_BY_SEASON: Record<string, SeasonColors> = {
  2022: {
    primary: '#0891b2',
    bg: 'bg-cyan-600',
    hover: 'hover:bg-cyan-800',
  },
  2023: {
    primary: '#ea580c',
    bg: 'bg-orange-600',
    hover: 'hover:bg-orange-800',
  },
  2024: {
    primary: '#059669',
    bg: 'bg-emerald-600',
    hover: 'hover:bg-emerald-800',
  },
  2025: {
    primary: '#ec003f',
    bg: 'bg-rose-600',
    hover: 'hover:bg-rose-800',
  },
  2026: {
    primary: '#ec003f',
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-800',
  },
}

export const HAS_IMAGES_BY_SEASON: Record<string, boolean> = {
  2022: true,
  2023: true,
  2024: false,
  2025: false,
  2026: false,
}
