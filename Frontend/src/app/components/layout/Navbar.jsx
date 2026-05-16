import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ShoppingBag, Search, User, Menu, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";
import { fetchProducts, fetchCategories } from "../../lib/api";
import { MOCK_PRODUCTS } from "../../lib/mockData";
import logoImg from "../../../assets/logo-removebg-preview.png";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  const [expandedCategory, setExpandedCategory] = useState(null);

  const { totalItems, toggleCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { announcementText, announcementVisible, storeName, headerCategories } = useSiteSettingsStore();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 280);

  const cartCount = totalItems();

  // ===== CATEGORIES SCROLL LOGIC =====

  useEffect(() => {
    fetchProducts().then(setAllProducts).catch(() => setAllProducts(MOCK_PRODUCTS));
    fetchCategories().then(setDbCategories).catch(console.error);
  }, []);

  const [navLinks, setNavLinks] = useState([{ href: "/shop", label: "Shop All" }]);

  useEffect(() => {
    if (!dbCategories.length) return;

    let selectedHeaderIds = headerCategories;
    if (typeof selectedHeaderIds === "string") {
      try { selectedHeaderIds = JSON.parse(selectedHeaderIds); } catch (e) { selectedHeaderIds = []; }
    }
    if (!Array.isArray(selectedHeaderIds)) selectedHeaderIds = [];
    const pinnedIds = selectedHeaderIds.map(String);

    let displayCats = [];
    if (pinnedIds.length > 0) {
      displayCats = dbCategories.filter((c) => pinnedIds.includes(String(c.id)) && !c.parentId);
    } else {
      displayCats = dbCategories.filter((c) => !c.parentId);
    }

    const sortByPriority = (arr) =>
      [...arr].sort((a, b) => {
        const pa = a.priority > 0 ? a.priority : Infinity;
        const pb = b.priority > 0 ? b.priority : Infinity;
        return pa - pb;
      });

    const builtLinks = sortByPriority(displayCats).map((cat) => {
      const subCats = dbCategories.filter((c) => String(c.parentId) === String(cat.id));
      return {
        label: cat.name,
        href: `/shop?category=${cat.slug}`,
        subLinks: subCats.length > 0
          ? sortByPriority(subCats).map((sub) => ({
              href: `/shop?category=${sub.slug}`,
              label: sub.name,
            }))
          : null,
      };
    });

    setNavLinks([{ href: "/shop", label: "Shop All" }, ...builtLinks]);
  }, [dbCategories, headerCategories]);



  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const q = debouncedQuery.toLowerCase();
    const results = allProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 5);
    setSearchResults(results);
  }, [debouncedQuery, allProducts]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setExpandedCategory(null);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen, searchOpen]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const toggleAccordion = (label) => {
    setExpandedCategory(expandedCategory === label ? null : label);
  };

  return (
    <>
      <style>{`
        @keyframes marquee-announcement {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-announcement {
          animation: marquee-announcement 25s linear infinite;
        }
        @keyframes marquee-categories {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-categories {
          animation: marquee-categories 120s linear infinite;
        }
        .pause-on-hover:hover {
          animation-play-state: paused;
        }
        /* Global CSS trick to hide scrollbars on sliders but keep them scrollable */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="fixed top-0 left-0 right-0 w-full z-50 flex flex-col">
        {/* ====== AUTO SCROLLING ANNOUNCEMENT BAR ====== */}
        {announcementVisible && (
          <div className="bg-[#8b4f5c] text-[#f5f0ee] py-2 sm:py-2.5 px-0 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] w-full shadow-md font-semibold sm:font-normal overflow-hidden flex whitespace-nowrap">
            <div className="flex w-max animate-marquee-announcement items-center">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="flex items-center px-4 sm:px-8">
                  {announcementText}
                  <span className="inline-block px-4 sm:px-8 opacity-50">✦</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <header
          className={`w-full transition-all duration-500 flex flex-col ${isScrolled ? "bg-[#0a0a0a]/95 backdrop-blur-lg shadow-lg border-b border-[#d4a59a]/15" : "bg-[#0a0a0a] border-b border-[#d4a59a]/5"
            }`}
        >
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">

            {/* ====== TIER 1: TOP BAR (Logo & Icons) ====== */}
            <div className="flex items-center justify-between h-16 md:h-20 lg:h-[88px] w-full">

              {/* LEFT SIDE: Hamburger */}
              <div className="flex-1 flex items-center justify-start">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden text-[#f5f0ee]/80 hover:text-[#d4a59a] py-2 pr-2 -ml-1 transition-all active:scale-95"
                  aria-label="Open menu"
                >
                  <Menu size={24} strokeWidth={1.5} />
                </button>
              </div>

              {/* CENTER SIDE: Logo */}
              <div className="flex-shrink-0 flex items-center justify-center px-2">
                <Link
                  to="/"
                  className="font-['Cormorant_Garamond'] text-2xl md:text-3xl lg:text-4xl font-semibold tracking-[0.1em] sm:tracking-[0.25em] uppercase text-[#f5f0ee] hover:text-[#d4a59a] transition-colors duration-500 whitespace-nowrap flex items-center gap-2 sm:gap-3"
                >
                  <img src={logoImg} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                  {storeName}
                </Link>
              </div>

              {/* RIGHT SIDE: Icons */}
              <div className="flex-1 flex items-center justify-end gap-3 sm:gap-5 h-full">
                <button onClick={() => setSearchOpen(true)} className="text-[#f5f0ee]/80 hover:text-[#d4a59a] transition-all duration-300">
                  <Search size={20} className="sm:w-5 sm:h-5 lg:w-[22px] lg:h-[22px]" strokeWidth={1.5} />
                </button>

                <Link to={isAuthenticated ? "/account" : "/auth"} className="hidden sm:block text-[#f5f0ee]/80 hover:text-[#d4a59a] transition-all duration-300">
                  <User size={20} className="lg:w-[22px] lg:h-[22px]" strokeWidth={1.5} />
                </Link>

                <button onClick={toggleCart} className="text-[#f5f0ee]/80 hover:text-[#d4a59a] relative transition-all duration-300">
                  <ShoppingBag size={20} className="sm:w-5 sm:h-5 lg:w-[22px] lg:h-[22px]" strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#d4a59a] text-[#0a0a0a] text-[9px] font-bold flex items-center justify-center font-['Montserrat'] shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ====== TIER 2: BOTTOM BAR (Categories - Desktop Only) ====== */}
            <div className="hidden lg:flex items-center relative h-[56px] border-t border-[#d4a59a]/10 w-full">
              <div className="w-full h-full relative flex items-center overflow-visible" style={{ clipPath: 'inset(-2000px 0px -2000px 0px)' }}>
                <div className="flex items-center h-full animate-marquee-categories pause-on-hover w-max">
                  
                  {[...Array(6)].map((_, i) => (
                    <div key={`cat-set-${i}`} className="flex items-center h-full gap-8 xl:gap-12 pr-8 xl:pr-12">
                      {navLinks.map((link, idx) => (
                        <div key={`link-${i}-${idx}`} className="h-full flex items-center relative group shrink-0 whitespace-nowrap">
                          <Link
                            to={link.href}
                            className="whitespace-nowrap text-[11px] xl:text-xs tracking-[0.2em] uppercase text-[#f5f0ee]/80 group-hover:text-[#d4a59a] transition-colors duration-300 font-['Montserrat'] flex items-center gap-1.5 h-full relative after:content-[''] after:absolute after:bottom-3 after:left-0 after:w-0 after:h-[1px] after:bg-[#d4a59a] group-hover:after:w-full after:transition-all after:duration-300"
                          >
                            {link.label}
                            {link.subLinks && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300 text-[#9a8f8c] group-hover:text-[#d4a59a]" />}
                          </Link>

                          {link.subLinks && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-[100]">
                              <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#d4a59a]/20 shadow-2xl p-5 min-w-[200px] flex flex-col gap-4 rounded-sm relative overflow-hidden text-center">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4a59a]/50 to-transparent"></div>
                                {link.subLinks.map((sub) => (
                                  <Link
                                    key={sub.label}
                                    to={sub.href}
                                    className="whitespace-nowrap text-[10px] tracking-[0.15em] uppercase text-[#9a8f8c] hover:text-[#d4a59a] hover:translate-x-1 transition-all duration-300 font-['Montserrat'] block"
                                  >
                                    {sub.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                </div>
              </div>
            </div>

          </div>
        </header>
      </div>

      {/* Spacer div to push content below the fixed header */}
      <div className={`w-full ${announcementVisible ? "h-[84px] sm:h-[88px] lg:h-[184px]" : "h-16 md:h-20 lg:h-[144px]"}`}></div>

      {/* ===== MOBILE SIDEBAR MENU ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 h-[100dvh] w-[62%] max-w-[240px] bg-[#0a0a0a] border-r border-[#d4a59a]/15 z-[70] lg:hidden flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#d4a59a]/10 bg-gradient-to-b from-[#111] to-transparent shrink-0">
                <div className="flex items-center gap-2">
                  <img src={logoImg} alt="Logo" className="w-6 h-6 object-contain" />
                  <span className="font-['Cormorant_Garamond'] text-xl tracking-[0.1em] font-semibold uppercase text-[#d4a59a]">
                    {storeName}
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-[#9a8f8c] hover:text-[#f5f0ee] transition-all p-1.5 -mr-1 bg-[#111] rounded-sm border border-[#d4a59a]/10">
                  <X size={17} strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex flex-col px-4 py-3 gap-2.5 overflow-y-auto overscroll-contain flex-1 no-scrollbar">
                {navLinks.map((link) => (
                  <div key={link.label} className="w-full">
                    <div className="flex items-center justify-between w-full border-b border-[#d4a59a]/5 pb-1.5">
                      <Link
                        to={link.href}
                        onClick={() => !link.subLinks && setMobileMenuOpen(false)}
                        className={`text-lg font-['Cormorant_Garamond'] font-medium py-1.5 transition-all duration-300 flex-1 ${expandedCategory === link.label ? "text-[#d4a59a] italic" : "text-[#f5f0ee]"}`}
                      >
                        {link.label}
                      </Link>

                      {link.subLinks && (
                        <button onClick={() => toggleAccordion(link.label)} className="p-2 -mr-2 text-[#9a8f8c] transition-colors">
                          <ChevronDown size={20} strokeWidth={1} className={`transition-transform duration-300 ${expandedCategory === link.label ? "rotate-180 text-[#d4a59a]" : ""}`} />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {link.subLinks && expandedCategory === link.label && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="flex flex-col gap-3 pl-3 pt-3 pb-1.5 border-l border-[#d4a59a]/20 ml-2 mt-1 relative">
                            {link.subLinks.map((sub) => (
                              <Link
                                key={sub.label} to={sub.href} onClick={() => setMobileMenuOpen(false)}
                                className="text-base font-['Cormorant_Garamond'] font-medium text-[#9a8f8c] py-0.5 flex items-center gap-2.5 transition-all"
                              >
                                <span className="w-2 h-[1px] bg-[#d4a59a]/40 block"></span>
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </nav>

              <div className="px-4 pb-6 pt-3 bg-gradient-to-t from-[#111] to-transparent shrink-0">
                <Link
                  to={isAuthenticated ? "/account" : "/auth"} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between border-t border-[#d4a59a]/20 pt-4 pb-1.5"
                >
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8f8c] font-['Montserrat'] font-semibold">
                    {isAuthenticated ? "My Account" : "Sign In"}
                  </span>
                  <User size={16} strokeWidth={1.5} className="text-[#9a8f8c]" />
                </Link>

                {(user?.isAdmin || user?.role === 'admin' || user?.is_admin) && (
                  <Link
                    to="/admin" onClick={() => setMobileMenuOpen(false)}
                    className="text-[9px] tracking-[0.2em] uppercase text-[#0a0a0a] bg-[#d4a59a] mt-3 px-4 py-3 text-center font-bold block rounded-sm shadow-md"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== SEARCH OVERLAY ===== */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] bg-[#0a0a0a]/95 backdrop-blur-xl flex items-start justify-center pt-20 md:pt-32 px-4 sm:px-6 overflow-y-auto no-scrollbar"
            onClick={(e) => e.target === e.currentTarget && closeSearch()}
          >
            <div className="w-full max-w-3xl mb-10">
              <div className="relative">
                <input
                  ref={searchInputRef} autoFocus
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full bg-transparent border-b border-[#d4a59a]/40 focus:border-[#d4a59a] text-[#f5f0ee] text-3xl sm:text-5xl font-['Cormorant_Garamond'] py-3 sm:py-4 outline-none transition-colors pr-10 sm:pr-12"
                />
                <button onClick={closeSearch} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9a8f8c] p-2 transition-transform active:rotate-90">
                  <X size={24} className="sm:w-7 sm:h-7" strokeWidth={1.5} />
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-6 md:mt-10 space-y-3 sm:space-y-4 pb-10">
                  {searchResults.map((p) => (
                    <Link key={p.id} to={`/product/${p.slug}`} onClick={closeSearch} className="flex items-center gap-4 bg-[#111] p-3 rounded-sm border border-[#d4a59a]/10">
                      <div className="w-14 h-16 sm:w-16 sm:h-20 bg-[#1a1a1a] shrink-0 rounded-sm border border-[#d4a59a]/20 overflow-hidden"><img src={p.image} className="w-full h-full object-cover" /></div>
                      <div>
                        <p className="text-[#f5f0ee] font-['Cormorant_Garamond'] text-lg sm:text-xl font-medium">{p.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] uppercase tracking-[0.2em] mt-1">{p.category}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}