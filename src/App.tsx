
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
