import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { MapPin, Navigation, Home, Building2, Flag, Save, Trash2, CheckSquare, Square, Camera, Video, Edit2, X, Settings as SettingsIcon } from 'lucide-react';
import localforage from 'localforage';
import { MapClickEvents } from './MapClickEvents';
import { MediaRecorder } from './MediaRecorder';
import { SettingsPanel } from './SettingsPanel';
import { ExportButton } from './ExportButton';
import type { MarkerPoint, Settings } from '../types';
import 'leaflet/dist/leaflet.css';

const MAP_LAYERS = {
  default: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  }
} as const;

const defaultSettings: Settings = {
  mapLayer: 'default',
  autoSaveMedia: true,
};

const createIcon = (type: string, isSelected: boolean) => {
  const getIconPath = (iconType: string) => {
    switch (iconType) {
      case 'pin':
        return 'M20 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z';
      case 'navigation':
        return 'M3 11l19-9-9 19-2-8-8-2z';
      case 'home':
        return 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10';
      case 'building':
        return 'M6 22V3h12v19M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1';
      case 'flag':
        return 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7';
      default:
        return 'M20 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z';
    }
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#2563eb' : '#000'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="${getIconPath(type)}"/>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
    className: 'custom-marker',
  });
};

export default function Map() {
  const [markers, setMarkers] = useState<MarkerPoint[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerPoint | null>(null);
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [currentIcon, setCurrentIcon] = useState('pin');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const savedSettings = await localforage.getItem<Settings>('mapSettings');
      if (savedSettings) setSettings(savedSettings);

      const savedMarkers = await localforage.getItem<MarkerPoint[]>('markers');
      if (savedMarkers) setMarkers(savedMarkers);
    };
    loadData();
  }, []);

  useEffect(() => {
    localforage.setItem('mapSettings', settings);
  }, [settings]);

  useEffect(() => {
    localforage.setItem('markers', markers);
  }, [markers]);

  const handleMapClick = useCallback((latlng: LatLng) => {
    if (!selectionMode) {
      const newMarker: MarkerPoint = {
        id: Date.now().toString(),
        position: latlng,
        name: `Point ${markers.length + 1}`,
        type: currentIcon,
      };
      setMarkers(prev => [...prev, newMarker]);
    }
  }, [markers.length, currentIcon, selectionMode]);

  const toggleMarkerSelection = (id: string) => {
    setSelectedMarkers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const deleteMarker = (id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
    setSelectedMarker(null);
  };

  const handleFileUpload = async (file: File, markerId: string) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('audio/') ? 'audio' : 'video';

    if (settings.autoSaveMedia) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        await localforage.setItem(fileName, file);

        setMarkers(prev => prev.map(marker => {
          if (marker.id === markerId) {
            return {
              ...marker,
              media: [...(marker.media || []), { type, url, localPath: fileName }],
            };
          }
          return marker;
        }));
      } catch (error) {
        console.error('Error saving media:', error);
      }
    } else {
      setMarkers(prev => prev.map(marker => {
        if (marker.id === markerId) {
          return {
            ...marker,
            media: [...(marker.media || []), { type, url }],
          };
        }
        return marker;
      }));
    }
  };

  const startEditing = useCallback((marker: MarkerPoint, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingName(marker.id);
    setEditingNameValue(marker.name);
  }, []);

  const updateMarkerName = (id: string) => {
    setMarkers(prev => prev.map(marker => {
      if (marker.id === id) {
        return { ...marker, name: editingNameValue };
      }
      return marker;
    }));
    setEditingName(null);
  };

  const deleteMedia = (markerId: string, mediaIndex: number) => {
    setMarkers(prev => prev.map(marker => {
      if (marker.id === markerId && marker.media) {
        const newMedia = [...marker.media];
        newMedia.splice(mediaIndex, 1);
        return { ...marker, media: newMedia };
      }
      return marker;
    }));
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white p-4 shadow-md flex items-center justify-between">
        <div className="flex gap-4">
          {['pin', 'navigation', 'home', 'building', 'flag'].map((icon) => (
            <button
              key={icon}
              onClick={() => setCurrentIcon(icon)}
              className={`p-2 rounded ${currentIcon === icon ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              {icon === 'pin' && <MapPin />}
              {icon === 'navigation' && <Navigation />}
              {icon === 'home' && <Home />}
              {icon === 'building' && <Building2 />}
              {icon === 'flag' && <Flag />}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            <SettingsIcon className="w-4 h-4" />
            Paramètres
          </button>

          <button
            onClick={() => setSelectionMode(!selectionMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              selectionMode ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            Sélection
          </button>

          <ExportButton
            markers={markers}
            selectedMarkers={selectedMarkers}
            selectionMode={selectionMode}
          />
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          className="h-full w-full"
        >
          <TileLayer
            attribution={MAP_LAYERS[settings.mapLayer].attribution}
            url={MAP_LAYERS[settings.mapLayer].url}
          />
          <MapClickEvents onMapClick={handleMapClick} />
          
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={createIcon(marker.type, selectedMarkers.has(marker.id))}
              eventHandlers={{
                click: (e) => {
                  if (selectionMode) {
                    e.originalEvent.preventDefault();
                    toggleMarkerSelection(marker.id);
                  } else {
                    setSelectedMarker(marker);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[300px]" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    {editingName === marker.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateMarkerName(marker.id);
                            }
                          }}
                          autoFocus
                          className="px-2 py-1 border rounded"
                        />
                        <button
                          onClick={() => updateMarkerName(marker.id)}
                          className="text-green-500 hover:text-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold flex items-center gap-2">
                        {marker.name}
                        <button
                          onClick={(e) => startEditing(marker, e)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </h3>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {marker.position.lat.toFixed(6)}, {marker.position.lng.toFixed(6)}
                  </p>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
                        <Camera className="w-4 h-4" />
                        <span className="text-sm">Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, marker.id);
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
                        <Video className="w-4 h-4" />
                        <span className="text-sm">Vidéo</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, marker.id);
                          }}
                        />
                      </label>
                    </div>

                    <MediaRecorder
                      onSave={(media) => {
                        setMarkers((prev) => prev.map((m) => {
                          if (m.id === marker.id) {
                            return {
                              ...m,
                              media: [...(m.media || []), media],
                            };
                          }
                          return m;
                        }));
                      }}
                    />

                    {marker.media && marker.media.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Médias attachés:</h4>
                        <div className="grid gap-2">
                          {marker.media.map((media, index) => (
                            <div key={index} className="relative">
                              {media.type === 'image' && (
                                <img src={media.url} alt="" className="max-w-full h-auto rounded" />
                              )}
                              {media.type === 'audio' && (
                                <audio src={media.url} controls className="w-full" />
                              )}
                              {media.type === 'video' && (
                                <video src={media.url} controls className="max-w-full h-auto rounded" />
                              )}
                              <button
                                onClick={() => deleteMedia(marker.id, index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => deleteMarker(marker.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {selectedMarker && !selectionMode && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center justify-between mb-2">
            {editingName === selectedMarker.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateMarkerName(selectedMarker.id);
                    }
                  }}
                  autoFocus
                  className="px-2 py-1 border rounded"
                />
                <button
                  onClick={() => updateMarkerName(selectedMarker.id)}
                  className="text-green-500 hover:text-green-700"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h3 className="font-semibold flex items-center gap-2">
                {selectedMarker.name}
                <button
                  onClick={(e) => startEditing(selectedMarker, e)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </h3>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {selectedMarker.position.lat.toFixed(6)}, {selectedMarker.position.lng.toFixed(6)}
          </p>
          <button
            onClick={() => deleteMarker(selectedMarker.id)}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}