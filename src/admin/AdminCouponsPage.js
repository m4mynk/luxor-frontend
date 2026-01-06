// src/admin/AdminCouponsPage.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT",
    discountValue: "",
    expiryDate: "",
    minPurchase: "",
    isActive: true,
  });

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("${process.env.REACT_APP_API_URL}/api/coupons", {
        withCredentials: true,
      });
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch coupons");
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("${process.env.REACT_APP_API_URL}/api/coupons", form, {
        withCredentials: true,
      });
      toast.success("Coupon created!");
      setForm({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        expiryDate: "",
        minPurchase: "",
        isActive: true,
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating coupon");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/coupons/${id}`, {
        withCredentials: true,
      });
      toast.success("Coupon deleted!");
      fetchCoupons();
    } catch (err) {
      toast.error("Error deleting coupon");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Manage Coupons</h1>

      {/* Create Coupon Form */}
      <form
        onSubmit={handleCreate}
        className="bg-white shadow p-6 rounded space-y-4"
      >
        <h2 className="text-xl font-semibold mb-4">Create New Coupon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Coupon Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="PERCENT">Percent %</option>
            <option value="FLAT">Flat ₹</option>
          </select>
          <input
            type="number"
            placeholder="Discount Value"
            value={form.discountValue}
            onChange={(e) =>
              setForm({ ...form, discountValue: e.target.value })
            }
            className="border p-2 rounded"
            required
          />
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Minimum Purchase (₹)"
            value={form.minPurchase}
            onChange={(e) =>
              setForm({ ...form, minPurchase: e.target.value })
            }
            className="border p-2 rounded"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
        <button
          type="submit"
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
        >
          Create Coupon
        </button>
      </form>

      {/* Coupon List */}
      <div className="bg-white shadow p-6 rounded">
        <h2 className="text-xl font-semibold mb-4">All Coupons</h2>
        {coupons.length > 0 ? (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Code</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Value</th>
                <th className="p-2 border">Min Purchase</th>
                <th className="p-2 border">Expiry</th>
                <th className="p-2 border">Active</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td className="p-2 border">{c.code}</td>
                  <td className="p-2 border">{c.discountType}</td>
                  <td className="p-2 border">
                    {c.discountType === "PERCENT"
                      ? `${c.discountValue}%`
                      : `${c.discountValue}`}
                  </td>
                  <td className="p-2 border">₹{c.minPurchase}</td>
                  <td className="p-2 border">
                    {c.expiryDate
                      ? new Date(c.expiryDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2 border">
                    {c.isActive ? "✅ Yes" : "❌ No"}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No coupons created yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminCouponsPage;