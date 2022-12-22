import Image from 'next/image'
import { getCloudinaryNumberUrl } from 'helpers/cars'

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

const CarNumber = ({ constructorName, size }) => {
  const widthHeight = getDimensions(size)
  const carImageUrl = getCloudinaryNumberUrl(constructorName, {
    format: 'webp',
    resize: `/c_scale,w_${widthHeight * 2.5}`,
  })
  return (
    <Image
      src={carImageUrl}
      alt={`${constructorName} Car Number`}
      width={widthHeight}
      height={widthHeight}
      className={`${SIZES[size]}`}
    />
  )
}

export default CarNumber
