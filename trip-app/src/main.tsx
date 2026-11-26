import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { DEMO } from './lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
import './styles/feed.css';
import './styles/social.css';
import './styles/stories.css';
import './styles/tokens.css';
import './styles/app.css';

const Router = DEMO ? MemoryRouter : BrowserRouter;
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
);
