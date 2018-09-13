/* eslint-disable camelcase */
import axios from 'axios';
import { fromJS } from 'immutable';
import { csvParse } from 'd3-dsv';
import isUndefined from 'lodash.isundefined';
import isNaN from 'lodash.isnan';
import { Map } from 'immutable';

/**
 * Fetches the data for the airlines.
 * @param {string} url
 * @param {{
 *   onSuccess: Function
 *   onLoadingStart: Function
 *   onLoadingEnd: Function
 * }}
 */
export function fetchAirplineData(url, {
  onSuccess,
  onLoadingStart,
  onLoadingEnd,
}) {
  if (isUndefined(url) || url.length === 0) {
    throw new TypeError('Missing airline data url');
  }

  // fetch the data
  onLoadingStart();
  axios.get(url)
    .then(({ status, data }) => {
      if (status !== 200) {
        onLoadingEnd();
        throw new Error('Return unexpected response for airline data');
      }

      // parse the data
      const d = csvParse(data, d => d);
      const o = {};
      d.forEach(({ airline_id, name, alias }) => {
        o[airline_id] = {
          name: name,
          alias: alias,
        };
      });
      onSuccess(new Map(o));
    })
    .catch((error) => {
      onLoadingEnd();
      console.log(error);
      throw new Error('Something went wrong, while trying to fetch the airline data.');
    });
}

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

/**
 * Fetches the data for the earth quakes.
 * @param {string} url
 * @param {{
 *   onSuccess: Function
 *   onLoadingStart: Function
 *   onLoadingEnd: Function
 * }}
 */
export function fetchEarthQuakeData(url, {
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
      const features = data.features.map(({ geometry, properties }) => {
        const { coordinates } = geometry;
        return [coordinates[0], coordinates[1], properties.mag, properties.title, properties.time];
      });
      onSuccess(fromJS(features));
    })
    .catch((error) => {
      onLoadingEnd();
      console.log(error);
      throw new Error('Something went wrong, while trying to fetch the flight route data.');
    });
}

export function fetchRouteData(url, {
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
      const features = [];
      csvParse(data, d => d).forEach(({ airline_id, src_airport_id, dest_airport_id }) => {
        // make sure that we only parse valid ids
        const airlineId = parseInt(airline_id, 10);
        const srcAirportId = parseInt(src_airport_id, 10);
        const destAirportId = parseInt(dest_airport_id, 10);
        if (!isNaN(airlineId) && !isNaN(srcAirportId) && !isNaN(destAirportId)) {
          features.push([airlineId, srcAirportId, destAirportId]);
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
