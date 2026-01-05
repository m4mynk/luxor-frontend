import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword';
import HomePage from './pages/HomePage';
import ProductList from './pages/ProductList';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import TrackOrderPage from './pages/TrackOrderPage';
import CheckoutPage from './pages/CheckoutPage'; // ✅ Add this import
import OrderSuccessPage from './pages/OrderSuccessPage';
import PayOnlinePage from './pages/PayOnlinePage';
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar';

import UserDashboard from './pages/UserDashboard';
import Orders from './dashboard/Orders';
import Wishlist from './dashboard/Wishlist';
import Account from './dashboard/Account';
import OrderDetailPage from './dashboard/OrderDetailPage';
import AdminOrdersPage from './admin/AdminOrdersPage';
import AdminProductsPage from './admin/AdminProductsPage';
import AdminCouponsPage from "./admin/AdminCouponsPage";
import AdminUserPage from './admin/AdminUserPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import { Toaster, toast } from 'react-hot-toast';

// AdminRoute: wrapper for admin-only pages
function AdminRoute({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('luxorUser'));
  } catch (e) {
    user = null;
  }
  if (user && user.role === 'admin') {
    return children;
  } else {
    toast.error("Access denied.");
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <Toaster position="top-right" />
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />  {/* ✅ Add this line */}
            <Route path="/checkout" element={<CheckoutPage />} /> {/* ✅ Add this route */}
            <Route path="/checkout/pay-online" element={<PayOnlinePage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/dashboard" element={<Navigate to="/userdashboard" replace />} />
            
          <Route path="/admin/orders" element={
            <AdminRoute>
              <AdminOrdersPage />
            </AdminRoute>
          } />
          <Route path="/admin/products" element={
            <AdminRoute>
              <AdminProductsPage />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUserPage />
            </AdminRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />

            <Route path="/userdashboard" element={<UserDashboard />}>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<Orders />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="account" element={<Account />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
            </Route>
          </Routes>
        </Router>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;