import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  ShoppingBag,
  User,
  Mail,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { fetchCustomers } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

const MOCK_CUSTOMERS = [];

export function AdminCustomers() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCustomers(token)
        .then((data) => setCustomers(data || []))
        .catch((err) => console.error("Failed to fetch customers:", err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "vip" && c.isVip) ||
      (filter === "active" && c.status === "active") ||
      (filter === "inactive" && c.status === "inactive");
    return matchSearch && matchFilter;
  });

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const vipCount = customers.filter((c) => c.isVip).length;
  const avgOrderValue =
    totalRevenue / Math.max(1, customers.reduce((s, c) => s + c.orders, 0));

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto relative h-full w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-2 md:gap-0 w-full">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-medium text-[#f5f0ee]">
            Customers
          </h1>
          <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] mt-1 sm:mt-2">
            {customers.length} registered clients
          </p>
        </div>
      </div>

      {/* Summary stats - Mobile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-10 w-full">
        {[
          { label: "Total Clients", value: customers.length },
          { label: "VIP Members", value: vipCount },
          { label: "Avg Order Value", value: `Rs. ${avgOrderValue.toFixed(0)}` },
          {
            label: "Total Revenue",
            value: `Rs. ${totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 md:p-6 rounded-sm shadow-sm md:shadow-md flex flex-col justify-center"
          >
            <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-1 md:mb-2 truncate w-full">
              {s.value}
            </p>
            <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#9a8f8c] truncate w-full">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6 mb-6 md:mb-8 w-full">
        <div className="relative w-full xl:w-96 shrink-0">
          <Search
            size={16}
            className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-[#9a8f8c] sm:w-[18px] sm:h-[18px]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs sm:text-sm font-['Montserrat'] pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 outline-none placeholder-[#9a8f8c]/50 transition-colors w-full rounded-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full">
          {["all", "vip", "active", "inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-semibold px-4 py-2.5 sm:px-5 sm:py-3 border transition-colors rounded-sm flex-1 sm:flex-none text-center ${filter === f
                  ? "border-[#d4a59a] text-[#d4a59a] bg-[#d4a59a]/10"
                  : "border-[#d4a59a]/15 text-[#9a8f8c] hover:text-[#f5f0ee] hover:border-[#d4a59a]/40"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 md:gap-8 relative w-full">

        {/* ====== MOBILE VIEW (Cards View) ====== */}
        <div className="md:hidden w-full space-y-3 sm:space-y-4">
          {loading && <p className="text-[#9a8f8c] font-['Montserrat'] text-center py-8 text-xs">Loading...</p>}
          {!loading && filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className={`border border-[#d4a59a]/15 p-3.5 sm:p-4 rounded-sm relative shadow-sm cursor-pointer transition-colors w-full ${selected?.id === c.id ? "bg-[#d4a59a]/5 border-[#d4a59a]/40" : "bg-[#0d0d0d] hover:border-[#d4a59a]/30"}`}
            >
              <div className="flex gap-3 sm:gap-4 w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#d4a59a]/15 border border-[#d4a59a]/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-1">
                  <span className="text-base sm:text-lg font-['Cormorant_Garamond'] font-medium text-[#d4a59a]">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm sm:text-base font-['Montserrat'] text-[#f5f0ee] font-semibold mb-0.5 truncate flex-1">
                      {c.name}
                    </p>
                    {c.isVip && (
                      <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase bg-[#d4a59a]/20 text-[#d4a59a] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm shrink-0">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] mb-2.5 sm:mb-3 truncate w-full">{c.email}</p>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-['Montserrat'] text-[#f5f0ee]">
                    <span className="bg-[#111] px-2 py-1 sm:px-2.5 sm:py-1 rounded-sm border border-[#d4a59a]/10">{c.orders} Orders</span>
                    <span className="bg-[#111] px-2 py-1 sm:px-2.5 sm:py-1 rounded-sm border border-[#d4a59a]/10">Rs. {c.totalSpent.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="p-8 text-center text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] border border-[#d4a59a]/15 bg-[#0d0d0d] rounded-sm w-full">
              No customers found
            </div>
          )}
        </div>

        {/* ====== DESKTOP VIEW (Table View) ====== */}
        <div className="hidden md:block flex-1 border border-[#d4a59a]/20 overflow-hidden bg-[#0d0d0d] rounded-sm shadow-md w-full">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#d4a59a]/20 bg-[#0a0a0a]">
                  {[
                    "Customer", "Country", "Orders", "Total Spent", "Last Order", "Status", ""
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-5 text-left text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4a59a]/10">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-[#9a8f8c] text-sm font-['Montserrat'] italic">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-[#d4a59a]/5 transition-colors cursor-pointer ${selected?.id === c.id ? "bg-[#d4a59a]/10" : ""
                      }`}
                    onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#d4a59a]/15 border border-[#d4a59a]/20 flex items-center justify-center shrink-0">
                          <span className="text-xs lg:text-sm font-['Montserrat'] font-bold text-[#d4a59a]">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-['Montserrat'] text-[#f5f0ee] font-medium flex flex-wrap items-center gap-2 truncate">
                            {c.name}
                            {c.isVip && (
                              <span className="text-[9px] lg:text-[10px] tracking-[0.15em] uppercase bg-[#d4a59a]/20 text-[#d4a59a] px-1.5 py-0.5 rounded-sm font-bold shrink-0">
                                VIP
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[#9a8f8c] font-['Montserrat'] mt-1 truncate">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs lg:text-sm font-['Montserrat'] text-[#9a8f8c] truncate max-w-[100px]">
                      {c.country}
                    </td>
                    <td className="px-6 py-4 text-xs lg:text-sm font-['Montserrat'] text-[#f5f0ee]">
                      {c.orders}
                    </td>
                    <td className="px-6 py-4 text-xs lg:text-sm font-['Montserrat'] text-[#f5f0ee] whitespace-nowrap">
                      Rs. {c.totalSpent.toLocaleString("en-GB", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-[10px] lg:text-xs font-['Montserrat'] text-[#9a8f8c] whitespace-nowrap">
                      {c.lastOrder === "Never" ? "Never" : new Date(c.lastOrder).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[9px] lg:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold px-2 py-1 lg:px-3 lg:py-1.5 rounded-sm whitespace-nowrap ${c.status === "active"
                          ? "text-green-400 bg-green-400/10 border border-green-400/20"
                          : "text-[#9a8f8c] bg-[#9a8f8c]/10 border border-[#9a8f8c]/20"
                          }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                        className="text-[#9a8f8c] hover:text-[#d4a59a] transition-colors p-2 lg:p-2.5 bg-[#111] hover:bg-[#d4a59a]/10 rounded-sm border border-[#d4a59a]/20"
                      >
                        <ArrowUpRight size={16} className="lg:w-[18px] lg:h-[18px]" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-[#9a8f8c] text-sm font-['Montserrat']">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====== DETAIL PANEL (Mobile: Bottom Sheet/Overlay, Desktop: Side Panel) ====== */}
        <AnimatePresence>
          {selected && (
            <>
              {/* Responsive Backdrop */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => setSelected(null)} />

              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-h-[90vh] overflow-y-auto z-50 md:w-[480px] border-t md:border border-[#d4a59a]/25 bg-[#111] rounded-t-2xl md:rounded-sm shadow-2xl w-full"
              >
                <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 md:px-6 md:py-6 border-b border-[#d4a59a]/15 sticky top-0 bg-[#111] z-10 shrink-0">
                  <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c]">
                    Profile Details
                  </p>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#9a8f8c] hover:text-[#f5f0ee] transition-all p-1.5 sm:p-2 bg-[#1a1a1a] rounded-sm hover:rotate-90 duration-300 border border-[#d4a59a]/10"
                  >
                    <X size={16} className="sm:w-[20px] sm:h-[20px]" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="p-5 sm:p-6 md:p-8 w-full overflow-x-hidden">
                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-6 sm:mb-8 text-center w-full">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-[#d4a59a]/15 border border-[#d4a59a]/30 flex items-center justify-center mb-3 sm:mb-4 shadow-sm shrink-0">
                      <span className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl text-[#d4a59a]">
                        {selected.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-3xl font-medium text-[#f5f0ee] truncate w-full px-4">
                      {selected.name}
                    </p>
                    {selected.isVip && (
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.2em] uppercase bg-[#d4a59a]/20 text-[#d4a59a] font-bold px-2 py-1 sm:px-3 sm:py-1.5 mt-2 sm:mt-3 rounded-sm">
                        VIP Member
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 bg-[#0a0a0a] md:bg-transparent p-4 md:p-0 rounded-sm border border-[#d4a59a]/10 md:border-none w-full">
                    {[
                      { icon: Mail, label: selected.email },
                      { icon: Calendar, label: `Joined ${new Date(selected.joined).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}` },
                      { icon: ShoppingBag, label: `${selected.orders} orders placed` },
                      { icon: User, label: selected.country },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 sm:gap-4 w-full">
                        <item.icon size={14} className="sm:w-[16px] sm:h-[16px] text-[#d4a59a] shrink-0" strokeWidth={1.5} />
                        <p className="text-xs sm:text-sm font-['Montserrat'] font-medium text-[#9a8f8c] truncate flex-1">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="border border-[#d4a59a]/20 bg-[#1a1a1a] md:bg-[#111] p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 rounded-sm w-full">
                    <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-semibold text-[#9a8f8c] mb-1.5 sm:mb-2">
                      Lifetime Value
                    </p>
                    <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-medium text-[#d4a59a] truncate w-full">
                      Rs. {selected.totalSpent.toLocaleString("en-GB", { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-medium text-[#9a8f8c] mt-1.5 sm:mt-2 truncate w-full">
                      Avg: Rs. {(selected.totalSpent / Math.max(1, selected.orders)).toFixed(0)} / order
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2.5 sm:space-y-3 pb-2 w-full">
                    <a
                      href={`mailto:${selected.email}`}
                      className="flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-4 bg-[#d4a59a] text-[#0a0a0a] text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm shadow-md"
                    >
                      <Mail size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />
                      Email Customer
                    </a>
                    {!selected.isVip && (
                      <button className="flex items-center justify-center gap-2 w-full py-3 sm:py-4 border border-[#d4a59a]/30 text-[#f5f0ee] md:text-[#9a8f8c] text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:text-[#d4a59a] hover:border-[#d4a59a]/50 transition-colors bg-[#1a1a1a] rounded-sm">
                        Promote to VIP
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}