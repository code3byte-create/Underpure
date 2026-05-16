import { useState } from "react";
import { Eye, EyeOff, RotateCcw, Save, CheckCircle, UploadCloud, X, Layers } from "lucide-react";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

const INPUT_CLS =
  "w-full bg-[#1a1a1a] md:bg-[#0a0a0a] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs sm:text-sm font-['Montserrat'] px-3.5 py-3 sm:px-4 sm:py-3.5 outline-none transition-colors placeholder-[#9a8f8c]/50 rounded-sm";
const TEXTAREA_CLS = INPUT_CLS + " resize-none";
const LABEL_CLS =
  "block text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] text-[#9a8f8c] font-bold mb-2 sm:mb-3";

function Field({ label, children }) {
  return (
    <div className="mb-4 sm:mb-5 md:mb-0 w-full">
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border border-[#d4a59a]/15 bg-[#0d0d0d] p-4 sm:p-6 md:p-8 mb-5 sm:mb-6 md:mb-8 rounded-sm shadow-sm w-full">
      <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-4 sm:mb-6 md:mb-8 pb-3 sm:pb-4 border-b border-[#d4a59a]/10">
        {title}
      </h2>
      <div className="space-y-0 md:space-y-6 w-full">{children}</div>
    </div>
  );
}

export function AdminContent() {
  const settings = useSiteSettingsStore();
  const { token } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const [draft, setDraft] = useState({
    announcementText: settings.announcementText,
    announcementVisible: settings.announcementVisible,
    heroHeadline: settings.heroHeadline,
    heroHeadlineItalic: settings.heroHeadlineItalic,
    heroSubheadline: settings.heroSubheadline,
    heroBadgeText: settings.heroBadgeText,
    heroCtaText: settings.heroCtaText,
    heroImages: (() => {
      try {
        return typeof settings.heroImages === 'string' ? JSON.parse(settings.heroImages) : (settings.heroImages || []);
      } catch (e) {
        return [];
      }
    })(),
    homeSectionPriority: (() => {
      try {
        return typeof settings.homeSectionPriority === 'string' ? JSON.parse(settings.homeSectionPriority) : (settings.homeSectionPriority || []);
      } catch (e) {
        return [];
      }
    })(),
    newsletterTitle: settings.newsletterTitle,
    newsletterSub: settings.newsletterSub,
  });

  const set = (key, value) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleHeroImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const readPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(base64Images => {
      setDraft(d => ({ ...d, heroImages: [...(d.heroImages || []), ...base64Images] }));
      toast.success(`${files.length} image(s) added to hero carousel!`);
    }).catch(() => {
      toast.error("Failed to read images.");
    });
    e.target.value = null;
  };

  const removeHeroImage = (idx) => {
    setDraft(d => {
      const newImgs = [...(d.heroImages || [])];
      newImgs.splice(idx, 1);
      return { ...d, heroImages: newImgs };
    });
  };

  const moveSection = (idx, direction) => {
    const newPriority = [...draft.homeSectionPriority];
    if (direction === "up" && idx > 0) {
      const temp = newPriority[idx];
      newPriority[idx] = newPriority[idx - 1];
      newPriority[idx - 1] = temp;
    } else if (direction === "down" && idx < newPriority.length - 1) {
      const temp = newPriority[idx];
      newPriority[idx] = newPriority[idx + 1];
      newPriority[idx + 1] = temp;
    }
    set("homeSectionPriority", newPriority);
  };

  const toggleSectionEnabled = (idx) => {
    const newPriority = [...draft.homeSectionPriority];
    newPriority[idx].enabled = !newPriority[idx].enabled;
    set("homeSectionPriority", newPriority);
  };

  const handleSave = async () => {
    const payload = {
      ...draft,
      heroImages: JSON.stringify(draft.heroImages),
      homeSectionPriority: JSON.stringify(draft.homeSectionPriority)
    };
    await settings.updateSettings(payload, token);
    setSaved(true);
    toast.success("Homepage content saved to database — changes are live");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    settings.resetToDefaults();
    setDraft({
      announcementText: "Complimentary Shipping on Orders Over Rs. 150 · New Collection Now Available",
      announcementVisible: true,
      heroHeadline: "Dressed in",
      heroHeadlineItalic: "Nothing But Luxury",
      heroSubheadline:
        "Handcrafted lingerie for the woman who understands that true luxury begins with what lies beneath.",
      heroBadgeText: "New Collection · Spring 2026",
      heroCtaText: "Shop The Collection",
      heroImages: [],
      homeSectionPriority: JSON.parse(settings.DEFAULTS?.homeSectionPriority || "[]"),
      newsletterTitle: "Join Our Inner Circle",
      newsletterSub:
        "Be the first to discover new collections, exclusive offers, and intimate styling notes.",
    });
    toast.success("Reset to defaults");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1200px] mx-auto pb-28 md:pb-8 relative w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-0 w-full">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">Homepage Content</h1>
          <p className="text-[#9a8f8c] text-xs sm:text-sm font-['Montserrat'] mt-1 sm:mt-2">
            Changes apply immediately to the live storefront
          </p>
        </div>

        <div className="hidden md:flex gap-3 sm:gap-4 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3.5 border border-[#d4a59a]/20 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] text-[#9a8f8c] hover:text-[#f5f0ee] hover:border-[#d4a59a]/40 transition-colors rounded-sm font-bold"
          >
            <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />
            Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3.5 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold transition-colors rounded-sm shadow-md ${saved
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-[#d4a59a] text-[#0a0a0a] hover:bg-[#f2c6b4]"
              }`}
          >
            {saved ? <CheckCircle size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} /> : <Save size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <Section title="Announcement Bar">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-5 gap-3 sm:gap-0 border-b border-[#d4a59a]/10 pb-4 w-full">
          <label className={LABEL_CLS + " mb-0"}>Visibility</label>
          <button
            onClick={() => set("announcementVisible", !draft.announcementVisible)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold px-4 py-2.5 sm:px-5 sm:py-3 border transition-colors rounded-sm w-full sm:w-auto ${draft.announcementVisible
                ? "border-[#d4a59a] text-[#d4a59a] bg-[#d4a59a]/10"
                : "border-[#d4a59a]/20 text-[#9a8f8c] hover:border-[#d4a59a]/40 bg-[#111] sm:bg-transparent"
              }`}
          >
            {draft.announcementVisible ? <Eye size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} /> : <EyeOff size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />}
            {draft.announcementVisible ? "Visible" : "Hidden"}
          </button>
        </div>
        <Field label="Announcement Text">
          <input
            type="text"
            value={draft.announcementText}
            onChange={(e) => set("announcementText", e.target.value)}
            className={INPUT_CLS}
            placeholder="Complimentary Shipping on Orders Over Rs. 150…"
          />
        </Field>
        <div className={`mt-4 py-2.5 px-3 sm:py-3 sm:px-4 text-center text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold transition-all rounded-sm border border-[#d4a59a]/20 w-full truncate ${draft.announcementVisible ? "bg-[#8b4f5c] text-[#f5f0ee]" : "bg-[#1a1a1a] text-[#9a8f8c] line-through opacity-50"
          }`}>
          {draft.announcementText || "No text set"}
        </div>
        <p className="text-[9px] sm:text-[10px] font-['Montserrat'] text-[#9a8f8c]/50 mt-1.5 sm:mt-2 text-center md:text-left italic uppercase tracking-widest">↑ Live preview</p>
      </Section>

      <Section title="Hero Section">
        <div className="mb-5 sm:mb-6 border border-[#d4a59a]/20 p-4 sm:p-5 rounded-sm bg-[#1a1a1a] w-full">
          <label className={LABEL_CLS}>Hero Background Images (Carousel)</label>
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 w-full">
            <div className="flex-1 text-[9px] sm:text-[10px] text-[#9a8f8c] font-['Montserrat'] leading-relaxed">
              Upload images to be displayed as a background carousel in the Hero section. For best results on all devices, use high-resolution vertical/square images.
            </div>
            <label className="cursor-pointer bg-[#d4a59a]/10 border border-[#d4a59a]/30 text-[#d4a59a] px-4 py-2.5 sm:px-5 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#d4a59a] hover:text-[#0a0a0a] transition-colors flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-center shrink-0">
              <UploadCloud size={14} className="sm:w-[16px] sm:h-[16px]" /> Upload Images
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleHeroImagesUpload} />
            </label>
          </div>

          {(draft.heroImages && draft.heroImages.length > 0) ? (
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[#d4a59a]/10 w-full">
              {draft.heroImages.map((img, idx) => (
                <div key={idx} className="relative group w-[calc(33.33%-0.5rem)] sm:w-24 md:w-28 shrink-0">
                  <img src={img} alt="Hero slide" className="w-full h-16 sm:h-20 object-cover rounded-sm border border-[#d4a59a]/30 bg-[#0a0a0a]" />
                  <button type="button" onClick={() => removeHeroImage(idx)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md">
                    <X size={10} className="sm:w-[12px] sm:h-[12px]" strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 sm:p-6 border border-dashed border-[#d4a59a]/20 rounded-sm w-full bg-[#111]">
              <p className="text-[10px] sm:text-xs text-[#9a8f8c] italic">No images added. A default fallback will be used.</p>
            </div>
          )}
        </div>

        <Field label="Badge Text">
          <input
            type="text"
            value={draft.heroBadgeText}
            onChange={(e) => set("heroBadgeText", e.target.value)}
            className={INPUT_CLS}
            placeholder="New Collection · Spring 2026"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-5 w-full">
          <Field label="Headline (first line)">
            <input
              type="text"
              value={draft.heroHeadline}
              onChange={(e) => set("heroHeadline", e.target.value)}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Headline (italic accent)">
            <input
              type="text"
              value={draft.heroHeadlineItalic}
              onChange={(e) => set("heroHeadlineItalic", e.target.value)}
              className={INPUT_CLS}
            />
          </Field>
        </div>
        <Field label="Subheadline">
          <textarea
            value={draft.heroSubheadline}
            onChange={(e) => set("heroSubheadline", e.target.value)}
            rows={4}
            className={TEXTAREA_CLS}
          />
        </Field>
        <Field label="Primary CTA Button Text">
          <input
            type="text"
            value={draft.heroCtaText}
            onChange={(e) => set("heroCtaText", e.target.value)}
            className={INPUT_CLS}
            placeholder="Shop The Collection"
          />
        </Field>

        <div className="mt-5 sm:mt-6 border border-[#d4a59a]/15 bg-[#0a0a0a] text-center rounded-sm shadow-inner py-8 px-4 sm:py-10 sm:px-6 w-full">
          <p className="text-[#d4a59a] text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2.5 sm:mb-4">
            {draft.heroBadgeText}
          </p>
          <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee] mb-1 sm:mb-2 leading-tight">
            {draft.heroHeadline}
          </p>
          <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#d4a59a] italic mb-3 sm:mb-6 leading-tight">
            {draft.heroHeadlineItalic}
          </p>
          <p className="text-[#9a8f8c] text-[10px] sm:text-xs md:text-sm font-['Montserrat'] font-medium mb-5 sm:mb-8 max-w-[280px] sm:max-w-md md:max-w-xl mx-auto leading-relaxed">
            {draft.heroSubheadline}
          </p>
          <span className="inline-block bg-[#d4a59a] text-[#0a0a0a] px-5 py-2.5 sm:px-8 sm:py-3.5 text-[8px] sm:text-[9px] md:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold rounded-sm shadow-md">
            {draft.heroCtaText}
          </span>
          <p className="text-[8px] sm:text-[9px] font-['Montserrat'] text-[#9a8f8c]/40 mt-6 sm:mt-8 uppercase tracking-widest italic">↑ Live preview</p>
        </div>
      </Section>

      {/* Homepage layout prioritization */}
      <Section title="Homepage Layout & Priority Settings">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#d4a59a]/10">
          <Layers size={18} strokeWidth={1.5} className="text-[#d4a59a]" />
          <h3 className="font-['Montserrat'] text-[11px] sm:text-xs tracking-[0.15em] uppercase text-[#f5f0ee] font-bold">Priority & Sliders Control</h3>
        </div>
        <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] mb-6 leading-relaxed">
          Enable, disable, or reorder the sections displayed on your website's Homepage. Use the up and down arrows to tailor your storefront layout and prioritize specific badges or sliders (e.g. New Arrivals, Trending Collections, Limited Editions, Best Sellers, etc.).
        </p>
        <div className="space-y-2.5 w-full">
          {draft.homeSectionPriority && draft.homeSectionPriority.map((sec, idx) => (
            <div key={sec.id} className="flex items-center justify-between bg-[#1a1a1a] p-3.5 sm:p-4 rounded-sm border border-[#d4a59a]/10 w-full gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${sec.enabled !== false ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                <p className="font-['Montserrat'] text-xs sm:text-sm font-semibold text-[#f5f0ee] truncate">{sec.label}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSectionEnabled(idx)}
                  className={`px-3 py-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border rounded-sm transition-colors ${
                    sec.enabled !== false
                      ? "border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/10"
                      : "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                  }`}
                >
                  {sec.enabled !== false ? "Enabled" : "Disabled"}
                </button>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, "up")}
                  className="p-1.5 text-[#9a8f8c] hover:text-[#f5f0ee] hover:bg-[#222] rounded-sm disabled:opacity-20 disabled:pointer-events-none border border-[#d4a59a]/10 transition-colors"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={idx === draft.homeSectionPriority.length - 1}
                  onClick={() => moveSection(idx, "down")}
                  className="p-1.5 text-[#9a8f8c] hover:text-[#f5f0ee] hover:bg-[#222] rounded-sm disabled:opacity-20 disabled:pointer-events-none border border-[#d4a59a]/10 transition-colors"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Newsletter Section">
        <Field label="Newsletter Title">
          <input
            type="text"
            value={draft.newsletterTitle}
            onChange={(e) => set("newsletterTitle", e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Newsletter Subtext">
          <textarea
            value={draft.newsletterSub}
            onChange={(e) => set("newsletterSub", e.target.value)}
            rows={3}
            className={TEXTAREA_CLS}
          />
        </Field>
      </Section>

      {/* Fixed bottom bar for Mobile only */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-[#111]/95 backdrop-blur-md border-t border-[#d4a59a]/15 flex gap-2.5 sm:gap-3 z-40 md:hidden w-full">
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 px-3 py-3.5 sm:py-4 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] rounded-sm shrink-0"
        >
          <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />
          Reset
        </button>
        <button
          onClick={handleSave}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3.5 sm:py-4 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm shadow-lg transition-colors ${saved
              ? "bg-green-500 text-[#0a0a0a]"
              : "bg-[#d4a59a] text-[#0a0a0a]"
            }`}
        >
          {saved ? <CheckCircle size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} /> : <Save size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2} />}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>

    </div>
  );
}