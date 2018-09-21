import React, { PureComponent } from 'react';
//import { Marker } from 'react-map-gl';
import Marker from './componentmarker';

const ICON = `M20.2,15.7L20.2,15.7c1.1-1.6,1.8-3.6,1.8-5.7c0-5.6-4.5-10-10-10S2,4.5,2,10c0,2,0.6,3.9,1.6,5.4c0,0.1,0.1,0.2,0.2,0.3
  c0,0,0.1,0.1,0.1,0.2c0.2,0.3,0.4,0.6,0.7,0.9c2.6,3.1,7.4,7.6,7.4,7.6s4.8-4.5,7.4-7.5c0.2-0.3,0.5-0.6,0.7-0.9
  C20.1,15.8,20.2,15.8,20.2,15.7z`;

const pinStyle = {
  cursor: 'pointer',
  fill: '#d00',
  fillOpacity: '0.65',
  stroke: 'none',
};

class AirportPin extends PureComponent {
  render() {
    const { size = 15 } = this.props;

    return (
      <svg height={size} viewBox='0 0 24 24' style={{ ...pinStyle, transform: `translate(${-size / 2}px,${-size}px)` }}>
        <path d={ICON}/>
      </svg>
    );
  }
}


export function renderAirportMarker(viewport, { id, count, lon, lat }) {
  return (
    <Marker key={`marker-${id}`} longitude={lon}
      latitude={lat} viewport={viewport}>
      <AirportPin size={20} />
    </Marker>
  );
}