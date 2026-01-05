// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOtp = async () => {
    if (!email) return toast.error('Please enter your email');
    try {
      await axios.post('http://localhost:3001/api/auth/forgot-password', { email });
      toast.success('OTP sent to email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) return toast.error('Fill all fields');
    try {
      await axios.post('http://localhost:3001/api/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      toast.success('Password reset successfully! Please log in with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
      {step === 1 && (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full border px-4 py-2 rounded mb-4"
          />
          <button
            onClick={handleSendOtp}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Send OTP
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter OTP"
            className="w-full border px-4 py-2 rounded mb-4"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full border px-4 py-2 rounded mb-4"
          />
          <button
            onClick={handleResetPassword}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Reset Password
          </button>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;