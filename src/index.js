import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { CartProvider } from './context/CartContext'; // Ensure this matches exactly the file path and export

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CartProvider> {/* ✅ Wrap your app with CartProvider */}
      <App />
    </CartProvider>
  </React.StrictMode>
);