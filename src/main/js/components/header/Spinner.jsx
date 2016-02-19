import React from 'react';
import Loader from 'react-loader';

export default class Spinner extends React.Component {

  static spinnerOptions = {
    lines : 13,
    length : 20,
    width : 10,
    radius : 30,
    corners : 1,
    rotate : 0,
    direction : 1,
    color : '#000',
    speed : 1,
    trail : 60,
    shadow : false,
    hwaccel : false,
    zIndex : 2e9,
    top : '50%',
    left : '50%',
    scale : 1.00
  };

  static propTypes = {};

  render() {
    return (
      <Loader loaded={false} options={Spinner.spinnerOptions} className="spinner">
        <div></div>
      </Loader>
    )
  }
}