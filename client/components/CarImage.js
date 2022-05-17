import { normalizeConstructorName, rgbDataURL } from 'helpers/cars'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import Image from 'next/image'
import hexRgb from 'hex-rgb'

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

const CarImage = ({ constructor, size }) => {
  const constructorCarImageUrl = normalizeConstructorName(constructor)
  const widthHeight = getDimensions(size)
  const { primary } = COLORS_BY_CONSTRUCTOR[constructorCarImageUrl]
  const { red, blue, green } = hexRgb(primary)

  return (
    <Image
      priority
      src={`/cars/${constructorCarImageUrl}.webp`}
      alt={`${constructor} Car Livery`}
      width={widthHeight}
      height={widthHeight}
      className={`rounded-lg shadow-lg ${SIZES[size]}`}
      placeholder="blur"
      blurDataURL={rgbDataURL(red, green, blue)}
    />
  )
}

export default CarImage
