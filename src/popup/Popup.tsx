import React from 'react';
import './popup.css';
import type { ExtensionSettings, SendMessage } from '../models';

export const Popup = () => {
  const [maskingEnabled, setMaskingEnabled] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await chrome.runtime.sendMessage<SendMessage, ExtensionSettings>({
        type: 'getSettings',
      });

      setMaskingEnabled(response.maskingEnabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleMasking = async () => {
    try {
      const response = await chrome.runtime.sendMessage<
        SendMessage & { maskingEnabled: boolean },
        ExtensionSettings
      >({
        type: 'toggleMasking',
        maskingEnabled: !maskingEnabled,
      });

      setMaskingEnabled(response.maskingEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle masking');
    }
  };

  React.useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="popup">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="header">
        <h1>Maskophilia</h1>
        <div className="status">
          <span className={`status-indicator ${maskingEnabled ? 'enabled' : 'disabled'}`}>
            {maskingEnabled ? '●' : '○'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={loadSettings} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="controls">
        <button
          onClick={toggleMasking}
          className={`toggle-button ${maskingEnabled ? 'enabled' : 'disabled'}`}
        >
          {maskingEnabled ? 'Disable Masking' : 'Enable Masking'}
        </button>
      </div>

      <div className="footer">
        <p className="version">v1.0.0</p>
      </div>
    </div>
  );
};
