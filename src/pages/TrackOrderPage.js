import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrackOrder = async () => {
    if (!orderId || !email) {
      toast.error('Please enter both Order ID and Email');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('${process.env.REACT_APP_API_URL}/api/orders/track', { orderId, email });
      setOrderDetails(res.data);
      toast.success('Order found!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Order not found');
      setOrderDetails(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Track Your Order</h1>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email used for order"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <button
          onClick={handleTrackOrder}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        >
          {loading ? 'Searching...' : 'Track Order'}
        </button>
      </div>

      {orderDetails && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Status: {orderDetails.status}</h2>
          <div className="mt-4 mb-4">
            <div className="flex justify-between text-sm font-medium text-gray-600">
              {['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, index) => (
                <div key={index} className="flex-1 text-center relative">
                  <div
                    className={`h-2 mb-2 rounded-full ${
                      index <= ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].indexOf(orderDetails.status)
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
          <p><strong>Items:</strong> {orderDetails.items.map(item => item.name).join(', ')}</p>
          {orderDetails.discountAmount > 0 && (
            <p className="text-green-600 font-medium">
              <strong>Coupon Discount:</strong> -₹{orderDetails.discountAmount.toLocaleString()}
            </p>
          )}

          <p className="font-semibold">
            <strong>Total:</strong> ₹{orderDetails.total.toLocaleString()}
          </p>
          <p><strong>Shipping Address:</strong> {orderDetails.shippingAddress}</p>
          <p><strong>Estimated Delivery:</strong> {new Date(orderDetails.estimatedDelivery).toLocaleDateString()}</p>
          {orderDetails.status === 'Processing' && (
            <button
              onClick={async () => {
                try {
                  const res = await axios.post('${process.env.REACT_APP_API_URL}/api/orders/cancel', {
                    orderId: orderDetails._id,
                    email,
                  });
                  setOrderDetails(res.data);
                  toast.success('Order cancelled successfully');
                } catch (err) {
                  console.error(err);
                  toast.error(err.response?.data?.message || 'Failed to cancel order');
                }
              }}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage;
