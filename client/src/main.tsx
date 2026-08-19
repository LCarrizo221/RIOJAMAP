import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './index.css';

// Start MSW worker only when explicitly enabled (VITE_USE_MSW=true).
// Default dev runs against the real backend so auth cookies and import
// tables work end-to-end.
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW === 'true') {
    const { worker } = await import('./mocks/browser.js');
    return worker.start({
      onUnhandledRequest: (req) => {
        // Log unhandled requests but don't error
        console.warn(`[MSW] Unhandled ${req.method} request to ${req.url}`);
      }
    }).catch((error) => {
      // Log warning but don't crash the app
      console.warn('[MSW] Failed to start worker:', error);
    });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
