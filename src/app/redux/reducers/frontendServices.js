import actionTypes from "../actionTypes";
const {
  frontendServices: { FRONTEND_SERVICES_LOADED }
} = actionTypes;

const initialState = {};

export const frontendServices = (state = initialState, action) => {
  switch (action.type) {
    case FRONTEND_SERVICES_LOADED:
      return action.result && action.result.services;
    default:
      return state;
  }
};
