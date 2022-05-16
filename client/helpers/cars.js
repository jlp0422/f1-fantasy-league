export const normalizeConstructorName = (constructor) =>
  constructor
    .toLowerCase()
    .split(' ')
    .join('-')
    .replace(/[^\w-]/g, '')


