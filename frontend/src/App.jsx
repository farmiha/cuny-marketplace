import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CampusThemeProvider, useCampusTheme } from "./hooks/useCampusTheme";
import { CartProvider } from "./hooks/useCart";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ListingDetail from "./pages/ListingDetail";
import Post from "./pages/Post";
import AuthPages from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";

function AppShell() {
  const { campus } = useCampusTheme();

  return (
    <div data-campus={campus}>
      <Navbar />
      <main>
        <div className="wrap">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/post" element={<Post />} />
            <Route path="/login" element={<AuthPages />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/order/:orderId/confirmation"
              element={<OrderConfirmation />}
            />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CampusThemeProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </CampusThemeProvider>
    </BrowserRouter>
  );
}
