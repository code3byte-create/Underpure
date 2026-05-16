// Updated routes for inventory support
import { createBrowserRouter, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import { Root } from "./components/layout/Root";
import { useAuthStore } from "./store/authStore";

// Standard Resilient Loader
const load = (factory) => lazy(() => 
  factory().then(module => ({ default: module.default || Object.values(module)[0] }))
);

const HomePage = load(() => import("./pages/HomePage"));
const ShopPage = load(() => import("./pages/ShopPage"));
const ProductDetailPage = load(() => import("./pages/ProductDetailPage"));
const AuthPage = load(() => import("./pages/AuthPage"));
const AccountPage = load(() => import("./pages/AccountPage"));
const CheckoutPage = load(() => import("./pages/CheckoutPage"));
const NotFoundPage = load(() => import("./pages/NotFoundPage"));

// Support
const SizeGuide = load(() => import("./pages/support/SizeGuide"));
const ShippingReturns = load(() => import("./pages/support/ShippingReturns"));
const CareInstructions = load(() => import("./pages/support/CareInstructions"));
const FAQ = load(() => import("./pages/support/FAQ"));
const ContactUs = load(() => import("./pages/support/ContactUs"));
const PolicyPages = import("./pages/support/PolicyPages");
const PrivacyPolicy = load(() => PolicyPages.then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = load(() => PolicyPages.then(m => ({ default: m.TermsOfService })));
const CookiePolicy = load(() => PolicyPages.then(m => ({ default: m.CookiePolicy })));

// Admin
const AdminLogin = load(() => import("./pages/admin/AdminLogin"));
const AdminLayout = load(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = load(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = load(() => import("./pages/admin/AdminProducts"));
const AdminCategories = load(() => import("./pages/admin/AdminCategories")); 
const AdminInventory = load(() => import("./pages/admin/AdminInventory"));
const AdminOrders = load(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = load(() => import("./pages/admin/AdminCustomers"));
const AdminAnalytics = load(() => import("./pages/admin/AdminAnalytics"));
const AdminContent = load(() => import("./pages/admin/AdminContent"));
const AdminSettings = load(() => import("./pages/admin/AdminSettings"));
const AdminPromotions = load(() => import("./pages/admin/AdminPromotions"));

const withSuspense = (Component) => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-[#d4a59a]">Loading...</div>}>
    <Component />
  </Suspense>
);

function AdminPrivateRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = isAuthenticated && (user?.isAdmin || user?.role === 'admin' || user?.is_admin);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: "shop", element: withSuspense(ShopPage) },
      { path: "product/:slug", element: withSuspense(ProductDetailPage) },
      { path: "auth", element: withSuspense(AuthPage) },
      { path: "account", element: withSuspense(AccountPage) },
      { path: "account/:tab", element: withSuspense(AccountPage) },
      { path: "checkout", element: withSuspense(CheckoutPage) },
      
      // Support Routes
      { path: "size-guide", element: withSuspense(SizeGuide) },
      { path: "shipping-returns", element: withSuspense(ShippingReturns) },
      { path: "care-instructions", element: withSuspense(CareInstructions) },
      { path: "faq", element: withSuspense(FAQ) },
      { path: "contact-us", element: withSuspense(ContactUs) },
      { path: "privacy-policy", element: withSuspense(PrivacyPolicy) },
      { path: "terms-service", element: withSuspense(TermsOfService) },
      { path: "cookie-policy", element: withSuspense(CookiePolicy) },
      { path: "admin/login", element: <AdminPrivateRoute>{withSuspense(AdminLogin)}</AdminPrivateRoute> },
      {
        path: "admin",
        element: <AdminPrivateRoute>{withSuspense(AdminLayout)}</AdminPrivateRoute>,
        children: [
          { path: "inventory", element: withSuspense(AdminInventory) },
          { index: true, element: withSuspense(AdminDashboard) },
          { path: "products", element: withSuspense(AdminProducts) },
          { path: "categories", element: withSuspense(AdminCategories) },
          { path: "orders", element: withSuspense(AdminOrders) },
          { path: "customers", element: withSuspense(AdminCustomers) },
          { path: "analytics", element: withSuspense(AdminAnalytics) },
          { path: "content", element: withSuspense(AdminContent) },
          { path: "settings", element: withSuspense(AdminSettings) },
          { path: "promotions", element: withSuspense(AdminPromotions) },
        ],
      },
      { path: "*", element: withSuspense(NotFoundPage) },
    ],
  },
]);