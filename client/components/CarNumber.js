import { getCarPath } from 'helpers/cars'

const CarImage = ({ constructor }) => {
  const constructorCarImageUrl = 'winning-formula' //getCarPath(constructor)
  return (
    <img
      src={`/numbers/${constructorCarImageUrl}.jpeg`}
      className="rounded-lg shadow-lg w-72 h-72"
    />
  )
}

export default CarImage
