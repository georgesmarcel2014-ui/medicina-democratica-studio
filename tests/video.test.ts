import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Clinic3D} from '../src/video/Clinic3D';

test('clinical animation projects finite 3D geometry and changes body motion over time', () => {
  const initial=renderToStaticMarkup(React.createElement(Clinic3D,{time:0,accent:'#90ccff'}));
  const later=renderToStaticMarkup(React.createElement(Clinic3D,{time:1.7,accent:'#90ccff'}));
  for(const markup of [initial,later]) {
    assert.match(markup,/Animação tridimensional original/);
    const polygons=[...markup.matchAll(/<polygon[^>]*points="([^"]+)"/g)];
    assert.ok(polygons.length>100,'scene must contain projected model geometry');
    for(const polygon of polygons) {
      const values=polygon[1].split(/[ ,]/).map(Number);
      assert.ok(values.length>=6,'a face must contain at least three projected vertices');
      assert.ok(values.every(Number.isFinite),'3D projection must never emit NaN or Infinity');
    }
  }
  assert.notEqual(initial,later,'animation must change geometry over time rather than display a still image');
});
