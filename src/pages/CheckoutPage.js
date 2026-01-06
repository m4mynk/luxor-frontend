// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';   // ⬅️ add useLocation here
import axios from 'axios';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation(); // ⬅️ NEW

  // ✅ Buy Now support
  const queryParams = new URLSearchParams(location.search);
  const isBuyNow = queryParams.get("mode") === "buyNow";

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isBuyNow) {
      const buyNowItems = JSON.parse(localStorage.getItem("buyNowItems") || "[]");
      setItems(buyNowItems);
    } else {
      setItems(cartItems);
    }
  }, [isBuyNow, cartItems]);

  const [loadingAddress, setLoadingAddress] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const [shippingOption, setShippingOption] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // ✅ Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('${process.env.REACT_APP_API_URL}/api/auth/me', { withCredentials: true });
        const user = res.data.user;

        setFormData((prev) => ({
          ...prev,
          name: user.name || '',
          phone: user.address?.phone || '',
          address: user.address?.street || '',
          city: user.address?.city || '',
          postalCode: user.address?.postalCode || ''
        }));

        setLoadingAddress(false);
      } catch (err) {
        console.error('Error loading user info:', err);
        toast.error('Failed to load address info');
        setLoadingAddress(false);
      }
    };

    fetchUser();
  }, []);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0); // ⬅️ changed to items
  const shippingFee = shippingOption === 'express' ? 99 : 0;
  const totalBeforeDiscount = subtotal + shippingFee;
  const total = finalPrice || totalBeforeDiscount;  // ✅ use final price if coupon applied

  const estimatedDelivery =
    shippingOption === 'express'
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toDateString();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code");
      return;
    }

    try {
      const { data } = await axios.post(
        "${process.env.REACT_APP_API_URL}/api/coupons/validate",
        { code: couponCode, totalPrice: totalBeforeDiscount },  // ✅ backend expects totalPrice
        { withCredentials: true }
      );
      
     console.log("🔥 Coupon response:", data);  // 👈 add this
      setAppliedCoupon(data.coupon);
      setDiscountAmount(data.discount || 0);
      setFinalPrice(data.finalPrice || null);
      toast.success(`Coupon "${couponCode}" applied!`);
    } catch (err) {
      console.error("Coupon error:", err);
      toast.error(err.response?.data?.message || "Invalid coupon");
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setFinalPrice(null);
    }
  };

  // ✅ COD + Razorpay
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) { // ⬅️ changed to items
      toast.error('Your cart is empty');
      return;
    }

    const hasMissingSize = items.some(item => !item.size); // ⬅️ changed
    if (hasMissingSize) {
      toast.error('Please select size for all items before placing order');
      return;
    }

    if (!formData.phone.match(/^\d{10}$/)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }

    setPlacingOrder(true);

    try {
      // Save/update address
      await axios.post(
        '${process.env.REACT_APP_API_URL}/api/auth/update-address',
        {
          phone: formData.phone,
          address: {
            street: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
          },
        },
        { withCredentials: true }
      );

      // Format items
     const orderItems = items.map((item) => { // ⬅️ changed
  let discountedPrice = item.price;

  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percent") {
      discountedPrice = Number(
        (item.price - (item.price * appliedCoupon.discountValue) / 100).toFixed(2)
      );
    } else if (appliedCoupon.discountType === "flat") {
      const perItemDiscount = appliedCoupon.discountValue / items.length; // ⬅️ changed
      discountedPrice = Number(
        Math.max(item.price - perItemDiscount, 0).toFixed(2)
      );
    }
  }

  return {
    product: item._id,
    name: item.name,
    qty: item.quantity,
    price: item.price,
    discountedPrice,   // 👈 now it will actually be reduced
    image: item.image,
    size: item.size,
    color: item.color,
  };
});

      console.log('Sending orderItems:', orderItems);

      // ✅ COD flow stays same
      if (paymentMethod === "COD") {
        const response = await axios.post(
          '${process.env.REACT_APP_API_URL}/api/orders',
          {
            orderItems,
            paymentMethod: "Cash on Delivery",
            shippingAddress: {
              address: formData.address,
              city: formData.city,
              postalCode: formData.postalCode,
              country: 'India',
              phone: formData.phone
            },
            estimatedDelivery,
            couponCode: appliedCoupon ? appliedCoupon.code : null
          },
          { withCredentials: true }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success('Order placed successfully!');
          if (isBuyNow) {
            localStorage.removeItem("buyNowItems");
          } else {
            clearCart();
          }
          navigate('/order-success', { state: { order: response.data } });
        }
      }

      // ✅ Pay Online → redirect to UPI page
