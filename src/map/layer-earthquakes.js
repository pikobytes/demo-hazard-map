import moment from 'moment';
import { easeBounceIn, easeLinear } from 'd3-ease';
import 'd3-transition';
import { select as d3Select } from 'd3-selection';
import { fromJS } from 'immutable';
import partial from 'lodash.partial';
import WebMercatorViewport from 'viewport-mercator-project';

/**
 * Current reference on the data
 */
let currentData;

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
export function redrawEarthquakes(selector, data, { onClick }, viewport, { width, height, project, unproject }) {
  const svg = d3Select(`${selector} svg`);

  if (viewport === undefined) {
    return;
  }

  // console.log(map.getCenter())
  //
  // const viewport = new WebMercatorViewport({
  //     altitude: 1.5,
  //     width: window.innerWidth,
  //     height: window.innerHeight,
  //     longitude: map.getCenter()[0],
  //     latitude: map.getCenter()[1],
  //     zoom: map.getZoom(),
  //     pitch: map.getPitch(),
  //     bearing: map.getBearing(),
  //   });
  // console.log(map.getCenter()[0])
  // in this case no svg is found and we abort the function. This is for example the
  // case when the layer is not currently initialized properly
  if (svg.node() === null) return;

  // append the given data to the svg
  const dataPlotId = 'data-plot';
  let dataPlot = svg.select(`#${dataPlotId}`);

  // the current data plot is empty so we clear the svg and reattach the data
  if (!data.equals(currentData)) {
    // clear all old transitions
    svg.interrupt().selectAll('*').interrupt();

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
        .attr('r', 5)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '1, 0')
        .attr('fill-opacity', '.25')
        .ease(easeLinear)
        .on('end', partial(transitionBig, selection));
    }

    function transitionBig(selection) {
      selection.transition()
        .duration(2000)
        .attr('stroke-width', 3)
        .attr('r', d => 5 + ((Math.max(d[2], 5) - 4) * 5))
        .attr('fill-opacity', d => `${Math.min(1, ((Math.max(d[2], 5) - 4) * 0.2) + 0.25)}`)
        .attr('stroke-opacity', d => `.${Math.min(1, ((Math.max(d[2], 5) - 4) * 0.1) + 0.25)}`)
        .ease(easeLinear)
        .on('end', partial(transitionSmall, selection));
    }

    // initialize the transition effects
    transitionBig(dataPlot.selectAll('circle'));
  }

  // select all circles
  dataPlot.selectAll('circle')
    .attr('r', 5)
    .attr('cx', d => viewport.project([d[0], d[1]])[0])
    .attr('cy', d => viewport.project([d[0], d[1]])[1])
    .attr('fill', '#8a1c1c')
    .attr('fill-opacity', '.25')
    .attr('stroke', '#8a1c1c')
    .attr('stroke-opacity', '.25')
    .attr('stroke-width', 2);
}
