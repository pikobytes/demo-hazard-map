import React, { Component } from 'react';
import moment from 'moment';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import './componentticker.css';

/**
 * Ticker
 */
export default class Ticker extends Component {
  static propTypes = {
    data: PropTypes.instanceOf(List),
    onViewportChange: PropTypes.func,
  }

  onClick(lon, lat) {
    if (this.props.onViewportChange) {
      this.props.onViewportChange({ lon: lon, lat: lat, zoom: 8 });
    }
  }

  /**
   * Renders the component
   */
  render() {
    const data = this.props.data.toJS();
    const duration = `${data.length * 5}s`;
    return <div className="osw-ticker">
      <div className="ticker-wrap">
        <div className="ticker" style={{
          animationDuration: duration,
          WebkitAnimationDuration: duration,
        }}>{
            data.map(bind((record, index) => {
              return <div className="ticker__item" key={index} onClick={this.onClick.bind(this, record[0], record[1])}>
                {`${record[3]}   @   ${moment(record[4]).format('MMM DD - hh:mm:ss')}`}
              </div>;
            }, this))}
        </div>
      </div>
    </div>;
  }
}

