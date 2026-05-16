import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { BackToTop } from "../ui/BackToTop";
import { WhatsAppButton } from "../ui/WhatsAppButton";
import { Toaster } from "sonner";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export function Root() {
  const location = useLocation();
  const fetchSettings = useSiteSettingsStore((state) => state.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Check current page paths
  const isAdmin = location.pathname.startsWith("/admin");
  const isAuth = location.pathname.startsWith("/auth");
  const isCheckout = location.pathname.startsWith("/checkout");

  // In 3 pages par Back To Top button show nahi hoga
  const showBackToTop = !isAdmin && !isAuth && !isCheckout;

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#0a0a0a] text-[#f5f0ee] flex flex-col">
      <ScrollToTop />
      {!isAdmin && <Navbar />}

      {/* Main content wrapper with flex-1 and min-w-0 to prevent flex children from blowing out width */}
      <main className="flex-1 w-full max-w-full flex flex-col min-w-0 overflow-x-hidden relative">
        <Outlet />
      </main>

      {!isAdmin && <Footer />}
      <CartDrawer />

      {/* Conditionally Render Back To Top Button */}
      {showBackToTop && <BackToTop />}

      {!isAdmin && <WhatsAppButton />}

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#0d0d0d",
            border: "1px solid rgba(212, 165, 154, 0.25)",
            color: "#f5f0ee",
            fontFamily: "Montserrat, sans-serif",
            fontSize: "12px",
            letterSpacing: "0.05em",
            borderRadius: "2px",
            padding: "16px",
          },
          success: {
            style: {
              background: "#0d0d0d",
              border: "1px solid rgba(52, 211, 153, 0.45)",
              color: "#34d399",
            },
          },
          error: {
            style: {
              background: "#0d0d0d",
              border: "1px solid rgba(248, 113, 113, 0.45)",
              color: "#f87171",
            },
          },
        }}
      />
    </div>
  );
}