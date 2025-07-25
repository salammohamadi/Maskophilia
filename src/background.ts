import type { ExtensionSettings, SendMessage } from './models';

const settings: ExtensionSettings = {
  maskingEnabled: true,
};

const loadSettings = async () => {
  try {
    const result = await chrome.storage.sync.get(['maskingEnabled']);
    settings.maskingEnabled = result.maskingEnabled !== false;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
};

const saveSettings = async () => {
  try {
    await chrome.storage.sync.set({ maskingEnabled: settings.maskingEnabled });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

const updateIcon = async () => {
  const iconPath = settings.maskingEnabled ? 'icon48.png' : 'icon48-disabled.png';
  try {
    await chrome.action.setIcon({
      path: {
        16: 'icon16.png',
        48: iconPath,
        128: 'icon128.png',
      },
    });
  } catch (error) {
    console.error('Failed to update icon:', error);
  }
};

const toggleMasking = async (enabled?: boolean) => {
  settings.maskingEnabled = enabled !== undefined ? enabled : !settings.maskingEnabled;
  await saveSettings();
  await updateIcon();

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'toggleMasking',
          maskingEnabled: settings.maskingEnabled,
        });
      } catch {
        // Ignore send errors
      }
    }
  }
};

interface IMessage extends SendMessage {
  enabled: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const handleMessage = async (message: IMessage, sendResponse: Function) => {
  try {
    switch (message.type) {
      case 'getSettings':
        sendResponse({ maskingEnabled: settings.maskingEnabled });
        break;
      case 'toggleMasking':
        await toggleMasking(message.enabled);
        sendResponse({ success: true, maskingEnabled: settings.maskingEnabled });
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (err) {
    sendResponse({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

const handleTabUpdate = async (tabId: number) => {
  try {
    const { maskingEnabled } = await chrome.storage.sync.get('maskingEnabled');
    await chrome.action.setBadgeText({
      text: maskingEnabled ? '' : '!',
      tabId,
    });
  } catch (err) {
    console.error('Failed to update badge:', err);
  }
};

const setupEventListeners = () => {
  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    handleMessage(message, sendResponse);
    return true;
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      handleTabUpdate(tabId);
    }
  });
};

export const initBackgroundService = async () => {
  await loadSettings();
  setupEventListeners();
  await updateIcon();
};

initBackgroundService();
