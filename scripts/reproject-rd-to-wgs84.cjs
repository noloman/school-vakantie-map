#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const proj4 = require('proj4');

const INPUT = path.resolve(__dirname, '..', '96d6f95c-7e7a-48af-aba2-090c814a425f.json');
const OUTPUT = path.resolve(__dirname, '..', 'src', 'geo', 'regions.geojson');

proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +no_defs');
const rd = proj4('EPSG:28992');
const wgs84 = proj4('WGS84');

function reprojectCoords(coords) {
  if (typeof coords[0] === 'number') {
    const [x, y] = coords;
    const [lon, lat] = proj4(rd, wgs84, [x, y]);
    return [lon, lat];
  }
  return coords.map(reprojectCoords);
}

function reprojectFeature(f) {
  const geom = f.geometry;
  if (!geom) return f;
  const newGeom = JSON.parse(JSON.stringify(geom));
  if (geom.type === 'Point') {
    newGeom.coordinates = reprojectCoords(geom.coordinates);
  } else if (geom.type === 'MultiPoint' || geom.type === 'LineString') {
    newGeom.coordinates = geom.coordinates.map(reprojectCoords);
  } else if (geom.type === 'MultiLineString' || geom.type === 'Polygon') {
    newGeom.coordinates = geom.coordinates.map(ring => ring.map(reprojectCoords));
  } else if (geom.type === 'MultiPolygon') {
    newGeom.coordinates = geom.coordinates.map(poly => poly.map(ring => ring.map(reprojectCoords)));
  } else {
    newGeom.coordinates = reprojectCoords(geom.coordinates);
  }
  const newFeat = { ...f, geometry: newGeom };
  newFeat.properties = newFeat.properties || {};
  const p = newFeat.properties;
  if (!p.name) p.name = p.PROVINCIENAAM || p.provincienaam || p.provincie || null;
  if (!p.provincie) p.provincie = p.name;
  if (!p.provincenaam) p.provincenaam = p.name;
  return newFeat;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('Input file not found:', INPUT);
    process.exit(1);
  }
  const raw = fs.readFileSync(INPUT, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(1);
  }
  if (!data.features || !Array.isArray(data.features)) {
    console.error('Not a FeatureCollection');
    process.exit(1);
  }
  const out = { type: 'FeatureCollection', features: data.features.map(reprojectFeature) };
  const outDir = path.dirname(OUTPUT);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2));
  console.log('Wrote', OUTPUT, 'features=', out.features.length);
  const sample = out.features[0] && out.features[0].properties ? Object.keys(out.features[0].properties).slice(0, 20) : [];
  console.log('Sample properties:', sample);
}

main();
