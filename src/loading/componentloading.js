import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './componentloading.css';

/**
 * Gives a loading feedback in form of a spinner.
 */
export default class Loading extends Component {
  static propTypes = {
    radius: PropTypes.number,
  };

  /**
   * Renders the component
   */
  render() {
    const { radius } = this.props;
    return <div className="osw-loading">
      { radius !== undefined
        ? <div className="osw-loading-child" style={{ width: `${radius}px`, height: `${radius}px` }}/>
        : <div className="osw-loading-child" />}
    </div>;
  }
}
