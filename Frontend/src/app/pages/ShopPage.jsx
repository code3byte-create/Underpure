import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProducts, fetchWishlist, fetchCategories } from "../lib/api";
import { ProductCard } from "../components/shop/ProductCard";
import { useAuthStore } from "../store/authStore";
import { MOCK_PRODUCTS } from "../lib/mockData";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Low to High" },
  { value: "price_desc", label: "High to Low" },
  { value: "rating", label: "Best Rated" },
];

function sortProducts(products, sort) {
  const sorted = [...products];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { isAuthenticated, token } = useAuthStore();

  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const currentCategoryLabel = category === "all"
    ? "All Pieces"
    : categories.find((c) => String(c.id) === String(category) || c.slug === category)?.name || "Category";

  useEffect(() => {
    let metaTag = document.querySelector('meta[name="viewport"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = "viewport";
      document.head.appendChild(metaTag);
    }
    metaTag.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([products, cats]) => {
        setAllProducts(products);
        setCategories(cats);
      })
      .catch(() => setAllProducts(MOCK_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWishlist(token).then(setWishlistedIds).catch(console.error);
    }
  }, [isAuthenticated, token]);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, categories]);

  const scrollCategories = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.7; // scroll by 70% of visible width
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 400);
    }
  };

  const setCategory = useCallback(
    (cat) => {
      const params = new URLSearchParams(searchParams);
      if (cat === "all") params.delete("category");
      else params.set("category", cat);
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const setSort = useCallback(
    (s) => {
      const params = new URLSearchParams(searchParams);
      params.set("sort", s);
      setSearchParams(params);
      setSortOpen(false);
    },
    [searchParams, setSearchParams]
  );

  const displayed = sortProducts(
    allProducts.filter((p) => {
      const catObj = categories.find((c) => c.slug === p.category);
      const isSubcategoryMatch = catObj && catObj.parentId && categories.find((parent) => parent.id === catObj.parentId)?.slug === category;
      const matchCat = category === "all" || p.category === category || isSubcategoryMatch;
      const matchSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    }),
    sort
  );

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label || "Sort";

  return (
    <div className="bg-[#0a0a0a] min-h-screen overflow-x-hidden w-full">
      {/* Header */}
      <div className="border-b border-[#d4a59a]/10 bg-[#0d0d0d] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-16 text-center sm:text-left w-full">
          {search ? (
            <>
              <p className="text-[#d4a59a] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-['Montserrat'] mb-2 sm:mb-3 font-bold">
                Search results for
              </p>
              <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-[#f5f0ee] break-words">
                "{search}"
              </h1>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 md:gap-2 text-[#d4a59a] text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] uppercase font-['Montserrat'] mb-2 sm:mb-3 font-bold">
                <Link to="/" className="hover:text-[#f5f0ee] transition-colors">Home</Link>
                <span className="text-[#d4a59a]/40">/</span>
                {category === "all" ? (
                  <span className="text-[#f5f0ee]">Collection</span>
                ) : (
                  <>
                    <Link to="/shop" className="hover:text-[#f5f0ee] transition-colors">Collection</Link>
                    <span className="text-[#d4a59a]/40">/</span>
                    <span className="text-[#f5f0ee] truncate max-w-[150px] sm:max-w-none">{currentCategoryLabel}</span>
                  </>
                )}
              </div>

              <h1 className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-[#f5f0ee] leading-tight">
                {currentCategoryLabel}
              </h1>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-10 border-b border-[#d4a59a]/10 pb-5 sm:pb-6 relative group">
          {/* Category filters (desktop) */}
          <div className="hidden md:flex items-center w-full max-w-3xl">
            <div className="w-8 shrink-0 flex justify-center">
              <AnimatePresence>
                {canScrollLeft && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollCategories("left")}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#d4a59a]/25 text-[#d4a59a] hover:bg-[#d4a59a] hover:text-[#0a0a0a] hover:border-[#d4a59a] transition-all duration-200 shadow-sm"
                    aria-label="Scroll categories left"
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div 
              ref={scrollRef} 
              onScroll={checkScroll}
              className="flex items-center gap-8 overflow-x-auto scrollbar-hide flex-1 px-2 snap-x snap-mandatory"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none'
              }}
            >
              <button
                onClick={() => setCategory("all")}
                className={`snap-start text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold transition-colors pb-1.5 whitespace-nowrap shrink-0 ${category === "all" ? "text-[#d4a59a] border-b-2 border-[#d4a59a]" : "text-[#9a8f8c] hover:text-[#f5f0ee] border-b-2 border-transparent"}`}
              >
                All Pieces
              </button>
              {[...categories]
                .filter(c => !c.parentId)
                .sort((a, b) => {
                  const pa = a.priority > 0 ? a.priority : Infinity;
                  const pb = b.priority > 0 ? b.priority : Infinity;
                  return pa - pb;
                })
                .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`snap-start text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold transition-colors pb-1.5 whitespace-nowrap shrink-0 ${category === cat.slug ? "text-[#d4a59a] border-b-2 border-[#d4a59a]" : "text-[#9a8f8c] hover:text-[#f5f0ee] border-b-2 border-transparent"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="w-8 shrink-0 flex justify-center">
              <AnimatePresence>
                {canScrollRight && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollCategories("right")}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#d4a59a]/25 text-[#d4a59a] hover:bg-[#d4a59a] hover:text-[#0a0a0a] hover:border-[#d4a59a] transition-all duration-200 shadow-sm"
                    aria-label="Scroll categories right"
                  >
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-3 sm:gap-4">
            {/* Mobile filter button */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 border border-[#d4a59a]/30 rounded-sm text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] hover:text-[#d4a59a] transition-colors bg-[#111]"
            >
              <SlidersHorizontal size={14} strokeWidth={1.5} className="sm:w-4 sm:h-4" />
              Filters
            </button>

            {/* Results count + Sort */}
            <div className="flex items-center gap-3 sm:gap-6 flex-1 md:flex-none justify-end">
              <span className="text-[10px] sm:text-xs md:text-sm text-[#9a8f8c] font-['Montserrat'] hidden sm:block font-medium">
                {displayed.length} {displayed.length === 1 ? "piece" : "pieces"}
              </span>
              {/* Sort dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 px-3 sm:px-0 py-3 sm:py-0 border border-[#d4a59a]/30 sm:border-0 bg-[#111] sm:bg-transparent rounded-sm sm:rounded-none text-[10px] sm:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] sm:text-[#9a8f8c] sm:hover:text-[#f5f0ee] transition-colors"
                >
                  <span className="truncate">{currentSortLabel}</span>
                  <ChevronDown size={14} className={`sm:w-4 sm:h-4 transition-transform shrink-0 ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-full min-w-[160px] sm:w-56 bg-[#1a1a1a] sm:bg-[#111] border border-[#d4a59a]/20 z-30 shadow-xl rounded-sm"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSort(opt.value)}
                          className={`w-full text-left px-4 py-3 sm:px-5 sm:py-3.5 text-[10px] sm:text-xs font-['Montserrat'] tracking-wide transition-colors uppercase ${sort === opt.value ? "text-[#d4a59a] bg-[#d4a59a]/10 font-bold" : "text-[#9a8f8c] hover:text-[#f5f0ee] hover:bg-[#2a2a2a] sm:hover:bg-[#1a1a1a]"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-[#141414] animate-pulse rounded-sm" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 sm:py-28 md:py-32 px-4 border border-[#d4a59a]/10 bg-[#0d0d0d] rounded-sm shadow-inner mx-auto w-full">
            <p className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl font-medium text-[#f5f0ee]/50 mb-3 sm:mb-4">
              No pieces found
            </p>
            <p className="text-xs sm:text-sm md:text-base text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-10 font-medium">
              Try adjusting your filters or search
            </p>
            <button
              onClick={() => setCategory("all")}
              className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] text-[#d4a59a] border border-[#d4a59a]/30 px-6 sm:px-10 py-3.5 sm:py-4 hover:bg-[#d4a59a]/10 transition-colors font-bold rounded-sm"
            >
              View All Pieces
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {displayed.map((product, i) => (
              <ProductCard key={product.id} product={product} wishlistedIds={wishlistedIds} onWishlistChange={setWishlistedIds} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setFiltersOpen(false)} />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 h-[100dvh] w-[62%] max-w-[240px] bg-[#111] border-r border-[#d4a59a]/15 z-50 flex flex-col shadow-2xl md:hidden overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-[#d4a59a]/15 bg-[#0a0a0a] shrink-0">
                <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee]">
                  Filters
                </p>
                <button onClick={() => setFiltersOpen(false)} className="text-[#9a8f8c] hover:text-[#f5f0ee] p-1.5 bg-[#1a1a1a] rounded-sm border border-[#d4a59a]/20 transition-all hover:rotate-90 duration-300">
                  <X size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto overscroll-contain no-scrollbar">
                <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#d4a59a] font-['Montserrat'] font-bold mb-3 sm:mb-4">
                  Category
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => { setCategory("all"); setFiltersOpen(false); }}
                    className={`text-left py-2.5 px-3.5 rounded-sm text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-semibold transition-colors ${category === "all" ? "text-[#d4a59a] bg-[#d4a59a]/10 border border-[#d4a59a]/20" : "text-[#9a8f8c] hover:text-[#f5f0ee] border border-transparent"}`}
                  >
                    All Pieces
                  </button>
                  {[...categories]
                    .filter(c => !c.parentId)
                    .sort((a, b) => {
                      const pa = a.priority > 0 ? a.priority : Infinity;
                      const pb = b.priority > 0 ? b.priority : Infinity;
                      return pa - pb;
                    })
                    .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setCategory(cat.slug); setFiltersOpen(false); }}
                      className={`text-left py-2.5 px-3.5 rounded-sm text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-semibold transition-colors ${category === cat.slug ? "text-[#d4a59a] bg-[#d4a59a]/10 border border-[#d4a59a]/20" : "text-[#9a8f8c] hover:text-[#f5f0ee] border border-transparent"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}