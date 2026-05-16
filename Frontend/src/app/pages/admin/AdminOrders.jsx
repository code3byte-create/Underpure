import { useEffect, useState } from "react";
import { ChevronDown, Search, Check, X, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchOrders, acceptOrder, cancelOrder, syncPostExOrders } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

const STATUS_STYLES = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  shipped: "text-[#d4a59a] bg-[#d4a59a]/10 border-[#d4a59a]/20",
  delivered: "text-green-400 bg-green-400/10 border-green-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_FILTER_OPTIONS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export function AdminOrders() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    fetchOrders(token)
      .then((data) => {
        setOrders(data || []);
      })
      .catch((err) => {
        toast.error("Failed to load orders");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  const handleAcceptOrder = async (orderId) => {
    setProcessingOrderId(orderId);
    setConfirmAction(null);
    try {
      const result = await acceptOrder(token, orderId);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
              ...o,
              status: result.order?.status || "processing",
              tracking_number: result.tracking_number || null,
            }
            : o
        )
      );

      if (result.tracking_number) {
        toast.success(`Order accepted! Tracking: ${result.tracking_number}`);
      } else if (result.postex_error) {
        toast.warning(`Order accepted but PostEx failed: ${result.postex_error}`);
      } else {
        toast.success("Order accepted & sent to PostEx!");
      }
    } catch (err) {
      toast.error(err.message || "Failed to accept order");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setProcessingOrderId(orderId);
    setConfirmAction(null);
    try {
      await cancelOrder(token, orderId);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
      toast.success("Order cancelled successfully");
    } catch (err) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleSyncPostEx = async () => {
    try {
      setSyncing(true);
      const res = await syncPostExOrders(token);
      toast.success(res.message || "Statuses synced successfully");
      loadOrders();
    } catch (err) {
      toast.error(err.message || "Failed to sync statuses");
    } finally {
      setSyncing(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      String(o.id).toLowerCase().includes(search.toLowerCase()) ||
      String(o.userEmail || o.shipping_email || "").toLowerCase().includes(search.toLowerCase()) ||
      String(o.shipping_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 md:mb-10 w-full">
        <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-medium text-[#f5f0ee]">
          Orders
        </h1>
        <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] mt-1 sm:mt-2">
          {orders.length} total orders
        </p>
      </div>

      {/* Filters, Search & Sync */}
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6 mb-6 md:mb-10 items-center w-full">
        <div className="relative w-full xl:w-auto shrink-0">
          <Search
            size={16}
            className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-[#9a8f8c] sm:w-[18px] sm:h-[18px]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, email or name…"
            className="bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs sm:text-sm font-['Montserrat'] pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 outline-none placeholder-[#9a8f8c]/50 transition-colors w-full sm:w-80 md:w-96 rounded-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto flex-1">
          <div className="relative w-full sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs tracking-[0.15em] uppercase font-['Montserrat'] px-4 py-3 sm:py-3.5 pr-10 outline-none transition-colors w-full rounded-sm appearance-none cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[#111] text-[#f5f0ee] py-2">
                  {s === "all" ? "All Orders" : s.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a8f8c] pointer-events-none"
            />
          </div>
          <button
            onClick={handleSyncPostEx}
            disabled={syncing}
            className="w-full sm:w-auto flex justify-center items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#0a0a0a] bg-[#d4a59a] hover:bg-[#f2c6b4] transition-colors px-4 py-3 sm:px-6 sm:py-3.5 rounded-sm disabled:opacity-60 disabled:cursor-not-allowed mt-1 sm:mt-0 shadow-md shrink-0"
          >
            {syncing ? <Loader2 size={14} className="animate-spin sm:w-[16px] sm:h-[16px]" /> : <RefreshCw size={14} className="sm:w-[16px] sm:h-[16px]" />}
            Sync PostEx
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 w-full"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-[#d4a59a]/20 rounded-sm p-6 sm:p-8 max-w-sm w-[90%] sm:w-full shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 w-full">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${confirmAction.action === "accept"
                      ? "bg-green-500/15 border border-green-500/30"
                      : "bg-red-500/15 border border-red-500/30"
                    }`}
                >
                  {confirmAction.action === "accept" ? (
                    <Check size={18} className="text-green-400 sm:w-[22px] sm:h-[22px]" />
                  ) : (
                    <X size={18} className="text-red-400 sm:w-[22px] sm:h-[22px]" />
                  )}
                </div>
                <div className="min-w-0 pr-1">
                  <h3 className="text-base sm:text-lg font-['Montserrat'] font-bold text-[#f5f0ee] truncate">
                    {confirmAction.action === "accept" ? "Accept Order?" : "Cancel Order?"}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] mt-0.5 truncate">
                    Order #{confirmAction.orderId}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-5 sm:mb-6 leading-relaxed w-full">
                {confirmAction.action === "accept"
                  ? "This will send the order to PostEx for shipment. The customer will receive their tracking details."
                  : "This will permanently cancel this order. This action cannot be undone."}
              </p>

              <div className="flex gap-2 sm:gap-3 w-full">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border border-[#d4a59a]/20 text-[#9a8f8c] text-[10px] sm:text-xs tracking-widest uppercase font-['Montserrat'] font-bold rounded-sm hover:border-[#d4a59a]/40 hover:text-[#f5f0ee] transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() =>
                    confirmAction.action === "accept"
                      ? handleAcceptOrder(confirmAction.orderId)
                      : handleCancelOrder(confirmAction.orderId)
                  }
                  className={`flex-1 px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs tracking-widest uppercase font-['Montserrat'] font-bold rounded-sm transition-all shadow-md ${confirmAction.action === "accept"
                      ? "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                      : "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                    }`}
                >
                  {confirmAction.action === "accept" ? "Accept" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3 sm:space-y-4 md:space-y-5 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-[#141414] animate-pulse rounded-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#d4a59a]/15 bg-[#0d0d0d] p-10 sm:p-12 text-center rounded-sm shadow-sm w-full">
          <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] italic">
            No orders found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 w-full">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="border border-[#d4a59a]/15 hover:border-[#d4a59a]/30 bg-[#0d0d0d] transition-colors rounded-sm overflow-hidden shadow-sm w-full"
            >
              {/* Order row */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 md:px-6 md:py-5 cursor-pointer w-full gap-3 sm:gap-0"
                onClick={() =>
                  setExpandedOrder(
                    expandedOrder === order.id ? null : order.id
                  )
                }
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <ChevronDown
                    size={18}
                    className={`text-[#9a8f8c] transition-transform shrink-0 mt-0.5 sm:mt-0 sm:w-[20px] sm:h-[20px] ${expandedOrder === order.id ? "rotate-180 text-[#d4a59a]" : ""
                      }`}
                  />
                  <div className="min-w-0 pr-1 w-full">
                    <div className="flex items-center justify-between sm:justify-start w-full gap-2">
                      <p className="text-sm sm:text-base font-['Montserrat'] text-[#f5f0ee] font-semibold truncate">
                        #{String(order.id).toUpperCase()}
                      </p>
                      {/* Mobile Status Badge Top Right */}
                      <span className={`sm:hidden text-[8px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold px-2 py-1 border rounded-sm shrink-0 ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] mt-1 sm:mt-1.5 truncate">
                      {order.shipping_email || order.userEmail || order.shipping_name || "Guest Customer"} <span className="hidden sm:inline">·</span> <br className="sm:hidden" />
                      <span className="text-[#9a8f8c]/60 mt-0.5 sm:mt-0 inline-block">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        }) : order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        }) : "Unknown Date"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right side: Price, Status Badge & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 md:gap-5 w-full sm:w-auto border-t border-[#d4a59a]/10 sm:border-0 pt-2.5 sm:pt-0 pl-7 sm:pl-0">
                  <span className="text-sm sm:text-base md:text-lg font-['Montserrat'] font-bold text-[#f5f0ee]">
                    Rs. {Number(order.total || 0).toFixed(0)}
                  </span>

                  {/* Desktop Status Badge */}
                  <span
                    className={`hidden sm:inline-block text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold px-2.5 py-1.5 md:px-3 md:py-2 border rounded-sm shrink-0 ${STATUS_STYLES[order.status] || STATUS_STYLES.pending
                      }`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>

                  {/* Action Buttons: Only show for pending orders */}
                  {order.status === "pending" && (
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        disabled={processingOrderId === order.id}
                        onClick={() => setConfirmAction({ orderId: order.id, action: "accept" })}
                        className="group relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-sm sm:rounded-full border border-green-500/30 bg-green-500/10 hover:bg-green-500/25 transition-all disabled:opacity-40"
                      >
                        {processingOrderId === order.id ? (
                          <Loader2 size={14} className="text-green-400 animate-spin sm:w-[16px] sm:h-[16px]" />
                        ) : (
                          <Check size={14} className="text-green-400 sm:w-[16px] sm:h-[16px]" strokeWidth={2.5} />
                        )}
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        disabled={processingOrderId === order.id}
                        onClick={() => setConfirmAction({ orderId: order.id, action: "cancel" })}
                        className="group relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-sm sm:rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/25 transition-all disabled:opacity-40"
                      >
                        <X size={14} className="text-red-400 sm:w-[16px] sm:h-[16px]" strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  )}
                  {/* Show tracking number if available */}
                  {order.tracking_number && (
                    <span className="text-[9px] sm:text-[10px] text-[#d4a59a] font-['Montserrat'] font-bold hidden xl:inline-block border border-[#d4a59a]/20 px-2 py-1 rounded-sm bg-[#d4a59a]/5">
                      📦 {order.tracking_number}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden bg-[#111] w-full"
                  >
                    <div className="px-4 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8 border-t border-[#d4a59a]/15 pt-4 sm:pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">

                      {/* Items */}
                      <div className="w-full">
                        <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-3 sm:mb-4">
                          Items
                        </p>
                        <div className="space-y-3 w-full">
                          {(order.items || order.cart_items || []).map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 sm:gap-4 bg-[#0a0a0a] p-2.5 sm:p-3 rounded-sm border border-[#d4a59a]/10 w-full"
                            >
                              <img
                                src={item.productImage || item.image_url || "https://images.unsplash.com/photo-1616422285623-14c1ebbd5b5b?q=80&w=2000"}
                                alt={item.productName || item.product_name || "Product"}
                                className="w-12 h-14 sm:w-14 sm:h-16 object-cover bg-[#1a1a1a] shrink-0 rounded-sm border border-[#d4a59a]/10"
                              />
                              <div className="flex-1 min-w-0 pr-1">
                                <p className="text-xs sm:text-sm font-['Montserrat'] font-semibold text-[#f5f0ee] truncate mb-0.5">
                                  {item.productName || item.product_name || "Unknown Product"}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] font-['Montserrat'] truncate">
                                  {item.color && `${item.color} · `}{item.size || "Standard"} <span className="text-[#f5f0ee] ml-0.5 sm:ml-1 font-bold">× {item.quantity || 1}</span>
                                </p>
                              </div>
                              <p className="text-xs sm:text-sm font-['Montserrat'] font-bold text-[#f5f0ee] shrink-0">
                                Rs. {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(0)}
                              </p>
                            </div>
                          ))}
                          {(!order.items && !order.cart_items) && (
                            <p className="text-[#9a8f8c] text-[10px] italic p-3 border border-dashed border-[#d4a59a]/20 rounded-sm text-center">No items found for this order.</p>
                          )}
                        </div>
                      </div>

                      {/* Shipping */}
                      <div className="w-full">
                        <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-3 sm:mb-4">
                          Shipping Details
                        </p>
                        <div className="bg-[#0a0a0a] p-4 sm:p-5 rounded-sm border border-[#d4a59a]/10 shadow-inner w-full">
                          <p className="text-xs sm:text-sm font-['Montserrat'] text-[#f5f0ee] font-bold mb-1.5">
                            {order.shippingAddress?.firstName || ""} {order.shippingAddress?.lastName || ""}
                            {(!order.shippingAddress?.firstName && !order.shippingAddress?.lastName) ? (order.shipping_name || "Customer") : ""}
                          </p>
                          <p className="text-[10px] sm:text-[11px] font-['Montserrat'] text-[#d4a59a] mb-2 font-bold truncate">
                            {order.shipping_email || order.userEmail || "No Email Provided"}
                          </p>
                          <p className="text-[10px] sm:text-[11px] font-['Montserrat'] text-[#9a8f8c] mb-0.5 truncate">
                            {order.shippingAddress?.street || order.shipping_address || "No Address Provided"}
                          </p>
                          <p className="text-[10px] sm:text-[11px] font-['Montserrat'] text-[#9a8f8c] mb-0.5 truncate">
                            {order.shippingAddress?.city || order.shipping_city || "City"},{" "}
                            {order.shippingAddress?.zip || order.shipping_zip || ""}
                          </p>
                          <p className="text-[10px] sm:text-[11px] font-['Montserrat'] text-[#9a8f8c]">
                            {order.shippingAddress?.country || "Pakistan"}
                          </p>
                          {(order.shippingAddress?.phone || order.shipping_phone) && (
                            <p className="text-[10px] sm:text-[11px] font-['Montserrat'] text-[#f5f0ee] mt-2 font-semibold">
                              📞 {order.shippingAddress?.phone || order.shipping_phone}
                            </p>
                          )}

                          {/* Tracking Info */}
                          {order.tracking_number && (
                            <div className="mt-4 pt-3 border-t border-[#d4a59a]/10">
                              <p className="text-[9px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-1">
                                Tracking
                              </p>
                              <p className="text-xs font-['Montserrat'] text-[#d4a59a] font-bold">
                                📦 {order.tracking_number}
                              </p>
                              {order.courier_status && (
                                <p className="text-[9px] font-['Montserrat'] text-[#9a8f8c] mt-1 font-bold uppercase tracking-widest">
                                  Status: <span className="text-[#f5f0ee]">{order.courier_status}</span>
                                </p>
                              )}
                            </div>
                          )}

                          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-[#d4a59a]/10 space-y-1.5 sm:space-y-2 w-full">
                            <div className="flex justify-between text-[10px] sm:text-xs font-['Montserrat']">
                              <span className="text-[#9a8f8c] font-bold">Subtotal</span>
                              <span className="text-[#f5f0ee] font-semibold">
                                Rs. {((order.items || order.cart_items || []).reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)).toFixed(0)}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] sm:text-xs font-['Montserrat']">
                              <span className="text-[#9a8f8c] font-bold">Shipping</span>
                              <span className="text-[#f5f0ee] font-semibold">
                                {(Number(order.total || 0) - ((order.items || order.cart_items || []).reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0))) <= 0 ? "Free" : `Rs. ${(Number(order.total || 0) - ((order.items || order.cart_items || []).reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0))).toFixed(0)}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm sm:text-base font-['Montserrat'] font-bold pt-2 mt-1 border-t border-[#d4a59a]/10">
                              <span className="text-[#f5f0ee]">Total</span>
                              <span className="text-[#d4a59a]">Rs. {Number(order.total || 0).toFixed(0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}