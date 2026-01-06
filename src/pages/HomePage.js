// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import SwiperCore, { Navigation, Autoplay } from 'swiper';
SwiperCore.use([Navigation, Autoplay]);

const HomePage = () => {
  const { addToCart } = useCart();
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [topRated, setTopRated] = useState([]); // ⭐ You may also like

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('${process.env.REACT_APP_API_URL}/api/products');

        // ✅ Featured = trending
        const featured = data.filter((p) => p.isFeatured);

        // ✅ New Arrivals = sorted by createdAt (latest 8)
        const latest = [...data]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8);

        // ✅ Top Rated / Most Popular
        const top = [...data]
          .sort((a, b) => b.averageRating - a.averageRating || b.numReviews - a.numReviews)
          .slice(0, 8);

        setTrendingProducts(featured);
        setNewArrivals(latest);
        setTopRated(top);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-center py-10 px-4">
      {/* Hero Banner */}
      <section className="mb-16">
        <div className="relative w-full h-[500px] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80"
            alt="Luxor Menswear Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center px-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Elevate Your Style</h2>
              <p className="text-white text-lg mb-6">Timeless menswear crafted for comfort & confidence.</p>
              <Link
                to="/products"
                className="inline-block bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition"
              >
                Shop Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Links */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Your Dashboard</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link to="/userdashboard/orders" className="bg-slate-600 text-white px-6 py-3 rounded shadow hover:bg-indigo-700">
            🧾 My Orders
          </Link>
          <Link to="/userdashboard/wishlist" className="bg-slate-500 text-white px-6 py-3 rounded shadow hover:bg-pink-600">
            ❤️ Wishlist
          </Link>
          <Link to="/userdashboard/account" className="bg-slate-500 text-white px-6 py-3 rounded shadow hover:bg-green-600">
            👤 My Account
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mb-16 max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold text-left px-4 md:px-0">Shop by Category</h2>

        {[
          { label: 't-shirts', image: 'https://i.postimg.cc/VvFfTTSp/temp-Image-GHGOok.avif' },
          { label: 'jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80' },
          { label: 'shirts', image: 'https://i.postimg.cc/6qK6MwQC/ac159d7cd943f7f7794ea74889fe09c2c8d292b2-jpg.avif' },
          { label: 'trousers', image: 'https://i.postimg.cc/fLmT7kMw/b413e220d1ee22d7bcb86ebc49285749d50480fa-jpg.avif' },
        ].map(({ label, image }) => (
          <Link
            key={label}
            to={`/products?category=${encodeURIComponent(label)}`}
            className="relative block h-60 md:h-72 w-full rounded overflow-hidden group shadow-md hover:shadow-xl transition duration-300"
          >
            <img
              src={image}
              alt={label}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition duration-300 flex items-center justify-center">
              <span className="text-white text-2xl md:text-3xl font-bold capitalize">{label}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Trending Now */}
      <section className="mb-20 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6 text-left">Trending Now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {trendingProducts.map(({ _id, name, price, image, averageRating }) => (
            <Link
              to={`/product/${_id}`}
              key={_id}
              className="bg-white rounded shadow overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition transform duration-300"
            >
              <img src={image} alt={name} className="w-full h-64 object-cover" />
              <div className="p-4 text-left">
                <h3 className="font-semibold text-gray-800 mb-1">{name}</h3>
                <p className="text-gray-600 font-medium mb-2">₹{price.toLocaleString()}</p>
                {/* ⭐ Rating */}
                <div className="flex text-yellow-500 text-sm">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i}>{i < Math.round(averageRating) ? '★' : '☆'}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals Slider */}
      <section className="mb-20 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6 text-left">New Arrivals ⚓︎</h2>
        <Swiper
          spaceBetween={20}
          slidesPerView={1.2}
          navigation
          autoplay={{ delay: 3000 }}
          modules={[Navigation, Autoplay]}
          breakpoints={{
            640: { slidesPerView: 1.5 },
            768: { slidesPerView: 2.5 },
            1024: { slidesPerView: 3.5 },
          }}
        >
          {newArrivals.map(({ _id, name, price, image }) => (
            <SwiperSlide key={_id}>
              <Link
                to={`/product/${_id}`}
                className="bg-white rounded shadow overflow-hidden hover:shadow-xl hover:scale-[1.02] transition block"
              >
                <img src={image} alt={name} className="w-full h-64 object-cover" />
                <div className="p-4 text-left">
                  <h3 className="font-semibold text-gray-800 mb-1">{name}</h3>
                  <p className="text-gray-600 font-medium">₹{price.toLocaleString()}</p>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ⭐ You May Also Like */}
      <section className="mb-20 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6 text-left"> You May Also Like</h2>
        <Swiper
          spaceBetween={20}
          slidesPerView={1.2}
          autoplay={{ delay: 2500 }}
          navigation
          modules={[Navigation, Autoplay]}
          breakpoints={{
            640: { slidesPerView: 1.5 },
            768: { slidesPerView: 2.5 },
            1024: { slidesPerView: 4 },
          }}
        >
          {topRated.map(({ _id, name, price, image, averageRating, numReviews }) => (
            <SwiperSlide key={_id}>
              <Link
                to={`/product/${_id}`}
                className="bg-white rounded shadow overflow-hidden hover:shadow-xl hover:scale-[1.02] transition block"
              >
                <img src={image} alt={name} className="w-full h-64 object-cover" />
                <div className="p-4 text-left">
                  <h3 className="font-semibold text-gray-800 mb-1">{name}</h3>
                  <p className="text-gray-600 font-medium mb-1">₹{price.toLocaleString()}</p>
                  {/* ⭐ Rating with review count */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex text-yellow-500">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i}>{i < Math.round(averageRating) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span>({numReviews} reviews)</span>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </div>
  );
};

export default HomePage;