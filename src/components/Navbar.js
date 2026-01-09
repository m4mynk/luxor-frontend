import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Navbar = () => {
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // 🔎 normalize helper for categories/terms
  const normalizeCategory = (cat) => {
    if (!cat) return "";
    return cat.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z]/g, "");
  };

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, { withCredentials: true });
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // 🔎 Live search effect
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/products?search=${encodeURIComponent(searchTerm)}`);
        let results = res.data;

        // normalize category matches
        results = results.filter((p) =>
          normalizeCategory(p.name).includes(normalizeCategory(searchTerm)) ||
          normalizeCategory(p.brand).includes(normalizeCategory(searchTerm)) ||
          normalizeCategory(p.category).includes(normalizeCategory(searchTerm))
        );

        setSearchResults(results);
      } catch (err) {
        console.error("❌ Search error:", err);
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Logout
  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Submit search manually
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-gray-900 tracking-widest">
          Luxor
        </Link>

        {/* 🔎 New Search with live results */}
        <div className="relative w-full md:w-1/3">
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring"
            />
          </form>

          {/* Results dropdown */}
          {searchTerm && searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white border rounded shadow mt-1 max-h-60 overflow-y-auto z-50">
              {isSearching ? (
                <p className="p-2 text-gray-500">Searching...</p>
              ) : (
                searchResults.map((p) => (
                  <div
                    key={p._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      navigate(`/products/${p._id}`);
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                  >
                    <span>{p.name}</span>
                    <span className="text-sm text-gray-500">₹{p.price}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* If no matches */}
          {searchTerm && searchResults.length === 0 && !isSearching && (
            <div className="absolute top-full left-0 w-full bg-white border rounded shadow mt-1 z-50">
              <p className="p-2 text-gray-500">No exact match. Try different keywords.</p>
            </div>
          )}
        </div>

        {/* Desktop Links */}
        <div className="space-x-6 hidden md:flex text-sm font-medium tracking-wide items-center">
          <Link to="/products" className="text-gray-700 hover:text-black transition">
            Products
          </Link>
          <Link to="/track-order" className="text-gray-700 hover:text-black transition">
            Track Order
          </Link>

          {/* Cart Icon */}
          <Link to="/cart" className="relative text-gray-700 hover:text-black transition">
            <ShoppingCart className="inline-block" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-1">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <span className="text-gray-700">👤 {user.name}</span>
              <Link to="/userdashboard/account" className="text-gray-700 hover:text-black transition">
                My Account
              </Link>
              {user?.role === "admin" && (
                <>
                  <Link to="/admin/dashboard" className="text-red-600 hover:text-red-800 transition font-semibold">
                    Dashboard
                  </Link>
                  <Link to="/admin/orders" className="text-red-600 hover:text-red-800 transition font-semibold">
                    Orders
                  </Link>
                  <Link to="/admin/products" className="text-red-600 hover:text-red-800 transition font-semibold">
                    Products
                  </Link>
                  <Link to="/admin/users" className="text-red-600 hover:text-red-800 transition font-semibold">
                    Users
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="text-red-500 hover:text-red-700 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-black transition">
                Login
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-black transition">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white p-6 shadow-lg flex flex-col space-y-6 text-lg font-medium">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/products" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
          <Link to="/track-order" onClick={() => setIsMobileMenuOpen(false)}>Track Order</Link>
          <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>Cart</Link>
          {user ? (
            <>
              <span className="text-gray-700">👤 {user.name}</span>
              <Link to="/userdashboard/account" onClick={() => setIsMobileMenuOpen(false)}>My Account</Link>
              {user?.role === "admin" && (
                <>
                  <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-red-600 font-semibold">
                    Dashboard
                  </Link>
                  <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-red-600 font-semibold">
                    Orders
                  </Link>
                  <Link to="/admin/products" onClick={() => setIsMobileMenuOpen(false)} className="text-red-600 font-semibold">
                    Products
                  </Link>
                  <Link to="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="text-red-600 font-semibold">
                    Users
                  </Link>
                </>
              )}
              <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="text-red-500 text-left">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const AdminRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

export { AdminRoute };
export default Navbar;