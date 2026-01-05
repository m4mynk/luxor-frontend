// src/pages/ProductDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]); 
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { wishlistItems, addToWishlist } = useWishlist();
  const navigate = useNavigate();

  const handleAddToWishlist = () => {
    const user = JSON.parse(localStorage.getItem("luxorUser"));
    if (!user) {
      localStorage.setItem("redirectAfterLogin", `/product/${id}`);
      toast.error("Please login to add items to your wishlist.");
      navigate("/login");
      return;
    }

    if (!wishlistItems.find(item => item._id === product._id)) {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    } else {
      toast('Already in wishlist!');
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/products/${id}`);
        setProduct(res.data);

        // ✅ Smart defaults for size/color + image (variant-aware and imagesByColor-aware)
        const pd = res.data;
        if (pd.variants?.length) {
          const first = pd.variants.find(v => v.stock > 0) || pd.variants[0];
          setSelectedSize(first.size);
          setSelectedColor(first.color);

          const imgs =
            (pd.imagesByColor && pd.imagesByColor[first.color]) ||
            pd.images ||
            [];
          setMainImage(imgs[0] || pd.image);
        } else {
          // No variants → try colors list or fallback to main image
          if (pd.colors?.length) {
            const firstColor = pd.colors[0];
            setSelectedColor(firstColor);
            const imgs =
              (pd.imagesByColor && pd.imagesByColor[firstColor]) ||
              pd.images ||
              [];
            setMainImage(imgs[0] || pd.image);
          } else {
            setMainImage(pd.image);
          }
        }

        // ✅ Fetch related products by category
        if (res.data.category) {
          const related = await axios.get(
            `http://localhost:3001/api/products?category=${res.data.category}`
          );
          setRelatedProducts(
            related.data.filter((p) => p._id !== res.data._id).slice(0, 6)
          );
        }

        // ✅ Save to Recently Viewed
        let viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
        viewed = viewed.filter((p) => p._id !== res.data._id);
        viewed.unshift(res.data);
        if (viewed.length > 8) viewed = viewed.slice(0, 8);
        localStorage.setItem("recentlyViewed", JSON.stringify(viewed));

        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduct();
  }, [id]);
// 👉 Pick images for the selected color, fall back to default images
const displayImages =
  (product?.imagesByColor &&
    (
      (selectedColor && product.imagesByColor[selectedColor]) ||
      Object.values(product.imagesByColor)[0]
    )
  ) ||
  product?.images ||
  [];

