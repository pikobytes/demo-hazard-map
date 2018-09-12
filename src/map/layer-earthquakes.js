import axios from 'axios';
import { easeBounceIn, easeLinear } from 'd3-ease';
import 'd3-transition';
import { select as d3Select } from 'd3-selection';
import { fromJS } from 'immutable';
import isUndefined from 'lodash.isundefined';
import partial from 'lodash.partial';

/**
 * Current reference on the data
 */
let currentData;

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
        return [coordinates[0], coordinates[1], properties.mag, properties.title];
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
 * Draws the given earthquakes.
 * @param {string} selector
 * @param {Immutable.List} data
 * @param {{
 *   onClick: Function
 * }}
 * @param {{
 *   isDragging: boolean
 *   width: number - width of the viewport
 *   height: number - height of the viewport
 *   project: Function - get screen position [x, y] from geo coordinates [lng, lat]
 *   unproject: Function - get geo coordinates [lng, lat] from screen position [x, y]
 * }}

 */
export function redrawEarthquakes(selector, data, { onClick }, { width, height, project, unproject }) {
  const svg = d3Select(`${selector} svg`);

  // in this case no svg is found and we abort the function. This is for example the
  // case when the layer is not currently initialized properly
  if (svg.node() === null) return;

  // append the given data to the svg
  const dataPlotId = 'data-plot';
  let dataPlot = svg.select(`#${dataPlotId}`);

  // the current data plot is empty so we clear the svg and reattach the data
  if (!data.equals(currentData)) {
    console.log('Reattach data');
    // remove all old data from the svg
    svg.selectAll('g').remove();

    // create data plot area
    dataPlot = svg.append('g')
      .attr('id', dataPlotId)
      .attr('transform', 'translate(0, 0)');

    // rebind the data
    currentData = data;


    // attach data to the data plot area
    dataPlot.selectAll('circle')
      .data(data.toJS())
      .enter()
      .append('circle')
      .on('click', onClick);

    function transitionSmall(selection) {
      // transition back to normal
      selection.transition()
        .duration(200)
        .attr('r', d => d[2])
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '1, 0')
        .ease(easeLinear)
        .on('end', partial(transitionBig, selection));
    }

    function transitionBig(selection) {
      selection.transition()
        .duration(2000)
        .attr('stroke-width', 3)
        .attr('r', d => d[2] * 3)
        .ease(easeLinear)
        .on('end', partial(transitionSmall, selection));
    }

    // initialize the transition effects
    transitionBig(dataPlot.selectAll('circle'));
  }

  console.log('Update data');

  // select all circles
  const circles = dataPlot.selectAll('circle')
    .attr('r', d => d[2])
    .attr('cx', d => project([d[0], d[1]])[0])
    .attr('cy', d => project([d[0], d[1]])[1])
    .attr('fill', '#8a1c1c')
    .attr('fill-opacity', '.25')
    .attr('stroke', '#8a1c1c')
    .attr('stroke-opacity', '.25')
    .attr('stroke-width', 2);
}
