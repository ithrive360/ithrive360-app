import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { UserProfileProvider } from './contexts/UserProfileContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <UserProfileProvider>
        <App />
      </UserProfileProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Service worker/cache purging removed to restore PWA caching performance on mobile.
