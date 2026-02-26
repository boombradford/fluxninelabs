import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('React imports loaded');

try {
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
} catch (e) {
  console.error(e);
  document.body.innerHTML = `<h1>Error: ${e}</h1>`;
}
