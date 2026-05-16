import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Tag, Clock, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { fetchPromotions, createPromotion, updatePromotion, deletePromotion } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

const INITIAL_CODES = [];

const EMPTY_FORM = {
  code: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxUses: null,
  active: true,
  expires: null,
};

const INPUT_CLS =
  "w-full bg-[#1a1a1a] md:bg-[#0a0a0a] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs sm:text-sm font-['Montserrat'] px-3.5 py-3.5 md:px-4 md:py-4 outline-none transition-colors placeholder-[#9a8f8c]/50 rounded-sm";
const LABEL_CLS =
  "block text-[10px] sm:text-[11px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-1.5 sm:mb-2 md:mb-3";

function Field({ label, children }) {
  return (
    <div className="mb-4 sm:mb-4 md:mb-0 w-full">
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

export function AdminPromotions() {
  const { token } = useAuthStore();
  const [codes, setCodes] = useState(INITIAL_CODES);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (token) {
      loadPromotions();
    }
  }, [token]);

  const loadPromotions = async () => {
    try {
      const data = await fetchPromotions(token);
      setCodes(data || []);
    } catch (err) {
      toast.error("Failed to load promotions");
    }
  };

  const setField = (key, value) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = async () => {
    if (!form.code.trim()) {
      toast.error("Please enter a code");
      return;
    }
    try {
      await createPromotion(token, { ...form, code: form.code.toUpperCase().replace(/\s+/g, "") });
      toast.success("Discount code created");
      setModalOpen(false);
      setForm({ ...EMPTY_FORM });
      loadPromotions();
    } catch (err) {
      toast.error(err.message || "Failed to create code");
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const codeToUpdate = codes.find(c => c.id === id);
      await updatePromotion(token, id, { ...codeToUpdate, active: !currentStatus });
      toast.success("Code status updated");
      loadPromotions();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePromotion(token, id);
      toast.success("Code deleted");
      setDeleteId(null);
      loadPromotions();
    } catch (err) {
      toast.error("Failed to delete code");
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => { });
    toast.success(`Copied: ${code}`);
  };

  const activeCodes = codes.filter((c) => c.active);
  const totalUses = codes.reduce((s, c) => s + c.uses, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full overflow-x-hidden pb-20 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 sm:mb-6 md:mb-10 gap-4 md:gap-0 w-full">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">Promotions</h1>
          <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] mt-1 sm:mt-2">
            {codes.length} discount codes · {activeCodes.length} active
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#d4a59a] text-[#0a0a0a] px-5 py-3.5 sm:px-6 sm:py-4 md:px-8 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm shadow-md w-full md:w-auto shrink-0"
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
          New Code
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-5 sm:mb-6 md:mb-10 w-full">
        {[
          { label: "Active Codes", value: activeCodes.length, icon: CheckCircle, color: "text-green-400" },
          { label: "Total Uses", value: totalUses, icon: Tag, color: "text-[#d4a59a]" },
          { label: "Expiring Soon", value: codes.filter((c) => c.expires && new Date(c.expires) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length, icon: Clock, color: "text-yellow-400", colSpanMobile: true },
        ].map((s, i) => (
          <div key={s.label} className={`border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-8 rounded-sm shadow-sm md:shadow-md flex flex-col justify-center w-full ${s.colSpanMobile ? "col-span-2 sm:col-span-1" : ""}`}>
            <div className="flex items-center justify-between mb-2 sm:mb-3 w-full">
              <s.icon size={18} className={`sm:w-[20px] sm:h-[20px] md:w-[24px] md:h-[24px] ${s.color}`} strokeWidth={1.5} />
            </div>
            <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee] mb-0.5 sm:mb-1">{s.value}</p>
            <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mt-1 sm:mt-2 truncate">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ====== MOBILE VIEW (Cards View) ====== */}
      <div className="md:hidden space-y-3 sm:space-y-4 w-full">
        {codes.map((code) => {
          const isExpired = code.expires && new Date(code.expires) < new Date();
          const isMaxed = code.maxUses !== null && code.uses >= code.maxUses;

          return (
            <div key={code.id} className="bg-[#0d0d0d] border border-[#d4a59a]/15 p-4 sm:p-5 rounded-sm shadow-sm relative w-full">
              <div className="flex justify-between items-start mb-3 sm:mb-4 w-full">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                  <code className="text-xs sm:text-sm font-mono font-bold text-[#d4a59a] bg-[#d4a59a]/10 px-2.5 py-1 sm:px-3 sm:py-1 rounded-sm border border-[#d4a59a]/20 truncate">
                    {code.code}
                  </code>
                  <button onClick={() => handleCopy(code.code)} className="text-[#9a8f8c] hover:text-[#d4a59a] bg-[#111] p-1.5 rounded-sm border border-[#d4a59a]/20 transition-colors shrink-0">
                    <Copy size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={1.5} />
                  </button>
                </div>
                <button
                  onClick={() => handleToggle(code.id, code.active)}
                  className={`text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm transition-colors shrink-0 ${code.active && !isExpired && !isMaxed
                      ? "text-green-400 bg-green-400/10 border border-green-400/20"
                      : "text-[#9a8f8c] bg-[#9a8f8c]/10 border border-[#9a8f8c]/20"
                    }`}
                >
                  {code.active && !isExpired && !isMaxed ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 bg-[#111] p-2.5 sm:p-3 rounded-sm border border-[#d4a59a]/5 w-full">
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-1 truncate">Discount</p>
                  <p className="text-xs sm:text-sm font-['Montserrat'] text-[#f5f0ee] font-semibold truncate">{code.type === "percent" ? `${code.value}%` : `Rs. ${code.value}`} OFF</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] mb-1 truncate">Uses</p>
                  <p className="text-xs sm:text-sm font-['Montserrat'] text-[#f5f0ee] font-semibold truncate">
                    {code.uses}{code.maxUses !== null ? ` / ${code.maxUses}` : ""}
                    {isMaxed && <span className="ml-1 text-[8px] sm:text-[9px] text-red-400 bg-red-400/10 px-1 rounded-sm border border-red-400/20">MAX</span>}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2.5 sm:pt-3 border-t border-[#d4a59a]/10 w-full">
                <p className="text-[9px] sm:text-[10px] font-['Montserrat'] text-[#9a8f8c] font-semibold truncate pr-2">
                  {code.expires ? <span className={isExpired ? "text-red-400" : ""}>Expires: {new Date(code.expires).toLocaleDateString("en-GB")}</span> : "No Expiry"}
                </p>
                <button onClick={() => setDeleteId(code.id)} className="text-[#9a8f8c] hover:text-red-400 transition-colors p-1.5 sm:p-2 bg-[#111] rounded-sm border border-red-500/20 shrink-0">
                  <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          );
        })}
        {codes.length === 0 && (
          <div className="p-8 text-center bg-[#111] border border-[#d4a59a]/10 rounded-sm w-full">
            <p className="text-xs text-[#9a8f8c] font-['Montserrat'] italic">No promotion codes available.</p>
          </div>
        )}
      </div>

      {/* ====== DESKTOP VIEW (Table View) ====== */}
      <div className="hidden md:block border border-[#d4a59a]/20 overflow-hidden bg-[#0d0d0d] rounded-sm shadow-md w-full">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#d4a59a]/20 bg-[#0a0a0a]">
                {["Code", "Discount", "Min. Order", "Uses", "Expires", "Status", ""].map((h) => (
                  <th key={h} className="px-5 lg:px-6 py-4 lg:py-5 text-left text-[10px] lg:text-xs tracking-[0.15em] lg:tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4a59a]/10 w-full">
              {codes.map((code) => {
                const isExpired = code.expires && new Date(code.expires) < new Date();
                const isMaxed = code.maxUses !== null && code.uses >= code.maxUses;
                return (
                  <tr key={code.id} className="hover:bg-[#d4a59a]/5 transition-colors group w-full">
                    <td className="px-5 lg:px-6 py-4 lg:py-5">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <code className="text-xs lg:text-sm font-mono text-[#d4a59a] bg-[#d4a59a]/10 px-2 py-1 lg:px-3 lg:py-1.5 rounded-sm border border-[#d4a59a]/20 font-bold truncate max-w-[120px] lg:max-w-none">
                          {code.code}
                        </code>
                        <button onClick={() => handleCopy(code.code)} className="text-[#9a8f8c] hover:text-[#d4a59a] transition-colors p-1 bg-[#111] rounded-sm shrink-0">
                          <Copy size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-['Montserrat'] font-medium text-[#f5f0ee] whitespace-nowrap">
                      {code.type === "percent" ? `${code.value}%` : `Rs. ${code.value}`} off
                    </td>
                    <td className="px-5 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-['Montserrat'] text-[#9a8f8c] whitespace-nowrap">
                      {code.minOrder > 0 ? `Rs. ${code.minOrder}` : "—"}
                    </td>
                    <td className="px-5 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-['Montserrat'] text-[#f5f0ee] whitespace-nowrap">
                      {code.uses}{code.maxUses !== null ? ` / ${code.maxUses}` : ""}
                      {isMaxed && <span className="ml-2 lg:ml-3 text-[9px] lg:text-[10px] text-red-400 font-['Montserrat'] font-bold tracking-widest bg-red-400/10 px-1.5 lg:px-2 py-1 rounded-sm border border-red-400/20">MAXED</span>}
                    </td>
                    <td className="px-5 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-['Montserrat'] text-[#9a8f8c] whitespace-nowrap">
                      {code.expires
                        ? <span className={isExpired ? "text-red-400 font-medium" : ""}>{new Date(code.expires).toLocaleDateString("en-GB")}{isExpired && " (expired)"}</span>
                        : "Never"
                      }
                    </td>
                    <td className="px-5 lg:px-6 py-4 lg:py-5">
                      <button
                        onClick={() => handleToggle(code.id, code.active)}
                        className={`text-[9px] lg:text-[10px] tracking-[0.1em] lg:tracking-[0.15em] uppercase font-['Montserrat'] font-bold px-3 lg:px-4 py-1.5 lg:py-2 transition-colors rounded-sm whitespace-nowrap ${code.active && !isExpired && !isMaxed
                          ? "text-green-400 bg-green-400/10 hover:bg-green-400/20 border border-green-400/20"
                          : "text-[#9a8f8c] bg-[#9a8f8c]/10 hover:bg-[#9a8f8c]/20 border border-[#9a8f8c]/20"
                          }`}
                      >
                        {code.active && !isExpired && !isMaxed ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 lg:px-6 py-4 lg:py-5 w-20 text-right">
                      <button onClick={() => setDeleteId(code.id)} className="text-[#9a8f8c] hover:text-red-400 transition-colors p-2 lg:p-2.5 bg-[#111] hover:bg-red-400/10 rounded-sm border border-[#d4a59a]/10 opacity-100 sm:opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} className="lg:w-[16px] lg:h-[16px]" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9a8f8c] text-sm font-['Montserrat'] italic">
                    No promotion codes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== Create Modal ====== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="relative w-[95%] sm:w-full md:max-w-xl bg-[#111] border border-[#d4a59a]/20 z-50 rounded-sm max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/15 bg-[#1a1a1a] shrink-0 w-full">
                <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] truncate">New Discount Code</p>
                <button onClick={() => setModalOpen(false)} className="text-[#9a8f8c] hover:text-[#f5f0ee] bg-[#111] sm:bg-[#1a1a1a] p-1.5 sm:p-2 rounded-sm border border-[#d4a59a]/10 transition-transform hover:rotate-90 shrink-0">
                  <X size={16} className="sm:w-[20px] sm:h-[20px]" strokeWidth={1.5} />
                </button>
              </div>
              <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 overflow-y-auto custom-scrollbar flex-1 w-full pb-24 md:pb-8">
                <Field label="Code *">
                  <input type="text" value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} placeholder="SUMMER25" className={INPUT_CLS} />
                </Field>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full">
                  <Field label="Discount Type">
                    <select value={form.type} onChange={(e) => setField("type", e.target.value)} className={INPUT_CLS}>
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed (Rs.)</option>
                    </select>
                  </Field>
                  <Field label={form.type === "percent" ? "Discount %" : "Amount (Rs.)"}>
                    <input type="number" min={1} max={form.type === "percent" ? 100 : undefined} value={form.value} onChange={(e) => setField("value", Number(e.target.value))} className={INPUT_CLS} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full">
                  <Field label="Min. Order (Rs.)">
                    <input type="number" min={0} value={form.minOrder} onChange={(e) => setField("minOrder", Number(e.target.value))} className={INPUT_CLS} />
                  </Field>
                  <Field label="Max Uses (blank = unlmt)">
                    <input type="number" min={1} value={form.maxUses ?? ""} onChange={(e) => setField("maxUses", e.target.value ? Number(e.target.value) : null)} className={INPUT_CLS} />
                  </Field>
                </div>
                <Field label="Expiry Date (blank = never)">
                  <input type="date" value={form.expires ?? ""} onChange={(e) => setField("expires", e.target.value || null)} className={INPUT_CLS} />
                </Field>

                {/* Desktop Buttons */}
                <div className="hidden md:flex gap-4 pt-4 border-t border-[#d4a59a]/15 w-full">
                  <button onClick={() => setModalOpen(false)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-4 text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold transition-colors rounded-sm hover:bg-[#222]">Cancel</button>
                  <button onClick={handleCreate} className="flex-1 bg-[#d4a59a] text-[#0a0a0a] py-4 text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm shadow-md">Create Code</button>
                </div>
              </div>

              {/* Mobile Sticky Buttons */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-[#111]/95 backdrop-blur-md border-t border-[#d4a59a]/15 flex gap-2.5 sm:gap-3 z-20 w-full">
                <button onClick={() => setModalOpen(false)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3.5 sm:py-4 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm">Cancel</button>
                <button onClick={handleCreate} className="flex-1 bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] rounded-sm shadow-lg">Create</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90%] sm:w-full md:max-w-sm bg-[#111] border border-[#d4a59a]/20 z-[60] p-6 sm:p-8 md:p-10 text-center rounded-sm shadow-2xl"
            >
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-2 sm:mb-3 md:mb-4">Delete Code?</p>
              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8 font-medium">This cannot be undone.</p>
              <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
                <button onClick={() => setDeleteId(null)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#222] transition-colors rounded-sm">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500/90 text-white py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-red-500 transition-colors rounded-sm shadow-md">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; sm:width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4a59a60; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4a59a; }
      `}</style>
    </div>
  );
}