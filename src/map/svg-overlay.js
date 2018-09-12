import { createElement } from 'react';
import PropTypes from 'prop-types';
import { BaseControl } from 'react-map-gl';

const propTypes = Object.assign({}, BaseControl.propTypes, {
  redraw: PropTypes.func.isRequired,
  style: PropTypes.object,
});

const defaultProps = {
  captureScroll: false,
  captureDrag: false,
  captureClick: false,
  captureDoubleClick: false,
};

/**
 * Based on the SVGOverlay component from the react-map-gl library. We extend the component
 * with one more redraw call on initialization, to make sure that the svg is already loaded
 * when called.
 */
export default class SVGOverlay extends BaseControl {
  componentDidMount() {
    const { viewport, isDragging } = this.context;
    this.props.redraw({
      width: viewport.width,
      height: viewport.height,
      isDragging,
      project: viewport.project.bind(viewport),
      unproject: viewport.unproject.bind(viewport),
    });
  }

  render() {
    const { viewport, isDragging } = this.context;
    const style = Object.assign({
      position: 'absolute',
      left: 0,
      top: 0,
    }, this.props.style);

    return (
      createElement('svg', {
        width: viewport.width,
        height: viewport.height,
        ref: this._onContainerLoad,
        style,
      },
      this.props.redraw({
        width: viewport.width,
        height: viewport.height,
        isDragging,
        project: viewport.project.bind(viewport),
        unproject: viewport.unproject.bind(viewport),
      }))
    );
  }
}

SVGOverlay.displayName = 'SVGOverlay';
SVGOverlay.propTypes = propTypes;
SVGOverlay.defaultProps = defaultProps;
