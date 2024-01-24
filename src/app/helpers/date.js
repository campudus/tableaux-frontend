export const isValidDate = x =>
  x instanceof Date ? !isNaN(x.valueOf()) : isValidDate(new Date(x));