if (paymentMethod === "Online") {
  const orderRes = await axios.post(
    "${process.env.REACT_APP_API_URL}/api/orders",
    {
      orderItems,
      paymentMethod: "Online Payment",
      shippingAddress: {
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: "India",
        phone: formData.phone,
      },
      estimatedDelivery,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
    },
    { withCredentials: true }
  );

  const createdOrder = orderRes.data;

  setPlacingOrder(false);

  navigate("/checkout/pay-online", {
    state: {
      orderId: createdOrder._id,
      totalPrice: createdOrder.totalPrice,
    },
  });

  return;
}

    } catch (err) {
      if (err.response) {
        console.error('Error placing order:', err.response.data);
        toast.error(err.response.data.message || 'Failed to place order');
      } else {
        console.error('Error placing order:', err);
        toast.error('Failed to place order');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loadingAddress) return <div className="text-center py-20">Loading address...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="border p-2 rounded" required />
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          className="border p-2 rounded"
          required
        />
        <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="border p-2 rounded" required />
        <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="border p-2 rounded" required />
        <input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="Postal Code" className="border p-2 rounded" required />
      </form>

      {/* Shipping Options */}
      <div className="bg-white shadow p-6 rounded mb-6">
        <h2 className="text-xl font-semibold mb-4">Shipping Options</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              value="standard"
              checked={shippingOption === 'standard'}
              onChange={() => setShippingOption('standard')}
            />
            Standard Shipping (Free, 5-7 days)
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              value="express"
              checked={shippingOption === 'express'}
              onChange={() => setShippingOption('express')}
            />
            Express Shipping (₹99, 2-3 days)
          </label>
        </div>
      </div>

      {/* Payment Options */}
      <div className="bg-white shadow p-6 rounded mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              value="COD"
              checked={paymentMethod === 'COD'}
              onChange={() => setPaymentMethod('COD')}
            />
            Cash on Delivery
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              value="Online"
              checked={paymentMethod === 'Online'}
              onChange={() => setPaymentMethod('Online')}
            />
            Pay Online
          </label>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white shadow p-6 rounded mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        {items.map((item) => ( // ⬅️ changed to items
          <div key={item._id || item.id} className="flex justify-between mb-2">
            <span>{item.name} ({item.size}) × {item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <hr className="my-4" />

        {/* ✅ Coupon Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter Coupon Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Apply
          </button>
        </div>

        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Shipping:</span>
          <span>{shippingFee > 0 ? `₹${shippingFee}` : "Free"}</span>
        </div>

        {/* ✅ Show Discount if applied */}
        {discountAmount > 0 && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Discount ({appliedCoupon?.code}):</span>
            <span>- ₹{discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>₹{total.toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">Estimated Delivery: {estimatedDelivery}</p>
      </div>

      <button
        type="submit"
        onClick={handlePlaceOrder}
        disabled={placingOrder}
        className={`w-full py-3 rounded font-semibold transition ${
          placingOrder
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }`}
      >
        {placingOrder ? "Placing Order..." : paymentMethod === "COD" ? "Place Order" : "Continue to Pay"}
      </button>
    </div>
  );
};

export default CheckoutPage;