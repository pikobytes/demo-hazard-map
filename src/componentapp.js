import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import '../node_modules/bulma/css/bulma.css';
import './componentapp.css';
import NavBar from './navbar/componentnavbar';
import Map from './map/componentmap';

/**
 * Wrap the map component within a container.
 * @returns {XML}
 * @constructor
 */
const MapContainer = () => {
  return <Map
    mapParams={{ minZoom: 0, maxZoom: 18 }}
    mapView={{ center: [9.65637154877186, 51.523555504969785], zoom: 7 }}
    styleUrl="mapbox://styles/pikobytes/cjlxqhbfo4nd52rlj5r5cd4xr"
    token="pk.eyJ1IjoicGlrb2J5dGVzIiwiYSI6ImNqaGJ5dXp4bTA2dXQzZHBjMXdsNDhjNDgifQ.AimHsnaeTPLRdi-MjLbI3w"
  />;
};

/**
 * App
 */
export default class App extends Component {
  /**
   * Renders the component
   */
  render() {
    return <div className="hazard-app">
      <NavBar />
      <Switch>
        <Route path="/map" component={MapContainer} />
        <Redirect exact from="/" to="/map" />
      </Switch>
    </div>;
  }
}
