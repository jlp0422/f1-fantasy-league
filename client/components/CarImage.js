import { getCarPath } from 'helpers/cars'

const SIZES = {
  xsmall: 'w-12 h-12',
  small: 'w-24 h-24',
  medium: 'w-48 h-48',
  large: 'w-72 h-72',
}

const CarImage = ({ constructor, size }) => {
  const constructorCarImageUrl = 'winning-formula' //getCarPath(constructor)
  return (
    <img
      src={`/cars/${constructorCarImageUrl}.jpeg`}
      className={`rounded-lg shadow-lg ${SIZES[size]}`}
    />
  )
}

export default CarImage
