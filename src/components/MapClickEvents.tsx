import { useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';

interface MapClickEventsProps {
  onMapClick: (latlng: LatLng) => void;
}

export function MapClickEvents({ onMapClick }: MapClickEventsProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}