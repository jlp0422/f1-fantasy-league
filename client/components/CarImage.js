import Image from 'next/image'
import { getCarPath } from 'helpers/cars'

const SIZES = {
  xsmall: 'w-12 h-12',
  small: 'w-24 h-24',
  medium: 'w-48 h-48',
  large: 'w-72 h-72',
}

const COLORS_BY_TEAM = {
  'guenters-angels': ['#983ee6', '#6e2ca8'],
  'look-at-this-hornergraph': ['#80f4d3', '#67c7ac'],
  'once-campeonatos': ['#e9ce45', '#b39e34'],
  'team-auzhous': ['#b7f4f1', '#b7f4f1'],
  teamnosleep: ['#fdf4c6', '#cfc7a1'],
  'turbo-team-racing': ['#87a7ec', '#657fb5'],
  'winning-formula': ['#69e1d9', '#4faba5'],
  'zak-brown-band': ['#e7a5a1', '#b8807d'],
}

const getDimensions = (size) => {
  switch (size) {
    case 'xsmall':
      return 48
    case 'small':
      return 96
    case 'medium':
      return 192
    case 'large':
      return 288
  }
}

const shimmer = (w, h, [startColor, endColor]) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="${startColor}" offset="20%" />
      <stop stop-color="${endColor}" offset="50%" />
      <stop stop-color="${startColor}" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${startColor}" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

const CarImage = ({ constructor, size }) => {
  const constructorCarImageUrl = getCarPath(constructor)
  const widthHeight = getDimensions(size)
  const colors = COLORS_BY_TEAM[constructorCarImageUrl]
  return (
    <Image
      priority
      src={`/cars/${constructorCarImageUrl}.jpg`}
      alt={`${constructor} Car Livery`}
      width={widthHeight}
      height={widthHeight}
      className={`rounded-lg shadow-lg ${SIZES[size]}`}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(
        shimmer(widthHeight, widthHeight, colors)
      )}`}
    />
  )
}

export default CarImage
