import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { MovementProviders } from './MovementProviders.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MovementProviders />
  </StrictMode>,
)
