// babel polyfill: https://babeljs.io/docs/en/babel-polyfill
import "core-js/stable";
import "regenerator-runtime/runtime";

// https://github.com/kutlugsahin/react-smooth-dnd/issues/48
Object.defineProperty(global, "Node", {
  value: { firstElementChild: "firstElementChild" }
});
