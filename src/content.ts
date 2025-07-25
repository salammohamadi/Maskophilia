const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const passwordLikeRegex = /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{6,}/gm;

const textareaOriginals = new WeakMap<HTMLTextAreaElement, string>();

const maskSensitive = (text: string) => {
  let masked = text.replace(emailRegex, '***');
  masked = masked.replace(passwordLikeRegex, (match) => '*'.repeat(match.length));
  return masked;
};

const isThreeLineTextarea = (textarea: HTMLTextAreaElement) => {
  // Check rows attribute first
  if (textarea.rows >= 3) {
    return true;
  }

  // Fallback: check computed height (approximate, assuming 1em per line)
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

const maskAllTextareas = (masking: boolean) => {
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach((ta) => processTextarea(ta as HTMLTextAreaElement, masking));
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
