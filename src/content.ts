type MaskingPattern = {
  name: string;
  regex: RegExp;
  replacer: (match: string) => string;
};

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const passwordLikeRegex = /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{6,}/gm;

const maskingPatterns: MaskingPattern[] = [
  {
    name: 'email',
    regex: emailRegex,
    replacer: (match: string) => match.replace(/[^@]/g, '*'),
  },
  {
    name: 'password-like',
    regex: passwordLikeRegex,
    replacer: (match) => '*'.repeat(match.length),
  },
];

const textareaOriginals = new Map<HTMLElement, string>();
const debounceTimers = new Map<HTMLElement, number>();
const listenersAttached = new WeakSet<HTMLElement>();

let globalMaskingEnabled = true;

const maskSensitive = (text: string) => {
  let masked = text;
  maskingPatterns.forEach((pattern) => {
    masked = masked.replace(pattern.regex, pattern.replacer);
  });
  return masked;
};

const attachInputListener = (el: HTMLElement) => {
  const isContentEditable = el.hasAttribute('contenteditable');
  const isTextarea = el instanceof HTMLTextAreaElement;

  if (!isTextarea && !isContentEditable) {
    return;
  }

  // Prevent duplicate listeners
  if (listenersAttached.has(el)) {
    return;
  }

  listenersAttached.add(el);

  el.addEventListener('input', () => {
    if (!globalMaskingEnabled) {
      return;
    }

    const currentContent = isContentEditable ? el.innerText : (el as HTMLTextAreaElement).value;

    if (!textareaOriginals.has(el)) {
      textareaOriginals.set(el, currentContent);
    }

    if (debounceTimers.has(el)) {
      clearTimeout(debounceTimers.get(el)!);
    }

    const timer = window.setTimeout(() => {
      const original = textareaOriginals.get(el) || currentContent;
      const masked = maskSensitive(original);
      if (isContentEditable) {
        el.innerText = masked;
      } else {
        (el as HTMLTextAreaElement).value = masked;
      }
    }, 1500);

    debounceTimers.set(el, timer);
  });
};

const processEditableElement = (el: HTMLElement, masking: boolean) => {
  const isContentEditable = el.hasAttribute('contenteditable');
  const isTextarea = el instanceof HTMLTextAreaElement;
  if (!isTextarea && !isContentEditable) {
    return;
  }

  const currentContent = isContentEditable ? el.innerText : (el as HTMLTextAreaElement).value;

  // If we're disabling, restore and clear stored original
  if (!masking) {
    const original = textareaOriginals.get(el);
    if (original !== undefined) {
      if (isContentEditable) {
        el.innerText = original;
      } else {
        (el as HTMLTextAreaElement).value = original;
      }
    }
    // Clear the stored original value
    textareaOriginals.delete(el);
    return;
  }

  // If we're enabling, capture the current value as original
  textareaOriginals.set(el, currentContent);

  attachInputListener(el);

  const original = textareaOriginals.get(el) || '';
  const masked = maskSensitive(original);
  if (isContentEditable) {
    el.innerText = masked;
  } else {
    (el as HTMLTextAreaElement).value = masked;
  }
};

const maskAllEditableElements = (masking: boolean) => {
  globalMaskingEnabled = masking;

  const textareas = document.querySelectorAll('textarea');
  const contenteditables = document.querySelectorAll<HTMLElement>('[contenteditable="true"]');

  [...textareas, ...contenteditables].forEach((el) => {
    processEditableElement(el as HTMLElement, masking);
  });
};

// Load initial masking setting
chrome.storage.sync.get(['maskingEnabled'], (result) => {
  const masking = result.maskingEnabled !== false;
  globalMaskingEnabled = masking;
  maskAllEditableElements(masking);
});

// Respond to toggle requests
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.sync.get(['maskingEnabled'], (result) => {
      sendResponse({ maskingEnabled: result.maskingEnabled !== false });
    });
    return true; // Keep the message channel open for async sendResponse
  }

  if (message.type === 'toggleMasking') {
    const newValue = message.maskingEnabled !== false;
    globalMaskingEnabled = newValue;
    chrome.storage.sync.set({ maskingEnabled: newValue }, () => {
      maskAllEditableElements(newValue);
      sendResponse({ maskingEnabled: newValue });
    });
    return true;
  }
});
