import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-['Cormorant_Garamond'] text-[150px] md:text-[180px] font-medium md:font-light text-[#d4a59a]/20 md:text-[#d4a59a]/10 leading-none mb-0">
          404
        </p>
        <p className="text-[#d4a59a] text-sm md:text-xs tracking-[0.3em] md:tracking-[0.35em] uppercase font-['Montserrat'] font-bold md:font-normal -mt-8 md:-mt-6 mb-6 md:mb-4">
          Page Not Found
        </p>
        <p className="font-['Cormorant_Garamond'] text-3xl md:text-3xl font-medium md:font-light text-[#f5f0ee]/80 md:text-[#f5f0ee]/60 mb-12 md:mb-10 max-w-sm mx-auto leading-snug">
          This page seems to have slipped away from our collection
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-3 text-xs md:text-xs tracking-[0.25em] uppercase font-['Montserrat'] font-bold md:font-normal text-[#0a0a0a] md:text-[#d4a59a] bg-[#d4a59a] md:bg-transparent border border-[#d4a59a]/30 px-10 py-4 md:px-8 md:py-4 hover:bg-[#f2c6b4] md:hover:bg-[#d4a59a]/10 transition-colors w-full sm:w-auto rounded-sm md:rounded-none shadow-lg md:shadow-none"
        >
          <ArrowLeft size={16} md:size={13} />
          Return Home
        </Link>
      </div>
    </div>
  );
}