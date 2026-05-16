import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useCartStore } from "../../store/cartStore";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";
import { motion, AnimatePresence } from "motion/react";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();
  const { freeShippingThreshold, deliveryFee } = useSiteSettingsStore();
  const sub = Number(subtotal()) || 0;
  const shipping = sub >= (Number(freeShippingThreshold) || 5000) ? 0 : (Number(deliveryFee) || 200);
  const total = sub + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.32, 0, 0.32, 1] }}
            className="fixed top-0 right-0 z-[60] h-[100dvh] w-[85%] max-w-sm bg-[#111111] border-l border-[#d4a59a]/10 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#d4a59a]/10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <ShoppingBag size={18} strokeWidth={1.5} className="text-[#d4a59a] sm:w-[20px] sm:h-[20px]" />
                <span className="text-[11px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold sm:font-medium text-[#f5f0ee]">
                  Your Bag
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] font-medium">
                    ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="text-[#9a8f8c] hover:text-[#d4a59a] transition-all hover:rotate-90 duration-300 p-1.5 sm:p-2 -mr-1.5 sm:-mr-2"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.5} className="sm:w-[24px] sm:h-[24px]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-3 sm:py-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <ShoppingBag size={40} strokeWidth={1} className="text-[#d4a59a]/30 mb-4 sm:w-[48px] sm:h-[48px] sm:mb-5" />
                  <p className="font-['Cormorant_Garamond'] text-xl sm:text-2xl font-medium text-[#f5f0ee]/80 mb-2">
                    Your bag is empty
                  </p>
                  <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8">
                    Discover our curated collections
                  </p>
                  <Link
                    to="/shop"
                    onClick={closeCart}
                    className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] border border-[#d4a59a]/40 px-6 py-3.5 sm:px-8 sm:py-4 hover:bg-[#d4a59a]/10 transition-colors w-full max-w-[200px]"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5 py-2">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      className="flex gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-[#d4a59a]/15 last:border-0"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-20 sm:w-20 sm:h-24 object-cover bg-[#1a1a1a] shrink-0 rounded-sm shadow-sm"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <Link
                              to={`/product/${item.product.slug}`}
                              onClick={closeCart}
                              className="font-['Cormorant_Garamond'] text-lg sm:text-xl font-medium text-[#f5f0ee] hover:text-[#d4a59a] transition-colors leading-tight line-clamp-2 pr-1"
                            >
                              {item.product.name}
                            </Link>
                            <button
                              onClick={() => removeItem(item.product.id, item.size, item.color)}
                              className="text-[#9a8f8c] hover:text-[#d4a59a] transition-colors shrink-0 p-1 -mr-1 -mt-0.5"
                              aria-label="Remove item"
                            >
                              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          </div>
                          <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] font-medium mt-1 sm:mt-1.5 truncate">
                            {item.color} · {item.size}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2 sm:mt-3">
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-[#d4a59a]/30 h-8 sm:h-9 rounded-sm">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                              className="w-7 sm:w-9 h-full flex items-center justify-center text-[#f5f0ee] hover:text-[#d4a59a] transition-colors"
                            >
                              <Minus size={12} className="sm:w-[14px] sm:h-[14px]" />
                            </button>
                            <span className="w-6 sm:w-8 text-center text-xs sm:text-sm text-[#f5f0ee] font-['Montserrat'] font-semibold border-x border-[#d4a59a]/30 flex items-center justify-center h-full">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                              className="w-7 sm:w-9 h-full flex items-center justify-center text-[#f5f0ee] hover:text-[#d4a59a] transition-colors"
                            >
                              <Plus size={12} className="sm:w-[14px] sm:h-[14px]" />
                            </button>
                          </div>
                          {/* Price */}
                          <p className="text-sm sm:text-base font-['Montserrat'] font-semibold text-[#f5f0ee]">
                            Rs. {(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with totals */}
            {items.length > 0 && (
              <div className="border-t border-[#d4a59a]/20 px-4 sm:px-6 py-4 sm:py-6 space-y-2 sm:space-y-3 shrink-0 bg-[#111111]">
                <div className="flex justify-between text-[11px] sm:text-sm font-['Montserrat'] font-medium text-[#9a8f8c]">
                  <span>Subtotal</span>
                  <span>Rs. {sub.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] sm:text-sm font-['Montserrat'] font-medium text-[#9a8f8c]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Complimentary" : `Rs. ${shipping.toFixed(2)}`}</span>
                </div>
                {sub < (Number(freeShippingThreshold) || 5000) && (
                  <p className="text-[9px] sm:text-[10px] text-[#d4a59a] font-['Montserrat'] font-semibold">
                    Add Rs. {((Number(freeShippingThreshold) || 5000) - sub).toFixed(2)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between font-['Montserrat'] text-[#f5f0ee] pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-[#d4a59a]/20">
                  <span className="text-[10px] sm:text-xs tracking-[0.15em] uppercase font-bold mt-0.5 sm:mt-1">Total</span>
                  <span className="text-lg sm:text-xl font-bold text-[#d4a59a]">Rs. {total.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:pt-3">
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="flex items-center justify-center gap-2 sm:gap-3 w-full bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm shadow-md"
                  >
                    Checkout Now
                    <ArrowRight size={14} className="sm:w-[16px] sm:h-[16px]" />
                  </Link>
                  <button
                    onClick={closeCart}
                    className="flex items-center justify-center w-full text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors py-2 sm:py-3"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}