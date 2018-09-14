import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Map } from 'immutable';
import Loading from '../loading/componentloading';
import './componentreport.css';

/**
 * Report
 */
export default class Report extends Component {
  static propTypes = {
    airlines: PropTypes.instanceOf(Map),
    dateTime: PropTypes.instanceOf(moment),
    loading: PropTypes.bool,
  }
  /**
   * Renders the component
   */
  render() {
    const { airlines, dateTime, loading } = this.props;
    const sortByConnections = Object.keys(airlines.toJS())
      .map(k => airlines.get(k))
      .sort((a, b) => {
        return b.count - a.count;
      });
    return <div className="osw-report">
      <div className="header">
        <div className="title">
          <h5>{ loading ? 'Processing' : `Report - ${dateTime.format('MMM DD / YYYY')}` }</h5>
        </div>
        { loading && <div className="loading-container"><Loading radius={30}/></div> }
      </div>
      <div className="content">
        <table className="table">
          <thead>
            <tr>
              <th>Airline</th>
              <th>Alias</th>
              <th>Connections at risk</th>
            </tr>
          </thead>
          <tbody>
            { sortByConnections.map(({ id, alias, count, name }) => {
              return <tr key={id}>
                <td>{name}</td>
                <td>{(alias.length > 0 && alias !== '\\N') ? alias : '-'}</td>
                <td>{count}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>;
  }
}
