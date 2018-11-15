import f from "lodash/fp";

export const toObjectById = arr =>
  f.reduce(
    (acc, val) => {
      const id = f.get("id", val);
      return {...acc, [id]: f.dissoc("id",val)};
    },
    {},
    arr
  );
