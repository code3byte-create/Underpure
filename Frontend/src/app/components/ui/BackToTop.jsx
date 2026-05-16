import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Check agar user Product Detail Page par hai
  const isProductPage = location.pathname.startsWith("/product/");

  // Classes dynamically set karna: 
  // Agar product page hai toh mobile par left aur thora oopar (bottom-24) aayega taake fixed bar ko overalap na kare. 
  // Desktop par right par hi rahega.
  const positionClasses = isProductPage 
    ? "left-5 bottom-28 md:left-auto md:right-6 md:bottom-6" 
    : "right-5 bottom-6 md:right-6 md:bottom-6";

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed z-40 w-10 h-10 md:w-11 md:h-11 bg-[#1a1a1a] border border-[#d4a59a]/30 text-[#d4a59a] hover:bg-[#d4a59a] hover:text-[#0a0a0a] hover:border-[#d4a59a] transition-all duration-300 flex items-center justify-center shadow-lg shadow-black/40 rounded-sm md:rounded-none ${positionClasses}`}
          aria-label="Back to top"
        >
          <ArrowUp size={16} strokeWidth={1.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}