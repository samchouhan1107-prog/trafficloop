import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Swap the boot splash for the real app once React is ready to paint
const splash = document.getElementById('boot-splash');
if (splash) {
  splash.classList.add('is-done');
  setTimeout(() => splash.remove(), 500);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);