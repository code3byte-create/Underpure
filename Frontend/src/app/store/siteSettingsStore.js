import { create } from "zustand";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_URL = isLocal 
  ? "http://127.0.0.1/backend/index.php/settings" 
  : "https://www.underpure.com/backend/index.php/settings";

export const DEFAULTS = {
  announcementText: "Complimentary Shipping on Orders Over $150 • New Collection Now Available",
  announcementVisible: true,
  heroHeadline: "Dressed in",
  heroHeadlineItalic: "Nothing But Luxury",
  heroSubheadline: "Handcrafted lingerie for the woman who understands that true luxury begins with what lies beneath.",
  heroBadgeText: "New Collection • Spring 2026",
  heroCtaText: "Shop The Collection",
  freeShippingThreshold: 5000,
  deliveryFee: 200,
  storeName: "Underpure",
  storeEmail: "hello@underpure.com",
  storePhone: "+44 20 7123 4567",
  storeAddress: "Lahore, Pakistan",
  instagramUrl: "#",
  facebookUrl: "#",
  twitterUrl: "#",
  newsletterTitle: "Join Our Inner Circle",
  newsletterSub: "Be the first to discover new collections, exclusive offers, and intimate styling notes.",
  footerTagline: "Luxury lingerie and intimate apparel, crafted for the discerning woman. Beauty in every thread.",
  maintenanceMode: false,
  headerCategories: "[]",
  heroImages: [],
  testimonials: [
    {
      id: 1,
      author: "Isabelle M.",
      location: "Lahore, Pakistan",
      text: "I've never owned anything quite like this. The fabric feels like a second skin. Worth every penny.",
      image: "https://images.unsplash.com/photo-1599839770015-53df36f312a8?w=400&q=80",
      rating: 5,
      verified: true,
    },
    {
      id: 2,
      author: "Camille D.",
      location: "Paris, France",
      text: "The quality is absolutely amazing. I bought this as a gift for myself and I have zero regrets.",
      image: "https://images.unsplash.com/photo-1599839770015-53df36f312a8?w=400&q=80",
      rating: 5,
      verified: true,
    },
    {
      id: 3,
      author: "Sophie K.",
      location: "New York, US",
      text: "Gorgeous piece — the construction feels very premium. Highly recommended!",
      image: "https://images.unsplash.com/photo-1599839770015-53df36f312a8?w=400&q=80",
      rating: 5,
      verified: true,
    },
  ],
  testimonialsTitle: "What Our Clients Say",
  testimonialsSubtitle: "Join thousands of customers who have discovered the perfect blend of luxury, comfort, and safety",
  homeSectionPriority: JSON.stringify([
    { id: "hero", label: "Hero Banner", enabled: true },
    { id: "marquee", label: "Ticker Bar", enabled: true },
    { id: "latestProduct", label: "Latest Featured Product", enabled: true },
    { id: "categories", label: "Category Grid", enabled: true },
    { id: "newArrivals", label: "New Arrivals", enabled: true },
    { id: "bestSellers", label: "Best Sellers", enabled: true },
    { id: "trending", label: "Trending Collections", enabled: true },
    { id: "exclusive", label: "Limited Editions", enabled: true },
    { id: "topPicks", label: "Top Picks", enabled: true },
    { id: "sale", label: "Sale Items", enabled: true },
    { id: "clearance", label: "Clearance Outlet", enabled: true },
    { id: "customBadges", label: "Custom Badge Collections", enabled: true },
    { id: "dynamicCollections", label: "Category Sliders", enabled: true },
    { id: "testimonials", label: "Testimonials", enabled: true },
  ]),
};

export const useSiteSettingsStore = create((set, get) => ({
  ...DEFAULTS,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const response = await fetch(API_URL);
      
      // Try to parse as JSON
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Settings API returned non-JSON response:", text.substring(0, 200));
        console.error("Parse error:", parseError);
        throw new Error("Invalid JSON from settings API");
      }

      if (response.ok && data && typeof data === 'object') {
        // Ensure array fields are parsed if they come as strings, and merge defaults
        const arrayFields = ['heroImages', 'testimonials', 'homeSectionPriority', 'headerCategories'];
        arrayFields.forEach(field => {
          if (data[field]) {
            let parsedArr;
            try {
              parsedArr = typeof data[field] === 'string' ? JSON.parse(data[field]) : data[field];
              if (!Array.isArray(parsedArr)) parsedArr = [];
              
              // Smart merge to never lose newly introduced sections (like latestProduct, trending, exclusive)
              if (field === 'homeSectionPriority') {
                const defaultSections = JSON.parse(DEFAULTS.homeSectionPriority);
                const existingIds = new Set(parsedArr.map(s => s.id));
                defaultSections.forEach(ds => {
                  if (!existingIds.has(ds.id)) {
                    if (ds.id === 'latestProduct') {
                      // Insert right after marquee (usually index 1 or 2)
                      const marqueeIdx = parsedArr.findIndex(x => x.id === 'marquee');
                      if (marqueeIdx >= 0) {
                        parsedArr.splice(marqueeIdx + 1, 0, ds);
                      } else {
                        parsedArr.splice(2, 0, ds);
                      }
                    } else {
                      parsedArr.push(ds);
                    }
                  }
                });
              }
              
              data[field] = parsedArr;
            } catch (e) {
              console.warn(`Failed to parse ${field}:`, e);
              data[field] = typeof DEFAULTS[field] === 'string' ? JSON.parse(DEFAULTS[field]) : (DEFAULTS[field] || []);
            }
          }
        });
        
        set((state) => ({ ...state, ...data }));
        console.log("Store settings fetched and synced successfully");
      }
    } catch (error) {
      console.error("Failed to fetch store settings from backend:", error);
      // Silently fail and use defaults - don't break the app
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings, token) => {
    // Optimistic Update: UI ko foran update kar dein taake user ko fast feel ho
    set((state) => ({ ...state, ...newSettings }));

    // Backend me save karein
    if (token) {
      try {
        const response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(newSettings)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("Backend failed to save settings:", response.status, errText);
          throw new Error("Failed to save settings to database");
        }
        
        console.log("Settings successfully synced to database");
      } catch (error) {
        console.error("Critical error syncing settings:", error);
        // We might want to re-fetch here to reset the UI to match reality
        // get().fetchSettings();
      }
    }
  },

  resetToDefaults: () => set((state) => ({ ...state, ...DEFAULTS })),
}));