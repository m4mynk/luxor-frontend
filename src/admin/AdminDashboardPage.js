import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// ✅ Recharts imports
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    ordersByStatus: {},
    topProducts: [],
    lowStock: [],
  });
  const [statusData, setStatusData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ✅ Fetch core stats
        const res = await axios.get("http://localhost:3001/api/admin/dashboard", {
          withCredentials: true,
        });
        setStats({
          totalOrders: res.data.totalOrders || 0,
          totalRevenue: res.data.totalRevenue || 0,
          ordersByStatus: res.data.ordersByStatus || {},
          topProducts: res.data.topProducts || [],
          lowStock: res.data.lowStock || [],
        });

        // ✅ Fetch analytics
        const statusRes = await axios.get("http://localhost:3001/api/orders/analytics/status", {
          withCredentials: true,
        });
        setStatusData(
          statusRes.data.map((s) => ({
            name: s._id,
            value: s.count,
          }))
        );

        const salesRes = await axios.get("http://localhost:3001/api/orders/analytics/sales", {
          withCredentials: true,
        });
        setSalesData(
          salesRes.data.map((s) => ({
            date: s._id,
            sales: s.totalSales,
            orders: s.count,
          }))
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard stats");
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

  // Colors for PieChart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#9b59b6", "#e74c3c"];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-xl font-semibold">Revenue</h2>
          <p className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-xl font-semibold">Pending Orders</h2>
          <p className="text-3xl font-bold">{stats.ordersByStatus?.Processing || 0}</p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-2xl font-semibold mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.entries(stats.ordersByStatus || {}).map(([status, count]) => (
            <div key={status} className="text-center">
              <p className="text-lg font-semibold">{status}</p>
              <p className="text-2xl">{count}</p>
            </div>
          ))}
        </div>

        {/* 📊 Pie Chart */}
        <div className="mt-6 w-full h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Trends */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-2xl font-semibold mb-4">Sales (Last 30 Days)</h2>
        <div className="w-full h-80">
          <ResponsiveContainer>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Revenue (₹)" />
              <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-2xl font-semibold mb-4">Top Selling Products</h2>
        {stats.topProducts.length > 0 ? (
          <ul className="space-y-2">
            {stats.topProducts.map((p, i) => (
              <li key={i} className="flex justify-between">
                <span>{p.name}</span>
                <span>{p.sold} sold</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No products sold yet.</p>
        )}
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-2xl font-semibold mb-4">Low Stock Alerts</h2>
        {stats.lowStock.length > 0 ? (
          <ul className="space-y-2">
            {stats.lowStock.map((p, i) => (
              <li key={i} className="flex justify-between text-red-600">
                <span>{p.name}</span>
                <span>{p.count} left</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>All products sufficiently stocked.</p>
        )}
      </div>

      {/* Quick Links */}
<div className="bg-white shadow p-6 rounded flex flex-wrap gap-6">
  <Link to="/admin/orders" className="px-6 py-3 bg-black text-white rounded">
    Manage Orders
  </Link>
  <Link to="/admin/products" className="px-6 py-3 bg-black text-white rounded">
    Manage Products
  </Link>
  <Link to="/admin/users" className="px-6 py-3 bg-black text-white rounded">
    Manage Users
  </Link>
  <Link to="/admin/coupons" className="px-6 py-3 bg-black text-white rounded">
    Manage Coupons
  </Link>
</div>
    </div>
  );
};

export default AdminDashboardPage;