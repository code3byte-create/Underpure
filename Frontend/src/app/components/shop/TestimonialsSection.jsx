import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

export function TestimonialsSection({ testimonials = [], title = "What Our Clients Say", subtitle = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Show 3 cards at a time, or fewer on smaller screens
  const itemsPerPage = window.innerWidth < 768 ? 1 : 3;
  const totalSlides = Math.ceil(testimonials.length / itemsPerPage);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= itemsPerPage) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay, totalSlides, itemsPerPage, testimonials.length]);

  const goToPrev = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-16 md:mb-20">
        <p className="text-[#d4a59a] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-3 sm:mb-4">
          TESTIMONIALS
        </p>
        <h2 className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl md:text-6xl font-medium text-[#f5f0ee] mb-3 sm:mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[#f5f0ee]/70 text-xs sm:text-base font-['Montserrat'] max-w-2xl mx-auto px-2">
            {subtitle}
          </p>
        )}
      </div>

      {/* Carousel */}
      <div className="relative w-full">
        <div className="overflow-hidden w-full">
          <motion.div
            className="flex gap-4 sm:gap-6 md:gap-8 w-full"
            initial={false}
            animate={{ x: `-${currentIndex * (100 / itemsPerPage)}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className={`flex-shrink-0 ${itemsPerPage === 1 ? "w-full" : "w-full md:w-[calc(33.333%-1.33rem)]"}`}
              >
                <motion.div
                  className="bg-[#0d0d0d] border border-[#d4a59a]/10 rounded-sm overflow-hidden h-full flex flex-col w-full"
                  whileHover={{ borderColor: "#d4a59a" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Image - Height reduced for mobile (h-44) and standard for larger (sm:h-64) */}
                  <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden bg-[#1a1a1a]">
                    {testimonial.image ? (
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#d4a59a]/20 to-[#1a1a1a] flex items-center justify-center">
                        <span className="text-[#9a8f8c] text-3xl sm:text-4xl">✦</span>
                      </div>
                    )}
                  </div>

                  {/* Content - Paddings and Text Sizes reduced for mobile */}
                  <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col">
                    {/* Stars */}
                    <div className="flex gap-1 mb-2.5 sm:mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={`sm:w-4 sm:h-4 w-3.5 h-3.5 ${i < (testimonial.rating || 5)
                            ? "text-[#d4a59a] fill-[#d4a59a]"
                            : "text-[#3a3a3a]"
                            }`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-[#f5f0ee] text-xs sm:text-sm md:text-base font-['Montserrat'] leading-relaxed mb-4 sm:mb-6 flex-1">
                      "{testimonial.text}"
                    </p>

                    {/* Author */}
                    <div className="border-t border-[#d4a59a]/10 pt-3 sm:pt-4">
                      <p className="font-['Montserrat'] font-semibold text-[#f5f0ee] text-[11px] sm:text-sm">
                        {testimonial.author}
                      </p>
                      {testimonial.location && (
                        <p className="text-[#9a8f8c] text-[9px] sm:text-xs font-['Montserrat'] mt-0.5 sm:mt-1">
                          {testimonial.location}
                        </p>
                      )}
                      {testimonial.verified && (
                        <span className="inline-block text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-green-400/80 border border-green-400/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm bg-green-400/5 mt-1.5 sm:mt-2">
                          Verified Customer
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Navigation */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 sm:-left-6 top-[30%] sm:top-1/3 -translate-y-1/2 z-10 p-2 sm:p-3 bg-[#0a0a0a]/80 sm:bg-[#d4a59a]/10 hover:bg-[#d4a59a]/20 text-[#f5f0ee] rounded-full transition-colors shadow-md sm:shadow-none"
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" strokeWidth={2} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:-right-6 top-[30%] sm:top-1/3 -translate-y-1/2 z-10 p-2 sm:p-3 bg-[#0a0a0a]/80 sm:bg-[#d4a59a]/10 hover:bg-[#d4a59a]/20 text-[#f5f0ee] rounded-full transition-colors shadow-md sm:shadow-none"
              aria-label="Next testimonials"
            >
              <ChevronRight size={16} className="sm:w-5 sm:h-5" strokeWidth={2} />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
              {[...Array(totalSlides)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAutoPlay(false);
                    setCurrentIndex(i);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${i === currentIndex
                    ? "bg-[#d4a59a] w-5 sm:w-8"
                    : "bg-[#d4a59a]/30 w-1.5 sm:w-2 hover:bg-[#d4a59a]/50"
                    }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}