import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import moment from 'moment';
import { List, fromJS } from 'immutable';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import uniqueId from 'lodash.uniqueid';
import { wrapInFeatureCollection } from './utils';

/**
 * Filters a given set of earthquake data by a dateTime.
 * @param {moment} dateTime
 * @param {Immutable.List} data
 * @returns {Immutable.List}
 */
export function filterEarthQuakeData(dateTime, data) {
  const d = dateTime.clone().subtract('days', 3);
  const f = data.toJS().filter(r => moment(r[4]).isSameOrAfter(d) && moment(r[4]).isSameOrBefore(dateTime));
  return fromJS(f);
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
        name: r[3],
        timestamp: r[4],
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
    id: PropTypes.string.isRequired,
    map: PropTypes.instanceOf(mapboxgl.Map),
  }

  constructor(props) {
    super(props);

    this.state = {
      layerId: props.id,
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

    setTimeout(bind(() => {
      animation = window.requestAnimationFrame(
        this.animatePoints.bind(this),
      );
    }, this), 100);
  }

  updateLayer({ map }) {
    const { layerId, sourceId } = this.state;

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