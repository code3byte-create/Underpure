import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Heart,
  User,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { fetchOrders, fetchWishlist, fetchProducts, fetchMe } from "../lib/api";
import { ProductCard } from "../components/shop/ProductCard";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "../lib/mockData";

const TABS = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "profile", label: "Profile", icon: User },
];

const STATUS_META = {
  pending: { label: "Pending", color: "text-yellow-400", icon: Clock },
  processing: { label: "Processing", color: "text-blue-400", icon: Clock },
  shipped: { label: "Shipped", color: "text-[#d4a59a]", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-400", icon: XCircle },
};

export function AccountPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState(tab || "orders");
  const [orders, setOrders] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Custom Logout Confirm Modal State
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: "/account" } });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    Promise.all([
      fetchOrders(token).catch(() => []),
      fetchWishlist(token).catch(() => []),
      fetchProducts().catch(() => MOCK_PRODUCTS),
      fetchMe(token).catch(() => null),
    ])
      .then(([o, w, p, freshUser]) => {
        setOrders(o);
        setWishlistIds(w);
        setAllProducts(p);
        setWishlistProducts(p.filter((prod) => w.includes(prod.id)));
        if (freshUser) {
          updateUser(freshUser);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  const confirmLogout = () => {
    logout();
    toast.success("Signed out successfully");
    setLogoutConfirmOpen(false);
    navigate("/");
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    navigate(`/account/${id}`);
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen w-full overflow-x-hidden relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-16 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 sm:gap-0 mb-8 sm:mb-12">
          <div className="w-full">
            <p className="text-[#d4a59a] text-[10px] sm:text-xs md:text-[11px] tracking-[0.3em] uppercase font-['Montserrat'] mb-1.5 sm:mb-2 font-bold">
              My Account
            </p>
            <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee] truncate w-full pr-2">
              Welcome, {user.name.split(" ")[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto shrink-0">
            {(user.isAdmin || user.role === 'admin' || user.is_admin) && (
              <Link
                to="/admin"
                className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] border border-[#d4a59a]/40 px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-[#d4a59a]/10 transition-colors text-center flex-1 sm:flex-none rounded-sm"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              className="flex items-center justify-center gap-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] border border-[#9a8f8c]/30 sm:border-transparent px-3 py-2.5 sm:px-2 sm:py-2 hover:text-red-400 hover:border-red-400/30 sm:hover:border-transparent transition-colors flex-1 sm:flex-none rounded-sm"
            >
              <LogOut size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] gap-6 md:gap-10 lg:gap-12 w-full">
          {/* Sidebar / Top Tabs (Swipeable on mobile) */}
          <div className="overflow-x-auto overscroll-x-contain pb-1 md:pb-0 scrollbar-hide md:overflow-visible border-b border-[#d4a59a]/20 md:border-b-0 mb-2 md:mb-0 -mx-4 px-4 md:mx-0 md:px-0 w-screen md:w-auto">
            <nav className="flex md:flex-col gap-2 md:gap-1.5 min-w-max md:min-w-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-4 py-3 md:px-5 md:py-3.5 text-[10px] sm:text-xs md:text-[13px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-semibold transition-colors md:text-left rounded-sm md:rounded-r-none ${activeTab === t.id
                      ? "bg-[#d4a59a]/10 text-[#d4a59a] border-b-2 md:border-b-0 md:border-l-[3px] border-[#d4a59a]"
                      : "text-[#9a8f8c] hover:text-[#f5f0ee] border-b-2 md:border-b-0 md:border-l-[3px] border-transparent hover:bg-[#111]"
                    }`}
                >
                  <t.icon size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" strokeWidth={1.5} />
                  {t.label}
                  {t.id === "orders" && orders.length > 0 && (
                    <span className="ml-1.5 md:ml-auto text-[9px] sm:text-[10px] bg-[#d4a59a]/20 text-[#d4a59a] px-2 py-0.5 md:py-0.5 font-bold rounded-sm">
                      {orders.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="min-h-[400px] w-full">
            {/* ===== ORDERS ===== */}
            {activeTab === "orders" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-5 sm:mb-8">Order History</h2>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-28 sm:h-32 md:h-36 bg-[#141414] animate-pulse rounded-sm" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 sm:py-24 border border-[#d4a59a]/15 bg-[#0d0d0d] px-4 rounded-sm shadow-sm">
                    <ShoppingBag size={32} strokeWidth={1.5} className="text-[#d4a59a]/30 mx-auto mb-4 sm:w-[42px] sm:h-[42px]" />
                    <p className="font-['Cormorant_Garamond'] text-xl sm:text-2xl md:text-3xl font-medium text-[#f5f0ee]/80 mb-2">No orders yet</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8">Your order history will appear here</p>
                    <Link to="/shop" className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] border border-[#d4a59a]/40 px-6 sm:px-8 py-3.5 hover:bg-[#d4a59a]/10 transition-colors inline-block rounded-sm shadow-sm">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-5">
                    {orders.map((order) => {
                      const meta = STATUS_META[order.status] || STATUS_META.pending;
                      const StatusIcon = meta.icon;
                      return (
                        <div key={order.id} className="border border-[#d4a59a]/15 bg-[#0d0d0d] p-4 sm:p-5 md:p-6 hover:border-[#d4a59a]/30 transition-colors rounded-sm shadow-sm w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 border-b border-[#d4a59a]/15 pb-4">
                            <div>
                              <p className="text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-1 sm:mb-1.5">Order #{String(order.id).toUpperCase()}</p>
                              <p className="text-[11px] sm:text-xs md:text-sm font-['Montserrat'] text-[#f5f0ee] font-medium">
                                {new Date(order.createdAt || order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 self-start bg-[#1a1a1a] sm:bg-[#111] px-2.5 py-1.5 rounded-sm border border-[#d4a59a]/10 shadow-sm">
                              <StatusIcon size={12} className={`${meta.color} sm:w-[14px] sm:h-[14px]`} />
                              <span className={`text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold ${meta.color}`}>{meta.label}</span>
                            </div>
                          </div>
                          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5 w-full">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs md:text-sm font-['Montserrat'] gap-1 sm:gap-0 w-full">
                                <span className="text-[#9a8f8c] font-medium truncate pr-2 w-full sm:w-auto flex-1">{item.productName} <span className="inline sm:inline">· {item.size} · {item.color}</span> × {item.quantity}</span>
                                <span className="text-[#f5f0ee] font-semibold shrink-0">Rs. {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[#d4a59a]/15 w-full">
                            <span className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c]">Total</span>
                            <span className="text-xs sm:text-sm md:text-base font-['Montserrat'] font-bold text-[#f5f0ee]">Rs. {Number(order.total || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== WISHLIST ===== */}
            {activeTab === "wishlist" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-5 sm:mb-8">My Wishlist</h2>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 w-full">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-[#141414] animate-pulse rounded-sm" />)}
                  </div>
                ) : wishlistProducts.length === 0 ? (
                  <div className="text-center py-16 sm:py-24 border border-[#d4a59a]/15 bg-[#0d0d0d] px-4 rounded-sm shadow-sm w-full">
                    <Heart size={32} strokeWidth={1.5} className="text-[#d4a59a]/30 mx-auto mb-4 sm:w-[42px] sm:h-[42px]" />
                    <p className="font-['Cormorant_Garamond'] text-xl sm:text-2xl md:text-3xl font-medium text-[#f5f0ee]/80 mb-2">No saved pieces</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8">Save pieces you love by tapping the heart</p>
                    <Link to="/shop" className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] border border-[#d4a59a]/40 px-6 sm:px-8 py-3.5 hover:bg-[#d4a59a]/10 transition-colors inline-block rounded-sm shadow-sm">Explore Collections</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 w-full">
                    {wishlistProducts.map((p) => (
                      <ProductCard
                        key={p.id} product={p} wishlistedIds={wishlistIds}
                        onWishlistChange={(ids) => { setWishlistIds(ids); setWishlistProducts(allProducts.filter((prod) => ids.includes(prod.id))); }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== PROFILE ===== */}
            {activeTab === "profile" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
                <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-5 sm:mb-8">My Profile</h2>
                <div className="border border-[#d4a59a]/15 bg-[#0d0d0d] p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5 max-w-xl rounded-sm shadow-sm w-full">
                  {[
                    { label: "Full Name", value: user.name },
                    { label: "Email Address", value: user.email },
                    { label: "Member Since", value: (user.createdAt || user.created_at) ? new Date(user.createdAt || user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }) },
                    { label: "Account Type", value: (user.isAdmin || user.role === 'admin' || user.is_admin) ? "Administrator" : "Member" },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-col gap-1 pb-4 sm:pb-5 border-b border-[#d4a59a]/10 last:border-0 last:pb-0 w-full">
                      <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c]">{row.label}</p>
                      <p className="text-xs sm:text-sm font-['Montserrat'] font-medium text-[#f5f0ee] break-words w-full">{row.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {logoutConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full" onClick={() => setLogoutConfirmOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90%] sm:w-full md:max-w-md bg-[#111] border border-[#d4a59a]/20 z-[60] p-6 sm:p-8 md:p-10 text-center rounded-sm shadow-2xl"
            >
              <LogOut size={48} className="mx-auto text-red-400 mb-4 sm:mb-5" strokeWidth={1.5} />
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-2 sm:mb-3">Sign Out?</p>
              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8 font-medium px-2">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
                <button onClick={() => setLogoutConfirmOpen(false)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-semibold md:font-bold hover:bg-[#222] transition-colors rounded-sm">Cancel</button>
                <button onClick={confirmLogout} className="flex-1 bg-red-500/90 text-white py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-bold hover:bg-red-500 transition-colors rounded-sm shadow-md">Yes, Sign Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}