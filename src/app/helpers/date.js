export const isValidDate = x =>
  x !== null &&
  x !== undefined &&
  (x instanceof Date ? !isNaN(x.valueOf()) : isValidDate(new Date(x)));
