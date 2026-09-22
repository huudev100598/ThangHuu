import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import RootApp from './RootApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  </StrictMode>,
);
