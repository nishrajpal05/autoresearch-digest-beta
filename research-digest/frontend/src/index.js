// frontend/src/index.js

/*
This is the entry point - where React starts
Think of it like the front door of your app
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Get the HTML element with id="root" from index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render (show) our App inside that element
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);