// src/context/WishlistContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const WishlistContext = createContext();

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_WISHLIST':
      return action.payload;
    case 'ADD_TO_WISHLIST':
      if (state.find(item => item._id === action.payload._id)) return state;
      return [...state, action.payload];
    case 'REMOVE_FROM_WISHLIST':
      return state.filter(item => item._id !== action.payload);
    case 'UPDATE_WISHLIST_ITEM':
      return state.map(item =>
        item._id === action.payload._id ? { ...item, ...action.payload } : item
      );
    default:
      return state;
  }
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, dispatch] = useReducer(
    wishlistReducer,
    [],
    () => {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    }
  );

  // ✅ Persist to localStorage
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // ✅ WishlistContext.js (fixed sync loop)
useEffect(() => {
  const syncStock = async () => {
    if (wishlistItems.length === 0) return;
    try {
      const updatedItems = await Promise.all(
        wishlistItems.map(async (item) => {
          try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/products/${item._id}`);
            return {
              ...item,
              countInStock: res.data.countInStock,
              active: res.data.active,
            };
          } catch {
            return { ...item, countInStock: 0, active: false }; // fallback
          }
        })
      );

      // ✅ Only update if something actually changed
      const hasChanges = updatedItems.some(
        (u, i) =>
          u.countInStock !== wishlistItems[i]?.countInStock ||
          u.active !== wishlistItems[i]?.active
      );

      if (hasChanges) {
        updatedItems.forEach((p) =>
          dispatch({ type: "UPDATE_WISHLIST_ITEM", payload: p })
        );
      }
    } catch (err) {
      console.error("❌ Error syncing wishlist stock:", err);
    }
  };

  // run once at mount
  syncStock();
  // then poll every 30s
  const interval = setInterval(syncStock, 30000);
  return () => clearInterval(interval);
}, []); // 🚀 removed wishlistItems from deps

  const addToWishlist = (item) =>
    dispatch({ type: 'ADD_TO_WISHLIST', payload: item });

  const removeFromWishlist = (id) =>
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: id });

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);