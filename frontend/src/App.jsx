import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CampusThemeProvider, useCampusTheme } from "./hooks/useCampusTheme";
import { CartProvider } from "./hooks/useCart";
import { MessageAlertsProvider } from "./components/MessageAlerts";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import OutcomeNotice from "./components/OutcomeNotice";
import IntroCurtain from "./components/IntroCurtain";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ListingDetail from "./pages/ListingDetail";
import SellerProfile from "./pages/SellerProfile";
import Following from "./pages/Following";
import Post from "./pages/Post";
import AuthPages from "./pages/AuthPages";
import Dashboard, { MessagesPage, ProfilePage } from "./pages/Dashboard";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Wanted from "./pages/Wanted";
import WantedPost from "./pages/WantedPost";
import WantedDetail from "./pages/WantedDetail";
import Notifications from "./pages/Notifications";
import Guide from "./pages/Guide";
import AdminReports from "./pages/AdminReports";

function AppShell() {
  const { campus } = useCampusTheme();
  const { pathname } = useLocation();
  const isGuide = pathname === "/guide";
  return (
    <div data-campus={campus}>
      <IntroCurtain />
      <Navbar />
      <OutcomeNotice />
      <main className="mp-main">
        {/* the guide has its own full-width background, so it skips the .wrap */}
        {isGuide ? (
          <Guide />
        ) : (
        <div className="wrap mp-bleed">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/seller/:id" element={<Legacy><SellerProfile /></Legacy>} />
            <Route path="/following" element={<Legacy><Following /></Legacy>} />
            <Route path="/post" element={<Post />} />
            <Route path="/login" element={<AuthPages />} />
            <Route path="/dashboard" element={<Legacy><Dashboard /></Legacy>} />
            <Route path="/messages" element={<Legacy><MessagesPage /></Legacy>} />
            <Route path="/profile" element={<Legacy><ProfilePage /></Legacy>} />
            <Route path="/about" element={<Legacy><About /></Legacy>} />
            <Route path="/cart" element={<Legacy><Cart /></Legacy>} />
            <Route path="/checkout" element={<Legacy><Checkout /></Legacy>} />
            <Route path="/order/:orderId/confirmation" element={<Legacy><OrderConfirmation /></Legacy>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/wanted" element={<Wanted />} />
            <Route path="/wanted/new" element={<WantedPost />} />
            <Route path="/wanted/:id" element={<WantedDetail />} />
            <Route path="/admin/reports" element={<Legacy><AdminReports /></Legacy>} />
          </Routes>
        </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// old-markup pages (cart, checkout, about...) get the new look from mp.css by sitting inside this wrapper
function Legacy({ children }) {
  return (
    <div className="mp-root">
      <div className="mp-page mp-legacy">{children}</div>
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