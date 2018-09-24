import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import uniqueId from 'lodash.uniqueid';
import { wrapInFeatureCollection } from './utils';



/**
 * Maps a given array of earthquake data to a geojson feature collection
 * @param {[lon, lat, mag]} arr
 */
function toFeatures(arr) {
  return arr.map(({ id, count, lon, lat }) => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        id: id,
      },
    };
  });
}

/**
 * Earthquake Layer
 */
export default class LayerAirports extends Component {
  static propTypes = {
    data: PropTypes.instanceOf(List),
    map: PropTypes.instanceOf(mapboxgl.Map),
  }

  constructor(props) {
    super(props);

    this.state = {
      layerId: `earthquake-layer-${uniqueId()}`,
      sourceId: `earthquake-source-${uniqueId()}`,
    };

    this.updateLayer(props);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.data.equals(prevProps.data)) {
      this.updateLayer(this.props);
    }
  }

  updateLayer({ map, data }) {
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
          'circle-radius': 5,
          'circle-color': '#d00',
        },
      });
    }

    // update the data
    const fts = wrapInFeatureCollection(
      toFeatures(data.toJS()),
    );
    map.getSource(sourceId).setData(fts);
  }

  /**
   * Renders the component
   */
  render() {
    return <div style={{ display: 'none' }} className="osw-layer-airports"></div>;
  }
}