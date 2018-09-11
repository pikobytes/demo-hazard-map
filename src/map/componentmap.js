import React, { Component } from 'react';
import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import uniqueId from 'lodash.uniqueid';
import './componentmap.css';

/**
 * Map container component
 */
export default class Map extends Component {
  static propTypes = {
    mapView: PropTypes.shape({
      center: PropTypes.arrayOf(
        PropTypes.number,
      ),
      zoom: PropTypes.number,
    }).isRequired,
    mapParams: PropTypes.shape({
      maxZoom: PropTypes.number,
      minZoom: PropTypes.number,
    }).isRequired,
    styleUrl: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired,
    // onDeleteMap: PropTypes.func,
    // onInitialMapLoad: PropTypes.func,
    // onViewUpdate: PropTypes.func,
  };

  /**
   * @param {?} props
   */
  constructor(props) {
    super(props);

    /**
     * @type {string}
     * @private
     */
    this.containerId_ = `osw-mapboxgl-map-${uniqueId()}`;

    /**
     * @type {mapboxgl.Map|undefined}
     * @private
     */
    this.map_ = undefined;
  }

  componentDidMount() {
    const { mapParams, mapView, styleUrl, token } = this.props;
    const { minZoom, maxZoom } = mapParams;
    const { center, zoom } = mapView;

    // set the mapbox access token
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      minZoom: minZoom,
      maxZoom: maxZoom,
      center: [center[0], center[1]],
      container: this.containerId_,
      style: styleUrl,
      zoom: zoom,
    });

    // bind listener for dispatching map interactions to the global application state
    // map.on('moveend', partial(this.props.onViewUpdate, map));
    // map.on('load', partial(this.props.onViewUpdate, map));

    // deactivate zooming on double clickCluster
    map.doubleClickZoom.disable();

    // Add zoom, rotation and copy to clipboard control to the map.
    map.addControl(new mapboxgl.NavigationControl());

    // The SearchLayer and the SpatialLayer do not support bearing (rotation) and
    // pitching yet. So we deactivate this interactions for the user.
    // disable map rotation using right clickCluster + drag
    map.dragRotate.disable();
    // disable map rotation using touch rotation gesture
    map.touchZoomRotate.disableRotation();

    // in case debug mode is active display a scalebar
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');


    // dispatches an action which signals that the loading of the map was finished.
    // map.once('load', bind(({ target }) => {
    //   this.props.onInitialMapLoad(target);
    // }, this));

    this.map_ = map;
  }

  /**
   * Renders the component
   */
  render() {
    return <div className="osw-map" aria-label="main navigation">
      <div id={this.containerId_}
        className="osw-mapboxgl-map"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>;
  }
}