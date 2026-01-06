import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    updateSize,
  } = useCart();

  const [liveStock, setLiveStock] = useState({});

  // ✅ Fetch latest stock whenever cart changes
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const updates = {};
        for (let item of cartItems) {
          const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/products/${item._id}/stock`);
          updates[item._id] = data.countInStock;
        }
        setLiveStock(updates);
      } catch (err) {
        console.error("❌ Error fetching stock:", err);
      }
    };

    if (cartItems.length > 0) {
      fetchStock();
    }
  }, [cartItems]);

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSizeChange = (id, size, item) => {
    updateSize(id, size, item);
    toast.success(`Size set to ${size}`);
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Your Cart is Empty</h2>
        <Link to="/products" className="text-blue-600 hover:underline">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">🛒 Your Cart</h1>

      <div className="space-y-6">
        {cartItems.map((item) => {
  const stock = liveStock[item._id] ?? item.countInStock;
  return (
    <div
      key={`${item._id}-${item.size || 'nosize'}-${item.color || 'nocolor'}`} // ✅ unique key
      className="flex items-center justify-between bg-white shadow p-4 rounded-lg"
    >
      <div className="flex items-center gap-4">
        <img src={item.image} alt={item.name} className="w-20 h-28 object-cover rounded" />
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{item.name}</h2>
          <p className="text-sm text-gray-500">
            {item.category} • {item.color || 'No color'}
          </p>
          <p className="text-sm text-gray-600">₹{item.price}</p>
          <p className="text-xs text-gray-500">In Stock: {stock}</p>

          <div className="mt-2">
            <label className="text-sm mr-2">Size:</label>
            <select
              value={item.size || ''}
              onChange={(e) => handleSizeChange(item._id, e.target.value, item)}
              className="border px-2 py-1 rounded"
            >
              <option value="">Select Size</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            decreaseQuantity(item._id, item.size, item.color);
            toast.success('Decreased quantity');
          }}
          className="text-gray-600 hover:text-black"
        >
          <Minus size={18} />
        </button>
        <span className="font-medium">{item.quantity}</span>
        <button
          onClick={() => {
            if (item.quantity >= stock) {
              toast.error(`Only ${stock} left in stock for "${item.name}"`);
              return;
            }
            increaseQuantity(item._id, item.size, item.color);
            toast.success('Increased quantity');
          }}
          className="text-gray-600 hover:text-black"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => {
            removeFromCart(item._id, item.size, item.color); // ✅ pass size + color too
            toast.success('Item removed from cart');
          }}
          className="text-red-500 hover:text-red-700 ml-4"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
})}
      </div>

      <div className="mt-10 flex flex-col md:flex-row justify-between items-center border-t pt-6">
        <div className="text-xl font-semibold text-gray-800">
          Total: ₹{totalPrice.toLocaleString()}
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button
            onClick={() => {
              clearCart();
              toast.success('Cart cleared!');
            }}
            className="px-5 py-2 border border-gray-600 text-gray-700 rounded hover:bg-gray-100 transition"
          >
            Clear Cart
          </button>
          <button
            onClick={() => {
              const missingSize = cartItems.find(item => !item.size);
              if (missingSize) {
                toast.error(`Please select a size for "${missingSize.name}" before checkout.`);
                return;
              }

              // ✅ Block checkout if stock exceeded
              const outOfStock = cartItems.find(item => {
                const stock = liveStock[item._id] ?? item.countInStock;
                return item.quantity > stock;
              });
              if (outOfStock) {
                const stock = liveStock[outOfStock._id] ?? outOfStock.countInStock;
                toast.error(`"${outOfStock.name}" exceeds available stock (${stock})`);
                return;
              }

              navigate('/checkout');
            }}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition text-center"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;