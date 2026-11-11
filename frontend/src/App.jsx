import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CampusThemeProvider, useCampusTheme } from "./hooks/useCampusTheme";
import { CartProvider } from "./hooks/useCart";
import { MessageAlertsProvider } from "./components/MessageAlerts";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ListingDetail from "./pages/ListingDetail";
import SellerProfile from "./pages/SellerProfile";
import Following from "./pages/Following";
import Post from "./pages/Post";
import AuthPages from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Wanted from "./pages/Wanted";
import WantedPost from "./pages/WantedPost";
import WantedDetail from "./pages/WantedDetail";
import Guide from "./pages/Guide";
import AdminReports from "./pages/AdminReports";

function AppShell() {
  const { campus } = useCampusTheme();
  const { pathname } = useLocation();
  const isGuide = pathname === "/guide";
  return (
    <div data-campus={campus}>
      <Navbar />
      <main>
        {/* the guide has its own full-width background, so it skips the .wrap */}
        {isGuide ? (
          <Guide />
        ) : (
        <div className="wrap">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/following" element={<Following />} />
            <Route path="/post" element={<Post />} />
            <Route path="/login" element={<AuthPages />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:orderId/confirmation" element={<OrderConfirmation />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/wanted" element={<Wanted />} />
            <Route path="/wanted/new" element={<WantedPost />} />
            <Route path="/wanted/:id" element={<WantedDetail />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Routes>
        </div>
        )}
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
          <MessageAlertsProvider>
            <AppShell />
          </MessageAlertsProvider>
        </CartProvider>
      </CampusThemeProvider>
    </BrowserRouter>
  );
}