// src/admin/AdminOrdersPage.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Confirmation modal state for orders
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    orderId: null,
    newStatus: "",
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await axios.get("${process.env.REACT_APP_API_URL}/api/auth/me", {
        withCredentials: true,
      });
      if (res.data?.user?.role === "admin") {
        setIsAdmin(true);
        fetchOrders();
      } else {
        toast.error("Access denied. Admins only.");
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      toast.error("Unauthorized. Please login as admin.");
      window.location.href = "/login";
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("${process.env.REACT_APP_API_URL}/api/orders", {
        withCredentials: true,
      });
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
      setLoading(false);
    }
  };

  // Remove direct call to axios and window.confirm from here
  const handleStatusChange = (orderId, newStatus) => {
    setConfirmModal({ visible: true, orderId, newStatus });
  };

  const confirmStatusChange = async () => {
    const { orderId, newStatus } = confirmModal;
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success("Order status updated");
      await fetchOrders();

      // Update selected order modal state
      const updatedOrder = orders.find((order) => order._id === orderId);
      if (updatedOrder) {
        setSelectedOrder({ ...updatedOrder, status: newStatus });
      } else {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}`, {
          withCredentials: true,
        });
        setSelectedOrder(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setConfirmModal({ visible: false, orderId: null, newStatus: "" });
    }
  };

  // ✅ Cancel Order by Admin
  const handleCancelOrder = async (orderId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/orders/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );
      toast.success("Order cancelled successfully");
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to cancel order");
    }
  };

  // ✅ Filtering orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(search.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) return null;
  if (loading) return <div className="p-10 text-center">Loading orders...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin - Manage Orders</h1>

      {/* ✅ Search & Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Order ID or Email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="All">All Status</option>
          <option value="Processing">Processing</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* ✅ Orders Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-200 text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order._id} className="border-t">
                  <td className="px-4 py-3">{order._id}</td>
                  <td className="px-4 py-3">{order.user?.email}</td>
                  <td className="px-4 py-3">
  {order.orderItems.map((item, i) => (
    <div key={i}>
      {item.name} – Size: {item.size}, Color: {item.color} × {item.qty} – ₹
    {item.discountedPrice ?? item.price}
    </div>
  ))}
</td>
                  <td className="px-4 py-3 font-semibold">₹{order.totalPrice}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "Delivered"
                          ? "bg-green-200 text-green-800"
                          : order.status === "Shipped"
                          ? "bg-blue-200 text-blue-800"
                          : order.status === "Cancelled"
                          ? "bg-red-200 text-red-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order._id, e.target.value)
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <p><strong>Order ID:</strong> {selectedOrder._id}</p>
            <p><strong>User:</strong> {selectedOrder.user?.email}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>

            <div className="mt-4">
  <h3 className="font-semibold mb-2">Items:</h3>
  {selectedOrder.orderItems.map((item, i) => (
    <div key={i} className="border-b py-2">
      {item.name} – Size: {item.size}, Color: {item.color} × {item.qty} – ₹{item.discountedPrice ?? item.price}
    </div>
  ))}
</div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Shipping Address:</h3>
              <p>{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}</p>
              <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone}</p>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => handleCancelOrder(selectedOrder._id)}
                disabled={selectedOrder.status === "Cancelled" || selectedOrder.status === "Delivered"}
                className={`px-4 py-2 rounded transition ${
                  selectedOrder.status === "Cancelled" || selectedOrder.status === "Delivered"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Cancel Order
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Order Status Change */}
      {confirmModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Confirm Status Change</h2>
            <p className="mb-6">
              Are you sure you want to update the order status to <strong>{confirmModal.newStatus}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() =>
                  setConfirmModal({ visible: false, orderId: null, newStatus: "" })
                }
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;