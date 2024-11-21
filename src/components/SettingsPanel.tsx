import { X } from 'lucide-react';

interface Settings {
  mapLayer: 'default' | 'satellite';
  autoSaveMedia: boolean;
}

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Conteneur principal du panneau */}
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Paramètres</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu des paramètres */}
        <div className="space-y-4">
          {/* Option Fond de carte */}
          <div>
            <label
              htmlFor="mapLayer"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Fond de carte
            </label>
            <select
              id="mapLayer"
              value={settings.mapLayer}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  mapLayer: e.target.value as 'default' | 'satellite',
                })
              }
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            >
              <option value="default">OpenStreetMap (Défaut)</option>
              <option value="satellite">Satellite</option>
            </select>
          </div>

          {/* Option Sauvegarde automatique */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="autoSaveMedia"
              className="text-sm font-medium text-gray-700"
            >
              Sauvegarde automatique des médias
            </label>
            <input
              id="autoSaveMedia"
              type="checkbox"
              checked={settings.autoSaveMedia}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  autoSaveMedia: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 focus:ring focus:ring-blue-300"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
