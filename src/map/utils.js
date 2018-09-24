/**
 * Wraps a given array of geojson features in a feature collection.
 * @param {[*]} arr
 * @returns {{type: string, features: *}}
 */
export function wrapInFeatureCollection(arr) {
  return {
    type: 'FeatureCollection',
    features: arr,
  };
}