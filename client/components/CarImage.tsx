import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import {
  getCloudinaryCarUrl,
  getDimensions,
  rgbDataURL,
  SIZES,
} from '@/helpers/cars'
import { ImageSize } from '@/types/Common'
import hexRgb from 'hex-rgb'
import Image from 'next/legacy/image'

interface Props {
  size: ImageSize
  constructorName: string
}

const CarImage = ({ constructorName, size }: Props) => {
  const widthHeight = getDimensions(size)
  const carImageUrl = getCloudinaryCarUrl(constructorName, {
    format: 'webp',
    resize: `/c_scale,w_${widthHeight * 2.5}`,
  })
  const { primary } = COLORS_BY_CONSTRUCTOR[constructorName]
  const { red, blue, green } = hexRgb(primary)

  return (
    <Image
      priority
      src={carImageUrl}
      alt={`${constructorName} Car Livery`}
      width={widthHeight}
      height={widthHeight}
      className={`rounded-lg shadow-lg ${SIZES[size]}`}
      placeholder="blur"
      blurDataURL={rgbDataURL(red, green, blue)}
    />
  )
}

export default CarImage
