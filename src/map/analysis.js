/* eslint-disable no-param-reassign,no-unused-vars */
import { Map } from 'immutable';
import { circle, point, booleanContains } from '@turf/turf';
import has from 'lodash.has';

/**
 * Creates a database in the form:
 * {
 *   <airport_id>: {
 *    <airline>: <numberOfRoutes>
 *   }
 * }
 * @param {Immutable.List} routes - List records have to structure
 *  [airline_id, src_airport_id, dest_airport_id]
 * @returns {Immutable.Map}
 */
export function createAirportDatabaseFromRoutes(routes) {
  function add(o, airportId, airlineId){
    // make sure the airportId is registered
    if (!has(o, airportId)) {
      o[airportId] = {};
    }

    // make sure the airlineId is registered
    if (!has(o[airportId], airlineId)) {
      o[airportId][airlineId] = 0;
    }

    // add route number for the airline at this airport to the record.
    o[airportId][airlineId] += 1;
  }

  //console.log('Start generation of airport/routes database ...');
  const obj = {};
  routes.toJS().forEach((route) => {
    add(obj, route[1], route[0]);
    add(obj, route[2], route[0]);
  });
  return new Map(obj);
}

/**
 * Checks which airports could be potentially affected by earthquakes.
 * @param {[[lon, lat, mag]]} eq - Earthquakes
 * @param {[[lon, lat, id]]} ap - Airports
 * @returns {[{ id: number, lon: number, lat: number, count: number }]}
 */
export function processAirportsWithinEarthquakeRange(eq, ap) {
  // generate the relevent earthquake areas
  const eqAreas = eq.map((r) => {
    const radiusKm = 10 ** ((r[2] / 2.76) - 0.55);
    //console.log(radiusKm)
    //console.log(`Maginute: ${r[2]} - Radius: ${radiusKm}`);
    return circle(point([r[0], r[1]]), radiusKm, { units: 'kilometers' });
  });

  // check which airports are within the given polygons
  let airportsAffected = {};
  let n = 0;
  eqAreas.forEach((poly) => {
    ap.forEach((r) => {
      if (booleanContains(poly, point([r[0], r[1]]))) {
        const id = r[2];
        if (!has(airportsAffected, id)) {
          airportsAffected[id] = {
            id: id,
            lon: r[0],
            lat: r[1],
            count: 0,
          };
        }
        airportsAffected = Object.assign(airportsAffected, {
          [id]: Object.assign({}, airportsAffected[id], {
            count: airportsAffected[id].count + 1,
          }),
        });
      }
    });
    n += 1;
  });

  return Object.keys(airportsAffected).map(k => airportsAffected[k]);
}

/**
 * Function generates report data, about airlines which are affected by given
 * blocked airports as well the affected connections.
 * @param {Immutable.Map} airportConnDB
 * @param {[{ id: number, lon: number, lat: number, count: number }]} airports
 * @param {Map} airlines
 * @returns {Map}
 */
export function generateAirlinesConnectionReport(airportConnDB, airports, airlines) {
  // extract from the airportConnDB and the given airports all airlines matching the
  // given airports as well as there affected connections
  const a = {};
  airports.forEach(({ id }) => {
    if (airportConnDB.has(id)) {
      const airportPlan = airportConnDB.get(id);
      Object.keys(airportPlan).forEach((airlineId) => {
        if (!has(a, airlineId)) {
          a[airlineId] = Object.assign(
            { id: airlineId, count: 0 },
            airlines.get(airlineId),
          );
        }
        a[airlineId].count += airportPlan[airlineId];
      });
    }
  });
  return new Map(a);
}
