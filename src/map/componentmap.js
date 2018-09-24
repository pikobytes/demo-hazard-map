import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import isUndefined from 'lodash.isundefined';
import uniqueId from 'lodash.uniqueid';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, List } from 'immutable';
import mapboxgl from 'mapbox-gl';
import './componentmap.css';
import {
  fetchAirplineData,
  fetchAirportData,
  fetchEarthQuakeData,
  fetchRouteData,
} from './api';
import DataRefresher from './componentdatarefresh';
import DateTimeSlider from './componentdatetimeslider';
import {
  createAirportDatabaseFromRoutes,
  generateAirlinesConnectionReport,
  processAirportsWithinEarthquakeRange,
} from './analysis';
import LayerAirports from './layerairports';
import LayerEarthquakes, { filterEarthQuakeData } from './layerearthquakes';
import Report from './componentreport';
import Ticker from './componentticker';

const DATA_KEY = {
  AIRLINES: 'airlines',
  AIRPORTS: 'airports',
  EARTHQUAKES: 'earthquakes',
  FLIGHT_ROUTES: 'routes',
};

/**
 * @param {Map} data
 * @returns {string}
 */
function getDatasourceText(data) {
  return `${data.get(DATA_KEY.AIRLINES).size} airlines, ${data.get(DATA_KEY.AIRPORTS).size} airports, ` +
      `${data.get(DATA_KEY.EARTHQUAKES).size} significant earthquakes, ${data.get(DATA_KEY.FLIGHT_ROUTES).size} ` +
      'flight connections.';
}

/**
 * Fetches all data.
 * @param {Function} onSuccess
 */
function fetchData(onSuccess) {
  let count = 0;
  function s() {
    count += 1;
    if (count === 4) onSuccess();
  }
  // fetch airline data
  fetchAirplineData(
    process.env.REACT_APP_DATA_AIRLINES,
    {
      onLoadingStart: bind(() => this.setState({ dataLoadingAL: true }), this),
      onLoadingEnd: bind(() => this.setState({ dataLoadingAL: false }), this),
      onSuccess: bind((d) => {
        const { data } = this.state;
        this.setState({
          data: data.set(DATA_KEY.AIRLINES, d),
          dataLoadingAL: false,
        }, s);
      }, this),
    },
  );

  // fetch earth quake data
  fetchEarthQuakeData(
    process.env.REACT_APP_DATA_EARTHQUAKES,
    {
      onLoadingStart: bind(() => this.setState({ dataLoadingEQ: true }), this),
      onLoadingEnd: bind(() => this.setState({ dataLoadingEQ: false }), this),
      onSuccess: bind((d) => {
        const { data } = this.state;
        this.setState({
          data: data.set(DATA_KEY.EARTHQUAKES, d),
          //dataFiltered: dataFiltered.set(DATA_KEY.EARTHQUAKES, filterEarthQuakeData(dateTime, d)),
          dataLoadingEQ: false,
        }, s);
      }, this),
    },
  );
  // fetch airport data
  fetchAirportData(
    process.env.REACT_APP_DATA_AIRPORTS,
    {
      onLoadingStart: bind(() => this.setState({ dataLoadingAP: true }), this),
      onLoadingEnd: bind(() => this.setState({ dataLoadingAP: false }), this),
      onSuccess: bind((d) => {
        const { data } = this.state;
        this.setState({
          data: data.set(DATA_KEY.AIRPORTS, d),
          dataLoadingAP: false,
        }, s);
      }, this),
    },
  );
  // fetch route data
  fetchRouteData(
    process.env.REACT_APP_DATA_FLIGHT_ROUTES,
    {
      onLoadingStart: bind(() => this.setState({ dataLoadingFR: true }), this),
      onLoadingEnd: bind(() => this.setState({ dataLoadingFR: false }), this),
      onSuccess: bind((d) => {
        const { data } = this.state;
        this.setState({
          data: data.set(DATA_KEY.FLIGHT_ROUTES, d),
          dataLoadingFR: false,
        }, s);
      }, this),
    },
  );
}

export default class MapContainer extends Component {
  static propTypes = {
    styleUrl: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    const dateTime = moment();
    this.state = {
      data: new Map({
        [DATA_KEY.AIRLINES]: new List([]),
        [DATA_KEY.AIRPORTS]: new List([]),
        [DATA_KEY.EARTHQUAKES]: new List([]),
        [DATA_KEY.FLIGHT_ROUTES]: new List([]),
      }),
      dataAirlines: new Map({}),
      dataAirports: new Map({}),
      dataFiltered: new Map({
        [DATA_KEY.AIRLINES]: new List([]),
        [DATA_KEY.AIRPORTS]: new List([]),
        [DATA_KEY.EARTHQUAKES]: new List([]),
        [DATA_KEY.FLIGHT_ROUTES]: new List([]),
      }),
      dataLoadingAL: false,
      dataLoadingAP: false,
      dataLoadingEQ: false,
      dataLoadingFR: false,
      dataLoadingPR: false,
      dateTime: dateTime,
      dateTimeExtent: [dateTime.clone().subtract(30, 'days'), dateTime],
      dataUpdate: undefined,
      map: undefined,
      mapContainer: `map-container-${uniqueId()}`,
      layerEarthquakeId: `earthquake-layer-${uniqueId()}`,
      popup: undefined,
    };
  }

  updateAssetEvaluation() {
    const { data, dataAirports, dataFiltered } = this.state;

    //console.log('Update asset evaluation ...');

    // extract airports which are within the range of an earthquake
    const airports = processAirportsWithinEarthquakeRange(
      dataFiltered.get(DATA_KEY.EARTHQUAKES).toJS(),
      data.get(DATA_KEY.AIRPORTS).toJS(),
    );

    // process the  airlines affected by the number of connections
    const dataAirlines = generateAirlinesConnectionReport(
      dataAirports,
      airports,
      data.get(DATA_KEY.AIRLINES),
    );

    this.setState({
      dataAirlines: dataAirlines,
      dataFiltered: dataFiltered.set(DATA_KEY.AIRPORTS, new List(airports)),
      dataLoadingPR: false,
    });
  }

