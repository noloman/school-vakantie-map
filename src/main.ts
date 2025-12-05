// TypeScript: declare Vite env typing for import.meta.env
declare global {
  interface ImportMeta {
    env: {
      DEV: boolean;
      PROD: boolean;
      [key: string]: any;
    };
  }
}
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './main.css';
let provinces: FeatureCollection | null = null;
import type { FeatureCollection } from 'geojson';
import { parseProvinceVacations, normalize, MapState } from './utils';
import { createLegendControl, renderProvinceLayers } from './mapRenderer';

console.log('src/main.ts loaded (modular)');
window.addEventListener('error', (ev) => { console.error('Uncaught error:', ev.error || ev.message, ev); });
window.addEventListener('unhandledrejection', (ev) => { console.error('Unhandled promise rejection:', ev.reason); });

// Try the local dev proxy first (works during `vite` dev), then fall back to the
// public Rijksoverheid OpenData API for production (GitHub Pages). This ensures
// the site still renders when the `/api` proxy is not available.
const getBaseUrl = (): string => {
  const raw = (import.meta as any).env?.BASE_URL || '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
};

const baseUrl = getBaseUrl();
const localApiUrl = `${window.location.origin}${baseUrl.replace(/\/$/, '')}/api/schoolholidays.json`;
const API_URLS = [
  localApiUrl,
  '/api/v1/infotypes/schoolholidays?output=json',
  'https://opendata.rijksoverheid.nl/api/v1/infotypes/schoolholidays?output=json',
];
async function loadProvinces(): Promise<FeatureCollection> {
  // In dev, use Vite's ?raw import; in production, fetch from a URL built off BASE_URL.
  if (import.meta.env && import.meta.env.DEV) {
    const regionsGeoText = await import('./geo/regions.geojson?raw').then(m => m.default);
    return JSON.parse(regionsGeoText) as FeatureCollection;
  }

  const geoUrl = `${window.location.origin}${baseUrl.replace(/\/$/, '')}/geo/regions.geojson`;
  console.info('Fetching provinces GeoJSON from', geoUrl);
  const res = await fetch(geoUrl);
  if (!res.ok) {
    console.error('Failed to fetch regions.geojson', res.status, res.statusText, 'url:', geoUrl);
    throw new Error(`Failed to fetch regions.geojson: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

async function main() {
  const mapEl = document.getElementById('map');
  if (!mapEl) console.error('Map container element `#map` not found in DOM');
  const map = mapEl ? L.map('map').setView([52.2, 5.3], 7) : (null as unknown as L.Map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

  try {
    provinces = await loadProvinces();
  } catch (err) {
    console.error('Fatal: could not load provinces GeoJSON', err);
    if (mapEl) {
      const alert = document.createElement('div');
      alert.style.position = 'absolute';
      alert.style.top = '12px';
      alert.style.right = '12px';
      alert.style.background = 'white';
      alert.style.padding = '10px';
      alert.style.border = '1px solid #ccc';
      alert.style.zIndex = '9999';
      alert.textContent = 'Error loading regions data. Check console logs.';
      mapEl.appendChild(alert);
    }
    return; // stop startup; map tiles still render
  }

  try {
    if (map && provinces && provinces.features && provinces.features.length) {
      const provincesGeo = L.geoJSON(provinces as any);
      const bounds = provincesGeo.getBounds();
      if (bounds && typeof map.fitBounds === 'function') map.fitBounds(bounds, { padding: [20, 20] });
    }
  } catch (e) {
    console.warn('Could not fit map to provinces bounds', e);
  }

  const regionsLayerGroup = L.layerGroup().addTo(map);

  const state: MapState = {
    visibleTypes: new Set<string>(),
    lastProvinceNextVacation: null,
    lastProvinceVacations: null,
    selectedDate: null,
    provincesBounds: null,
    lastProvinceLayerByKey: new Map<string, L.Layer>(),
  };

  let legendControlInstance: L.Control | null = null;
  let sidebarInstance: L.Control | null = null;
  let debugControlInstance: L.Control | null = null;

  async function loadSchoolHolidays(): Promise<void> {
  try {
    // Try configured URLs in order until we get JSON data.
    let data: any = null;
    for (const url of API_URLS) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn('Fetch to', url, 'failed with', res.status);
          continue;
        }
        data = await res.json();
        if (data) break;
      } catch (e) {
        console.warn('Error fetching', url, e);
        continue;
      }
    }
    if (!data) {
      console.error('No school holidays data returned from any configured source', API_URLS);
      return;
    }
    if (!Array.isArray(data) || data.length === 0) return console.warn('No school holidays data returned');

    const latest = (data as any[]).reduce((a, b) => new Date(a.lastmodified) > new Date(b.lastmodified) ? a : b);
    const content = latest.content && latest.content[0];
    if (!content || !Array.isArray(content.vacations)) return console.warn('Unexpected API content shape', content);

    const { nextVacation, allVacations } = parseProvinceVacations(content, provinces as FeatureCollection);
    state.lastProvinceNextVacation = nextVacation;
    state.lastProvinceVacations = allVacations;

    const typesPresent = Array.from(new Set((content.vacations as any[]).map(v => (v.type || '').toString().trim()))).filter(t => t);
    state.visibleTypes = new Set(typesPresent);

    if (legendControlInstance) { try { legendControlInstance.remove(); } catch (e) { /* ignore */ } }
    legendControlInstance = createLegendControl(typesPresent, state, () => { render(); updateSidebarList(); }) as any;
    if (legendControlInstance && typeof (legendControlInstance as any).addTo === 'function') {
      (legendControlInstance as any).addTo(map);
    }

    render();

    if (!sidebarInstance) sidebarInstance = createSidebarControl();
    const sb = document.querySelector('.province-sidebar') as any;
    if (sb && typeof sb._updateSidebarList === 'function') sb._updateSidebarList();
    if (!debugControlInstance) debugControlInstance = createDebugControl();
    updateDebug();

    console.log('Rendered school holiday regions for', content.title || 'unknown');
  } catch (err) {
    console.error('Error loading school holidays', err);
  }
  }

  function render() {
    renderProvinceLayers(regionsLayerGroup, provinces as FeatureCollection, state, map);
  }

  await loadSchoolHolidays();

  function createSidebarControl() {
  const control = (L as any).control({ position: 'topleft' });
  control.onAdd = function () {
    const div = L.DomUtil.create('div', 'province-sidebar p-3 bg-white rounded');
    div.style.maxHeight = '70vh';
    div.style.overflow = 'auto';

    const header = document.createElement('div');
    header.className = 'header';
    header.textContent = 'Provincies';
    div.appendChild(header);

    const controls = document.createElement('div');
    controls.className = 'controls';

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'px-2 py-1 border rounded ml-2';
    dateInput.addEventListener('change', () => {
      const v = dateInput.value;
      state.selectedDate = v ? new Date(v + 'T00:00:00') : null;
      render();
      updateSidebarList();
      updateDebug();
    });
    controls.appendChild(dateInput);
    div.appendChild(controls);

    const list = document.createElement('div');
    list.id = 'province-list';
    div.appendChild(list);

    function updateSidebarList() {
      list.innerHTML = '';
      const names = provinces && provinces.features ? provinces.features.map((f: any) => ((f.properties && ((f.properties as any).name || (f.properties as any).provincie || (f.properties as any).provincenaam)) || '') as string).sort() : [];
      names.forEach(n => {
        const key = normalize(n);
        const item = document.createElement('div');
        item.className = 'list-item';
        const title = document.createElement('div');
        title.textContent = n;
        const meta = document.createElement('div');
        meta.className = 'meta';
        const nextVac = state.lastProvinceNextVacation && state.lastProvinceNextVacation.get(key);
        let metaText = '-';
        if (nextVac) {
          const s = nextVac.start ? nextVac.start.toLocaleDateString() : '';
          const e = nextVac.end ? nextVac.end.toLocaleDateString() : '';
          metaText = `${nextVac.type} ${s} — ${e}`;
        }
        meta.textContent = metaText;
        if (state.selectedDate && state.lastProvinceVacations) {
          const all = state.lastProvinceVacations.get(key) || [];
          const hasActive = all.some(v => v.start && v.end && (v.start <= state.selectedDate! && state.selectedDate! <= v.end));
          if (hasActive) item.className += ' active';
        }
        item.appendChild(title);
        item.appendChild(meta);
        item.addEventListener('click', () => {
          const layer = state.lastProvinceLayerByKey.get(key) as any;
          if (layer && typeof layer.getBounds === 'function') {
            try { map.fitBounds(layer.getBounds(), { padding: [20,20] }); layer.openPopup && layer.openPopup(); } catch (e) { console.warn('Could not zoom to province', e); }
          }
        });
        list.appendChild(item);
      });
    }

    (div as any)._updateSidebarList = updateSidebarList;
    return div;
  };
  return control.addTo(map);
  }

  function createDebugControl() {
  const control = (L as any).control({ position: 'bottomleft' });
  control.onAdd = function () {
    const div = L.DomUtil.create('div', 'debug-panel p-2 bg-white rounded');
    div.style.maxHeight = '35vh';
    div.style.overflow = 'auto';
    const toggle = document.createElement('button');
    toggle.textContent = 'Toggle debug';
    toggle.className = 'px-2 py-1 bg-gray-100 rounded mb-2';
    const content = document.createElement('div');
    content.id = 'debug-content';
    content.style.display = 'none';
    toggle.addEventListener('click', () => { content.style.display = content.style.display === 'none' ? 'block' : 'none'; updateDebug(); });
    div.appendChild(toggle);
    div.appendChild(content);
    return div;
  };
  const inst = control.addTo(map);
  return control;
  }

  function updateDebug() {
  try {
    const el = document.getElementById('debug-content');
    if (!el) return;
    const summary: Record<string, any> = {};
    if (state.lastProvinceVacations) {
      for (const [k, arr] of state.lastProvinceVacations.entries()) {
        summary[k] = arr.map(x => ({ type: x.type, start: x.start ? x.start.toISOString().slice(0,10) : null, end: x.end ? x.end.toISOString().slice(0,10) : null }));
      }
    }
    el.textContent = JSON.stringify({ selectedDate: state.selectedDate ? state.selectedDate.toISOString().slice(0,10) : null, summary }, null, 2);
  } catch (e) {
    // ignore
  }
  }

  function updateSidebarList() {
  const sb = document.querySelector('.province-sidebar') as any;
  if (sb && typeof sb._updateSidebarList === 'function') sb._updateSidebarList();
  }

}

main().catch((err) => {
  console.error('Fatal error during app startup', err);
});
