import { Link } from "react-router";
import { Instagram, Facebook, Mail, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";
import { fetchCategories } from "../../lib/api";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    fetchCategories()
      .then((data) => setDbCategories(data.filter((c) => !c.parentId)))
      .catch(console.error);
  }, []);

  // Mobile dropdown states
  const [shopOpen, setShopOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const {
    storeName,
    storeEmail,
    storePhone,
    footerTagline,
    newsletterTitle,
    newsletterSub,
    instagramUrl,
    facebookUrl,
  } = useSiteSettingsStore();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#0d0d0d] border-t border-[#d4a59a]/15 w-full overflow-hidden">
      {/* Newsletter section */}
      <div className="border-b border-[#d4a59a]/15 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16 text-center w-full">
          <p className="text-[10px] md:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] uppercase text-[#d4a59a] mb-3 md:mb-4 font-['Montserrat'] font-bold md:font-normal">
            The {storeName} Circle
          </p>
          <h3 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-4xl font-medium md:font-light text-[#f5f0ee] mb-3 md:mb-4 px-2">
            {newsletterTitle}
          </h3>
          <p className="text-[#9a8f8c] text-xs sm:text-sm max-w-md mx-auto mb-6 sm:mb-8 font-['Montserrat'] leading-relaxed font-medium md:font-normal px-2">
            {newsletterSub}
          </p>
          {subscribed ? (
            <p className="text-[#d4a59a] text-xs sm:text-sm tracking-[0.1em] font-['Montserrat'] font-semibold py-3 bg-[#d4a59a]/10 max-w-[90%] sm:max-w-sm mx-auto rounded-sm border border-[#d4a59a]/20">
              ✦ Welcome to the circle
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full max-w-[90%] sm:max-w-md mx-auto gap-3 sm:gap-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 bg-[#111] sm:bg-transparent border border-[#d4a59a]/30 sm:border-[#d4a59a]/20 sm:border-r-0 px-4 sm:px-5 py-3.5 sm:py-3 text-xs sm:text-sm text-[#f5f0ee] placeholder-[#9a8f8c] focus:outline-none focus:border-[#d4a59a]/60 font-['Montserrat'] w-full rounded-sm sm:rounded-none shadow-inner sm:shadow-none"
              />
              <button
                type="submit"
                className="bg-[#d4a59a] text-[#0a0a0a] px-6 sm:px-8 py-3.5 sm:py-3 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold sm:font-semibold hover:bg-[#f2c6b4] transition-colors w-full sm:w-auto rounded-sm sm:rounded-none shadow-md sm:shadow-none"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-14 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-4 md:gap-10 w-full">

          {/* Brand */}
          <div className="md:col-span-2 mb-6 sm:mb-8 md:mb-0 text-center md:text-left border-b border-[#d4a59a]/10 pb-6 sm:pb-8 md:border-none md:pb-0 w-full">
            <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-2xl font-medium md:font-light tracking-[0.2em] sm:tracking-[0.3em] uppercase text-[#f5f0ee] mb-3 md:mb-4">
              {storeName}
            </p>
            <p className="text-[#9a8f8c] text-[11px] sm:text-xs leading-relaxed mb-3 md:mb-4 font-['Montserrat'] max-w-[280px] sm:max-w-sm mx-auto md:mx-0 font-medium md:font-normal">
              {footerTagline}
            </p>
            {storePhone && (
              <p className="text-[#9a8f8c] text-[11px] sm:text-xs leading-relaxed mb-5 md:mb-6 font-['Montserrat'] font-medium md:font-normal">
                <a href={`tel:${storePhone.replace(/\s+/g, '')}`} className="hover:text-[#d4a59a] transition-colors">{storePhone}</a>
              </p>
            )}
            <div className="flex gap-4 sm:gap-6 md:gap-5 justify-center md:justify-start">
              <a href={instagramUrl} className="text-[#f5f0ee]/80 md:text-[#9a8f8c] hover:text-[#d4a59a] bg-[#111] md:bg-transparent p-2.5 sm:p-3 md:p-0 rounded-full md:rounded-none transition-colors border border-[#d4a59a]/20 md:border-none" aria-label="Instagram">
                <Instagram size={18} className="sm:w-[22px] sm:h-[22px] md:w-[20px] md:h-[20px]" strokeWidth={1.5} />
              </a>
              <a href={facebookUrl} className="text-[#f5f0ee]/80 md:text-[#9a8f8c] hover:text-[#d4a59a] bg-[#111] md:bg-transparent p-2.5 sm:p-3 md:p-0 rounded-full md:rounded-none transition-colors border border-[#d4a59a]/20 md:border-none" aria-label="Facebook">
                <Facebook size={18} className="sm:w-[22px] sm:h-[22px] md:w-[20px] md:h-[20px]" strokeWidth={1.5} />
              </a>
              <a href={`mailto:${storeEmail}`} className="text-[#f5f0ee]/80 md:text-[#9a8f8c] hover:text-[#d4a59a] bg-[#111] md:bg-transparent p-2.5 sm:p-3 md:p-0 rounded-full md:rounded-none transition-colors border border-[#d4a59a]/20 md:border-none" aria-label="Email">
                <Mail size={18} className="sm:w-[22px] sm:h-[22px] md:w-[20px] md:h-[20px]" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Shop (Dropdown on mobile) */}
          <div className="border-b border-[#d4a59a]/10 md:border-none py-4 sm:py-5 md:py-0 overflow-hidden w-full">
            <button
              onClick={() => setShopOpen(!shopOpen)}
              className="flex justify-between items-center w-full md:cursor-default md:pointer-events-none outline-none py-1"
            >
              <p className="text-[11px] sm:text-xs md:text-[10px] tracking-[0.2em] uppercase text-[#f5f0ee] font-['Montserrat'] font-bold md:font-semibold">
                Shop
              </p>
              <ChevronDown size={18} className={`sm:w-[20px] sm:h-[20px] text-[#9a8f8c] transition-transform duration-500 md:hidden ${shopOpen ? "rotate-180" : ""}`} />
            </button>
            <ul className={`space-y-3 sm:space-y-4 md:space-y-3 overflow-hidden transition-all duration-500 ease-in-out md:max-h-[500px] md:opacity-100 md:mt-5 ${shopOpen ? "max-h-[300px] opacity-100 mt-4 sm:mt-5" : "max-h-0 opacity-0 mt-0"}`}>
              <li>
                <Link to="/shop" className="text-xs sm:text-sm md:text-xs text-[#9a8f8c] hover:text-[#d4a59a] font-medium md:font-normal transition-colors font-['Montserrat'] tracking-wide inline-block py-1">
                  All Pieces
                </Link>
              </li>
              {dbCategories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/shop?category=${cat.slug}`} className="text-xs sm:text-sm md:text-xs text-[#9a8f8c] hover:text-[#d4a59a] font-medium md:font-normal transition-colors font-['Montserrat'] tracking-wide inline-block py-1">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help (Dropdown on mobile) */}
          <div className="border-b border-[#d4a59a]/10 md:border-none py-4 sm:py-5 md:py-0 overflow-hidden w-full">
            <button
              onClick={() => setHelpOpen(!helpOpen)}
              className="flex justify-between items-center w-full md:cursor-default md:pointer-events-none outline-none py-1"
            >
              <p className="text-[11px] sm:text-xs md:text-[10px] tracking-[0.2em] uppercase text-[#f5f0ee] font-['Montserrat'] font-bold md:font-semibold">
                Help
              </p>
              <ChevronDown size={18} className={`sm:w-[20px] sm:h-[20px] text-[#9a8f8c] transition-transform duration-500 md:hidden ${helpOpen ? "rotate-180" : ""}`} />
            </button>
            <ul className={`space-y-3 sm:space-y-4 md:space-y-3 overflow-hidden transition-all duration-500 ease-in-out md:max-h-[500px] md:opacity-100 md:mt-5 ${helpOpen ? "max-h-[300px] opacity-100 mt-4 sm:mt-5" : "max-h-0 opacity-0 mt-0"}`}>
              {[
                { label: "Size Guide", href: "/size-guide" },
                { label: "Shipping & Returns", href: "/shipping-returns" },
                { label: "Care Instructions", href: "/care-instructions" },
                { label: "FAQ", href: "/faq" },
                { label: "Contact Us", href: "/contact-us" }
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-xs sm:text-sm md:text-xs text-[#9a8f8c] hover:text-[#d4a59a] font-medium md:font-normal transition-colors font-['Montserrat'] tracking-wide inline-block py-1">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#d4a59a]/20 md:border-[#d4a59a]/10 mt-8 sm:mt-10 md:mt-10 pt-6 sm:pt-8 md:pt-6 flex flex-col md:flex-row justify-between items-center gap-5 sm:gap-6 md:gap-4 text-center md:text-left w-full">
          <p className="text-[#9a8f8c] text-[10px] sm:text-[11px] md:text-[10px] font-['Montserrat'] tracking-wide font-medium md:font-normal">
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 items-center w-full md:w-auto">
            {[
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Terms of Service", href: "/terms-service" },
              { label: "Cookie Policy", href: "/cookie-policy" }
            ].map((item) => (
              <Link key={item.label} to={item.href} className="text-[10px] sm:text-[11px] md:text-[10px] text-[#9a8f8c] hover:text-[#d4a59a] transition-colors font-['Montserrat'] font-medium md:font-normal">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}