  componentDidMount() {
    const updateDate = moment();

    // load the data
    fetchData.call(this, bind(() => {
      const { data, dataFiltered, dateTime } = this.state;

      // create a airport database
      if (data.get(DATA_KEY.FLIGHT_ROUTES).size > 0) {
        this.setState({
          dataFiltered: dataFiltered.set(DATA_KEY.EARTHQUAKES, filterEarthQuakeData(dateTime, data.get(DATA_KEY.EARTHQUAKES))),
          dataAirports: createAirportDatabaseFromRoutes(data.get(DATA_KEY.FLIGHT_ROUTES)),
          dataUpdate: updateDate,
          dataLoadingPR: true,
        }, this.updateAssetEvaluation.bind(this));
      }
    }, this));

    // initialize the map
    const { styleUrl, token } = this.props;
    const { mapContainer, layerEarthquakeId } = this.state;
    const viewport = {
      latitude: 5.088887490341627,
      longitude: 13.651812424861578,
      zoom: 1,
      bearing: 0,
      pitch: 0,
    };

    // set the mapbox access token
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      minZoom: 0,
      maxZoom: 18,
      center: [viewport.longitude, viewport.latitude],
      container: mapContainer,
      style: styleUrl,
      zoom: viewport.zoom,
    });

    // bind listener for dispatching map interactions to the global application state
    // map.on('moveend', bind(this.updateViewport, this));
    // map.on('load', bind(this.updateViewport, this));

    // deactivate zooming on double clickCluster
    map.doubleClickZoom.disable();

    // Add zoom, rotation and copy to clipboard control to the map.
    map.addControl(new mapboxgl.NavigationControl());

    // in case debug mode is active display a scalebar
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

    // update the map after initializing
    map.once('load', bind(({ target }) => this.setState({ map: target }), this));

    // bind click listener
    map.on('click', layerEarthquakeId, this.onMapClickEarthquake.bind(this));
  }

  /**
   * Update the dateTime. This leads also to an update of the date.
   * @param {moment} dateTime
   */
  onDateTimeChange(dateTime) {
    const { data, dataFiltered } = this.state;
    // update state
    this.setState({
      dataFiltered: dataFiltered.set(DATA_KEY.EARTHQUAKES, filterEarthQuakeData(dateTime, data.get(DATA_KEY.EARTHQUAKES))),
      dateTime: dateTime,
      dataLoadingPR: true,
    }, this.updateAssetEvaluation.bind(this));
  }

  onMapClickEarthquake({ features, lngLat }) {
    const { map } = this.state;
    if (features.length > 0) {
      const ft = features[0];
      const coordinates = ft.geometry.coordinates.slice();
      const description = `${moment(ft.properties.timestamp).format('MMM DD')}: ${ft.properties.name}`;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    }
  }

  /**
   * Refreshes all dynamic data sources
   */
  onRefreshData() {
    const updateDate = moment();

    // fetch earth quake data
    fetchEarthQuakeData(
      process.env.REACT_APP_DATA_EARTHQUAKES,
      {
        onLoadingStart: bind(() => this.setState({ dataLoadingEQ: true }), this),
        onLoadingEnd: bind(() => this.setState({ dataLoadingEQ: false }), this),
        onSuccess: bind((d) => {
          const { data, dataFiltered, dateTime } = this.state;
          this.setState({
            data: data.set(DATA_KEY.EARTHQUAKES, d),
            dataFiltered: dataFiltered.set(DATA_KEY.EARTHQUAKES, filterEarthQuakeData(dateTime, d)),
            dataUpdate: updateDate,
            dataLoadingEQ: false,
            dataLoadingPR: true,
          }, this.updateAssetEvaluation.bind(this));
        }, this),
      },
    );
  }


  /**
   * Renders the component
   */
  render() {
    const {
      data,
      dataAirlines,
      dataFiltered,
      dataLoadingAL,
      dataLoadingAP,
      dataLoadingEQ,
      dataLoadingFR,
      dataLoadingPR,
      dateTime,
      dateTimeExtent,
      dataUpdate,
      map,
      mapContainer,
      layerEarthquakeId,
    } = this.state;
    const dataAirports = dataFiltered.get(DATA_KEY.AIRPORTS);
    const dataEarthquake = dataFiltered.get(DATA_KEY.EARTHQUAKES);
    const width = window.innerWidth;
    const height = window.innerHeight;
    return <div className="osw-map">
      <div className="map-container" style={{
        width: width,
        height: height,
        position: 'relativ',
      }}>
        <div id={mapContainer} key="map-mapbox" className="mapboxgl-map" style={{
          width,
          height,
          visibility: 'visible',
        }}/>
        { !isUndefined(map) && <LayerEarthquakes id={layerEarthquakeId} data={dataEarthquake} map={map} /> }
        { !isUndefined(map) && <LayerAirports data={dataAirports} map={map} /> }
      </div>

      <div className="datetime-slider-container">
        <DateTimeSlider style={{ width: window.innerWidth > 1200 ? 800 : 400, height: 150 }}
          dateTime={dateTime}
          onDateTimeChange={this.onDateTimeChange.bind(this)}
          timeExtent={dateTimeExtent}
        />
      </div>

      <div className="report-container">
        <Report airlines={dataAirlines}
          dateTime={dateTime}
          loading={(dataLoadingAL || dataLoadingEQ || dataLoadingAP || dataLoadingFR || dataLoadingPR)} />
      </div>

      <div className="data-refresher-container">
        <DataRefresher lastUpdate={dataUpdate}
          text={getDatasourceText(data)}
          onRefresh={this.onRefreshData.bind(this)}
        />
      </div>

      <div className="ticker-container">
        <Ticker key={dataEarthquake.size} data={dataEarthquake} map={map} onViewportChange={({ lon, lat, zoom }) => {
          map.flyTo({ center: [lon, lat], zoom: zoom });
        }} />
      </div>
    </div>;
  }
}
