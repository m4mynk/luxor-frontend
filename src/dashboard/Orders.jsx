import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('${process.env.REACT_APP_API_URL}/api/orders/myorders', { withCredentials: true });
        setOrders(res.data);
      } catch (err) {
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="text-center py-10">Loading orders...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (orders.length === 0) return <div className="text-center py-10 text-gray-600">You haven’t placed any orders yet.</div>;

  // ✅ Map status → badge color
  const statusBadge = {
    Processing: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    Packed: "bg-blue-100 text-blue-800 border border-blue-300",
    Shipped: "bg-indigo-100 text-indigo-800 border border-indigo-300",
    "Out for Delivery": "bg-purple-100 text-purple-800 border border-purple-300",
    Delivered: "bg-green-100 text-green-800 border border-green-300",
    Cancelled: "bg-red-100 text-red-800 border border-red-400 font-bold",
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Order History</h1>
      {orders.map((order) => (
        <div
          key={order._id}
          className="bg-white rounded-xl p-6 mb-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1 text-gray-800">
                Order #{order._id.slice(-6).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
              {order.status === "Cancelled" && (
                <p className="text-sm text-red-600 mt-1">
                  Cancelled on {new Date(order.updatedAt).toLocaleDateString()}
                </p>
              )}
              {order.status === "Delivered" && (
                <p className="text-sm text-green-600 mt-1">
                  Delivered on {new Date(order.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate(`/userdashboard/orders/${order._id}`)}
              className="text-sm font-medium text-black border border-gray-300 px-4 py-1 rounded hover:bg-gray-100 transition"
            >
              View Details
            </button>
          </div>

          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium text-gray-800">Items:</span>{' '}
              {order.orderItems.map(i => i.name).join(', ')}
            </p>
            {order.discountAmount > 0 && (
              <p className="text-green-600">
                <span className="font-medium">Coupon Discount:</span> -₹{order.discountAmount}
              </p>
            )}

            <p>
              <span className="font-medium text-gray-800">Total:</span> ₹{order.totalPrice}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium text-gray-800">Status:</span>{' '}
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge[order.status] || "bg-gray-100 text-gray-600 border"}`}>
                {order.status}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            {order.orderItems.map((item, i) => (
              <div key={i} className="flex flex-col items-center w-20">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded border cursor-pointer hover:shadow-lg transition"
                  onClick={() => navigate(`/product/${item.product}`)} // 🔗 Go to product page
                />
                <p className="text-xs text-gray-600 mt-1 text-center truncate w-full">
                  {item.name}
               </p>
             </div>
           ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;