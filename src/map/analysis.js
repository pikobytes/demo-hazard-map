import { point, buffer, booleanPointInPolygon } from '@turf/turf';

/**
 * Checks which airports could be potentially affected by earthquakes.
 * @param {[[lon, lat, mag]]} eq - Earthquakes
 * @param {[[lon, lat, id]]} ap - Airports
 */
export function getAirportsAffectedByEarthquakes(eq, ap) {
  // generate the relevent earthquake areas
  const eqAreas = eq.map((r) => {
    return buffer(point([r[0], r[1]]), r[2] * 50, { units: 'kilometers' });
  });

  console.log(eqAreas)
  // check which airports are within the given polygons
  const airportsAffected = [];
  let n = 0;
  eqAreas.forEach((poly) => {
    ap.forEach((r) => {
      if (booleanPointInPolygon(point([r[0], r[1]]), poly)) {
        airportsAffected.push(r);
      }
    });
    n += 1;
    console.log(`Check ${n}/${eqAreas.length}`);
  });

  console.log(airportsAffected)
}
