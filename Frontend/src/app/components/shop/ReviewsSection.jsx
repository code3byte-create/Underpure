import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, ThumbsUp, ChevronDown } from "lucide-react";

function generateReviews(product) {
  const pool = [
    {
      id: "r1",
      author: "Isabelle M.",
      location: "Lahore, Pakistan",
      rating: 5,
      title: "Absolutely exquisite",
      body: `I've never owned anything quite like this. The fabric feels like a second skin. Worth every penny.`,
      date: "2026-03-14",
      helpful: 24,
      verified: true,
    },
    {
      id: "r2",
      author: "Camille D.",
      location: "Paris, France",
      rating: 5,
      title: "The quality is unreal",
      body: "I bought this as a gift for myself and I have zero regrets. S&S Kids packaging alone makes you feel like royalty.",
      date: "2026-02-28",
      helpful: 18,
      verified: true,
    },
    {
      id: "r3",
      author: "Sophie K.",
      location: "New York, US",
      rating: 4,
      title: "Stunning piece",
      body: `Gorgeous piece — the construction feels very premium. I'd recommend sizing up if you're between sizes.`,
      date: "2026-01-20",
      helpful: 31,
      verified: true,
    }
  ];
  return pool;
}

function StarRow({ rating, max = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={`sm:w-4 sm:h-4 w-3.5 h-3.5 ${i < rating ? "text-[#d4a59a] fill-[#d4a59a]" : "text-[#3a3a3a]"}`}
          strokeWidth={1}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, percent }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 w-full">
      <span className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] w-6 shrink-0">{label}</span>
      <div className="flex-1 h-1 sm:h-1.5 bg-[#1a1a1a] overflow-hidden rounded-full">
        <div className="h-full bg-[#d4a59a] rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[10px] sm:text-xs font-['Montserrat'] text-[#9a8f8c] w-8 text-right shrink-0">{percent}%</span>
    </div>
  );
}

export function ReviewsSection({ product }) {
  const reviews = generateReviews(product);
  const [helpfulIds, setHelpfulIds] = useState(new Set());
  const [showAll, setShowAll] = useState(false);

  const markHelpful = (id) => {
    setHelpfulIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <section className="border-t border-[#d4a59a]/15 pt-10 sm:pt-14 md:pt-16 mt-10 sm:mt-12 bg-[#0d0d0d] md:bg-transparent -mx-4 px-4 md:mx-0 md:px-0 w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 sm:gap-10 md:gap-14 w-full">

        {/* Rating Summary Card */}
        <div className="bg-[#111] md:bg-[#0d0d0d] p-5 sm:p-6 md:p-8 border border-[#d4a59a]/10 md:border-[#d4a59a]/5 rounded-sm shadow-sm md:shadow-none w-full">
          <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-medium text-[#f5f0ee] mb-4 sm:mb-6 border-b border-[#d4a59a]/10 pb-3 sm:pb-4">
            Reviews
          </h2>
          <div className="mb-6 sm:mb-8">
            <p className="font-['Cormorant_Garamond'] text-5xl sm:text-6xl font-light text-[#f5f0ee] leading-none mb-2 sm:mb-3">
              {product.rating ? product.rating.toFixed(1) : "0.0"}
            </p>
            <StarRow rating={Math.round(product.rating || 0)} />
            <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] font-['Montserrat'] font-bold mt-3 sm:mt-4 uppercase tracking-[0.15em] sm:tracking-widest">
              Based on {product.reviewCount || 0} reviews
            </p>
          </div>
          <div className="space-y-2.5 sm:space-y-3 w-full">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar key={star} label={`${star}★`} percent={star === 5 ? 85 : star === 4 ? 10 : 5} />
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6 sm:space-y-8 md:space-y-10 w-full">
          {displayedReviews.map((review, i) => (
            <div key={review.id} className="border-b border-[#d4a59a]/10 pb-6 sm:pb-8 last:border-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 w-full">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <StarRow rating={review.rating} />
                    {review.verified && (
                      <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-green-400/80 border border-green-400/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm bg-green-400/5 shrink-0">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="font-['Cormorant_Garamond'] text-xl sm:text-xl md:text-2xl font-medium text-[#f5f0ee] mt-2 sm:mt-3">
                    {review.title}
                  </p>
                </div>
                <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-1.5 sm:gap-1 w-full sm:w-auto shrink-0">
                  <p className="text-[11px] sm:text-xs font-semibold font-['Montserrat'] text-[#f5f0ee]">{review.author}</p>
                  <span className="text-xs text-[#9a8f8c] hidden sm:inline">·</span>
                  <p className="text-[9px] sm:text-[10px] font-['Montserrat'] text-[#9a8f8c] truncate max-w-[200px] sm:max-w-none">{review.location} · {review.date}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] leading-relaxed sm:leading-loose mb-4 sm:mb-6 w-full">
                {review.body}
              </p>
              <button
                onClick={() => markHelpful(review.id)}
                className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold transition-colors py-2 px-3 rounded-sm border w-full sm:w-auto ${helpfulIds.has(review.id) ? "text-[#d4a59a] border-[#d4a59a]/30 bg-[#d4a59a]/5" : "text-[#9a8f8c] border-[#9a8f8c]/20 hover:text-[#f5f0ee] hover:border-[#f5f0ee]/40 bg-[#111]"}`}
              >
                <ThumbsUp size={12} className="sm:w-[14px] sm:h-[14px]" /> Helpful ({review.helpful + (helpfulIds.has(review.id) ? 1 : 0)})
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}