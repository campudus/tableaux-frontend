import React, {Component} from 'react';
import { hot } from 'react-hot-loader';
import Test from "../components/test/test.js";

class App extends Component {
  render() {
    return (<div><Test/></div>);
  }
} 

export default hot(module)(App);
