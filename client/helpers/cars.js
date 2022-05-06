export const getCarPath = (constructor) =>
  constructor.toLowerCase().split(' ').join('-')
