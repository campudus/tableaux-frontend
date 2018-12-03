import React, {Component} from 'react';
import { hot } from 'react-hot-loader';
import TableContainer from "../containers/TableContainer";
// import Router from "../router/router"
import "../../scss/main.scss";

// const router = new Router();

class App extends Component {
  render() {
    return <TableContainer tableId={77} langtag={"de"} fullyLoaded />;
  }
} 

export default hot(module)(App);
