import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { UserProfileProvider } from './contexts/UserProfileContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProfileProvider>
      <App />
    </UserProfileProvider>
  </StrictMode>
);

// Service worker/cache purging removed to restore PWA caching performance on mobile.
