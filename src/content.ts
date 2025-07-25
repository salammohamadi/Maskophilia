const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const passwordLikeRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{6,}$/gm;

const textareaOriginals = new WeakMap<HTMLTextAreaElement, string>();
const textareaMasked = new WeakMap<HTMLTextAreaElement, string>();

const maskSensitive = (text: string) => {
  let masked = text.replace(emailRegex, '***');
  masked = masked.replace(passwordLikeRegex, (match) => '*'.repeat(match.length));

  return masked;
};

const isThreeLineTextarea = (textarea: HTMLTextAreaElement) => {
  // Check rows attribute first
  if (textarea.rows && textarea.rows >= 3) {
    return true;
  }

  // Fallback: check computed height (approximate, assuming 1em per line)
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 16;
  const hasMoreThan3Line = textarea.offsetHeight / lineHeight >= 3;

  return hasMoreThan3Line;
};

const processTextarea = (textarea: HTMLTextAreaElement, masking: boolean) => {
  if (!isThreeLineTextarea(textarea)) {
    return;
  }
  if (!textareaOriginals.has(textarea)) {
    textareaOriginals.set(textarea, textarea.value);
  }

  if (masking) {
    const maskedValue = maskSensitive(textareaOriginals.get(textarea) || textarea.value);
    textareaMasked.set(textarea, maskedValue);
    textarea.value = maskedValue;
  } else {
    textarea.value = textareaOriginals.get(textarea) || textarea.value;
  }
};

const maskAllTextareas = (masking: boolean) => {
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach((ta) => processTextarea(ta, masking));
};

// Initial load from chrome.storage
if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
  chrome.storage.sync.get(['maskOn'], (result) => {
    const maskOn = result.maskOn !== false;
    maskAllTextareas(maskOn);
  });

  // Listen for changes to maskOn in storage
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.maskOn) {
      maskAllTextareas(changes.maskOn.newValue !== false);
    }
  });
}
