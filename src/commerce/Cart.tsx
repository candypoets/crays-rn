import * as SecureStore from 'expo-secure-store';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { RoomProduct } from '@/rooms/types';

const STORAGE_KEY = 'crays.commerce.cart';

export type CartLine = {
  productId: string;
  address: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  recipientPubkey?: string;
  recipientName?: string;
};

export type CartState = {
  roomId: string;
  roomName: string;
  lines: CartLine[];
};

type CartValue = {
  cart: CartState | null;
  hydrated: boolean;
  count: number;
  total: number;
  add: (roomId: string, roomName: string, product: RoomProduct, quantity: number, recipient?: { pubkey: string; name: string }) => Promise<void>;
  remove: (productId: string, recipientPubkey?: string) => Promise<void>;
  setQuantity: (productId: string, quantity: number, recipientPubkey?: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartValue | null>(null);

function validCart(raw: string | null): CartState | null {
  if (!raw) return null;
  try {
    const cart = JSON.parse(raw) as CartState;
    if (!cart.roomId || !cart.roomName || !Array.isArray(cart.lines)) return null;
    if (cart.lines.some((line) => !line.productId || !line.address || !line.name || !Number.isFinite(line.price) || !Number.isInteger(line.quantity) || line.quantity < 1)) return null;
    return cart;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: PropsWithChildren) {
  const [cart, setCart] = useState<CartState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((value) => setCart(validCart(value)))
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const persist = useCallback(async (next: CartState | null) => {
    if (next?.lines.length) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
    setCart(next?.lines.length ? next : null);
  }, []);

  const add = useCallback<CartValue['add']>(async (roomId, roomName, product, quantity, recipient) => {
    const current = cart?.roomId === roomId ? cart : { roomId, roomName, lines: [] };
    const recipientPubkey = recipient?.pubkey;
    const index = current.lines.findIndex((line) => line.productId === product.id && line.recipientPubkey === recipientPubkey);
    const line: CartLine = {
      productId: product.id,
      address: product.address,
      name: product.name,
      price: product.price,
      currency: product.currency,
      quantity,
      recipientPubkey,
      recipientName: recipient?.name,
    };
    const lines = current.lines.slice();
    if (index >= 0) lines[index] = line;
    else lines.push(line);
    await persist({ roomId, roomName, lines });
  }, [cart, persist]);

  const remove = useCallback<CartValue['remove']>(async (productId, recipientPubkey) => {
    if (!cart) return;
    await persist({ ...cart, lines: cart.lines.filter((line) => !(line.productId === productId && line.recipientPubkey === recipientPubkey)) });
  }, [cart, persist]);

  const setQuantity = useCallback<CartValue['setQuantity']>(async (productId, quantity, recipientPubkey) => {
    if (!cart) return;
    if (quantity < 1) return remove(productId, recipientPubkey);
    await persist({ ...cart, lines: cart.lines.map((line) => line.productId === productId && line.recipientPubkey === recipientPubkey ? { ...line, quantity } : line) });
  }, [cart, persist, remove]);

  const clear = useCallback(() => persist(null), [persist]);
  const value = useMemo<CartValue>(() => ({
    cart,
    hydrated,
    count: cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0,
    total: cart?.lines.reduce((sum, line) => sum + line.price * line.quantity, 0) ?? 0,
    add,
    remove,
    setQuantity,
    clear,
  }), [add, cart, clear, hydrated, remove, setQuantity]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
