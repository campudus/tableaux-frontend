import React, {Component} from 'react';
import { hot } from 'react-hot-loader';
import TableContainer from "../containers/TableContainer";
import "../../scss/main.scss";

class App extends Component {
  render() {
    return <TableContainer tableId={71} langtag={"en"} fullyLoaded/>;
  }
} 

export default hot(module)(App);
