import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './main.css'
import App from './App.jsx'
import { initializeSchoolYears } from './data/schoolYears.js'
import { initializeSchoolRecords } from './data/schoolRecords.js'

const startApp = async () => {
  await initializeSchoolYears();
  await initializeSchoolRecords();

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
};

startApp();
