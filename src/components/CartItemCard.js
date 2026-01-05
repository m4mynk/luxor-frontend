// src/components/CartItemCard.js
import React from 'react';
import { useCart } from '../context/CartContext';

const CartItemCard = ({ item }) => {
  const { dispatch } = useCart(); // Now it will work because dispatch is part of the context

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: item.id });
  };

  return (
    <div>
      <h3>{item.name}</h3>
      <p>{item.price}</p>
      <button onClick={handleRemove}>Remove</button>
    </div>
  );
};

export default CartItemCard;