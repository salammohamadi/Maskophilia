import './popup.css';
import React from 'react';

export const Popup = () => {
  const [maskOn, setMaskOn] = React.useState(true);

  React.useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get(['maskOn'], (result) => {
        setMaskOn(result.maskOn !== false); // default to true
      });
    }
  }, []);

  const toggleMask = () => {
    console.log(chrome.storage?.sync);
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set({ maskOn: !maskOn }, () => {
        setMaskOn(!maskOn);
      });
    }
  };

  return (
    <div className="popup">
      <div className="header">
        <h1>Maskophilia</h1>
      </div>
      <button
        className="popup-action-icon-btnpopup-action-icon-btn"
        onClick={toggleMask}
        aria-label={maskOn ? 'Turn masking off' : 'Turn masking on'}
        title={maskOn ? 'Masking is ON (click to turn off)' : 'Masking is OFF (click to turn on)'}
      >
        <img
          src={maskOn ? 'icon48.png' : 'icon48-disabled.png'}
          alt={maskOn ? 'Masking ON' : 'Masking OFF'}
          width={32}
          height={32}
        />
      </button>
    </div>
  );
};
