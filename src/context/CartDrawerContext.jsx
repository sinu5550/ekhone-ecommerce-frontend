// context/CartDrawerContext.jsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import CartSliderDrawer from '@/components/Cart/CartSliderDrawer';

const CartDrawerContext = createContext({
  isCartDrawerOpen: false,
  openCartDrawer: () => {},
  closeCartDrawer: () => {},
});

export function CartDrawerProvider({ children }) {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  return (
    <CartDrawerContext.Provider
      value={{ isCartDrawerOpen, openCartDrawer, closeCartDrawer }}
    >
      {children}
      <CartSliderDrawer
        isOpen={isCartDrawerOpen}
        onClose={closeCartDrawer}
      />
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  return useContext(CartDrawerContext);
}
