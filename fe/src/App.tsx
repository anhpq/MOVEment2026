import './App.css'
import { useMovementBootstrap } from './features/movement/hooks/useMovementBootstrap'
import { MovementRoutes } from './features/movement/routes'

function App() {
  useMovementBootstrap()

  return <MovementRoutes />
}

export default App
