export const getCarPath = (constructor) =>
  constructor
    .toLowerCase()
    .split(' ')
    .join('-')
    .replace(/[^\w-]/g, '')
