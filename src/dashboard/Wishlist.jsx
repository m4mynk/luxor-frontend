import React, { useState, useEffect } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import SwiperCore, { Navigation } from "swiper";
SwiperCore.use([Navigation]);

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selectedSizes, setSelectedSizes] = useState({});
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // ✅ Engagement notification after 10s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (wishlistItems.length > 0) {
        toast("Others Are Eyeing Your Picks—Snag ‘Em Before They’re Gone!", {
          icon: "🫠",
        });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [wishlistItems]);

  // ✅ Move to cart without extra GET request
  const handleMoveToCart = (item) => {
    const selectedSize = selectedSizes[item._id];
    if (!selectedSize) {
      toast.error(`Please select a size for "${item.name}"`);
      return;
    }

    if (!item.active || item.countInStock <= 0) {
      toast.error(`"${item.name}" is currently out of stock`);
      return;
    }

    addToCart({ ...item, size: selectedSize });
    removeFromWishlist(item._id);
    toast.success(`Moved "${item.name}" to cart`);
  };

  // ✅ Fetch “You May Also Like” products
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data } = await axios.get("http://localhost:3001/api/products");
        const suggested = [...data]
          .filter((p) => p.isFeatured || p.averageRating >= 4)
          .slice(0, 10); // take top 10
        setSuggestedProducts(suggested);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };
    fetchSuggestions();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center text-gray-500">
          Your wishlist is empty.
          <br />
          <Link to="/products" className="text-blue-600 hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
          {wishlistItems.map((item) => (
            <div
              key={item._id}
              className="bg-white shadow rounded p-4 relative hover:shadow-lg transition"
            >
              {/* ✅ Stock Badge */}
              {item.countInStock === 0 && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
              {item.countInStock > 0 && item.countInStock < 10 && (
                <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Only {item.countInStock} left
                </span>
              )}

              <img
                src={item.image}
                alt={item.name}
                className="w-full h-60 object-cover rounded mb-4"
              />
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                {item.name}
              </h2>
              <p className="text-sm text-gray-600 mb-2">₹{item.price}</p>
              <p className="text-xs text-gray-500">
                {item.countInStock > 0
                  ? `In Stock: ${item.countInStock}`
                  : "Out of Stock"}
              </p>

              {/* ✅ Size selection */}
              <select
                value={selectedSizes[item._id] || ""}
                onChange={(e) =>
                  setSelectedSizes((prev) => ({
                    ...prev,
                    [item._id]: e.target.value,
                  }))
                }
                className="w-full mb-3 px-3 py-2 border rounded text-gray-700"
              >
                <option value="">Select Size</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>

              <div className="flex justify-between items-center">
                <Link
                  to={`/product/${item._id}`}
                  className="text-blue-600 hover:underline"
                >
                  View
                </Link>

                <button
                  onClick={() => handleMoveToCart(item)}
                  disabled={item.countInStock <= 0}
                  className={`px-3 py-1 rounded transition ${
                    item.countInStock <= 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  Move to Cart
                </button>

                <button
                  onClick={() => removeFromWishlist(item._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ You May Also Like (Slider) */}
      {suggestedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            You May Also Like
          </h2>
          <Swiper
            spaceBetween={20}
            slidesPerView={1.2}
            navigation
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
          >
            {suggestedProducts.map((item) => (
              <SwiperSlide key={item._id}>
                <Link
                  to={`/product/${item._id}`}
                  className="bg-white rounded shadow hover:shadow-lg transition block"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-64 object-cover rounded-t"
                  />
                  <div className="p-4 text-left">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">₹{item.price}</p>
                    <div className="flex text-yellow-500 text-xs mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i}>
                          {i < Math.round(item.averageRating || 0) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};

export default Wishlist;