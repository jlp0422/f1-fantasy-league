import { getCloudinaryNumberUrl, getDimensions, SIZES } from '@/helpers/cars'
import { ImageSize } from '@/types/Common'
import Image from 'next/image'
import { useRouter } from 'next/router'

interface Props {
  size: ImageSize
  constructorName: string
}

const CarNumber = ({ constructorName, size }: Props) => {
  const { query } = useRouter()
  const season = query.season as string
  const widthHeight = getDimensions(size)
  const carImageUrl = getCloudinaryNumberUrl(constructorName, season, {
    format: 'webp',
    resize: `/c_scale,w_${widthHeight * 2.5}`,
  })

  return (
    <Image
      src={carImageUrl}
      alt={`${constructorName} Car Number`}
      width={widthHeight}
      height={widthHeight}
      className={`${SIZES[size]} h-full`}
    />
  )
}

export default CarNumber
