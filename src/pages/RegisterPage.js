import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/send-otp`, { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-email`, {
        email,
        code: otp
      });
      toast.success('OTP verified. Now complete your profile');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleFinalRegister = async (e) => {
    e.preventDefault();
    const { name, password } = formData;
    if (!name || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        name,
        email,
        password,
        role: 'customer'
      });
      toast.success('Registered successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 to-white flex flex-col justify-center items-center text-center px-6">
      <div className="max-w-3xl text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Step Into Elegance With <span className="text-black">Luxor</span> 
        </h1>
        <p className="text-lg md:text-xl text-gray-700">
          Discover the perfect blend of timeless fashion and modern luxury. From exclusive drops to iconic essentials, Luxor is your gateway to premium style.
        </p>
      </div>

      <div className="bg-white shadow-lg p-8 rounded-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create Your Account</h2>

        {step === 1 && (
          <div className="space-y-4 text-left">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              required
            />
            <button
              onClick={handleSendOTP}
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
            >
              Send OTP
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-left">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              required
            />
            <button
              onClick={handleVerifyOTP}
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
            >
              Verify OTP
            </button>
          </div>
        )}
 
        {step === 3 && (
          <form onSubmit={handleFinalRegister} className="space-y-4 text-left">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              required
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
            >
              Register
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-800 font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;