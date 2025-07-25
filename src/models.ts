export interface ExtensionSettings {
  maskingEnabled: boolean;
}

type MessageTypes = 'getSettings' | 'toggleMasking';
export interface SendMessage {
  type: MessageTypes;
}
