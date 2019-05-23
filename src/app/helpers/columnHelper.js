const yearNameRegex = /year/i;

export const isYearColumn = (column = {}) => yearNameRegex.test(column.name);
