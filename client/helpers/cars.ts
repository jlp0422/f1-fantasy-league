import { ImageSize } from '@/types/Common'

export const normalizeConstructorName = (constructor: string) =>
  constructor
    .toLowerCase()
    .split(' ')
    .join('-')
    .replace(/[^\w-]/g, '')

export const normalizeRaceLocation = (location: string) =>
  location
    .toLowerCase()
    .split(' ')
    .join('-')
    .replace(/[^\w-]/g, '')

const keyStr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

const triplet = (e1: number, e2: number, e3: number) =>
  keyStr.charAt(e1 >> 2) +
  keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
  keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
  keyStr.charAt(e3 & 63)

export const rgbDataURL = (r: number, g: number, b: number) =>
  `data:image/gif;base64,R0lGODlhAQABAPAA${
    triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`

type CloudinaryOptions = Record<string, string>

export const getCloudinaryCarUrl = (
  constructorName: string,
  season: string,
  { format = 'jpg', resize = '' }: CloudinaryOptions = {}
) => {
  const baseUrl = 'https://res.cloudinary.com/jlp0422/image/upload'
  const path = `/v1677193378/f1-fantasy-league/${season}/cars`
  return `${baseUrl}${resize}${path}/${constructorName}.${format}`
}

export const getCloudinaryNumberUrl = (
  constructorName: string,
  season: string,
  { format = 'jpg', resize = '' }: CloudinaryOptions = {}
) => {
  const baseUrl = 'https://res.cloudinary.com/jlp0422/image/upload'
  const path = `/v1677193392/f1-fantasy-league/${season}/numbers`
  return `${baseUrl}${resize}${path}/${constructorName}.${format}`
}

export const getCloudinaryCircuitUrl = (
  location: string,
  season: string,
  { format = 'jpg', resize = '' }: CloudinaryOptions = {}
) => {
  const baseUrl = 'https://res.cloudinary.com/jlp0422/image/upload'
  const path = `/v1677193400/f1-fantasy-league/${season}/circuits`
  const normalizedLocation = normalizeRaceLocation(location)
  return `${baseUrl}${resize}${path}/${normalizedLocation}.${format}`
}

export const SIZES = {
  xsmall: 'w-12 h-12',
  small: 'w-24 h-24',
  medium: 'w-48 h-48',
  large: 'w-72 h-72',
}

export const getDimensions = (size: ImageSize) => {
  switch (size) {
    case 'xsmall':
      return 48
    case 'small':
    default:
      return 96
    case 'medium':
      return 192
    case 'large':
      return 288
  }
}
