import React, {Component} from 'react';
import { hot } from 'react-hot-loader';
import Test from "../components/test/test.js";
import "../../scss/main.scss";

class App extends Component {
  render() {
    return (<div><Test/></div>);
  }
} 

export default hot(module)(App);
