import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const orderId = state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate("/userdashboard/orders");
      return;
    }

    const timer = setTimeout(() => {
      navigate(`/userdashboard/orders/${orderId}`);
    }, 4000);

    return () => clearTimeout(timer);
  }, [orderId, navigate]);

  if (!orderId) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm max-w-md w-full p-8 text-center animate-fadeIn">

        {/* Check icon */}
        <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center rounded-full bg-black text-white text-3xl">
          ✓
        </div>

        <h1 className="text-2xl font-semibold text-black mb-2">
          Payment Successful
        </h1>

        <p className="text-gray-600 mb-4">
          Your order has been placed successfully.
        </p>

        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-sm text-gray-700">
          <p>
            <span className="font-medium text-black">Order ID:</span>{" "}
            {orderId.slice(-6).toUpperCase()}
          </p>
          <p className="mt-1">
            Estimated delivery in <span className="font-medium text-black">5–7 days</span>
          </p>
        </div>

        <button
          onClick={() => navigate(`/userdashboard/orders/${orderId}`)}
          className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-900 transition"
        >
          View Order
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Redirecting to order details…
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;