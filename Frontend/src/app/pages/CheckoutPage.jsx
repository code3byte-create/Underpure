import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Lock, CheckCircle, Truck } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useSiteSettingsStore } from "../store/siteSettingsStore";
import { createOrder } from "../lib/api";
import { toast } from "sonner";

const STEPS = ["Shipping", "Review"];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const { token, user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const { freeShippingThreshold, deliveryFee } = useSiteSettingsStore();

  const sub = Number(subtotal()) || 0;
  const shipping = sub >= (Number(freeShippingThreshold) || 5000) ? 0 : (Number(deliveryFee) || 200);
  const total = sub + shipping;

  const [address, setAddress] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "Pakistan",
    email: user?.email || "",
  });

  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        firstName: user.name?.split(" ")[0] || prev.firstName,
        lastName: user.name?.split(" ").slice(1).join(" ") || prev.lastName,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const setAddr = (k, v) => setAddress((a) => ({ ...a, [k]: v }));

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center px-4 sm:px-6 w-full overflow-hidden">
        <div className="text-center w-full max-w-sm">
          <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-medium text-[#f5f0ee]/60 mb-6 sm:mb-8">
            Your bag is empty
          </p>
          <Link
            to="/shop"
            className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] border border-[#d4a59a]/40 px-8 py-3.5 sm:px-10 sm:py-4 hover:bg-[#d4a59a]/10 transition-colors inline-block w-full sm:w-auto rounded-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 w-full overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="text-center max-w-lg w-full border border-[#d4a59a]/15 bg-[#0d0d0d] p-6 sm:p-8 md:p-12 rounded-sm shadow-md"
        >
          <CheckCircle size={48} strokeWidth={1.5} className="text-[#d4a59a] mx-auto mb-5 sm:mb-8 sm:w-[64px] sm:h-[64px]" />
          <p className="text-[#d4a59a] text-[10px] sm:text-[11px] md:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-semibold mb-2 sm:mb-4">
            Order Confirmed
          </p>
          <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee] mb-3 sm:mb-6 leading-tight">
            Thank You, {address.firstName || "Guest"}
          </h1>
          <p className="text-[#9a8f8c] text-xs sm:text-sm md:text-base font-['Montserrat'] leading-relaxed mb-5 sm:mb-6 px-1 sm:px-2">
            Your order has been placed successfully via Cash on Delivery. We'll send an email confirmation shortly.
          </p>
          <div className="bg-[#111] border border-[#d4a59a]/10 py-3 mb-6 sm:mb-10 rounded-sm">
            <p className="text-[#9a8f8c] text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-medium">
              Order reference: <span className="text-[#d4a59a] font-bold ml-1">#{orderId.slice(-8).toUpperCase()}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full">
            <Link
              to="/shop"
              className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] text-[#0a0a0a] bg-[#d4a59a] px-6 py-3.5 sm:px-10 sm:py-4 hover:bg-[#f2c6b4] transition-colors font-bold w-full sm:w-auto rounded-sm shadow-md"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!address.firstName || !address.phone || !address.street || !address.city || !address.zip || !address.email) {
      toast.error("Please complete your shipping address and email");
      setStep(0);
      return;
    }

    if (address.phone.replace(/\D/g, "").length !== 11) {
      toast.error("Phone number must be exactly 11 digits (e.g. 03XXXXXXXXX)");
      setStep(0);
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        productId: i.product.id, productName: i.product.name, productImage: i.product.image,
        size: i.size, color: i.color, quantity: i.quantity, price: i.product.price,
      }));

      const order = await createOrder(token || "guest", {
        items: orderItems, subtotal: sub, shipping, total, shippingAddress: address, paymentMethod: "COD",
      });

      clearCart();
      setOrderId(order.id || "GUEST-" + Math.floor(Math.random() * 1000000));
      setOrderPlaced(true);
    } catch (err) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 md:py-16 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 border-b border-[#d4a59a]/10 pb-4 sm:border-none sm:pb-0">
          <Link
            to="/shop"
            className="flex items-center gap-1.5 text-[9px] sm:text-[11px] md:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-semibold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors shrink-0"
          >
            <ArrowLeft size={14} className="sm:w-[16px] sm:h-[16px]" />
            <span className="hidden sm:inline">Back to Shop</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">
            Checkout
          </p>
          <div className="flex items-center gap-1 sm:gap-2 text-[#9a8f8c] shrink-0">
            <Lock size={12} strokeWidth={1.5} className="sm:w-[14px] sm:h-[14px]" />
            <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-semibold">Secure</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8 sm:mb-12 md:mb-16">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer ${i <= step ? "text-[#d4a59a]" : "text-[#9a8f8c]/40"}`}
                onClick={() => i < step && setStep(i)}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs font-['Montserrat'] font-bold border rounded-sm ${i < step ? "border-[#d4a59a] bg-[#d4a59a] text-[#0a0a0a]" : i === step ? "border-[#d4a59a] text-[#d4a59a]" : "border-[#9a8f8c]/20 text-[#9a8f8c]/40"
                    }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold hidden sm:block">
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-10 sm:w-16 md:w-24 lg:w-32 h-px mx-2 sm:mx-4 md:mx-6 ${i < step ? "bg-[#d4a59a]/40" : "bg-[#9a8f8c]/15"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-6 sm:gap-8 lg:gap-16">

          {/* Order Summary for Mobile */}
          <div className="block lg:hidden order-first w-full">
            <div className="border border-[#d4a59a]/20 bg-[#111] p-5 sm:p-6 rounded-sm w-full">
              <div className="flex justify-between items-center mb-4 border-b border-[#d4a59a]/10 pb-3 sm:pb-4">
                <p className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee]">Order Summary</p>
                <p className="text-sm sm:text-base font-['Montserrat'] font-bold text-[#d4a59a]">Rs. {total.toFixed(2)}</p>
              </div>
              <div className="space-y-3 mb-2">
                {items.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] sm:text-xs font-['Montserrat'] font-medium">
                    <span className="text-[#9a8f8c] truncate pr-2 flex-1">{item.product.name} × {item.quantity}</span>
                    <span className="text-[#f5f0ee] shrink-0">Rs. {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {items.length > 2 && <p className="text-[9px] sm:text-[10px] text-[#d4a59a] font-['Montserrat'] italic mt-2">+ {items.length - 2} more items</p>}
              </div>
            </div>
          </div>

          {/* Left — form */}
          <div className="order-last lg:order-first w-full">
            <AnimatePresence mode="wait">
              {/* STEP 0: Shipping */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
                  <div className="flex flex-row justify-between items-end mb-5 sm:mb-8 pb-2 border-b border-[#d4a59a]/5 lg:border-none">
                    <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee]">Shipping Address</h2>
                    {!user && (
                      <Link to="/auth" state={{ from: "/checkout" }} className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] bg-[#d4a59a]/10 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-sm whitespace-nowrap ml-2">
                        Login <span className="hidden sm:inline">for faster checkout</span>
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 bg-[#0d0d0d] p-4 sm:p-6 md:p-8 border border-[#d4a59a]/10 rounded-sm">
                    <div className="col-span-1 sm:col-span-2 mb-2 sm:mb-4 border-b border-[#d4a59a]/10 pb-5 sm:pb-6">
                      <label className="block text-[10px] sm:text-[11px] md:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2 sm:mb-3">Email Address *</label>
                      <input
                        type="email" value={address.email} onChange={(e) => setAddr("email", e.target.value)}
                        className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm md:text-sm font-['Montserrat'] px-3.5 py-3.5 md:px-4 md:py-4 outline-none transition-colors rounded-sm shadow-inner"
                      />
                    </div>

                    {[
                      { key: "firstName", label: "First Name *", col: 1 },
                      { key: "lastName", label: "Last Name *", col: 1 },
                      { key: "phone", label: "Phone Number *", col: 2, type: "tel", placeholder: "03XXXXXXXXX" },
                      { key: "street", label: "Street Address *", col: 2 },
                      { key: "city", label: "City *", col: 1 },
                      { key: "state", label: "County / State", col: 1 },
                      { key: "zip", label: "Postcode / ZIP *", col: 1 },
                    ].map((field) => (
                      <div key={field.key} className={field.col === 2 ? "col-span-1 sm:col-span-2" : "col-span-1"}>
                        <label className="block text-[10px] sm:text-[11px] md:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-2 sm:mb-3">{field.label}</label>
                        <input
                          type={field.type || "text"} 
                          value={address[field.key]} 
                          onChange={(e) => {
                            let val = e.target.value;
                            if (field.key === "phone") {
                              val = val.replace(/\D/g, "").slice(0, 11);
                            }
                            setAddr(field.key, val);
                          }}
                          maxLength={field.key === "phone" ? 11 : undefined}
                          placeholder={field.placeholder || ""}
                          className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/60 text-[#f5f0ee] text-sm md:text-sm font-['Montserrat'] px-3.5 py-3.5 md:px-4 md:py-4 outline-none transition-colors rounded-sm shadow-inner placeholder-[#9a8f8c]/30"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (!address.firstName || !address.phone || !address.street || !address.city || !address.zip || !address.email) {
                        toast.error("Please complete your shipping address and email");
                        return;
                      }
                      if (address.phone.replace(/\D/g, "").length !== 11) {
                        toast.error("Phone number must be exactly 11 digits (e.g. 03XXXXXXXXX)");
                        return;
                      }
                      setStep(1);
                    }}
                    className="mt-6 sm:mt-8 md:mt-10 w-full bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 md:py-5 text-[11px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm shadow-md"
                  >
                    Continue to Review
                  </button>
                </motion.div>
              )}

              {/* STEP 1: Review */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }}>
                  <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-5 sm:mb-8">Review Your Order</h2>

                  {/* COD Info Box */}
                  <div className="border border-[#d4a59a]/30 bg-[#d4a59a]/10 p-4 sm:p-5 md:p-6 mb-5 sm:mb-6 flex items-start gap-3 sm:gap-4 rounded-sm shadow-sm">
                    <Truck size={24} className="text-[#d4a59a] shrink-0 mt-0.5 sm:w-[28px] sm:h-[28px]" strokeWidth={1.5} />
                    <div>
                      <p className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-['Montserrat'] text-[#d4a59a] font-bold mb-1 sm:mb-1.5">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-[#f5f0ee] sm:text-[#9a8f8c] text-[11px] sm:text-xs md:text-sm font-['Montserrat'] font-medium leading-relaxed">
                        You have selected Cash on Delivery. Please pay the rider in cash when your order arrives at your doorstep. No advance payment is required.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
                    {/* Shipping summary */}
                    <div className="border border-[#d4a59a]/15 p-4 sm:p-5 md:p-6 bg-[#0d0d0d] rounded-sm shadow-sm">
                      <div className="flex justify-between items-start mb-3 border-b border-[#d4a59a]/10 pb-2 sm:pb-3">
                        <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c]">Shipping To</p>
                        <button onClick={() => setStep(0)} className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] hover:text-[#f2c6b4] transition-colors border border-[#d4a59a]/30 px-2 py-1 rounded-sm">Edit</button>
                      </div>
                      <p className="text-xs sm:text-sm font-['Montserrat'] font-semibold text-[#f5f0ee] mb-1">{address.firstName} {address.lastName}</p>
                      <p className="text-[11px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] mb-1 truncate">{address.email}</p>
                      <p className="text-[11px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] leading-snug">{address.street}, {address.city}, {address.zip}, {address.country}</p>
                    </div>

                    {/* Items summary */}
                    <div className="border border-[#d4a59a]/15 p-4 sm:p-5 md:p-6 bg-[#0d0d0d] rounded-sm shadow-sm">
                      <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-3 border-b border-[#d4a59a]/10 pb-2 sm:pb-3">Items ({items.length})</p>
                      <div className="space-y-3 sm:space-y-4 max-h-[140px] sm:max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item, i) => (
                          <div key={i} className="flex gap-3 sm:gap-4">
                            <img src={item.product.image} alt={item.product.name} className="w-12 h-16 sm:w-16 sm:h-20 object-cover bg-[#141414] shrink-0 rounded-sm border border-[#d4a59a]/10" />
                            <div className="flex-1 min-w-0">
                              <p className="font-['Cormorant_Garamond'] text-base sm:text-lg font-medium text-[#f5f0ee] truncate mb-0.5">{item.product.name}</p>
                              <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] font-['Montserrat'] font-semibold truncate mb-1">{item.color} · {item.size} <span className="text-[#f5f0ee] ml-0.5">× {item.quantity}</span></p>
                              <p className="text-[11px] sm:text-xs font-['Montserrat'] font-bold text-[#d4a59a]">Rs. {(item.product.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6 border-t border-[#d4a59a]/10 pt-5 sm:pt-6 md:pt-8">
                    <button
                      onClick={() => setStep(0)}
                      className="w-full sm:w-auto px-4 py-3.5 sm:py-4 md:py-5 border border-[#d4a59a]/30 text-[10px] sm:text-[11px] md:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] hover:bg-[#1a1a1a] transition-colors rounded-sm bg-[#111]"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 md:py-5 text-[11px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] disabled:opacity-60 transition-colors w-full rounded-sm shadow-md"
                    >
                      {loading ? "Processing…" : `Confirm Order · Rs. ${total.toFixed(2)}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — order summary (Desktop Only) */}
          <div className="hidden lg:block w-full">
            <div className="border border-[#d4a59a]/20 p-8 sticky top-28 bg-[#0d0d0d] rounded-sm shadow-lg w-full">
              <p className="text-xs tracking-[0.2em] uppercase font-['Montserrat'] text-[#f5f0ee] font-bold mb-6 border-b border-[#d4a59a]/15 pb-4">Order Summary</p>
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-['Montserrat'] font-medium">
                    <span className="text-[#9a8f8c] max-w-[200px] truncate">{item.product.name} <span className="text-[#f5f0ee] font-bold ml-1">× {item.quantity}</span></span>
                    <span className="text-[#f5f0ee] font-bold">Rs. {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#d4a59a]/15 pt-5 space-y-3">
                <div className="flex justify-between text-sm font-['Montserrat'] text-[#9a8f8c]">
                  <span>Subtotal</span>
                  <span className="text-[#f5f0ee]">Rs. {sub.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-['Montserrat'] text-[#9a8f8c]">
                  <span>Shipping</span>
                  <span className="text-[#f5f0ee]">{shipping === 0 ? "Complimentary" : `Rs. ${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-['Montserrat'] text-[#f5f0ee] pt-4 border-t border-[#d4a59a]/15 mt-2">
                  <span className="text-xs tracking-[0.15em] uppercase font-bold mt-1">Total to pay</span>
                  <span className="text-2xl font-bold text-[#d4a59a]">Rs. {total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[#d4a59a]/15 text-center bg-[#111] rounded-sm border border-[#d4a59a]/10 p-4">
                <p className="text-[10px] font-['Montserrat'] text-[#9a8f8c] uppercase tracking-[0.2em] mb-1.5 font-bold">Payment Method</p>
                <p className="text-sm font-['Montserrat'] text-[#d4a59a] font-bold flex justify-center items-center gap-2">
                  <Truck size={16} /> Cash on Delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4a59a40; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4a59a80; }
      `}</style>
    </div>
  );
}