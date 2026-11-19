import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './AppContext';
import App from './App';
import './styles.css';

// Se algo quebrar, mostra o erro na tela em vez de ficar tudo em branco
function showFatal(msg, force) {
  const el = document.getElementById('root');
  // só substitui a tela se o app nem chegou a aparecer (ou se o React quebrou)
  if (el && !el.dataset.fatal && (force || !el.querySelector('.app'))) {
    el.dataset.fatal = '1';
    el.innerHTML = `<div style="padding:24px;font-family:sans-serif;color:#111;background:#fff"><h2>BROTA não abriu</h2><p>Manda um print desta tela:</p><pre style="white-space:pre-wrap;font-size:12px;color:#c00">${String(msg).replace(/</g, '&lt;')}</pre></div>`;
  }
}
window.addEventListener('error', (e) => showFatal(e.message || e.error));
window.addEventListener('unhandledrejection', (e) => showFatal(e.reason?.message || e.reason));

class Boundary extends React.Component {
  componentDidCatch(err) { showFatal(err?.stack || err, true); }
  render() { return this.props.children; }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boundary><AppProvider><App /></AppProvider></Boundary>
  </React.StrictMode>,
);
