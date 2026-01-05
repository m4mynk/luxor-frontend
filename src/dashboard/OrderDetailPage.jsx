// src/dashboard/OrderDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/orders/${id}`, {
          withCredentials: true,
        });
        setOrder(res.data);
      } catch (err) {
        toast.error("Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    try {
      await axios.put(
        `http://localhost:3001/api/orders/${id}/cancel`,
        {},
        { withCredentials: true }
      );
      toast.success("Order cancelled successfully");
      setOrder({ ...order, status: "Cancelled" }); // ✅ update immediately
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    }
  };

  const getEstimatedDelivery = () => {
    if (!order?.createdAt) return "";
    const date = new Date(order.createdAt);
    date.setDate(date.getDate() + 5); // +5 days
    return date.toDateString();
  };

  if (loading) return <div className="text-center py-10">Loading order details...</div>;
  if (!order) return <div className="text-center py-10">Order not found.</div>;

  // Timeline component
  const OrderTimeline = ({ status }) => {
    const steps = ["Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];
    const currentStep = steps.findIndex(s => s.toLowerCase() === status.toLowerCase());
    const activeStep = currentStep === -1 ? 0 : currentStep;
    return (
      <div className="flex items-center w-full mb-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold " +
                  (idx <= activeStep
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500")
                }
              >
                {idx + 1}
              </div>
              <span
                className={
                  "text-xs mt-1 " +
                  (idx <= activeStep ? "text-green-700 font-semibold" : "text-gray-400")
                }
              >
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={
                  "flex-1 h-1 mx-1 " +
                  (idx < activeStep ? "bg-green-600" : "bg-gray-300")
                }
                style={{ minWidth: 16 }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Order #{order._id.slice(-6).toUpperCase()}
      </h1>

      {/* Status */}
      <div className="mb-6 text-center">
        {order.status === "Cancelled" ? (
          <span className="inline-block bg-red-600 text-white px-6 py-2 rounded-full text-lg font-bold">
            CANCELLED
          </span>
        ) : (
          <>
            <OrderTimeline status={order.status} />
            <p className="text-lg mt-2">
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={
                  order.status === "Delivered"
                    ? "text-green-600 font-bold"
                    : "text-yellow-600"
                }
              >
                {order.status}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Estimated Delivery: {getEstimatedDelivery()}
            </p>
          </>
        )}
      </div>

      {/* Items */}
<div className="bg-white shadow rounded-lg p-4 mb-6">
  <h2 className="text-xl font-semibold mb-3">Items</h2>
  {order.orderItems.map((item, i) => (
    <div
      key={i}
      className="flex justify-between items-center border-b py-2 cursor-pointer hover:bg-gray-50"
      onClick={() => navigate(`/product/${item.product}`)} // ✅ click anywhere in row
    >
      <div className="flex items-center gap-4">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 object-cover rounded border"
        />
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-500">Qty: {item.qty}</p>
        </div>
      </div>
      <p className="font-semibold">₹{item.price * item.qty}</p>
    </div>
  ))}
  {order.discountAmount > 0 && (
    <div className="flex justify-between text-green-600 font-medium mt-2">
      <span>Coupon Discount:</span>
      <span>-₹{order.discountAmount.toLocaleString()}</span>
    </div>
  )}

  <div className="flex justify-between font-bold text-lg mt-2">
    <span>Total:</span>
    <span>₹{order.totalPrice.toLocaleString()}</span>
  </div>
</div>

      {/* Shipping */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Shipping Address</h2>
        <p>{order.shippingAddress?.address}</p>
        <p>
          {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
        </p>
        <p>Phone: {order.shippingAddress?.phone}</p>
        <p>Country: {order.shippingAddress?.country}</p>
      </div>

      {/* Cancel button (only if still processing) */}
      {order.status === "Processing" && (
        <button
          onClick={handleCancelOrder}
          className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition"
        >
          Cancel Order
        </button>
      )}
    </div>
  );
};

export default OrderDetailPage;