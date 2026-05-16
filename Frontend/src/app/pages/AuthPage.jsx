import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { login, register, googleLogin } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useSiteSettingsStore } from "../store/siteSettingsStore";
import { toast } from "sonner";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin } = useAuthStore();
  const { storeName } = useSiteSettingsStore();
  const [mode, setMode] = useState("login"); // login, register, forgot
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Forgot Password state definitions
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter OTP & new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  // Google Login Setup
  useEffect(() => {
    // Inject Google Script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      console.log("Google SDK Loaded");
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: "999154568889-b5b0cmo9q7fj155qrg2i0m0qm1crqeig.apps.googleusercontent.com",
            callback: window.handleGoogleResponse,
            auto_select: false,
          });
          window.google.accounts.id.renderButton(
            document.getElementById("google-button"),
            { theme: "outline", size: "large", width: 400, text: "continue_with" }
          );
        } catch (e) {
          console.error("Google Init Error:", e);
        }
      }
    };
    script.onerror = () => console.error("Failed to load Google SDK");
    document.body.appendChild(script);

    window.handleGoogleResponse = async (response) => {
      setLoading(true);
      try {
        const { user, token } = await googleLogin(response.credential);
        storeLogin(user, token);
        toast.success(`Welcome, ${user.name} ✦`);
        const from = location.state?.from || "/account";
        navigate(from, { replace: true });
      } catch (err) {
        toast.error("Google sign in failed");
      } finally {
        setLoading(false);
      }
    };
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const setField = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "register" && !form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email address (e.g. user@example.com)");
      return;
    }

    if (mode === "register") {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(form.password)) {
        toast.error("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (@, $, !, %, *, ?, &).");
        return;
      }
    } else {
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { user, token } = await login(form.email, form.password);
        storeLogin(user, token);
        toast.success(`Welcome back, ${user.name} ✦`);
        const from = location.state?.from || "/account";
        navigate(from, { replace: true });
      } else {
        const { user, token } = await register(form.email, form.password, form.name);
        storeLogin(user, token);
        toast.success(`Welcome to ${storeName}, ${user.name} ✦`);
        navigate("/account", { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const apiBase = isLocal 
      ? "http://localhost/backend/index.php" 
      : "https://www.underpure.com/backend/index.php";

    if (forgotStep === 1) {
      if (!forgotEmail.trim()) {
        toast.error("Please enter your email address");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotEmail.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail.trim() }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to send reset code");
        setLoading(false);
        setForgotStep(2);
        if (data.debug_otp) {
          toast.success(`✦ Secure OTP sent to email! (Local Dev OTP: ${data.debug_otp})`, { duration: 10000 });
        } else {
          toast.success("✦ Secure OTP code sent successfully to your email!");
        }
      } catch (err) {
        setLoading(false);
        toast.error(err.message);
      }
    } else {
      if (!forgotOtp.trim()) {
        toast.error("Please enter the verification OTP code");
        return;
      }
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(forgotNewPass)) {
        toast.error("New password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (@, $, !, %, *, ?, &).");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotEmail.trim(),
            otp: forgotOtp.trim(),
            password: forgotNewPass,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Password reset failed");
        setLoading(false);
        toast.success("✦ Password reset successfully! Please sign in with your new password.");
        setMode("login");
        setForgotStep(1);
        setForgotEmail("");
        setForgotOtp("");
        setForgotNewPass("");
      } catch (err) {
        setLoading(false);
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen flex w-full overflow-x-hidden">
      {/* Left — decorative (Hidden on Mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1770294759013-a5784266a817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&q=80"
          alt="Luxury collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/20 to-[#0a0a0a]/80" />
        <div className="absolute bottom-16 left-16 right-16">
          <p className="font-['Cormorant_Garamond'] text-4xl font-light text-[#f5f0ee] italic leading-snug">
            "Design is the silent ambassador of your brand."
          </p>
          <p className="text-[#d4a59a] text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-bold mt-6">
            Paul Rand
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 md:py-16 lg:py-20 w-full">
        <div className="w-full max-w-sm md:max-w-md lg:max-w-[420px]">
          <Link
            to="/"
            className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#f5f0ee] block text-center mb-8 sm:mb-10 md:mb-12 hover:text-[#d4a59a] transition-colors w-full break-words"
          >
            {storeName}
          </Link>

          {/* Mode toggle */}
          {mode !== "forgot" && (
            <div className="flex border-b border-[#d4a59a]/15 mb-6 sm:mb-8 md:mb-10 w-full">
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 pb-3 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] transition-colors font-bold ${
                    mode === m
                      ? "text-[#d4a59a] border-b-2 border-[#d4a59a] -mb-px"
                      : "text-[#9a8f8c] hover:text-[#f5f0ee]"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === "forgot" ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6 w-full"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-medium text-[#f5f0ee]">Reset Password</h2>
                  <p className="text-[11px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] leading-relaxed mt-2 px-2">
                    {forgotStep === 1 
                      ? "Enter your email to receive a secure 6-digit authentication OTP code." 
                      : "Enter the code sent to your email and set your new secure password."
                    }
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4 sm:space-y-5 w-full">
                  {forgotStep === 1 ? (
                    <div>
                      <label className="block text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm font-['Montserrat'] px-4 py-3 sm:py-3.5 outline-none placeholder-[#9a8f8c]/50 transition-colors rounded-sm shadow-inner"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] mb-4 text-center leading-relaxed">
                        Please check your inbox at <strong>{forgotEmail}</strong>. We have sent you a secure 6-digit password reset verification code.
                      </p>

                      <div>
                        <label className="block text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2">
                          6-Digit Verification OTP
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm font-['Montserrat'] tracking-[0.5em] text-center px-4 py-3 sm:py-3.5 outline-none placeholder-[#9a8f8c]/50 transition-colors rounded-sm font-bold shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPass ? "text" : "password"}
                            required
                            value={forgotNewPass}
                            onChange={(e) => setForgotNewPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm font-['Montserrat'] px-4 py-3 sm:py-3.5 pr-12 outline-none placeholder-[#9a8f8c]/50 transition-colors rounded-sm shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#9a8f8c] hover:text-[#d4a59a] transition-colors p-1.5"
                          >
                            {showPass ? <EyeOff size={16} className="sm:w-[18px]" strokeWidth={1.5} /> : <Eye size={16} className="sm:w-[18px]" strokeWidth={1.5} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] disabled:opacity-60 transition-colors mt-4 rounded-sm shadow-md"
                  >
                    {loading ? (
                      <span>Verifying…</span>
                    ) : (
                      <>
                        {forgotStep === 1 ? "Request OTP" : "Reset Password"}
                        <ArrowRight size={14} className="sm:w-4 sm:h-4" strokeWidth={2} />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setForgotStep(1); }}
                    className="text-[10px] sm:text-xs tracking-[0.1em] font-['Montserrat'] font-semibold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6 w-full"
              >
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 w-full">
                  {mode === "register" && (
                    <div>
                      <label className="block text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm font-['Montserrat'] px-3.5 py-3.5 sm:px-4 sm:py-3.5 outline-none placeholder-[#9a8f8c]/50 transition-colors rounded-sm shadow-inner"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm font-['Montserrat'] px-3.5 py-3.5 sm:px-4 sm:py-3.5 outline-none placeholder-[#9a8f8c]/50 transition-colors rounded-sm shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm font-['Montserrat'] px-3.5 py-3.5 sm:px-4 sm:py-3.5 pr-10 sm:pr-12 outline-none placeholder-[#9a8f8c]/50 transition-colors rounded-sm shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#9a8f8c] hover:text-[#d4a59a] transition-colors p-1.5"
                      >
                        {showPass ? <EyeOff size={16} className="sm:w-[18px]" strokeWidth={1.5} /> : <Eye size={16} className="sm:w-[18px]" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>

                  {mode === "login" && (
                    <div className="text-right pt-1">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[10px] sm:text-xs tracking-[0.1em] font-['Montserrat'] font-medium text-[#9a8f8c] hover:text-[#d4a59a] transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] disabled:opacity-60 transition-colors mt-3 sm:mt-5 rounded-sm shadow-md"
                  >
                    {loading ? (
                      <span>Please wait…</span>
                    ) : (
                      <>
                        {mode === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight size={14} className="sm:w-4 sm:h-4" strokeWidth={2} />
                      </>
                    )}
                  </button>
                </form>

              {/* OR Divider */}
              <div className="relative py-2 mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#d4a59a]/10"></div>
                </div>
                <div className="relative flex justify-center text-[9px] sm:text-[10px] uppercase tracking-widest">
                  <span className="bg-[#0a0a0a] px-3 sm:px-4 text-[#9a8f8c]">Or continue with</span>
                </div>
              </div>

              {/* Google Button - Custom Styled */}
              <div className="flex justify-center mt-2 w-full">
                <div className="relative w-full">
                  {/* The actual button visual */}
                  <div className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 text-[9px] sm:text-xs tracking-[0.15em] sm:tracking-[0.25em] uppercase font-['Montserrat'] font-bold rounded-sm shadow-md pointer-events-none">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </div>
                  {/* The invisible real Google button overlay */}
                  <div className="absolute inset-0 opacity-0 overflow-hidden w-full h-full flex justify-center">
                    <div id="google-button" className="w-full"></div>
                  </div>
                </div>
              </div>

              {mode === "register" && (
                <p className="text-[9px] sm:text-[10px] text-[#9a8f8c]/60 font-['Montserrat'] text-center leading-relaxed pt-2 sm:pt-3">
                  By creating an account you agree to our{" "}
                  <a href="#" className="underline hover:text-[#d4a59a] transition-colors font-medium">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="underline hover:text-[#d4a59a] transition-colors font-medium">Privacy Policy</a>.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

          <div className="mt-8 sm:mt-12 text-center border-t border-[#d4a59a]/10 pt-6 sm:pt-8 w-full">
            <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat']">
              {mode === "login" ? "New to S&S Kids?" : "Already a member?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-[#d4a59a] font-semibold tracking-wide hover:text-[#f2c6b4] transition-colors ml-1 sm:ml-1.5"
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}