// 👉 When color changes, auto-switch the big image to that color's first image
useEffect(() => {
  if (!product) return;
  const imgs =
    (product?.imagesByColor &&
      selectedColor &&
      product.imagesByColor[selectedColor]) ||
    product?.images ||
    [];
  if (imgs.length) {
    setMainImage(imgs[0]);
  }
}, [selectedColor, product?._id]); // runs when color or product changes
  // ✅ Figure out selected variant
  const selectedVariant = product?.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const variantOutOfStock = selectedVariant && selectedVariant.stock === 0;

  const handleAddToCart = () => {
    const user = JSON.parse(localStorage.getItem("luxorUser"));
    if (!user) {
      localStorage.setItem("redirectAfterLogin", `/product/${id}`);
      toast.error("Please login to add items to your cart.");
      navigate("/login");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }
    if (variantOutOfStock) {
      toast.error("This variant is out of stock");
      return;
    }
    addToCart({ ...product, size: selectedSize, color: selectedColor, quantity });
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
  const user = JSON.parse(localStorage.getItem("luxorUser"));
  if (!user) {
    localStorage.setItem("redirectAfterLogin", `/product/${id}`);
    toast.error("Please login to continue checkout.");
    navigate("/login");
    return;
  }
  if (!selectedSize) {
    toast.error("Please select a size");
    return;
  }
  if (!selectedColor) {
    toast.error("Please select a color");
    return;
  }
  if (variantOutOfStock) {
    toast.error("This variant is out of stock");
    return;
  }

  // ❌ Don't use addToCart
  // ✅ Instead, store this one item separately
  const buyNowItem = { ...product, size: selectedSize, color: selectedColor, quantity };
  localStorage.setItem("buyNowItems", JSON.stringify([buyNowItem]));

  toast.success("Redirecting to checkout...");
  navigate("/checkout?mode=buyNow"); // ✅ pass query param
};

  if (loading) return <div className="text-center py-20">Loading product...</div>;
  if (!product) return <div className="text-center py-20">Product not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Images */}
        <div className="flex-1 relative">
          {product.countInStock === 0 && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
              Out of Stock
            </span>
          )}
          {product.countInStock > 0 && product.countInStock < 10 && (
            <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
              Only {product.countInStock} left
            </span>
          )}
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-[500px] object-cover rounded shadow"
          />
          <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {displayImages.map((img, i) => (
  <img
    key={i}
    src={img}
    alt={`thumb-${i}`}
    className={`min-w-[80px] w-20 h-24 object-cover cursor-pointer border-2 transition-all duration-200 ${
      mainImage === img ? 'border-black scale-105 shadow-md' : 'border-gray-300 hover:border-black'
    }`}
    onClick={() => setMainImage(img)}
  />
))}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>

          <p className="text-sm mb-4">
            {product.countInStock > 0
              ? `In Stock: ${product.countInStock}`
              : "Currently Out of Stock"}
          </p>

          {/* ✅ Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <p className="font-medium text-gray-700 mb-2">Available Variants:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((variant, index) => (
  <button
    key={index}
    onClick={() => {
      setSelectedSize(variant.size);
      setSelectedColor(variant.color);
      toast.success(`Selected ${variant.size} / ${variant.color}`);

      // 🟢 NEW: Automatically change images when color changes
      const imgs =
        (product?.imagesByColor &&
          product.imagesByColor[variant.color]) ||
        product?.images ||
        [];
      if (imgs.length) setMainImage(imgs[0]);
    }}
    disabled={variant.stock === 0}
    className={`px-3 py-2 rounded border text-sm ${
      selectedSize === variant.size && selectedColor === variant.color
        ? "bg-black text-white"
        : "bg-white text-black"
    } ${variant.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {variant.size} / {variant.color}{" "}
    <span className="text-gray-500 text-xs">
      ({variant.stock > 0 ? `${variant.stock} left` : "Out"})
    </span>
  </button>
))}
              </div>
            </div>
          )}

          {/* 🟢 Show hardcoded Size/Color ONLY if no variants exist */}
          {!product.variants?.length && (
            <>
              <div className="mb-4">
                <p className="font-medium text-gray-700 mb-2">Select Size:</p>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={product.countInStock === 0}
                      className={`px-3 py-1 rounded border ${
                        selectedSize === size ? 'bg-black text-white' : 'bg-white text-black'
                      } ${product.countInStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700 mb-2">Select Color:</p>
                <div className="flex gap-2">
                  {(product.colors || []).map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        const imgs =
                          (product?.imagesByColor && product.imagesByColor[color]) ||
                          product?.images ||
                          [];
                        if (imgs.length) setMainImage(imgs[0]);
                      }}
                      disabled={product.countInStock === 0}
                      className={`px-3 py-1 rounded border ${
                        selectedColor === color ? 'bg-black text-white' : 'bg-white text-black'
                      } ${product.countInStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <p className="text-xl font-semibold text-gray-800 mb-6">₹{product.price}</p>
          <p className="text-sm text-yellow-900 mb-4 italic">
            Unleash luxury & confidence with this exclusive Luxor style – made to turn heads.
          </p>
          {/* Quantity Selector */}
<div className="mb-4 flex items-center gap-3">
  <p className="font-medium text-gray-700">Quantity:</p>
  <button
    onClick={() => setQuantity(qty => Math.max(1, qty - 1))}
    className="px-3 py-1 border rounded"
  >
    -
  </button>
  <span className="px-4">{quantity}</span>
  <button
    onClick={() => setQuantity(qty => qty + 1)}
    className="px-3 py-1 border rounded"
  >
    +
  </button>
</div>

          
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={product.countInStock === 0 || variantOutOfStock}
              className={`px-6 py-2 rounded transition ${
                product.countInStock === 0 || variantOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Add to Cart
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!selectedSize || !selectedColor || product.countInStock === 0 || variantOutOfStock}
              className={`px-6 py-2 rounded transition ${
                !selectedSize || !selectedColor || product.countInStock === 0 || variantOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Buy Now
            </button>
          </div>

          {/* ✅ Selected variant stock info */}
          {selectedVariant && (
            <p className="mt-3 text-sm text-gray-600">
              {variantOutOfStock
                ? "❌ This variant is out of stock"
                : `✅ Stock left for ${selectedVariant.size}/${selectedVariant.color}: ${selectedVariant.stock}`}
            </p>
          )}

          <button
            onClick={handleAddToWishlist}
            className="mt-4 px-6 py-2 border border-grey-600 text-black-600 rounded hover:bg-grey-50 transition"
          >
            Add to Wishlist
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>

        {/* ⭐ Average rating + count */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex text-yellow-500 text-lg">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>
                {i < Math.round(product.averageRating) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-gray-700 text-sm">
            {product.averageRating?.toFixed(1) || 0} / 5 ({product.numReviews || 0} reviews)
          </span>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((review, index) => (
                <div key={index} className="border p-4 rounded bg-white shadow-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{review.name}</h4>
                    <div className="flex text-yellow-500 text-sm">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i}>
                          {i < review.rating ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet.</p>
        )}
      </div>

      {/* Submit Review Section */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Write a Review</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!rating || !comment) {
              toast.error("Please fill all review fields");
              return;
            }
            try {
              await axios.post(
                `http://localhost:3001/api/products/${id}/reviews`,
                { rating: Number(rating), comment },
                { withCredentials: true }
              );
              toast.success("Review submitted!");
              setRating(0);
              setComment("");
              const res = await axios.get(`http://localhost:3001/api/products/${id}`);
              setProduct(res.data);
            } catch (err) {
              toast.error(err.response?.data?.message || "Error submitting review");
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Rating:</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border rounded"
            >
              <option value="">Select rating</option>
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} - {["Poor", "Fair", "Good", "Very Good", "Excellent"][r - 1]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Comment:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
              className="mt-1 block w-full px-4 py-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Submit Review
          </button>
        </form>
      </div>
      {/* Recently Viewed Section */}
<div className="mt-16">
  <h2 className="text-2xl font-bold text-gray-800 mb-6">Recently Viewed</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
    {JSON.parse(localStorage.getItem("recentlyViewed") || "[]")
      .filter(p => p._id !== product._id) // don’t show current product
      .map((p) => (
        <div key={p._id} className="bg-white shadow rounded overflow-hidden hover:shadow-lg transition">
          <img src={p.image} alt={p.name} className="w-full h-48 object-cover" />
          <div className="p-3 text-left">
            <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
            <p className="text-gray-600 text-sm">₹{p.price}</p>
          </div>
        </div>
      ))}
  </div>
</div>
      {/* ✅ You May Also Like Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link
                key={item._id}
                to={`/product/${item._id}`}
                className="group block bg-white rounded-lg shadow hover:shadow-2xl transition overflow-hidden"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-black">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.category}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">₹{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;