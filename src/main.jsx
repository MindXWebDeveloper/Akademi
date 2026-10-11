import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './main.css'
import App from './App.jsx'
import { initializeResources } from './data/apiClient.js'

const root = createRoot(document.getElementById('root'));

const renderApp = () => root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

const startApp = async () => {
  root.render(<main className="startup-message" role="status">Connecting to Akademi data services…</main>);
  try {
    await initializeResources();
    renderApp();
  } catch (error) {
    root.render(
      <main className="startup-message" role="alert">
        <h1>Unable to load Akademi data</h1>
        <p>{error.message}</p>
        <button type="button" onClick={startApp}>Retry</button>
      </main>,
    );
  }
};

startApp();
