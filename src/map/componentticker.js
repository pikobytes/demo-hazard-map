import React, { Component } from 'react';
import moment from 'moment';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import './componentticker.css';

let TIMEOUT;

/**
 * Ticker
 */
export default class Ticker extends Component {
  static propTypes = {
    data: PropTypes.instanceOf(List),
    onViewportChange: PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.state = {
      index: 0,
    };
  }

  componentDidMount() {
    this.updateTicker();
  }

  updateTicker() {
    clearTimeout(TIMEOUT);

    const { index } = this.state;
    const { data } = this.props;
    const newIndex = index + 1 < data.size
      ? index + 1
      : 0;
    this.setState({ index: newIndex }, bind(() => {
      TIMEOUT = setTimeout(this.updateTicker.bind(this), 1000 * 5);
    }, this));
  }

  onClick() {
    const { index } = this.state;
    const data = this.props.data.toJS();
    const record = index < data.length
      ? data[index]
      : undefined;

    // abort the action
    if (!record) console.warn('Could not parse data');

    if (this.props.onViewportChange) {
      this.props.onViewportChange({ longitude: record[0], latitude: record[1], zoom: 9 });
    }
  }

  /**
   * Renders the component
   */
  render() {
    const data = this.props.data.toJS();
    const { index } = this.state;
    return <div className="osw-ticker">
      { data.length > 0 && <div className="ticker-info" onClick={this.onClick.bind(this)}>
        {`${data[index][3]}   @   ${moment(data[index][4]).format('MMM DD - hh:mm:ss')}`}
      </div>}
    </div>;
  }
}
