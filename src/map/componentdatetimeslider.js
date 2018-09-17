import React, { Component } from 'react';
import { axisBottom as d3AxisBottom } from 'd3-axis';
import { brushX as d3BrushX } from 'd3-brush';
import { scaleTime as d3ScaleTime } from 'd3-scale';
import { event as d3Event, mouse as d3Mouse, select as d3Select } from 'd3-selection';
import moment from 'moment';
import axios from 'axios';
import PropTypes from 'prop-types';
import bind from 'lodash.bind';
import isUndefined from 'lodash.isundefined';
import partial from 'lodash.partial';
import round from 'lodash.round';
import uniqueId from 'lodash.uniqueid';
import { List } from 'immutable';

import './componentdatetimeslider.css';

// timeout for preventing to much dispatching of updateDateTimeChange
let TIMEOUT_DATETIME_CHANGE;

// format string for usage with momentjs
const DATETIME_FORMAT = 'MMM DD';

export default class DateTimeSlider extends Component {
  static propTypes = {
    dateTime: PropTypes.instanceOf(moment),
    onDateTimeChange: PropTypes.func,
    style: PropTypes.object,
    timeExtent: PropTypes.arrayOf(
      PropTypes.instanceOf(moment),
    ),
  };

  constructor(props) {
    super(props);
    this.state = {
      containerId: `datetime-slider-${uniqueId()}`,
      d3Brush: undefined,
      d3Handle: undefined,
      d3Scale: undefined,
      d3Svg: undefined,
      height: props.style.height,
      width: props.style.width - 60,
    };
  }

  componentDidMount() {
    const { containerId } = this.state;
    const { style, dateTime, timeExtent } = this.props;
    const margin = { top: 10, right: 50, bottom: 10, left: 50 };
    const width = this.state.width - margin.left - margin.right;
    const height = this.state.height - margin.bottom - margin.top;

    // create the scale function
    const timeScale = d3ScaleTime()
      .domain([timeExtent[0].valueOf(), timeExtent[1].valueOf()])
      .range([0, width])
      .clamp(true);

    // set the startValue
    const startingValue = timeScale(dateTime.valueOf());
    const brushStartValue = [timeScale(dateTime.valueOf()) - 1, startingValue];

    // define the brush
    const brush = d3BrushX()
      .extent([[0, 0], [width, height / 2]])
      .on('brush', partial(brushed, this.props));

    // create the brush svg
    const svg = d3Select(`#${containerId}`)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('class', 'draw-pane')
      .attr('transform', `translate(${margin.left},${height / 2})`);

    svg.append('g')
      .attr('class', 'x axis')
      // place the brush in the middle of the container
      .attr('transform', `translate(0,${height / 4})`)
      // bind with brush
      .call(
        d3AxisBottom(timeScale)
          .tickFormat(d => moment(d).format(DATETIME_FORMAT))
          .tickSize(0)
          .tickPadding(12)
          .tickValues([timeScale.domain()[0], timeScale.domain()[1]]),
      );

    // append slider to brush
    const slider = svg.append('g')
      .attr('class', 'slider')
      .call(brush)
      .call(brush.move, brushStartValue);

    // removes handle to resize the brush
    svg.selectAll('.slider>.handle').remove();
    // removes crosshair cursor
    svg.selectAll('.slider>.overlay').remove();

    // replace slider handler
    const handle = slider.append('g')
      .attr('class', 'tooltip');

    handle.append('text')
      .text(moment(timeScale.invert(startingValue)).format(DATETIME_FORMAT))
      .attr('transform', `translate(${startingValue - 28},${-25})`);

    function brushed(props) {
      if (d3Event.sourceEvent && d3Event.type === 'brush') {
        const translateX = d3Event.selection[1];
        const newDateTime = moment(timeScale.invert(translateX));
        const newDateTimeStr = newDateTime.format(DATETIME_FORMAT);
        handle.select('text')
          .text(newDateTimeStr)
          .attr('transform', `translate(${d3Event.selection[1] - 28},${-25})`);

        // Check if the dateTime has update and if yes dispatch a change. The demo application
        // dispatches a new date when the day has changed.
        if (props.dateTime.format(DATETIME_FORMAT) !== newDateTimeStr) {
          clearTimeout(TIMEOUT_DATETIME_CHANGE);
          TIMEOUT_DATETIME_CHANGE = setTimeout(() => props.onDateTimeChange(newDateTime), 200);
        }
      }
    }

    // update the state
    this.setState({ d3Brush: brush, d3Handle: handle, d3Scale: timeScale, d3Svg: svg });
  }

  onClick(direction) {
    const { dateTime } = this.props;
    const { d3Brush, d3Handle, d3Scale, d3Svg, width } = this.state;

    // make sure the brush is already initialized
    if (isUndefined(d3Brush) || isUndefined(d3Handle) || isUndefined(d3Scale) || isUndefined(d3Svg)) {
      console.log('Brush is not initialized yet');
    }

    let newDate;
    let selection;
    if (direction === 'left') {
      newDate = dateTime.clone().subtract('days', 1);
      const newSelection = round(d3Scale(newDate.valueOf()));
      selection = newSelection > 0 && newSelection < width
        ? [newSelection - 1, newSelection]
        : undefined;
    } else if (direction === 'right') {
      newDate = dateTime.clone().add('days', 1);
      const newSelection = round(d3Scale(newDate.valueOf()));
      selection = newSelection < width && newSelection > 0
        ? [newSelection - 1, newSelection]
        : undefined;
    }

    if (!isUndefined(selection) && !isUndefined(newDate)) {
      // update the brush slider
      d3Svg.select('.slider')
        .call(d3Brush.move, selection);

      // update the brush text feedback
      const newDateTime = moment(d3Scale.invert(selection[0]));
      const newDateTimeStr = newDateTime.format(DATETIME_FORMAT);
      d3Handle.select('text')
        .text(newDateTimeStr)
        .attr('transform', `translate(${selection[1] - 28},${-25})`);

      // dispatch the new dateTime
      this.props.onDateTimeChange(newDateTime);
    }
  }

  /**
   * This component should never rerender, because the dom is handled by the d3.
   * @returns {boolean}
   */
  shouldComponentUpdate() {
    return false;
  }

  /**
   * Renders the component
   */
  render() {
    const { containerId } = this.state;
    const { style } = this.props;
    return <div className="osw-datetime-slider" style={style}>
      <div className="child-container container-left">
        <span className="icon is-medium" onClick={this.onClick.bind(this, 'left')}>
          <i className="ion-md-arrow-dropleft" />
        </span>
      </div>
      <div className="child-container container-middle" id={containerId}/>
      <div className="child-container container-right">
        <span className="icon is-medium" onClick={this.onClick.bind(this, 'right')}>
          <i className="ion ion-md-arrow-dropright" />
        </span>
      </div>
    </div>;
  }
}