import React, { Component } from 'react';
import moment from 'moment';
import mapboxgl from 'mapbox-gl';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import uniqueId from 'lodash.uniqueid';

/**
 * Wraps a given array of geojson features in a feature collection.
 * @param {[*]} arr
 * @returns {{type: string, features: *}}
 */
function wrapInFeatureCollection(arr) {
  return {
    type: 'FeatureCollection',
    features: arr,
  };
}

function opacityValue({ angle, minOpacity, maxOpacity }) {
  const maxDelta = maxOpacity - minOpacity;
  const d = (Math.sin(angle) * ((maxDelta) / 2)) + (maxDelta / 2);
  return minOpacity + d;
}

function radiusValue({ angle, minRadius, maxRadius }) {
  const maxDelta = maxRadius - minRadius;
  const d = (Math.sin(angle) * ((maxDelta) / 2)) + (maxDelta / 2);
  return minRadius + d;
}

/**
 * Maps a given array of earthquake data to a geojson feature collection
 * @param {[lon, lat, mag]} arr
 */
function toFeatures(arr) {
  const angle = Date.now() / 1000;
  return arr.map((r) => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [r[0], r[1]],
      },
      properties: {
        magnitude: r[2],
        opacity: opacityValue({
          angle: angle,
          minOpacity: 0.5,
          maxOpacity: Math.min(1, ((Math.max(r[2], 5) - 4) * 0.1) + 0.5),
        }),
        radius: radiusValue({
          angle: angle,
          minRadius: 5,
          maxRadius: 5 + ((Math.max(r[2], 5) - 4) * 5),
        }),
      },
    };
  });
}


let animation = null;

/**
 * Earthquake Layer
 */
export default class LayerEarthquakes extends Component {
  static propTypes = {
    data: PropTypes.instanceOf(List),
    map: PropTypes.instanceOf(mapboxgl.Map),
  }

  constructor(props) {
    super(props);

    this.state = {
      layerId: `earthquake-layer-${uniqueId()}`,
      sourceId: `earthquake-source-${uniqueId()}`,
      animationFrame: `earthquake-animation-${uniqueId()}`,
    };

    this.updateLayer(props);
  }

  componentDidMount() {
    animation = window.requestAnimationFrame(
      this.animatePoints.bind(this),
    );
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(animation);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.data.equals(prevProps.data)) {
      this.updateLayer(this.props);
    }
  }

  animatePoints() {
    const { data, map } = this.props;
    const { sourceId } = this.state;

    // update the data
    const fts = wrapInFeatureCollection(
      toFeatures(data.toJS()),
    );
    map.getSource(sourceId).setData(fts);

    animation = window.requestAnimationFrame(
      this.animatePoints.bind(this),
    );
  }

  updateLayer({ map, data }) {
    const { animationFrame, layerId, sourceId } = this.state;

    if (map.getLayer(layerId) === undefined) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: wrapInFeatureCollection([]),
      });

      map.addLayer({
        id: layerId,
        source: sourceId,
        type: 'circle',
        paint: {
          'circle-radius': ['number', ['get', 'radius'], 5],
          'circle-opacity': ['number', ['get', 'opacity'], 0.5],
          'circle-color': '#8a1c1c',
        },
      });
    }
  }

  /**
   * Renders the component
   */
  render() {
    return <div style={{ display: 'none' }} className="osw-layer-earthquake"></div>;
  }
}