import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        formData,
        { withCredentials: true }
      );

      // Save user object to localStorage so frontend can know the role
      if (res.data && res.data.user) {
        localStorage.setItem("luxorUser", JSON.stringify(res.data.user));
      }

      toast.success('Logged in successfully!');

      // ✅ Redirect after login if key exists
      const redirectPath = localStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      toast.error(
  err.response?.data?.message || "Login failed. Please check your credentials."
);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Welcome Back to Luxor
        </h2>
        <p className="text-center text-gray-600">
          Unlock your personalized fashion feed, exclusive launches, and secret sales.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition"
          >
            Sign In
          </button>
          <div className="text-right">
            <a href="/forgot-password" className="text-sm text-gray-600 hover:underline">
              Forgot your password?
            </a>
          </div>
        </form>
        <p className="text-center text-sm text-gray-500">
          New to Luxor? <a href="/register" className="text-black hover:underline">Create an account</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;