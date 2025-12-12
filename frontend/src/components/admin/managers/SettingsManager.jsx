import { useState, useEffect } from 'react';
import { getAppSettings, updateAppSettings } from '../../../services/api';
import { getApiErrorMessage } from '../../../services/apiHelpers';

function SettingsManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    basicAuthEnabled: false,
    basicAuthUsername: '',
    basicAuthPassword: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getAppSettings();
      setSettings({
        basicAuthEnabled: response.data.basicAuthEnabled || false,
        basicAuthUsername: response.data.basicAuthUsername || '',
        basicAuthPassword: '' // Never load password
      });
      setError('');
    } catch (err) {
      // If settings don't exist yet, use defaults
      if (err.response?.status === 404) {
        setSettings({
          basicAuthEnabled: false,
          basicAuthUsername: '',
          basicAuthPassword: ''
        });
      } else {
        setError('Erreur lors du chargement: ' + getApiErrorMessage(err));
        console.error('Load settings error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (settings.basicAuthEnabled && !settings.basicAuthUsername) {
      setError('Le nom d\'utilisateur est requis si Basic Auth est activé');
      return;
    }

    if (settings.basicAuthEnabled && !settings.basicAuthPassword) {
      setError('Le mot de passe est requis si Basic Auth est activé');
      return;
    }

    try {
      const dataToSend = {
        basicAuthEnabled: settings.basicAuthEnabled,
        basicAuthUsername: settings.basicAuthUsername || null
      };

      // Only send password if it's been changed
      if (settings.basicAuthPassword) {
        dataToSend.basicAuthPassword = settings.basicAuthPassword;
      }

      await updateAppSettings(dataToSend);
      setSuccess('Paramètres mis à jour avec succès');

      // Clear password field after save
      setSettings(prev => ({ ...prev, basicAuthPassword: '' }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde: ' + getApiErrorMessage(err));
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-wine-200 border-t-wine-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres de l'Application</h2>
        <p className="mt-1 text-gray-500">Configurez l'accès et la sécurité de l'application</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Basic Auth Settings */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">Authentification Basic Auth</h3>
          <p className="mt-1 text-sm text-gray-500">Protégez l'accès au site avec un nom d'utilisateur et un mot de passe</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="text-sm font-medium text-gray-900">Activer Basic Auth</label>
              <p className="text-xs text-gray-500 mt-1">Demander une authentification pour accéder au site</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, basicAuthEnabled: !settings.basicAuthEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.basicAuthEnabled ? 'bg-wine-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.basicAuthEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur {settings.basicAuthEnabled && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={settings.basicAuthUsername}
              onChange={(e) => setSettings({ ...settings, basicAuthUsername: e.target.value })}
              disabled={!settings.basicAuthEnabled}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="admin"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe {settings.basicAuthEnabled && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={settings.basicAuthPassword}
              onChange={(e) => setSettings({ ...settings, basicAuthPassword: e.target.value })}
              disabled={!settings.basicAuthEnabled}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-wine-500 focus:ring-2 focus:ring-wine-500/20 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
            />
            <p className="mt-2 text-xs text-gray-500">
              Laissez vide pour conserver le mot de passe actuel
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-wine-600 to-wine-700 text-white rounded-xl font-semibold shadow-lg shadow-wine-500/25 hover:shadow-xl hover:shadow-wine-500/30 hover:from-wine-700 hover:to-wine-800 transition-all duration-200"
            >
              Enregistrer les paramètres
            </button>
          </div>
        </form>
      </div>

      {/* Warning Message */}
      {settings.basicAuthEnabled && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-900">Attention</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Une fois activé, tous les visiteurs devront s'authentifier pour accéder au site. Assurez-vous de bien noter vos identifiants.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsManager;