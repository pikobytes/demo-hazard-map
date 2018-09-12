import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import isUndefined from 'lodash.isundefined';
import partial from 'lodash.partial';
import uniqueId from 'lodash.uniqueid';
import 'mapbox-gl/dist/mapbox-gl.css';
import { InteractiveMap, NavigationControl, Popup } from 'react-map-gl';
import { List } from 'immutable';
import WebMercatorViewport from 'viewport-mercator-project';

import './componentmap.css';
import SVGOverlay from './svg-overlay';
import { fetchEarthQuakeData, redrawEarthquakes } from './layer-earthquakes';
import Loading from '../loading/componentloading';

export default class Map extends Component {
  static propTypes = {
    styleUrl: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      dataEA: new List([]),
      dataEALoading: false,
      mapStyle: props.styleUrl,
      popup: undefined,
      token: props.token,
      viewport: {
        latitude: 1.0177774980683254,
        longitude: 10.903720605862574,
        zoom: 1,
        bearing: -5.451772765941094,
        pitch: 41.02174132780428,
      },
    };
  }

  componentDidMount() {
    // fetch earth quake data
    fetchEarthQuakeData(
      process.env.REACT_APP_DATA_EARTHQUAKES,
      {
        onLoadingStart: bind(() => this.setState({ dataEALoading: true }), this),
        onLoadingEnd: bind(() => this.setState({ dataEALoading: false }), this),
        onSuccess: bind((d) => {
          this.setState({ dataEALoading: false, dataEA: d });
        }, this),
      },
    );
  }

  /**
   * Function for updating the viewport
   * @param viewport
   */
  onViewportChange(viewport) {
    this.setState({ viewport });
  }

  /**
   * Renders the component
   */
  render() {
    const { dataEALoading, dataEA, mapStyle, popup, token } = this.state;
    const viewport = {
      mapStyle,
      ...this.state.viewport,
      ...this.props,
    };
    return <div className="osw-map">
      {
        dataEALoading &&
        <div className="loading-container">
          <Loading radius={50}/>
        </div>
      }
      <InteractiveMap
        { ...viewport }
        mapboxApiAccessToken={token}
        maxPitch={85}
        width={window.innerWidth}
        height={window.innerHeight}
        onViewportChange={this.onViewportChange.bind(this)}
        // setting to `true` should cause the map to flicker because all sources
        // and layers need to be reloaded without diffing enabled.
        preventStyleDiffing={ false }>
        <SVGOverlay
          redraw={
            partial(
              redrawEarthquakes,
              '.osw-map',
              dataEA,
              {
                onClick: bind(d => this.setState({ popup: { lat: d[1], lon: d[0], text: d[3] } }), this),
              },
            )
          }
          captureClick={true} />
        <div style={{ position: 'absolute', right: 10, top: 100 }}>
          <NavigationControl onViewportChange={this.onViewportChange.bind(this)} />
        </div>
        {
          !isUndefined(popup) &&
          <Popup latitude={popup.lat} longitude={popup.lon} closeButton={true} closeOnClick={false} anchor="top"
            onClose={bind(() => this.setState({ popup: undefined }), this)}>
            <div>{popup.text}</div>
          </Popup>
        }
      </InteractiveMap>
    </div>;
  }
}