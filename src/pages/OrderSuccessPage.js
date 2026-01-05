// src/pages/OrderSuccessPage.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="max-w-3xl mx-auto text-center py-20 px-6">
      {/* ✅ Bold Success Heading */}
      <h1 className="text-4xl font-extrabold mb-6 text-gray-900 tracking-tight">
        ORDER CONFIRMED
      </h1>

      {/* ✅ Subtext */}
      <p className="text-lg mb-6 text-gray-700">
        Thank you for shopping with <span className="font-semibold">LUXOR</span>.
        <br />
        Your order has been placed successfully and is being processed.
      </p>

      {/* ✅ Order ID if available */}
      {order?._id && (
        <p className="text-base mb-10 text-gray-500">
          Order ID: <span className="font-mono font-semibold text-gray-800">{order._id}</span>
        </p>
      )}

      {/* ✅ Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate("/products")}
          className="px-8 py-3 bg-black text-white text-sm font-semibold tracking-wide rounded-md hover:bg-gray-800 transition"
        >
          CONTINUE SHOPPING
        </button>

        <button
          onClick={() => navigate("/userdashboard/orders")}
          className="px-8 py-3 bg-gray-600 text-white text-sm font-semibold tracking-wide rounded-md hover:lightblue-700 transition"
        >
          TRACK MY ORDER
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;