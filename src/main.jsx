import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { PricingProvider } from './context/PricingContext'
import { ToastProvider } from './context/ToastContext'
import { RestaurantProvider } from './context/RestaurantContext'
import { PaymentProvider } from './context/PaymentContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PricingProvider>
        <ToastProvider>
          <RestaurantProvider>
            <PaymentProvider>
              <App />
            </PaymentProvider>
          </RestaurantProvider>
        </ToastProvider>
      </PricingProvider>
    </AuthProvider>
  </StrictMode>,
)
