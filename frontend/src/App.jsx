import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UploadRx from './pages/UploadRx';
import SubscribeSave from './pages/SubscribeSave';
import TrackOrder from './pages/TrackOrder';
import Profile from './pages/Profile';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
          <Navbar />
          <div style={{ flex: 1 }}>
            <Routes>
              {/* Public catalog route */}
              <Route path="/" element={<Home />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Customer routes */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-rx"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <UploadRx />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscribe-save"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <SubscribeSave />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/track-order"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <TrackOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
