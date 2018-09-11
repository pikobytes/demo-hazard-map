import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import './componentnavbar.css';
/**
 * NavBar
 */
export default class NavBar extends Component {
  /**
   * Renders the component
   */
  render() {
    return <nav className="osw-navbar navbar" aria-label="main navigation">
      <div className="navbar-start">
        <NavLink className="navbar-item header-logo" to={{ pathname: '/map' }}>
          <h1>process.env.REACT_APP_WEBSITE_TITLE</h1>
        </NavLink>
      </div>

      <div className="navbar-menu navbar-end">
        <NavLink className="navbar-item" activeClassName="is-active" to={{ pathname: '/map' }}>Map</NavLink>
      </div>
    </nav>;
  }
}
