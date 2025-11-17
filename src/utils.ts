import L from 'leaflet';
import type { FeatureCollection, Feature } from 'geojson';

export interface VacationInfo {
  type: string;
  start?: Date;
  end?: Date;
  regionLabel?: string;
}

export interface MapState {
  visibleTypes: Set<string>;
  lastProvinceNextVacation: Map<string, VacationInfo> | null;
  lastProvinceVacations: Map<string, VacationInfo[]> | null;
  selectedDate: Date | null;
  provincesBounds: L.LatLngBounds | null;
  lastProvinceLayerByKey: Map<string, L.Layer>;
}

export interface RegionToProvincesMap {
  [key: string]: string[] | 'ALL';
}

export const colorForVacation = (type?: string): string => {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'kerstvakantie': return '#2b6cb0';
    case 'zomervakantie': return '#d69e2e';
    case 'meivakantie': return '#38a169';
    case 'voorjaarsvakantie': return '#f6ad55';
    case 'herfstvakantie': return '#e53e3e';
    default: return '#805ad5';
  }
};

export const normalize = (s?: string): string =>
  (s || '')
    .toString()
    .toLowerCase()
    .replace(/[-\s]+/g, '')
    .replace(/[^a-z0-9]/g, '');

export const scoreDate = (d?: Date): number => {
  if (!d) return Number.POSITIVE_INFINITY;
  const today = new Date();
  // prefer upcoming dates (>= today) and earlier ones first
  return d >= today ? d.getTime() : d.getTime() + 1000 * 60 * 60 * 24 * 365 * 10;
};

export const regionToProvinces: RegionToProvincesMap = {
  'noord': ['groningen', 'friesland', 'drenthe'],
  'midden': ['overijssel', 'flevoland', 'gelderland', 'utrecht', 'noordholland', 'zuidholland'],
  'zuid': ['zeeland', 'noordbrabant', 'limburg'],
  'heel nederland': 'ALL',
};

export const parseProvinceVacations = (
  content: any,
  provinces: FeatureCollection
): { nextVacation: Map<string, VacationInfo>; allVacations: Map<string, VacationInfo[]> } => {
  const provinceNextVacation = new Map<string, VacationInfo>();
  const provinceVacations = new Map<string, VacationInfo[]>();

  (content.vacations as any[]).forEach(vac => {
    const vacationType = (vac.type || '').toString().trim();
    if (!Array.isArray(vac.regions)) return;

    vac.regions.forEach((r: any) => {
      const regionKeyRaw = (r.region || '').replace(/\s+/g, ' ').trim();
      const regionKey = regionKeyRaw.toLowerCase();

      let targetProvinceNames: string[] = [];
      if (regionKey === 'heel nederland' || regionToProvinces[regionKey] === 'ALL') {
        targetProvinceNames = provinces.features.map(
          f =>
            ((f.properties as any).name ||
              (f.properties as any).provincie ||
              (f.properties as any).provincenaam ||
              '') as string
        );
      } else if (regionToProvinces[regionKey]) {
        targetProvinceNames = (regionToProvinces[regionKey] as string[]).slice();
      } else {
        targetProvinceNames = [regionKeyRaw];
      }

      const startDate = r.startdate ? new Date(r.startdate) : undefined;
      const endDate = r.enddate ? new Date(r.enddate) : undefined;

      targetProvinceNames.forEach((pnameRaw: string) => {
        const key = normalize(pnameRaw);
        const existing = provinceNextVacation.get(key);
        const candScore = scoreDate(startDate);

        if (!existing) {
          provinceNextVacation.set(key, { type: vacationType, start: startDate, end: endDate, regionLabel: regionKeyRaw });
        } else {
          const existingScore = scoreDate(existing.start);
          if (candScore < existingScore) {
            provinceNextVacation.set(key, { type: vacationType, start: startDate, end: endDate, regionLabel: regionKeyRaw });
          }
        }

        // Also collect all vacations per province
        const arr = provinceVacations.get(key) || [];
        arr.push({ type: vacationType, start: startDate, end: endDate, regionLabel: regionKeyRaw });
        provinceVacations.set(key, arr);
      });
    });
  });

  return { nextVacation: provinceNextVacation, allVacations: provinceVacations };
};
