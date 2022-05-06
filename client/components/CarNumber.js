import { getCarPath } from 'helpers/cars'

const CarNumber = ({ constructor }) => {
  const constructorCarNumberUrl = 'winning-formula' //getCarPath(constructor)
  return (
    <img
      src={`/numbers/${constructorCarNumberUrl}.jpeg`}
      className="rounded-lg shadow-lg w-72 h-72"
    />
  )
}

export default CarNumber
