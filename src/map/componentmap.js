import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import isUndefined from 'lodash.isundefined';
import partial from 'lodash.partial';
import uniqueId from 'lodash.uniqueid';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FlyToInterpolator, InteractiveMap, NavigationControl, Popup } from 'react-map-gl';
import { Map, List } from 'immutable';
import WebMercatorViewport from 'viewport-mercator-project';
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
import SVGOverlay from './svg-overlay';
import {
  createAirportDatabaseFromRoutes,
  generateAirlinesConnectionReport,
  processAirportsWithinEarthquakeRange,
} from './analysis';
import { renderAirportMarker } from './layer-airports';
import { filterEarthQuakeData, redrawEarthquakes } from './layer-earthquakes';
import LayerAirports from './layerairports';
import LayerEarthquakes from './layerearthquakes';
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
        const { data, dataFiltered, dateTime } = this.state;
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
      map: undefined, // @deprecated
      mapContainer: `map-container-${uniqueId()}`,
      mapStyle: props.styleUrl,
      passViewport: false, // @deprecated
      popup: undefined,
      token: props.token,
      viewport: {
        latitude: 5.088887490341627,
        longitude: 13.651812424861578,
        zoom: 1,
        bearing: 0,
        pitch: 0,
      },
      viewportPure: undefined,
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
    const { mapContainer } = this.state;
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

    // Update the map after initializing
    map.once('load', bind(({ target }) => this.setState({ map: target }), this));
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

  /**
   * Set the map state, when the onLoad event is finished.
   */
  onLoad({ target }) {
    this.setState({ map: target, passViewport: true });
    target.on('moveend', this.onViewportUpdate.bind(this));
    target.on('load', this.onViewportUpdate.bind(this));
    this.onViewportUpdate({ target });
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

  onViewportUpdate({ target }) {
    const { map } = this.state;
    if (!isUndefined(map)) {
      this.setState({ map: target });
    }

    // this.setState({
    //   viewportPure: new WebMercatorViewport({
    //     altitude: 1.5,
    //     width: window.innerWidth,
    //     height: window.innerHeight,
    //     longitude: target.getCenter().lng,
    //     latitude: target.getCenter().lat,
    //     zoom: target.getZoom(),
    //     pitch: target.getPitch(),
    //     bearing: target.getBearing(),
    //   }),
    // });
  }

  /**
   * Function for updating the viewport
   * @param viewport
   */
  onViewportChange(viewport) {
    this.setState({ viewport, passViewport: false });
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
      mapStyle,
      popup,
      token,
      viewportPure,
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
        { !isUndefined(map) && <LayerEarthquakes data={dataEarthquake} map={map} /> }
        { !isUndefined(map) && <LayerAirports data={dataAirports} map={map} /> }
      </div>
      {/*<InteractiveMap*/}
        {/*{ ...{ mapStyle, ...this.state.viewport, ...this.props } }*/}
        {/*ref="mapContainer"*/}
        {/*mapboxApiAccessToken={token}*/}
        {/*maxPitch={85}*/}
        {/*width={window.innerWidth}*/}
        {/*height={window.innerHeight}*/}
        {/*onViewportChange={this.onViewportChange.bind(this)}*/}
        {/*onLoad={this.onLoad.bind(this)}*/}
        {/*// setting to `true` should cause the map to flicker because all sources*/}
        {/*// and layers need to be reloaded without diffing enabled.*/}
        {/*preventStyleDiffing={ false }>*/}
        {/*<SVGOverlay*/}
          {/*redraw={*/}
            {/*partial(*/}
              {/*redrawEarthquakes,*/}
              {/*'.osw-map',*/}
              {/*dataEarthquake,*/}
              {/*{*/}
                {/*onClick: bind(d => this.setState({ popup: { lat: d[1], lon: d[0], text: d[3], date: moment(d[4]) } }), this),*/}
              {/*},*/}
              {/*viewportPure,*/}
            {/*)*/}
          {/*}*/}
          {/*captureClick={true} />*/}

        {/*{ (dataAirports.length > 0 && viewportPure !== undefined) && dataAirports.map(partial(renderAirportMarker, viewportPure)) }*/}


        {/*<div style={{ position: 'absolute', right: 10, top: 100 }}>*/}
          {/*<NavigationControl onViewportChange={this.onViewportChange.bind(this)} />*/}
        {/*</div>*/}

        {/*{*/}
          {/*!isUndefined(popup) &&*/}
          {/*<Popup latitude={popup.lat} longitude={popup.lon} closeButton={true} closeOnClick={false} anchor="top"*/}
            {/*onClose={bind(() => this.setState({ popup: undefined }), this)}>*/}
            {/*<div>{popup.date.format('MMM DD')}: {popup.text}</div>*/}
          {/*</Popup>*/}
        {/*}*/}
      {/*</InteractiveMap>*/}

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
        <Ticker key={dataEarthquake.size} data={dataEarthquake} map={map} onViewportChange={bind((viewportUpdate) => {
          this.setState({
            viewport: Object.assign({
              transitionInterpolator: new FlyToInterpolator(),
              transitionDuration: 3000,
            }, this.state.viewport, viewportUpdate),
          });
        }, this)}/>
      </div>
    </div>;
  }
}
