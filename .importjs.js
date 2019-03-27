module.exports = {
  exclude: ["./out"],
  aliases: {
    f: "lodash/fp",
    React: "react",
    PropTypes: "prop-types"
  },
  environments: ["browser", "jest"],
  importDevDependencies: true
};
