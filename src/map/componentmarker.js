import React from 'react';
import PropTypes from 'prop-types';
import { BaseControl } from 'react-map-gl';

const propTypes = Object.assign({}, BaseControl.propTypes, {
  // Custom className
  className: PropTypes.string,
  // Longitude of the anchor point
  longitude: PropTypes.number.isRequired,
  // Latitude of the anchor point
  latitude: PropTypes.number.isRequired,
  // Offset from the left
  offsetLeft: PropTypes.number,
  // Offset from the top
  offsetTop: PropTypes.number
});

const defaultProps = Object.assign({}, BaseControl.defaultProps, {
  className: '',
  offsetLeft: 0,
  offsetTop: 0,
});

/*
 * PureComponent doesn't update when context changes.
 * The only way is to implement our own shouldComponentUpdate here. Considering
 * the parent component (StaticMap or InteractiveMap) is pure, and map re-render
 * is almost always triggered by a viewport change, we almost definitely need to
 * recalculate the marker's position when the parent re-renders.
 */
export default class Marker extends BaseControl {
  static defaultProps = Object.assign({}, BaseControl.defaultProps, {
    className: '',
    offsetLeft: 0,
    offsetTop: 0,
  })
  static propTypes = Object.assign({}, BaseControl.propTypes, {
    // Custom className
    className: PropTypes.string,
    // Longitude of the anchor point
    longitude: PropTypes.number.isRequired,
    // Latitude of the anchor point
    latitude: PropTypes.number.isRequired,
    // Offset from the left
    offsetLeft: PropTypes.number,
    // Offset from the top
    offsetTop: PropTypes.number,
  });

  render() {
    const { className, longitude, latitude, offsetLeft, offsetTop, viewport } = this.props;

    const [x, y] = viewport.project([longitude, latitude]);
    const containerStyle = {
      position: 'absolute',
      left: x + offsetLeft,
      top: y + offsetTop,
    };

    return <div className={`mapboxgl-marker ${className}`} ref={this._onContainerLoad} style={containerStyle}>
      {this.props.children}
    </div>;
  }
}
