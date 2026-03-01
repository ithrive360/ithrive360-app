import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Brutally purge the old broken Service Worker and all offline caches from users' phones!
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Deleted zombie Service Worker:', registration);
    }
  });

  if ('caches' in window) {
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        console.log('Purging archaic offline cache:', key);
        return caches.delete(key);
      }));
    });
  }
}
