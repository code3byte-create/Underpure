import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, Star } from "lucide-react";
import { fetchProducts, fetchCategories, fetchTopReviews } from "../lib/api";
import { ProductSlider } from "../components/shop/ProductSlider";
import { TestimonialsSection } from "../components/shop/TestimonialsSection";
import { useSiteSettingsStore } from "../store/siteSettingsStore";
import { MOCK_PRODUCTS } from "../lib/mockData";

export default function HomePage() {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const featuredRef = useRef(null);

  const {
    heroHeadline,
    heroHeadlineItalic,
    heroSubheadline,
    heroBadgeText,
    heroCtaText,
    heroImages,
    heroImg,
    storePhone,
    storeName,
    testimonials,
    testimonialsTitle,
    testimonialsSubtitle,
  } = useSiteSettingsStore();

  let parsedHeroImages = [];
  try {
    parsedHeroImages = typeof heroImages === 'string' ? JSON.parse(heroImages) : (heroImages || []);
    if (!Array.isArray(parsedHeroImages)) parsedHeroImages = [];
  } catch (e) {
    parsedHeroImages = [];
  }

  let parsedTestimonials = [];
  try {
    parsedTestimonials = typeof testimonials === 'string' ? JSON.parse(testimonials) : (testimonials || []);
    if (!Array.isArray(parsedTestimonials)) parsedTestimonials = [];
  } catch (e) {
    parsedTestimonials = [];
  }

  const carouselImages = (Array.isArray(parsedHeroImages) && parsedHeroImages.length > 0)
    ? parsedHeroImages
    : [heroImg || "https://images.unsplash.com/photo-1616422285623-14c1ebbd5b5b?q=80&w=2000"];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  useEffect(() => {
    Promise.all([
      fetchProducts().catch(() => MOCK_PRODUCTS),
      fetchCategories().catch(() => []),
      fetchTopReviews().catch(() => [])
    ])
      .then(([productsData, categoriesData, reviewsData]) => {
        setAllProducts(productsData);
        setCategories(categoriesData);
        setReviews(reviewsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const newArrivals = [...safeAllProducts]
    .sort((a, b) => {
      if (a.badge === "NEW" && b.badge !== "NEW") return -1;
      if (b.badge === "NEW" && a.badge !== "NEW") return 1;
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      if (!isNaN(idA) && !isNaN(idB)) {
        if (idA !== idB) return idB - idA;
      }
      const dateA = new Date((a.created_at || a.createdAt || "").replace(" ", "T")).getTime() || 0;
      const dateB = new Date((b.created_at || b.createdAt || "").replace(" ", "T")).getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 8);

  const bestSellers = [...safeAllProducts]
    .filter((p) => p.badge === "BESTSELLER" || p.rating >= 4.7)
    .sort((a, b) => {
      if (a.badge === "BESTSELLER" && b.badge !== "BESTSELLER") return -1;
      if (b.badge === "BESTSELLER" && a.badge !== "BESTSELLER") return 1;
      return b.reviewCount - a.reviewCount;
    })
    .slice(0, 8);

  const topPicks = [...safeAllProducts]
    .filter((p) => p.badge === "EXCLUSIVE" || p.featured)
    .slice(0, 8);

  const saleItems = [...safeAllProducts]
    .filter((p) => p.badge === "SALE" || (p.originalPrice && p.originalPrice > p.price))
    .slice(0, 8);

  const trendingItems = [...safeAllProducts]
    .filter((p) => p.badge === "TRENDING" || p.rating >= 4.5)
    .slice(0, 8);

  const exclusiveItems = [...safeAllProducts]
    .filter((p) => p.badge === "EXCLUSIVE" || p.badge === "LIMITED EDITION" || p.featured)
    .slice(0, 8);

  const clearanceItems = [...safeAllProducts]
    .filter((p) => p.badge === "CLEARANCE" || (p.originalPrice && p.originalPrice >= p.price * 1.3))
    .slice(0, 8);

  const standardBadges = ["NEW", "SALE", "BESTSELLER", "EXCLUSIVE", "TRENDING", "CLEARANCE", "LIMITED EDITION", ""];
  
  const customBadges = [...new Set(
    safeAllProducts
      .map(p => p.badge)
      .filter(b => b && typeof b === 'string' && !standardBadges.includes(b.toUpperCase().trim()))
  )];

  const scrollToFeatured = () => {
    featuredRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { homeSectionPriority } = useSiteSettingsStore();
  let sectionsOrder = [];
  try {
    sectionsOrder = typeof homeSectionPriority === 'string' ? JSON.parse(homeSectionPriority) : (homeSectionPriority || []);
  } catch (e) {
    sectionsOrder = [];
  }

  const renderSection = (sectionId) => {
    switch (sectionId) {
      case "hero":
        return (
          <section key="hero" className="relative h-[100svh] min-h-[550px] md:min-h-[650px] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
            {carouselImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Hero background ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1500ms] ease-in-out ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/30 to-[#0a0a0a]/90" />
            <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto w-full pt-16 sm:pt-0">
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-[#d4a59a] text-[10px] md:text-xs tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-4 sm:mb-6">
                {heroBadgeText}
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }} className="font-['Cormorant_Garamond'] text-5xl sm:text-7xl lg:text-8xl font-medium text-[#f5f0ee] leading-tight mb-4 sm:mb-6">
                {heroHeadline}
                <br className="hidden sm:block" />
                <span className="italic text-[#d4a59a] sm:ml-3">{heroHeadlineItalic}</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="text-[#f5f0ee]/80 text-xs sm:text-sm md:text-base font-['Montserrat'] font-medium max-w-2xl mx-auto mb-8 sm:mb-10 px-2 leading-relaxed">
                {heroSubheadline}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }} className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center px-4 w-full sm:w-auto">
                <Link to="/shop" className="inline-flex items-center justify-center gap-3 bg-[#d4a59a] text-[#0a0a0a] px-6 sm:px-8 py-4 text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors duration-300 w-full sm:w-auto shadow-md">
                  {heroCtaText}
                  <ArrowRight size={18} strokeWidth={2} />
                </Link>
                <Link to="/shop?category=sets" className="inline-flex items-center justify-center gap-3 border border-[#f5f0ee]/40 text-[#f5f0ee] px-6 sm:px-8 py-4 text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:border-[#d4a59a] hover:text-[#d4a59a] hover:bg-[#d4a59a]/10 transition-colors duration-300 w-full sm:w-auto">
                  View Sets
                </Link>
              </motion.div>
            </div>
            <motion.button onClick={scrollToFeatured} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }} className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 text-[#f5f0ee]/50 hover:text-[#d4a59a] transition-colors flex flex-col items-center gap-2">
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold">Explore</span>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}><ChevronDown size={20} strokeWidth={2} /></motion.div>
            </motion.button>
          </section>
        );

      case "marquee":
        return (
          <div key="marquee" className="overflow-hidden border-y border-[#d4a59a]/10 py-3 sm:py-4 bg-[#0d0d0d] w-full flex">
            <div className="flex w-max animate-marquee flex-nowrap items-center">
              {[...Array(4)].map((_, i) =>
                ["Handcrafted Luxury", "Premium Quality", "Exclusive Designs", "Free Returns", "Secure Checkout", "New Collection"].map(
                  (text) => (
                    <span key={`${i}-${text}`} className="shrink-0 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#9a8f8c] font-['Montserrat'] font-semibold flex items-center px-4 sm:px-6">
                      {text}
                      <span className="text-[#d4a59a]/40 ml-8 sm:ml-12">✦</span>
                    </span>
                  )
                )
              )}
            </div>
          </div>
        );

      case "categories":
        const parentCategories = safeCategories.filter(c => !c.parentId);
        return (
          <section key="categories" className="py-12 sm:py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-[#d4a59a] text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2 sm:mb-3">Shop by Category</p>
              <h2 className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl font-medium text-[#f5f0ee]">Our Collections</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {parentCategories.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: i * 0.1 }}>
                  <Link to={`/shop?category=${cat.slug}`} className="group relative block overflow-hidden aspect-[2.5/1] sm:aspect-[4/5] rounded-sm shadow-md">
                    <img src={cat.image || "https://images.unsplash.com/photo-1598719830738-32b91fa649be?w=800&q=80"} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute bottom-0 left-0 h-1 bg-[#d4a59a] w-0 group-hover:w-full transition-all duration-500 z-10" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        );

      case "newArrivals":
        return (
          <section key="newArrivals" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-row items-end justify-between mb-8 sm:mb-10 border-b border-[#d4a59a]/10 pb-4">
              <div className="text-left">
                <p className="text-[#d4a59a] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2">Just In</p>
                <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">New Arrivals</h2>
              </div>
              <Link to="/shop?sort=newest" className="flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors whitespace-nowrap">
                <span className="hidden sm:inline">View All</span> <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-[#141414] animate-pulse rounded-sm" />)}
              </div>
            ) : <ProductSlider products={newArrivals} />}
          </section>
        );

      case "bestSellers":
        return (
          <section key="bestSellers" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto bg-[#0d0d0d] shadow-inner w-full">
            <div className="flex flex-row items-end justify-between mb-8 sm:mb-10 border-b border-[#d4a59a]/10 pb-4">
              <div className="text-left">
                <p className="text-[#d4a59a] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2">Favorites</p>
                <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">Best Sellers</h2>
              </div>
              <Link to="/shop?sort=rating" className="flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors whitespace-nowrap">
                <span className="hidden sm:inline">View All</span> <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-[#141414] animate-pulse rounded-sm" />)}
              </div>
            ) : <ProductSlider products={bestSellers} />}
          </section>
        );

      case "topPicks":
        return (
          <section key="topPicks" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-row items-end justify-between mb-8 sm:mb-10 border-b border-[#d4a59a]/10 pb-4">
              <div className="text-left">
                <p className="text-[#d4a59a] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2">Editor's Choice</p>
                <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">Top Picks</h2>
              </div>
              <Link to="/shop?featured=true" className="flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors whitespace-nowrap">
                <span className="hidden sm:inline">View All</span> <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-[#141414] animate-pulse rounded-sm" />)}
              </div>
            ) : <ProductSlider products={topPicks} />}
          </section>
        );

      case "sale":
        if (saleItems.length === 0) return null;
        return (
          <section key="sale" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto bg-[#0d0d0d] shadow-inner w-full">
            <div className="flex flex-row items-end justify-between mb-8 sm:mb-10 border-b border-[#d4a59a]/10 pb-4">
              <div className="text-left">
                <p className="text-[#d4a59a] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2">Limited Time</p>
                <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">On Sale</h2>
              </div>
              <Link to="/shop" className="flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors whitespace-nowrap">
                <span className="hidden sm:inline">View All</span> <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
            <ProductSlider products={saleItems} />
          </section>
        );

      case "customBadges":
        if (customBadges.length === 0) return null;
        return (
          <div key="customBadges" className="w-full">
            {customBadges.map((badgeName, idx) => {
              const badgeProducts = safeAllProducts.filter(p => p.badge === badgeName).slice(0, 12);
              if (badgeProducts.length === 0) return null;
              
              const isEven = idx % 2 === 0;
              return (
                <section key={`custom-badge-${badgeName}`} className={`py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full ${!isEven ? 'bg-[#0d0d0d] shadow-inner' : ''}`}>
                  <div className="flex flex-row items-end justify-between mb-8 sm:mb-10 border-b border-[#d4a59a]/10 pb-4">
                    <div className="text-left">
                      <p className="text-[#d4a59a] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2">Special Collection</p>
                      <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee] capitalize">{badgeName}</h2>
                    </div>
                    <Link to={`/shop`} className="flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors whitespace-nowrap">
                      <span className="hidden sm:inline">View All</span> <ArrowRight size={16} strokeWidth={2} />
                    </Link>
                  </div>
                  <ProductSlider products={badgeProducts} />
                </section>
              );
            })}
          </div>
        );

      case "dynamicCollections":
        return (
          <div key="dynamicCollections" className="w-full">
            {safeCategories.map((cat, idx) => {
              const catProducts = safeAllProducts.filter(p =>
                p.category === cat.slug ||
                p.category === String(cat.id)
              ).slice(0, 12);

              if (catProducts.length === 0) return null;
              const isEven = idx % 2 === 0;
              return (
                <section key={cat.id} className={`py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full ${!isEven ? 'bg-[#0d0d0d] shadow-inner' : ''}`}>
                  <div className="flex flex-row items-end justify-between mb-8 sm:mb-10 border-b border-[#d4a59a]/10 pb-4">
                    <div className="text-left">
                      <p className="text-[#d4a59a] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-2">{cat.subTitle || "Collection"}</p>
                      <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]">{cat.name}</h2>
                    </div>
                    <Link to={`/shop?category=${cat.slug}`} className="flex items-center gap-2 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors whitespace-nowrap">
                      <span className="hidden sm:inline">View All</span> <ArrowRight size={16} strokeWidth={2} />
                    </Link>
                  </div>
                  <ProductSlider products={catProducts} />
                </section>
              );
            })}
          </div>
        );

      // ===== NEW COLLECTION BANNER (PICTURE SIDE, TEXT SIDE, BUTTONS BOTTOM) =====
      case "latestProduct":
        {
          const sortedByNewest = [...safeAllProducts].sort((a, b) => {
            const idA = parseInt(a.id, 10);
            const idB = parseInt(b.id, 10);
            if (!isNaN(idA) && !isNaN(idB)) {
              if (idA !== idB) return idB - idA;
            }
            const dateA = new Date((a.created_at || a.createdAt || "").replace(" ", "T")).getTime() || 0;
            const dateB = new Date((b.created_at || b.createdAt || "").replace(" ", "T")).getTime() || 0;
            return dateB - dateA;
          });
          const latestProductObj = sortedByNewest.length > 0 ? sortedByNewest[0] : null;
          if (!latestProductObj) return null;

          return (
            <section key="latestProduct" className="relative border-y border-[#d4a59a]/10 py-10 sm:py-16 px-4 sm:px-6 md:py-24 w-full flex items-center justify-center overflow-hidden min-h-[400px]">
              {/* Background Image with Blur Overlay */}
              <div className="absolute inset-0 w-full h-full">
                <img src={latestProductObj.image || "https://images.unsplash.com/photo-1616422285623-14c1ebbd5b5b?q=80&w=2000"} alt={latestProductObj.name} className="w-full h-full object-cover object-center scale-105" />
                <div className="absolute inset-0 bg-[#0a0a0a]/85 md:bg-[#0a0a0a]/85 backdrop-blur-md" />
              </div>

              {/* Content */}
              <div className="relative z-10 max-w-7xl mx-auto w-full">

                {/* ====== MOBILE LAYOUT (Image Left, Text Right, Buttons Bottom) ====== */}
                <div className="md:hidden flex flex-col w-full gap-5">
                  <div className="flex flex-row items-center gap-4 sm:gap-5 w-full">

                    {/* Left: Image */}
                    <div className="w-[45%] shrink-0">
                      <div className="aspect-[4/5] rounded-sm overflow-hidden border border-[#d4a59a]/30 shadow-2xl relative">
                        <img src={latestProductObj.image || "https://images.unsplash.com/photo-1616422285623-14c1ebbd5b5b?q=80&w=800"} alt={latestProductObj.name} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    {/* Right: Details */}
                    <div className="w-[55%] flex flex-col items-start text-left space-y-2.5">
                      <span className="inline-block bg-[#d4a59a]/20 border border-[#d4a59a]/40 text-[#d4a59a] px-2 py-1 text-[8px] uppercase tracking-[0.2em] font-['Montserrat'] font-bold rounded-sm backdrop-blur-sm">
                        New Collection
                      </span>
                      <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-medium text-[#f5f0ee] leading-tight drop-shadow-md">
                        {latestProductObj.name}
                      </h2>
                      <p className="text-[#e6dfdc]/80 text-[10px] sm:text-xs font-['Montserrat'] leading-snug drop-shadow-sm line-clamp-3">
                        {latestProductObj.description || "A soft and elegant luxury apparel handcrafted for ladies."}
                      </p>
                      <div className="font-['Cormorant_Garamond'] text-xl text-[#d4a59a] font-medium drop-shadow-md">
                        Rs. {Number(latestProductObj.price).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full mt-1">
                    <Link to={`/product/${latestProductObj.slug}`} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#d4a59a] text-[#0a0a0a] px-4 py-3.5 text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm shadow-xl">
                      Shop Now <ArrowRight size={14} strokeWidth={2} />
                    </Link>
                    <Link to="/shop" className="flex-1 inline-flex items-center justify-center gap-2 border border-[#d4a59a]/40 text-[#f5f0ee] px-4 py-3.5 text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:text-[#d4a59a] transition-colors rounded-sm backdrop-blur-sm bg-black/20">
                      View Collection
                    </Link>
                  </div>
                </div>

                {/* ====== DESKTOP LAYOUT (Text Left, Image Right) ====== */}
                <div className="hidden md:flex flex-row items-center gap-10 lg:gap-16 w-full text-left">
                  <div className="flex-1 space-y-6">
                    <span className="inline-block bg-[#d4a59a]/20 border border-[#d4a59a]/40 text-[#d4a59a] px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-['Montserrat'] font-bold rounded-sm backdrop-blur-sm">
                      New Collection
                    </span>
                    <h2 className="font-['Cormorant_Garamond'] text-5xl lg:text-6xl font-medium text-[#f5f0ee] leading-tight drop-shadow-md">
                      {latestProductObj.name}
                    </h2>
                    <p className="text-[#e6dfdc]/80 text-base font-['Montserrat'] leading-relaxed drop-shadow-sm max-w-lg">
                      {latestProductObj.description || "A soft and elegant luxury apparel handcrafted for ladies."}
                    </p>
                    <div className="font-['Cormorant_Garamond'] text-3xl text-[#d4a59a] font-medium drop-shadow-md">
                      Rs. {Number(latestProductObj.price).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                    </div>
                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link to={`/product/${latestProductObj.slug}`} className="inline-flex items-center justify-center gap-2 bg-[#d4a59a] text-[#0a0a0a] px-6 py-3.5 text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm shadow-xl">
                        Shop Now <ArrowRight size={14} strokeWidth={2} />
                      </Link>
                      <Link to="/shop" className="inline-flex items-center justify-center gap-2 border border-[#d4a59a]/40 text-[#f5f0ee] px-6 py-3.5 text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:border-[#d4a59a] hover:text-[#d4a59a] hover:bg-[#d4a59a]/10 transition-colors rounded-sm backdrop-blur-sm bg-black/20">
                        View Collection
                      </Link>
                    </div>
                  </div>
                  <div className="flex-1 w-full max-w-md lg:max-w-lg">
                    <div className="aspect-[4/5] rounded-sm overflow-hidden border border-[#d4a59a]/30 shadow-2xl relative group">
                      <img src={latestProductObj.image || "https://images.unsplash.com/photo-1616422285623-14c1ebbd5b5b?q=80&w=800"} alt={latestProductObj.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                </div>

              </div>
            </section>
          );
        }

      case "testimonials":
        return (
          <div className="w-full overflow-hidden" key="testimonials">
            <TestimonialsSection
              testimonials={parsedTestimonials}
              title={testimonialsTitle}
              subtitle={testimonialsSubtitle}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0a0a0a] relative overflow-x-hidden w-full min-h-screen">
      {sectionsOrder
        .filter(s => s.enabled !== false)
        .map(section => renderSection(section.id))
      }

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}