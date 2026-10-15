import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";
import * as cartApi from "../lib/cartApi";

const CartContext = createContext(null);

const EMPTY_CART = {
  groups: [],
  saved: [],
  totals: {
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
    promoCode: null,
    promoError: null,
  },
  count: 0,
  unavailableCount: 0,
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const promoRef = useRef(""); // the promo code the user typed in

  // (re)load the cart from the backend
  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setLoggedIn(Boolean(data.session));
    if (!data.session) {
      setCart(EMPTY_CART);
      setLoading(false);
      return;
    }
    try {
      setCart(await cartApi.getCart(promoRef.current));
    } catch (err) {
      console.error("Could not load cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // load on page load, and again whenever someone logs in or out
  useEffect(() => {
    refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      promoRef.current = "";
      refresh();
    });
    return () => listener.subscription.unsubscribe();
  }, [refresh]);

  const addToCart = async (listingId) => {
    await cartApi.addToCart(listingId);
    await refresh();
  };
  const removeItem = async (listingId) => {
    await cartApi.removeFromCart(listingId);
    await refresh();
  };
  const setSaved = async (listingId, saved) => {
    await cartApi.setSavedForLater(listingId, saved);
    await refresh();
  };
  const applyPromo = async (code) => {
    promoRef.current = code.trim();
    await refresh();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        loggedIn,
        count: cart.count,
        promoCode: promoRef.current,
        refresh,
        addToCart,
        removeItem,
        setSaved,
        applyPromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider");
  return ctx;
}
