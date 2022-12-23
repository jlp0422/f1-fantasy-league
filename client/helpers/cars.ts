export const normalizeConstructorName = (constructor: string) =>
  constructor
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

type CloudinaryOptions = Record<'format' | 'resize', string>

export const getCloudinaryCarUrl = (
  constructorName: string,
  { format = 'jpg', resize = '' }: CloudinaryOptions
) => {
  const baseUrl = 'https://res.cloudinary.com/jlp0422/image/upload'
  const path = '/v1652746266/f1-fantasy-2022/cars'
  return `${baseUrl}${resize}${path}/${constructorName}.${format}`
}

export const getCloudinaryNumberUrl = (
  constructorName: string,
  { format = 'jpg', resize = '' }: CloudinaryOptions
) => {
  const baseUrl = 'https://res.cloudinary.com/jlp0422/image/upload'
  const path = '/v1652746271/f1-fantasy-2022/numbers'
  return `${baseUrl}${resize}${path}/${constructorName}.${format}`
}
