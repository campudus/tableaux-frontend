const Mode = {
  contains: "contains",
  endsWith: "ends-with",
  equals: "equals",
  isEmpty: "is-empty",
  isNotEmpty: "is-not-empty",
  like: "like",
  startsWith: "starts-with"
};

const clean = str => str?.trim().toLowerCase() ?? "";

export default {
  Mode,
  [Mode.contains]: query => {
    const cleanQuery = clean(query);
    return str => clean(str).includes(cleanQuery);
  },
  [Mode.endsWith]: query => {
    const cleanQuery = clean(query);
    return str => clean(str).endsWith(cleanQuery);
  },
  [Mode.equals]: query => {
    const cleanQuery = clean(query);
    return str => clean(str) === cleanQuery;
  },
  [Mode.isEmpty]: () => str => !str,
  [Mode.isNotEmpty]: () => str => Boolean(str),
  [Mode.like]: _ => _ => true, // TODO: Make less loose ;)
  [Mode.startsWith]: query => {
    const cleanQuery = clean(query);
    return str => clean(str).startsWith(cleanQuery);
  }
};
