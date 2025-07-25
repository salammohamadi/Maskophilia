const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const passwordLikeRegex = /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{6,}/gm;

const textareaOriginals = new WeakMap<HTMLTextAreaElement, string>();
const debounceTimers = new WeakMap<HTMLTextAreaElement, number>();

let globalMaskingEnabled = true;

const maskSensitive = (text: string) => {
  let masked = text.replace(emailRegex, '***');
  masked = masked.replace(passwordLikeRegex, (match) => '*'.repeat(match.length));
  return masked;
};

const isThreeLineTextarea = (textarea: HTMLTextAreaElement) => {
  if (textarea.rows >= 3) {
    return true;
  }
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 16;
  return textarea.offsetHeight / lineHeight >= 3;
};

const processTextarea = (textarea: HTMLTextAreaElement, masking: boolean) => {
  if (!isThreeLineTextarea(textarea)) {
    return;
  }

  if (!textareaOriginals.has(textarea)) {
    textareaOriginals.set(textarea, textarea.value);
  }

  textarea.value = masking
    ? maskSensitive(textareaOriginals.get(textarea) || textarea.value)
    : textareaOriginals.get(textarea) || textarea.value;
};

const attachInputListener = (textarea: HTMLTextAreaElement) => {
  if (!isThreeLineTextarea(textarea)) {
    return;
  }

  textarea.addEventListener('input', () => {
    if (!textareaOriginals.has(textarea)) {
      textareaOriginals.set(textarea, textarea.value);
    } else {
      textareaOriginals.set(textarea, textarea.value); // update live
    }

    if (debounceTimers.has(textarea)) {
      clearTimeout(debounceTimers.get(textarea)!);
    }

    const timer = window.setTimeout(() => {
      if (globalMaskingEnabled) {
        textarea.value = maskSensitive(textarea.value);
      }
    }, 1500);

    debounceTimers.set(textarea, timer);
  });
};

const maskAllTextareas = (masking: boolean) => {
  globalMaskingEnabled = masking;
  const textareas = document.querySelectorAll('textarea');

  textareas.forEach((ta) => {
    const textarea = ta as HTMLTextAreaElement;

    // Attach input listener first
    attachInputListener(textarea);

    // Save original value before masking
    if (!textareaOriginals.has(textarea)) {
      textareaOriginals.set(textarea, textarea.value);
    }

    // Apply or remove masking
    processTextarea(textarea, masking);
  });
};

// Initial load
chrome.storage.sync.get(['maskingEnabled'], (result) => {
  const masking = result.maskingEnabled !== false;
  maskAllTextareas(masking);
});

// Listen for toggle messages
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === 'toggleMasking') {
    maskAllTextareas(message.enabled !== false);
    sendResponse({ success: true });
  }
});
