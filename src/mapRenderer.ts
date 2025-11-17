import L from 'leaflet';
import type { FeatureCollection, Feature } from 'geojson';
import { colorForVacation, normalize, scoreDate, MapState, VacationInfo } from './utils';

export const createLegendControl = (types: string[], state: MapState, onToggle: () => void): L.Control => {
  const control = (L as any).control({ position: 'topright' });
  control.onAdd = function () {
    const div = L.DomUtil.create('div', 'vacation-legend p-2 bg-white rounded shadow');
    div.style.minWidth = '180px';
    div.style.maxHeight = '300px';
    div.style.overflow = 'auto';

    const title = document.createElement('div');
    title.textContent = 'Vakanties';
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    div.appendChild(title);

    types.forEach(t => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.margin = '4px 0';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.style.marginRight = '8px';
      checkbox.dataset.type = t;
      checkbox.addEventListener('change', () => {
        const ty = checkbox.dataset.type || '';
        if (checkbox.checked) state.visibleTypes.add(ty);
        else state.visibleTypes.delete(ty);
        onToggle();
      });

      const swatch = document.createElement('span');
      swatch.style.display = 'inline-block';
      swatch.style.width = '18px';
      swatch.style.height = '12px';
      swatch.style.background = colorForVacation(t);
      swatch.style.margin = '0 8px';
      swatch.style.border = '1px solid #222';

      const span = document.createElement('span');
      span.textContent = t;

      label.appendChild(checkbox);
      label.appendChild(swatch);
      label.appendChild(span);
      div.appendChild(label);
    });

    L.DomEvent.disableClickPropagation(div);
    return div;
  };

  return control;
};

export const renderProvinceLayers = (
  regionsLayerGroup: L.LayerGroup,
  provinces: FeatureCollection,
  state: MapState,
  map: L.Map
): void => {
  regionsLayerGroup.clearLayers();
  if (!state.lastProvinceVacations) return;

  provinces.features.forEach((feature: Feature) => {
    const name =
      (feature.properties &&
        ((feature.properties as any).name ||
          (feature.properties as any).provincie ||
          (feature.properties as any).provincenaam)) ||
      '';
    const key = normalize(name);
    const allVac = state.lastProvinceVacations && state.lastProvinceVacations.get(key);
    if (!allVac || allVac.length === 0) return;

    // Filter to visible types
    const candidates = allVac.filter(v => state.visibleTypes.has(v.type));
    if (candidates.length === 0) return;

    // pick the nearest upcoming among selected types
    let pick = candidates[0];
    let best = scoreDate(pick.start);
    for (let i = 1; i < candidates.length; i++) {
      const s = scoreDate(candidates[i].start);
      if (s < best) {
        best = s;
        pick = candidates[i];
      }
    }

    const vacationType = pick.type;
    const start = pick.start ? pick.start.toLocaleDateString() : '';
    const end = pick.end ? pick.end.toLocaleDateString() : '';
    const popupHtml = `<strong>${vacationType}</strong><br>${name}<br>${start} — ${end}`;

    // If a date is selected, de-emphasize provinces not active on that date
    let isActiveOnSelected = false;
    if (state.selectedDate && state.lastProvinceVacations) {
      const allForProvince = state.lastProvinceVacations.get(key) || [];
      isActiveOnSelected = allForProvince.some(
        v => v.start && v.end && v.start <= state.selectedDate! && state.selectedDate! <= v.end
      );
    }

    const baseColor = colorForVacation(vacationType);
    const style = {
      color: baseColor,
      weight: state.selectedDate ? (isActiveOnSelected ? 2 : 0.6) : 1,
      fillColor: baseColor,
      fillOpacity: state.selectedDate ? (isActiveOnSelected ? 0.6 : 0.12) : 0.45,
    } as L.PathOptions;

    const layer = L.geoJSON(feature as any, { style });
    layer.bindPopup(popupHtml);
    regionsLayerGroup.addLayer(layer);

    try {
      state.lastProvinceLayerByKey.set(key, layer);
    } catch (e) {
      // ignore
    }
  });
};
