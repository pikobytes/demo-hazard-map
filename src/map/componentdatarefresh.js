import React, { Component } from 'react';
import moment from 'moment';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import './componentdatarefresh.css';

let TIMEOUT;

/**
 * Component for updating the data within a given time interval
 */
export default class DataRefresher extends Component {
  static propTypes = {
    lastUpdate: PropTypes.instanceOf(moment),
    onRefresh: PropTypes.func,
    text: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = {
      time: new Date().toLocaleString(),
    };
  }

  componentDidMount() {
    this.intervalID = setInterval(
      () => this.tick(),
      1000,
    );
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }

  tick() {
    this.setState({
      time: new Date().toLocaleString(),
    });
  }

  /**
   * Renders the component
   */
  render() {
    const { lastUpdate, text, time } = this.props;
    return <div className="osw-data-refresher">
      <div className="header">
        <div>{moment(time).format('HH:mm:ss')}</div>
        <a className="button" onClick={this.props.onRefresh}>
          <span className="icon is-small">
            <i className="ion ion-md-sync" />
          </span>
        </a>
      </div>
      <div className="body">
        <div className="text">{text}</div>
        <div className="last-update">Last Update: Today - {moment(lastUpdate).format('HH:mm:ss')}</div>
      </div>
    </div>;
  }
}