import { LatLng } from 'leaflet';

export interface MarkerPoint {
  id: string;
  position: LatLng;
  name: string;
  type: string;
  media?: Array<{
    type: 'image' | 'audio' | 'video';
    url: string;
    localPath?: string;
  }>;
}

export interface Settings {
  mapLayer: 'default' | 'satellite';
  autoSaveMedia: boolean;
}