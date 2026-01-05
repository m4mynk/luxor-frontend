// src/context/CartContext.js
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  cartItems: [],
};

// Reducer
const cartReducer = (state, action) => {
  let newCartItems;
  switch (action.type) {
    case 'ADD_TO_CART': {
  // ✅ Normalize size + color
  const payloadWithOptions = {
    ...action.payload,
    size: action.payload.size || action.payload.selectedSize,
    color: action.payload.color || action.payload.selectedColor || null,
    quantity: action.payload.quantity || 1, // ✅ ensure quantity is respected
  };

  const exists = state.cartItems.find(
    item =>
      item._id === payloadWithOptions._id &&
      item.size === payloadWithOptions.size &&
      item.color === payloadWithOptions.color
  );

  if (exists) {
    newCartItems = state.cartItems.map(item =>
      item._id === payloadWithOptions._id &&
      item.size === payloadWithOptions.size &&
      item.color === payloadWithOptions.color
        // ✅ Add chosen quantity instead of always +1
        ? { ...item, quantity: item.quantity + payloadWithOptions.quantity }
        : item
    );
  } else {
    // ✅ Start with chosen quantity instead of always 1
    newCartItems = [...state.cartItems, payloadWithOptions];
  }

  localStorage.setItem('cartItems', JSON.stringify(newCartItems));
  return { ...state, cartItems: newCartItems };
}

    case 'REMOVE_FROM_CART': {
      newCartItems = state.cartItems.filter(
        item =>
          !(
            item._id === action.payload._id &&
            item.size === action.payload.size &&
            item.color === action.payload.color // 🟢 match color too
          )
      );
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return { ...state, cartItems: newCartItems };
    }

    case 'INCREASE_QUANTITY': {
      const normSize = action.payload.size || action.payload.selectedSize;
      const normColor = action.payload.color || action.payload.selectedColor || null;
      newCartItems = state.cartItems.map(item => {
        if (item._id === action.payload._id && item.size === normSize && item.color === normColor) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return { ...item };
      });
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return { ...state, cartItems: newCartItems };
    }

    case 'DECREASE_QUANTITY': {
      const normSize = action.payload.size || action.payload.selectedSize;
      const normColor = action.payload.color || action.payload.selectedColor || null;
      newCartItems = state.cartItems.map(item => {
        if (
          item._id === action.payload._id &&
          item.size === normSize &&
          item.color === normColor &&
          item.quantity > 1
        ) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return { ...item };
      });
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return { ...state, cartItems: newCartItems };
    }

    case 'CLEAR_CART': {
      localStorage.setItem('cartItems', JSON.stringify([]));
      return { ...state, cartItems: [] };
    }

    case 'UPDATE_SIZE': {
      newCartItems = state.cartItems.map(item =>
        item._id === action.payload.id ? { ...item, size: action.payload.size } : item
      );
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return { ...state, cartItems: newCartItems };
    }

    case 'UPDATE_COLOR': { // 🟢 New case for color updates
      newCartItems = state.cartItems.map(item =>
        item._id === action.payload.id ? { ...item, color: action.payload.color } : item
      );
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return { ...state, cartItems: newCartItems };
    }

    default:
      return state;
  }
};

// Context and Provider
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    cartReducer,
    { cartItems: JSON.parse(localStorage.getItem('cartItems')) || [] }
  );

  const debounceRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
  }, [state.cartItems]);

  const addToCart = (product) => {
    const size = product.size || product.selectedSize;
    const color = product.color || product.selectedColor || null;

    if (!product._id || !size) {
      console.warn("🚫 Cannot add to cart: Missing _id or size.");
      return;
    }
    const normalizedProduct = { ...product, size, color };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch({ type: 'ADD_TO_CART', payload: normalizedProduct });
      toast.success('Added to cart!');
    }, 400);
  };

  const removeFromCart = (_id, size, color) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { _id, size, color } });
  };

  const increaseQuantity = (_id, size, color) => {
    dispatch({ type: 'INCREASE_QUANTITY', payload: { _id, size, color } });
  };

  const decreaseQuantity = (_id, size, color) => {
    dispatch({ type: 'DECREASE_QUANTITY', payload: { _id, size, color } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const updateSize = (id, size) => {
    dispatch({ type: 'UPDATE_SIZE', payload: { id, size } });
  };

  const updateColor = (id, color) => { // 🟢 new function
    dispatch({ type: 'UPDATE_COLOR', payload: { id, color } });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        cartItems: state.cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        updateSize,
        updateColor, // 🟢 export color updater
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);