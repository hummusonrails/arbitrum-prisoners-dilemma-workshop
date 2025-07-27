import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { Web3Provider } from './contexts/Web3Context';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);