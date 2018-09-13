import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import isUndefined from 'lodash.isundefined';
import partial from 'lodash.partial';
import uniqueId from 'lodash.uniqueid';
import 'mapbox-gl/dist/mapbox-gl.css';
import { InteractiveMap, NavigationControl, Popup } from 'react-map-gl';
import { List } from 'immutable';

import './componentmap.css';
import DateTimeSlider from './componentdatetimeslider';
import SVGOverlay from './svg-overlay';
import {
  getAirportsAffectedByEarthquakes,
} from './analysis'
import { fetchAirportData } from './layer-airports';
import { fetchEarthQuakeData, filterEarthQuakeData, redrawEarthquakes } from './layer-earthquakes';
import Loading from '../loading/componentloading';

export default class Map extends Component {
  static propTypes = {
    styleUrl: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      dataAirports: new List([]),
      dataAirportsLoading: false,
      dataEA: new List([]),
      dataEAFiltered: new List([]),
      dataEALoading: false,
      dateTime: moment(),
      dateTimeExtent: [moment().subtract('days', 30), moment()],
      mapStyle: props.styleUrl,
      popup: undefined,
      token: props.token,
      viewport: {
        latitude: 5.088887490341627,
        longitude: 13.651812424861578,
        zoom: 1,
        bearing: 0,
        pitch: 0,
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
          const { dateTime } = this.state;
          this.setState({ dataEALoading: false, dataEA: d, dataEAFiltered: filterEarthQuakeData(dateTime, d) });
        }, this),
      },
    );
    // fetch airport data
    fetchAirportData(
      process.env.REACT_APP_DATA_AIRPORTS,
      {
        onLoadingStart: bind(() => this.setState({ dataAirportsLoading: true }), this),
        onLoadingEnd: bind(() => this.setState({ dataAirportsLoading: false }), this),
        onSuccess: bind((d) => {
          this.setState({ dataAirportsLoading: false, dataAirports: d });
        }, this),
      },
    );
  }

  /**
   * Update the dateTime. This leads also to an update of the date.
   * @param {moment} dateTime
   */
  onDateTimeChange(dateTime) {
    const { dataEA } = this.state;
    // update state
    this.setState({
      dataEAFiltered: filterEarthQuakeData(dateTime, dataEA),
      dateTime: dateTime,
    });
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
    const { dataEALoading, dataEAFiltered, dataAirports, dateTime, dateTimeExtent, mapStyle, popup, token } = this.state;
    const viewport = {
      mapStyle,
      ...this.state.viewport,
      ...this.props,
    };

    // perform analysis
    // if (dataEA.size > 0 && dataAirports.size > 0) {
    //   getAirportsAffectedByEarthquakes(dataEA.toJS(), dataAirports.toJS());
    // }

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
              dataEAFiltered,
              {
                onClick: bind(d => this.setState({ popup: { lat: d[1], lon: d[0], text: d[3], date: moment(d[4]) } }), this),
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
            <div>{popup.date.format('MMM DD')}: {popup.text}</div>
          </Popup>
        }
      </InteractiveMap>

      <div className="datetime-slider-container">
        <DateTimeSlider style={{ width: 800, height: 150 }}
          dateTime={dateTime}
          onDateTimeChange={this.onDateTimeChange.bind(this)}
          timeExtent={dateTimeExtent}
        />
      </div>
    </div>;
  }
}
