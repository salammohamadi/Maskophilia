import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './popup';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <Popup />
    </StrictMode>,
  );
} else {
  console.error('Root element not found');
}
