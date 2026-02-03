import './App.css'
import Bussiness from './BussinessOwner/component/Page/Bussiness'
import OnboardingPage from './OnboardingPage/OnboardingPage'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './LandingPage/LandingPage'
import RequireAuth from './components/RequireAuth'
import CustomerMenuPage from './Customer/pages/CustomerMenuPage'
import CustomerEntryPage from './Customer/pages/CustomerEntryPage'
import CustomerNotFoundPage from './Customer/pages/CustomerNotFoundPage'
import OrderTrackingPage from './Customer/pages/OrderTrackingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/bussiness/*"
          element={
            <RequireAuth roles={[
              'restaurant_owner',
              'restaurant',
              'owner',
              'restaurant-admin'
            ]}>
              <Bussiness />
            </RequireAuth>
          }
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* Customer QR Scan Routes */}
        <Route path="/customer" element={<CustomerEntryPage />} />
        <Route path="/:restaurantSlug/menu/:tableNumber" element={<CustomerMenuPage />} />
        <Route path="/order/:orderNumber" element={<OrderTrackingPage />} />
        <Route path="/not-found" element={<CustomerNotFoundPage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App