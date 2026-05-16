import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { useAuthStore } from "../../store/authStore";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { storeName } = useSiteSettingsStore();

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && (user?.isAdmin || user?.role === 'admin' || user?.is_admin)) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const loginUrl = isLocal 
        ? "http://localhost/backend/index.php/auth/login" 
        : "https://www.underpure.com/backend/index.php/auth/login";

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const isUserAdmin = data.user?.isAdmin || data.user?.role === 'admin' || data.user?.is_admin;
      if (!isUserAdmin) {
        throw new Error("Access denied. Administrator privileges required.");
      }

      const normalizedUser = {
        ...data.user,
      };

      login(normalizedUser, data.token);
      toast.success("Welcome back, Administrator");
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 sm:px-6 w-full overflow-hidden">
      <div className="max-w-sm sm:max-w-md w-full text-center">
        <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-medium sm:font-light text-[#f5f0ee] tracking-widest uppercase mb-2 sm:mb-2 truncate px-2">
          {storeName}
        </p>
        <p className="text-[9px] sm:text-[11px] md:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#d4a59a] font-['Montserrat'] mb-8 sm:mb-10 md:mb-12 font-bold sm:font-semibold">
          Admin Portal Authentication
        </p>

        <div className="border border-[#d4a59a]/20 sm:border-[#d4a59a]/15 p-6 sm:p-8 bg-[#111111] rounded-sm text-left shadow-2xl w-full">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] sm:text-xs font-['Montserrat'] p-3 mb-5 sm:mb-6 rounded-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 w-full">
            <div>
              <label className="block text-[#9a8f8c] text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.15em] sm:tracking-[0.1em] uppercase font-['Montserrat'] font-bold sm:font-semibold mb-1.5 sm:mb-2">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 text-[#f5f0ee] px-3.5 sm:px-4 py-3 sm:py-3 text-xs sm:text-sm font-['Montserrat'] focus:outline-none focus:border-[#d4a59a]/50 focus:ring-1 focus:ring-[#d4a59a]/20 transition-all rounded-sm shadow-inner"
                placeholder="admin@underpure.com"
              />
            </div>

            <div>
              <label className="block text-[#9a8f8c] text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.15em] sm:tracking-[0.1em] uppercase font-['Montserrat'] font-bold sm:font-semibold mb-1.5 sm:mb-2">
                Secure Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 text-[#f5f0ee] px-3.5 sm:px-4 py-3 sm:py-3 text-xs sm:text-sm font-['Montserrat'] focus:outline-none focus:border-[#d4a59a]/50 focus:ring-1 focus:ring-[#d4a59a]/20 transition-all rounded-sm shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors mt-2 sm:mt-4 shadow-md rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center border-t border-[#d4a59a]/10 pt-5 sm:pt-6 w-full">
            <Link
              to="/"
              className="inline-block text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#9a8f8c] hover:text-[#d4a59a] font-['Montserrat'] font-bold sm:font-semibold transition-colors"
            >
              ← Return to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}