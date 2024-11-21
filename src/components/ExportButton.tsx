import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import UtmLatLng from 'utm-latlng';
import togpx from 'togpx';
import type { MarkerPoint } from '../types';

interface ExportButtonProps {
  markers: MarkerPoint[];
  selectedMarkers: Set<string>;
  selectionMode: boolean;
}

export function ExportButton({ markers, selectedMarkers, selectionMode }: ExportButtonProps) {
  const exportData = async (format: 'json' | 'csv' | 'gpx' | 'utm') => {
    const selectedPoints = markers.filter(m => selectedMarkers.has(m.id));
    const points = selectedPoints.length > 0 ? selectedPoints : markers;

    switch (format) {
      case 'json': {
        const jsonData = JSON.stringify(points, null, 2);
        saveAs(new Blob([jsonData], { type: 'application/json' }), 'points.json');
        break;
      }
      case 'csv': {
        const csvData = points.map(p => ({
          name: p.name,
          latitude: p.position.lat,
          longitude: p.position.lng,
          type: p.type
        }));
        const csv = Papa.unparse(csvData);
        saveAs(new Blob([csv], { type: 'text/csv' }), 'points.csv');
        break;
      }
      case 'gpx': {
        const geojson = {
          type: 'FeatureCollection',
          features: points.map(p => ({
            type: 'Feature',
            properties: {
              name: p.name,
              type: p.type
            },
            geometry: {
              type: 'Point',
              coordinates: [p.position.lng, p.position.lat]
            }
          }))
        };
        const gpx = togpx(geojson);
        saveAs(new Blob([gpx], { type: 'application/gpx+xml' }), 'points.gpx');
        break;
      }
      case 'utm': {
        const utm = new UtmLatLng();
        const utmData = points.map(p => {
          const conv = utm.convertLatLngToUtm(p.position.lat, p.position.lng);
          return {
            name: p.name,
            easting: conv.Easting,
            northing: conv.Northing,
            zoneNumber: conv.ZoneNumber,
            zoneLetter: conv.ZoneLetter
          };
        });
        const utmCsv = Papa.unparse(utmData);
        saveAs(new Blob([utmCsv], { type: 'text/csv' }), 'points_utm.csv');
        break;
      }
    }
  };

  if (!(selectedMarkers.size > 0 || !selectionMode)) return null;

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        <Download className="w-4 h-4" />
        Exporter {selectedMarkers.size > 0 ? `(${selectedMarkers.size})` : ''}
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-50">
        <div className="py-1">
          {['json', 'csv', 'gpx', 'utm'].map((format) => (
            <button
              key={format}
              onClick={() => exportData(format as 'json' | 'csv' | 'gpx' | 'utm')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Exporter en {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}