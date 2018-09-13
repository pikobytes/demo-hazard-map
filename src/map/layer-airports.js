/* eslint-disable camelcase */
import axios from 'axios';
import { fromJS } from 'immutable';
import isUndefined from 'lodash.isundefined';
import isNaN from 'lodash.isnan';
import { csvParse } from 'd3-dsv';

/**
 * Fetches the data for the airports.
 * @param {string} url
 * @param {{
 *   onSuccess: Function
 *   onLoadingStart: Function
 *   onLoadingEnd: Function
 * }}
 */
export function fetchAirportData(url, {
  onSuccess,
  onLoadingStart,
  onLoadingEnd,
}) {
  if (isUndefined(url) || url.length === 0) {
    throw new TypeError('Missing flight route data url');
  }

  // fetch the data
  onLoadingStart();
  axios.get(url)
    .then(({ status, data }) => {
      if (status !== 200) {
        onLoadingEnd();
        throw new Error('Return unexpected response for flight route data');
      }

      // parse the data
      const d = csvParse(data, d => d);
      const features = [];
      d.forEach(({ airport_id, airport_name, airport_city, lng, lat }) => {
        const llon = parseFloat(lng);
        const llat = parseFloat(lat);
        if (!isNaN(llon) && !isNaN(llat)) {
          features.push([llon, llat, airport_id, airport_name, airport_city]);
        }
      });
      onSuccess(fromJS(features));
    })
    .catch((error) => {
      onLoadingEnd();
      console.log(error);
      throw new Error('Something went wrong, while trying to fetch the flight route data.');
    });
}