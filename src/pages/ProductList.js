import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLocation, Link, useNavigate } from 'react-router-dom'; // ✅ added useNavigate
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Navigation, Autoplay, Pagination } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../styles/SwiperCustom.css';
SwiperCore.use([Navigation, Autoplay, Pagination]);

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSizes, setSelectedSizes] = useState({});

  const location = useLocation();
  const navigate = useNavigate(); // ✅ initialize navigation
  const urlSearchParams = new URLSearchParams(location.search);
  const initialSearch = urlSearchParams.get('search') || '';
  const initialCategory = urlSearchParams.get('category') || '';
  const initialColor = urlSearchParams.get('color') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [colorFilter, setColorFilter] = useState(initialColor);

  const { addToCart } = useCart();

  useEffect(() => {
    if (initialCategory) {
      setFilter(initialCategory.toLowerCase());
    }
  }, [initialCategory]);

  // ✅ Fetch products with debounce (500ms)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();

        if (filter !== 'All') params.append('category', filter.toLowerCase());
        if (colorFilter !== 'All') params.append('color', colorFilter.toLowerCase());
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (searchTerm) params.append('search', searchTerm);

        const res = await axios.get(`http://localhost:3001/api/products?${params.toString()}`);
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    const debounceTimer = setTimeout(fetchProducts, 500);
    return () => clearTimeout(debounceTimer);
  }, [filter, colorFilter, minPrice, maxPrice, searchTerm]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      filter === 'All' || product.category?.toLowerCase() === filter.toLowerCase();

    const matchesColor =
      colorFilter === 'All' ||
      (Array.isArray(product.colors) &&
        product.colors.some((c) => c.toLowerCase() === colorFilter.toLowerCase()));

    const matchesPrice =
      (!minPrice || product.price >= parseInt(minPrice)) &&
      (!maxPrice || product.price <= parseInt(maxPrice));

    return matchesCategory && matchesColor && matchesPrice;
  });

  const displayedProducts =
    filteredProducts.length > 0
      ? filteredProducts
      : products.filter((p) =>
          searchTerm
            ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.brand.toLowerCase().includes(searchTerm.toLowerCase())
            : true
        );

  const isFallback = filteredProducts.length === 0 && displayedProducts.length > 0;

  return (
    <div className="px-6 py-10 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Luxor Collection</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-center mb-10">
        {/* unchanged filter inputs */}
        <select
          className="px-4 py-2 rounded border text-gray-700"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="t-shirts">T-Shirts</option>
          <option value="shirts">Shirts</option>
          <option value="jeans">Jeans</option>
          <option value="trousers">Trousers</option>
          <option value="hoodies">Hoodies</option>
        </select>

        <select
          className="px-4 py-2 rounded border text-gray-700"
          value={colorFilter}
          onChange={(e) => setColorFilter(e.target.value)}
        >
          <option value="All">All Colors</option>
          <option value="white">White</option>
          <option value="black">Black</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
        </select>

        <input
          type="number"
          placeholder="Min Price"
          className="px-4 py-2 rounded border text-gray-700"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max Price"
          className="px-4 py-2 rounded border text-gray-700"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {isFallback && (
        <p className="text-center text-gray-600 mb-6">
          No exact matches found. Showing similar results for{" "}
          <span className="font-bold">{searchTerm}</span>.
        </p>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {displayedProducts.length === 0 ? (
          <p className="col-span-full text-center text-gray-600 text-lg">
            No products found.
          </p>
        ) : (
          displayedProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition duration-300 relative"
            >
              {/* ✅ Stock Badge */}
              {product.countInStock === 0 && (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
              {product.countInStock > 0 && product.countInStock < 10 && (
                <span className="absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                  Only {product.countInStock} left
                </span>
              )}

              <Link to={`/product/${product._id}`} className="block">
                <Swiper
                  spaceBetween={10}
                  slidesPerView={1}
                  navigation
                  autoplay={{ delay: 2500, disableOnInteraction: false }}
                  pagination={{ clickable: true, type: 'bullets' }}
                  className="w-full h-72 custom-swiper"
                >
                  {(product.images?.length ? product.images : [product.image]).map((img, i) => (
                    <SwiperSlide key={i}>
                      <img
                        src={img}
                        alt={`${product.name}-${i}`}
                        className="w-full h-72 object-cover"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">{product.name}</h2>
                  <p className="text-sm text-gray-500 mb-1">
                    {product.category} •{" "}
                    {Array.isArray(product.colors) ? product.colors.join(', ') : product.colors}
                  </p>
                  <p className="text-sm text-gray-700 font-semibold mb-3">
                    ₹{product.price.toLocaleString()}
                  </p>
                </div>
              </Link>
              <div className="p-4 pt-0">
                <select
                  className="w-full mb-3 px-4 py-2 rounded border text-gray-700"
                  value={selectedSizes[product._id] || ''}
                  onChange={(e) =>
                    setSelectedSizes((prev) => ({
                      ...prev,
                      [product._id]: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Size</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
                <button
                  onClick={() => {
                    // ✅ Check login
                    const user = JSON.parse(localStorage.getItem("luxorUser"));
                    if (!user) {
                      // Save redirect path and go to login
                      localStorage.setItem("redirectAfterLogin", `/products`);
                      navigate("/login");
                      return;
                    }

                    const selectedSize = selectedSizes[product._id];
                    if (!selectedSize) {
                      alert('Please select a size before adding to cart.');
                      return;
                    }
                    addToCart({ ...product, size: selectedSize });
                  }}
                  disabled={product.countInStock <= 0}
                  className={`w-full py-2 rounded transition ${
                    product.countInStock <= 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductList;