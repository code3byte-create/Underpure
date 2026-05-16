import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router";
import { fetchAdminStats } from "../../lib/api";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  BarChart2,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Grid
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";
import { toast } from "sonner";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart2, end: false },
    ],
  },
  {
    label: "Store",
    items: [
      { to: "/admin/products", label: "Products", icon: Package, end: false },
      { to: "/admin/categories", label: "Categories", icon: Grid, end: false },
      { to: "/admin/orders", label: "Orders", icon: ShoppingBag, end: false },
      { to: "/admin/inventory", label: "Inventory", icon: LayoutGrid, end: false },
      { to: "/admin/customers", label: "Customers", icon: Users, end: false },
      { to: "/admin/promotions", label: "Promotions", icon: Tag, end: false },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/content", label: "Homepage", icon: FileText, end: false },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/settings", label: "Settings", icon: Settings, end: false },
    ],
  },
];

const ROUTE_TITLES = {
  "/admin": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/inventory": "Inventory Management",
  "/admin/customers": "Customers",
  "/admin/promotions": "Promotions",
  "/admin/content": "Homepage Content",
  "/admin/settings": "Settings",
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, token } = useAuthStore();
  const { storeName } = useSiteSettingsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lowStockVariants, setLowStockVariants] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Custom Logout Confirm Modal State
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const isAdmin = isAuthenticated && (user?.isAdmin || user?.role === 'admin' || user?.is_admin);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login", { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (token && isAdmin) {
      fetchAdminStats(token)
        .then((data) => {
          if (data && data.lowStockVariants && data.lowStockVariants.length > 0) {
            setLowStockVariants(data.lowStockVariants);
            const count = data.lowStockTotalCount || data.lowStockVariants.length;
            toast.warning(`Warning: ${count} variant(s) are below the low stock threshold!`, {
              duration: 8000,
              description: "Please review your product inventory."
            });
          }
        })
        .catch(console.error);
    }
  }, [token, isAdmin]);

  if (!isAdmin) return null;

  const confirmLogout = () => {
    logout();
    toast.success("Signed out");
    setLogoutConfirmOpen(false);
    navigate("/");
  };

  const pageTitle = ROUTE_TITLES[location.pathname] || "Admin";

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f0ee] flex w-full overflow-x-hidden relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden w-full"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed top-0 inset-y-0 h-[100dvh] left-0 z-50 w-[85%] max-w-[300px] lg:w-[260px] xl:w-[280px] flex-shrink-0 bg-[#0a0a0a] border-r border-[#d4a59a]/15 lg:border-[#d4a59a]/10 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none overflow-x-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 sm:px-6 sm:py-6 lg:px-6 lg:py-6 border-b border-[#d4a59a]/15 lg:border-[#d4a59a]/10 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <p className="font-['Cormorant_Garamond'] text-2xl lg:text-2xl font-medium lg:font-light tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#f5f0ee] truncate">
              {storeName}
            </p>
            <div className="flex items-center gap-2 mt-0.5 lg:mt-0.5">
              <span className="text-[9px] sm:text-[10px] lg:text-xs tracking-[0.2em] uppercase text-[#d4a59a] font-['Montserrat'] font-semibold lg:font-normal truncate">
                Admin Panel
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#9a8f8c] hover:text-[#d4a59a] transition-all p-1.5 -mr-1.5 hover:rotate-90 duration-300 bg-[#111] rounded-sm shrink-0"
          >
            <X size={20} className="sm:w-[24px] sm:h-[24px]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav Groups - WITH CUSTOM SCROLLBAR & NO HORIZONTAL SCROLL */}
        <nav className="flex-1 px-3 sm:px-4 lg:px-4 py-5 sm:py-6 lg:py-6 overflow-y-auto overflow-x-hidden custom-scrollbar w-full">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5 sm:mb-6 lg:mb-6 w-full">
              <p className="text-[9px] sm:text-[10px] lg:text-[11px] tracking-[0.3em] uppercase text-[#9a8f8c]/60 lg:text-[#9a8f8c]/50 font-['Montserrat'] font-bold lg:font-medium px-3 sm:px-4 lg:px-3 mb-2.5 sm:mb-3 lg:mb-3 truncate">
                {group.label}
              </p>
              <div className="space-y-0.5 sm:space-y-1 lg:space-y-1 w-full">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 lg:gap-3 px-3 sm:px-4 lg:px-3 py-3 sm:py-3.5 lg:py-3 text-[11px] sm:text-xs lg:text-sm tracking-[0.08em] uppercase font-['Montserrat'] transition-all rounded-sm w-full ${isActive
                        ? "bg-[#d4a59a]/15 lg:bg-[#d4a59a]/12 text-[#d4a59a] font-bold lg:font-semibold border-l-2 border-[#d4a59a]"
                        : "text-[#9a8f8c] font-medium lg:font-normal hover:text-[#f5f0ee] hover:bg-[#f5f0ee]/5 border-l-2 border-transparent"
                      }`
                    }
                  >
                    <item.icon size={16} strokeWidth={1.5} className="shrink-0 sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User + actions */}
        <div className="border-t border-[#d4a59a]/15 lg:border-[#d4a59a]/10 px-3 sm:px-4 lg:px-4 py-4 sm:py-5 lg:py-5 space-y-1.5 sm:space-y-2 lg:space-y-2 shrink-0 w-full bg-[#0a0a0a]">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2.5 sm:gap-3 lg:gap-3 px-3 sm:px-4 lg:px-3 py-2.5 sm:py-3 lg:py-2 text-[10px] sm:text-xs lg:text-sm tracking-[0.08em] uppercase font-['Montserrat'] font-bold sm:font-semibold lg:font-medium text-[#9a8f8c] hover:text-[#d4a59a] transition-colors w-full"
          >
            <ExternalLink size={14} strokeWidth={1.5} className="sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] shrink-0" />
            <span className="truncate">View Store</span>
          </Link>
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full flex items-center gap-2.5 sm:gap-3 lg:gap-3 px-3 sm:px-4 lg:px-3 py-2.5 sm:py-3 lg:py-2 text-[10px] sm:text-xs lg:text-sm tracking-[0.08em] uppercase font-['Montserrat'] font-bold sm:font-semibold lg:font-medium text-[#9a8f8c] hover:text-red-400 transition-colors"
          >
            <LogOut size={14} strokeWidth={1.5} className="sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] shrink-0" />
            <span className="truncate text-left">Sign Out</span>
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-3 px-3 sm:px-4 lg:px-3 py-3 sm:py-4 lg:py-3 mt-2 sm:mt-3 lg:mt-3 border-t border-[#d4a59a]/15 lg:border-[#d4a59a]/10 bg-[#111] lg:bg-transparent rounded-sm lg:rounded-none w-full">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-10 lg:h-10 rounded-full bg-[#d4a59a]/20 border border-[#d4a59a]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] sm:text-xs lg:text-sm font-['Montserrat'] font-bold text-[#d4a59a]">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs lg:text-sm font-['Montserrat'] font-bold sm:font-semibold lg:font-medium text-[#f5f0ee] truncate w-full">
                {user?.name || "Admin User"}
              </p>
              <p className="text-[9px] sm:text-[10px] lg:text-xs font-['Montserrat'] text-[#9a8f8c] truncate mt-0.5 w-full">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080808] lg:ml-[260px] xl:ml-[280px] w-full transition-all duration-300">
        {/* Top bar */}
        <header className="sticky top-0 h-14 sm:h-16 lg:h-20 border-b border-[#d4a59a]/15 lg:border-[#d4a59a]/10 bg-[#0a0a0a]/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 lg:px-8 flex-shrink-0 z-30 shadow-sm w-full">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-[#f5f0ee]/80 hover:text-[#d4a59a] transition-all active:scale-95 p-1.5 sm:p-1.5 -ml-1 sm:-ml-1.5 rounded-md shrink-0"
            >
              <Menu size={20} className="sm:w-[24px] sm:h-[24px]" strokeWidth={1.5} />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-2 text-[10px] sm:text-xs lg:text-sm font-['Montserrat'] font-bold sm:font-medium lg:font-normal truncate">
              <span className="text-[#9a8f8c] hidden sm:inline shrink-0">Admin Space</span>
              <ChevronRight size={12} className="text-[#9a8f8c]/40 hidden sm:inline sm:w-[14px] sm:h-[14px] lg:w-[16px] lg:h-[16px] shrink-0" />
              <span className="text-[#d4a59a] truncate text-sm">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 relative shrink-0">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative text-[#9a8f8c] hover:text-[#d4a59a] transition-colors p-1.5 sm:p-2 lg:p-1"
            >
              <Bell size={18} strokeWidth={1.5} className="sm:w-[20px] sm:h-[20px] lg:w-[22px] lg:h-[22px]" />
              {lowStockVariants.length > 0 && (
                <span className="absolute top-1 lg:top-0 right-1 lg:right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-2.5 lg:h-2.5 rounded-full bg-red-500 border border-[#0a0a0a]" />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-[280px] sm:w-[320px] bg-[#111] border border-[#d4a59a]/15 rounded-sm shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 sm:p-4 border-b border-[#d4a59a]/10 bg-[#0a0a0a] flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee]">Notifications</span>
                      {lowStockVariants.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-sm">
                          {lowStockVariants.length} Alert(s)
                        </span>
                      )}
                    </div>

                    <div className="max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar divide-y divide-[#d4a59a]/5">
                      {lowStockVariants.length > 0 ? (
                        lowStockVariants.map((variant) => (
                          <Link
                            key={`${variant.id}-${variant.color}-${variant.size}`}
                            to="/admin/inventory"
                            onClick={() => setNotificationsOpen(false)}
                            className="p-3 sm:p-4 block hover:bg-[#d4a59a]/5 transition-colors text-left"
                          >
                            <p className="text-[10px] sm:text-xs font-['Montserrat'] font-bold text-red-400">
                              Low Stock Variant Alert
                            </p>
                            <p className="text-[11px] sm:text-xs text-[#f5f0ee] font-medium mt-1 truncate">
                              {variant.name}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] font-['Montserrat'] uppercase tracking-wider mt-0.5 truncate">
                              {variant.color} · Size {variant.size} ({variant.stock} left)
                            </p>
                          </Link>
                        ))
                      ) : (
                        <div className="p-6 sm:p-8 text-center text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] uppercase tracking-wider">
                          No new notifications
                        </div>
                      )}
                    </div>

                    <div className="p-2 sm:p-3 border-t border-[#d4a59a]/10 bg-[#0a0a0a] text-center">
                      <Link
                        to="/admin/inventory"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[9px] sm:text-[10px] font-['Montserrat'] uppercase tracking-widest font-bold text-[#d4a59a] hover:text-[#f2c6b4] transition-colors inline-block py-1"
                      >
                        Manage Inventory
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-8 bg-[#080808] flex flex-col gap-4 sm:gap-6 w-full">
          {lowStockVariants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#d4a59a]/10 border border-[#d4a59a]/25 p-3 sm:p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-[10px] sm:text-xs font-['Montserrat'] font-semibold text-[#d4a59a] w-full"
            >
              <div className="flex items-start sm:items-center gap-2 w-full">
                <span className="relative flex h-2 w-2 mt-1 sm:mt-0 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="leading-snug">Low Stock Alert: {lowStockVariants.length} product variant(s) are below their low stock threshold!</span>
              </div>
              <Link to="/admin/inventory" className="underline hover:text-[#f2c6b4] tracking-widest sm:tracking-wider uppercase text-[9px] sm:text-[10px] font-bold flex items-center gap-1 mt-1 sm:mt-0 shrink-0">
                View Inventory <ChevronRight size={10} className="sm:w-[12px] sm:h-[12px]" />
              </Link>
            </motion.div>
          )}
          <Outlet />
        </main>
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
              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8 font-medium px-2">Are you sure you want to sign out of the Admin Panel?</p>
              <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
                <button onClick={() => setLogoutConfirmOpen(false)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-semibold md:font-bold hover:bg-[#222] transition-colors rounded-sm">Cancel</button>
                <button onClick={confirmLogout} className="flex-1 bg-red-500/90 text-white py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-bold hover:bg-red-500 transition-colors rounded-sm shadow-md">Yes, Sign Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        /* Global Custom Scrollbar for Admin Panel Components */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 165, 154, 0.25); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 165, 154, 0.5); }
      `}</style>
    </div>
  );
}