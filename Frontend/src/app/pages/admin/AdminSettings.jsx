import { useState } from "react";
import { Save, CheckCircle, RotateCcw, Store, Truck, Share2, Mail, Plus, X, Star, ChevronDown, Image as ImageIcon, AlertTriangle, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSiteSettingsStore, DEFAULTS } from "../../store/siteSettingsStore";
import { useAuthStore } from "../../store/authStore";
import { CloudinaryUpload } from "../../components/admin/CloudinaryUpload";
import { toast } from "sonner";

const INPUT_CLS =
  "w-full bg-[#1a1a1a] md:bg-[#0a0a0a] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs sm:text-sm md:text-sm font-['Montserrat'] px-3.5 py-3.5 sm:px-4 sm:py-3 md:px-5 md:py-4 outline-none transition-colors placeholder-[#9a8f8c]/50 rounded-sm";
const LABEL_CLS =
  "block text-[9px] sm:text-[11px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] text-[#9a8f8c] font-bold md:font-bold mb-1.5 sm:mb-2 md:mb-3";

function Field({ label, children, hint }) {
  return (
    <div className="mb-4 sm:mb-5 md:mb-0 w-full">
      <label className={LABEL_CLS}>{label}</label>
      {children}
      {hint && <p className="text-[9px] sm:text-[10px] md:text-xs font-['Montserrat'] text-[#9a8f8c]/60 mt-1.5 sm:mt-2">{hint}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="border border-[#d4a59a]/15 md:border-[#d4a59a]/20 bg-[#0d0d0d] p-4 sm:p-5 md:p-10 mb-4 sm:mb-5 md:mb-8 rounded-sm shadow-sm md:shadow-md w-full">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-8 pb-3 md:pb-5 border-b border-[#d4a59a]/10 md:border-[#d4a59a]/20">
        <Icon size={18} strokeWidth={1.5} className="text-[#d4a59a] sm:w-[20px] sm:h-[20px]" />
        <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] truncate">{title}</h2>
      </div>
      <div className="space-y-0 md:space-y-6 w-full">{children}</div>
    </div>
  );
}

export function AdminSettings() {
  const settings = useSiteSettingsStore();
  const { token } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false); // Custom Modal State

  const [draft, setDraft] = useState({
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    storePhone: settings.storePhone,
    storeAddress: settings.storeAddress,
    freeShippingThreshold: settings.freeShippingThreshold,
    deliveryFee: settings.deliveryFee ?? DEFAULTS.deliveryFee,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    twitterUrl: settings.twitterUrl,
    footerTagline: settings.footerTagline,
    maintenanceMode: settings.maintenanceMode || false,
    testimonialsTitle: settings.testimonialsTitle || "What Our Customers Say",
    testimonialsSubtitle: settings.testimonialsSubtitle || "Join thousands of customers who have discovered the perfect blend of luxury, comfort, and safety",
    heroHeadline: settings.heroHeadline || "Dressed in",
    heroHeadlineItalic: settings.heroHeadlineItalic || "Nothing But Luxury",
    heroSubheadline: settings.heroSubheadline || "Handcrafted lingerie for the woman who understands that true luxury begins with what lies beneath.",
    heroBadgeText: settings.heroBadgeText || "New Collection • Spring 2026",
    heroCtaText: settings.heroCtaText || "Shop The Collection",
    heroImages: typeof settings.heroImages === 'string' ? JSON.parse(settings.heroImages || "[]") : (settings.heroImages || []),
    testimonials: typeof settings.testimonials === 'string' ? JSON.parse(settings.testimonials || "[]") : (settings.testimonials || []),
    homeSectionPriority: typeof settings.homeSectionPriority === 'string' ? JSON.parse(settings.homeSectionPriority || "[]") : (settings.homeSectionPriority || []),
  });

  const set = (key, value) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    const payload = {
      ...draft,
      headerCategories: settings.headerCategories || "[]",
      testimonialsTitle: draft.testimonialsTitle,
      testimonialsSubtitle: draft.testimonialsSubtitle,
      heroImages: JSON.stringify(draft.heroImages),
      testimonials: JSON.stringify(draft.testimonials),
      homeSectionPriority: JSON.stringify(draft.homeSectionPriority)
    };
    await settings.updateSettings(payload, token);
    setSaved(true);
    toast.success("Store settings saved to database successfully");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetRequest = () => {
    setResetConfirmOpen(true);
  };

  const executeReset = async () => {
    settings.resetToDefaults();
    setDraft({
      storeName: DEFAULTS.storeName,
      storeEmail: DEFAULTS.storeEmail,
      storePhone: DEFAULTS.storePhone,
      storeAddress: DEFAULTS.storeAddress,
      freeShippingThreshold: DEFAULTS.freeShippingThreshold,
      deliveryFee: DEFAULTS.deliveryFee,
      instagramUrl: DEFAULTS.instagramUrl,
      facebookUrl: DEFAULTS.facebookUrl,
      twitterUrl: DEFAULTS.twitterUrl,
      footerTagline: DEFAULTS.footerTagline,
      maintenanceMode: DEFAULTS.maintenanceMode,
    });

    await settings.updateSettings(DEFAULTS, token);
    toast.success("Settings reset to defaults and saved");
    setResetConfirmOpen(false);
  };

  const toggleMaintenance = async () => {
    const newVal = !draft.maintenanceMode;
    set("maintenanceMode", newVal);
    await settings.updateSettings({ ...draft, maintenanceMode: newVal }, token);
    toast.success(`Maintenance mode ${newVal ? "enabled" : "disabled"}`);
  };



  const addTestimonial = () => {
    const newTestimonial = {
      id: Date.now(),
      author: "",
      location: "",
      text: "",
      image: "",
      rating: 5,
      verified: true,
    };
    setDraft(d => ({
      ...d,
      testimonials: [...d.testimonials, newTestimonial]
    }));
  };

  const removeTestimonial = (id) => {
    setDraft(d => ({
      ...d,
      testimonials: d.testimonials.filter(t => t.id !== id)
    }));
  };

  const updateTestimonial = (id, field, value) => {
    setDraft(d => ({
      ...d,
      testimonials: d.testimonials.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      )
    }));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1200px] mx-auto pb-28 md:pb-10 relative w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 sm:mb-6 md:mb-10 gap-3 sm:gap-4 md:gap-0 w-full">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">Settings</h1>
          <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] mt-1 sm:mt-2">Store configuration</p>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-4 shrink-0">
          <button
            onClick={handleResetRequest}
            className="flex items-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4 border border-[#d4a59a]/20 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] text-[#9a8f8c] hover:text-[#f5f0ee] hover:border-[#d4a59a]/40 transition-colors rounded-sm font-bold"
          >
            <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />
            Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold transition-colors rounded-sm shadow-md ${saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-[#d4a59a] text-[#0a0a0a] hover:bg-[#f2c6b4]"
              }`}
          >
            {saved ? <CheckCircle size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} /> : <Save size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Store Info */}
      <Section icon={Store} title="Store Information">
        <Field label="Store Name" hint="Displayed in the navbar, footer, and browser tab">
          <input
            type="text"
            value={draft.storeName}
            onChange={(e) => set("storeName", e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Footer Tagline">
          <input
            type="text"
            value={draft.footerTagline}
            onChange={(e) => set("footerTagline", e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Store Address">
          <input
            type="text"
            value={draft.storeAddress}
            onChange={(e) => set("storeAddress", e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
      </Section>



      {/* Contact */}
      <Section icon={Mail} title="Contact Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 lg:gap-8 w-full">
          <Field label="Email Address">
            <input
              type="email"
              value={draft.storeEmail}
              onChange={(e) => set("storeEmail", e.target.value)}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Phone Number">
            <input
              type="tel"
              value={draft.storePhone}
              onChange={(e) => set("storePhone", e.target.value)}
              className={INPUT_CLS}
            />
          </Field>
        </div>
      </Section>

      {/* Shipping */}
      <Section icon={Truck} title="Shipping Settings">
        <Field label="Free Shipping Threshold (Rs. )" hint="Orders above this amount get free shipping">
          <input
            type="number"
            min={0}
            value={draft.freeShippingThreshold}
            onChange={(e) => set("freeShippingThreshold", Number(e.target.value))}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Standard Delivery Fee (Rs. )" hint="Flat rate fee applied to orders below the free shipping threshold">
          <input
            type="number"
            min={0}
            value={draft.deliveryFee}
            onChange={(e) => set("deliveryFee", Number(e.target.value))}
            className={INPUT_CLS}
          />
        </Field>
        <div className="border border-[#d4a59a]/15 md:border-[#d4a59a]/20 p-3.5 sm:p-4 md:p-6 bg-[#1a1a1a] md:bg-[#0a0a0a] rounded-sm mt-3 sm:mt-4 md:mt-4 shadow-inner w-full">
          <p className="text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-semibold text-[#9a8f8c] leading-relaxed">
            Current announcement bar shows:{" "}
            <span className="text-[#d4a59a] block md:inline mt-1 md:mt-0 font-bold">
              "Complimentary Shipping on Orders Over Rs. {draft.freeShippingThreshold}"
            </span>
          </p>
          <p className="text-[9px] sm:text-[10px] md:text-xs font-['Montserrat'] text-[#9a8f8c]/60 mt-1.5 sm:mt-2">
            Update the announcement bar text in Homepage Content to reflect threshold changes.
          </p>
        </div>
      </Section>

      {/* Social Media */}
      <Section icon={Share2} title="Social Media Links">
        {[
          { key: "instagramUrl", label: "Instagram URL", placeholder: "https://instagram.com/" },
          { key: "facebookUrl", label: "Facebook URL", placeholder: "https://facebook.com/" },
          { key: "twitterUrl", label: "X / Twitter URL", placeholder: "https://x.com/" },
        ].map((field) => (
          <Field key={field.key} label={field.label}>
            <input
              type="url"
              value={draft[field.key]}
              onChange={(e) => set(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={INPUT_CLS}
            />
          </Field>
        ))}
      </Section>

      {/* Testimonials */}
      <Section icon={Star} title="Testimonials & Reviews">
        <Field label="Section Title">
          <input
            type="text"
            value={draft.testimonialsTitle}
            onChange={(e) => set("testimonialsTitle", e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Section Subtitle">
          <textarea
            value={draft.testimonialsSubtitle}
            onChange={(e) => set("testimonialsSubtitle", e.target.value)}
            rows={3}
            className={INPUT_CLS + " resize-none"}
          />
        </Field>

        <div className="border-t border-[#d4a59a]/15 md:border-[#d4a59a]/20 pt-5 sm:pt-6 md:pt-8 mt-5 sm:mt-6 md:mt-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0 w-full">
            <h3 className="font-['Montserrat'] text-[11px] sm:text-sm md:text-base font-bold text-[#f5f0ee]">
              Testimonials ({draft.testimonials.length})
            </h3>
            <button
              onClick={addTestimonial}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-4 sm:py-2.5 bg-[#d4a59a]/20 text-[#d4a59a] text-[9px] sm:text-[10px] font-['Montserrat'] font-bold tracking-widest uppercase hover:bg-[#d4a59a]/30 transition-colors rounded-sm w-full sm:w-auto"
            >
              <Plus size={14} className="sm:w-[16px] sm:h-[16px]" /> Add Testimonial
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6 w-full">
            {draft.testimonials.map((testimonial, idx) => (
              <div key={testimonial.id} className="bg-[#1a1a1a] md:bg-[#111] border border-[#d4a59a]/10 p-4 sm:p-5 md:p-6 rounded-sm w-full relative">
                <div className="flex justify-between items-start mb-3 sm:mb-5">
                  <p className="font-['Montserrat'] text-[9px] sm:text-[10px] md:text-xs tracking-widest uppercase text-[#d4a59a] font-bold">
                    Testimonial #{idx + 1}
                  </p>
                  <button
                    onClick={() => removeTestimonial(testimonial.id)}
                    className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 p-1.5 sm:p-2 text-red-400/80 sm:text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-colors bg-[#111] sm:bg-transparent border border-[#d4a59a]/10 sm:border-transparent"
                    title="Remove testimonial"
                  >
                    <X size={14} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 sm:gap-4 md:gap-6 w-full">
                  <Field label="Author Name">
                    <input
                      type="text"
                      value={testimonial.author}
                      onChange={(e) => updateTestimonial(testimonial.id, "author", e.target.value)}
                      placeholder="e.g., Sarah M."
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      type="text"
                      value={testimonial.location}
                      onChange={(e) => updateTestimonial(testimonial.id, "location", e.target.value)}
                      placeholder="e.g., London, UK"
                      className={INPUT_CLS}
                    />
                  </Field>
                </div>

                <Field label="Testimonial Text">
                  <textarea
                    value={testimonial.text}
                    onChange={(e) => updateTestimonial(testimonial.id, "text", e.target.value)}
                    placeholder="What did the customer say about your product?"
                    rows={4}
                    className={INPUT_CLS + " resize-none"}
                  />
                </Field>

                <div className="w-full">
                  <label className={LABEL_CLS}>Customer Photo</label>
                  <CloudinaryUpload
                    onImageUpload={(url) => updateTestimonial(testimonial.id, "image", url)}
                    preview={testimonial.image}
                    previewAlt={testimonial.author}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 sm:gap-4 md:gap-6 mt-4 sm:mt-5 w-full">
                  <Field label="Rating">
                    <select
                      value={testimonial.rating}
                      onChange={(e) => updateTestimonial(testimonial.id, "rating", parseInt(e.target.value))}
                      className={INPUT_CLS}
                    >
                      {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{r} Stars</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Verified Customer">
                    <select
                      value={testimonial.verified ? "true" : "false"}
                      onChange={(e) => updateTestimonial(testimonial.id, "verified", e.target.value === "true")}
                      className={INPUT_CLS}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </Field>
                </div>
              </div>
            ))}
            {draft.testimonials.length === 0 && (
              <div className="text-center py-8 sm:py-10 text-[#9a8f8c] border border-dashed border-[#d4a59a]/20 bg-[#111] rounded-sm w-full">
                <p className="text-[10px] sm:text-sm font-['Montserrat'] italic">No testimonials added yet.</p>
                <p className="text-[8px] sm:text-[10px] font-['Montserrat'] text-[#d4a59a] uppercase tracking-widest mt-1.5 font-bold">Click "Add Testimonial" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </Section>



      <div className="border border-red-500/20 bg-red-500/5 p-4 sm:p-6 md:p-10 rounded-sm shadow-md w-full">
        <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-red-400 mb-3 sm:mb-5 md:mb-8 pb-3 md:pb-5 border-b border-red-500/20">
          Danger Zone
        </h2>
        <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 w-full">
            <div className="pr-2">
              <p className="text-[11px] sm:text-sm md:text-base font-['Montserrat'] font-bold md:font-semibold text-[#f5f0ee]">Maintenance Mode</p>
              <p className="text-[9px] sm:text-[10px] md:text-sm font-['Montserrat'] text-[#9a8f8c] mt-0.5 sm:mt-1">Temporarily disable the storefront for customers</p>
            </div>
            <button
              onClick={toggleMaintenance}
              className={`px-4 py-3 sm:px-5 sm:py-3 md:px-8 md:py-4 border text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold transition-colors rounded-sm w-full sm:w-auto shrink-0 ${draft.maintenanceMode
                ? "border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20"
                : "border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20"
                }`}
            >
              {draft.maintenanceMode ? "Disable" : "Enable"}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 md:pt-6 border-t border-red-500/10 w-full">
            <div className="pr-2">
              <p className="text-[11px] sm:text-sm md:text-base font-['Montserrat'] font-bold md:font-semibold text-[#f5f0ee]">Clear All Data</p>
              <p className="text-[9px] sm:text-[10px] md:text-sm font-['Montserrat'] text-[#9a8f8c] mt-0.5 sm:mt-1">Reset all settings to factory defaults</p>
            </div>
            <button
              onClick={handleResetRequest}
              className="px-4 py-3 sm:px-5 sm:py-3 md:px-8 md:py-4 border border-red-500/40 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-red-400 bg-red-500/5 hover:bg-red-500/15 transition-colors rounded-sm w-full sm:w-auto shrink-0"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-[#111]/95 backdrop-blur-md border-t border-[#d4a59a]/15 flex gap-2.5 sm:gap-3 z-40 md:hidden w-full">
        <button
          onClick={handleResetRequest}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3.5 sm:py-4 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] rounded-sm shrink-0"
        >
          <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />
          <span className="truncate">Reset</span>
        </button>
        <button
          onClick={handleSave}
          className={`flex-[2] flex items-center justify-center gap-1.5 px-3 py-3.5 sm:py-4 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm shadow-lg transition-colors ${saved
            ? "bg-green-500 text-[#0a0a0a]"
            : "bg-[#d4a59a] text-[#0a0a0a]"
            }`}
        >
          {saved ? <CheckCircle size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} /> : <Save size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />}
          <span className="truncate">{saved ? "Saved!" : "Save Changes"}</span>
        </button>
      </div>

      {/* CUSTOM RESET CONFIRMATION MODAL */}
      <AnimatePresence>
        {resetConfirmOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full" onClick={() => setResetConfirmOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90%] sm:w-full md:max-w-md bg-[#111] border border-[#d4a59a]/20 z-[60] p-6 sm:p-8 md:p-10 text-center rounded-sm shadow-2xl"
            >
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4 sm:mb-5" strokeWidth={1.5} />
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-2 sm:mb-3">Factory Reset?</p>
              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8 font-medium px-2">Are you sure you want to reset all store settings to their default values? This action cannot be undone.</p>
              <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
                <button onClick={() => setResetConfirmOpen(false)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-semibold md:font-bold hover:bg-[#222] transition-colors rounded-sm">Cancel</button>
                <button onClick={executeReset} className="flex-1 bg-red-500/90 text-white py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-bold hover:bg-red-500 transition-colors rounded-sm shadow-md">Yes, Reset All</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}