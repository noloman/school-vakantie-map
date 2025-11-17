const fs = require('fs');
const inPath = 'src/geo/regions_pdok.json';
const outPath = 'src/geo/regions.geojson';
const j = JSON.parse(fs.readFileSync(inPath, 'utf8'));
j.features.forEach(f => {
  f.properties = f.properties || {};
  if (!f.properties.name) f.properties.name = f.properties.naam || f.properties.PROVINCIENAAM || f.properties.provincienaam || null;
  if (!f.properties.provincie) f.properties.provincie = f.properties.name;
  if (!f.properties.provincenaam) f.properties.provincenaam = f.properties.name;
});
fs.writeFileSync(outPath, JSON.stringify(j, null, 2));
console.log('Wrote', outPath, 'features=', j.features.length);
