import { normalizeConstructorName } from 'helpers/cars'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import Image from 'next/image'

const SIZES = {
  xsmall: 'w-12 h-12',
  small: 'w-24 h-24',
  medium: 'w-48 h-48',
  large: 'w-72 h-72',
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

const rectangle = (w, h, [startColor]) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${w}" height="${h}" fill="${startColor}" rx="8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" rx="8" />
</svg>`

const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

const CarImage = ({ constructor, size }) => {
  const constructorCarImageUrl = normalizeConstructorName(constructor)
  const widthHeight = getDimensions(size)
  const colors = COLORS_BY_CONSTRUCTOR[constructorCarImageUrl]
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
        rectangle(widthHeight, widthHeight, colors)
      )}`}
    />
  )
}

export default CarImage
