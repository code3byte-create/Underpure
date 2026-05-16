import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import { ProductCard } from "./ProductCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function NextArrow({ onClick }) {
  return (
    <button onClick={onClick} className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#0a0a0a]/90 border border-[#d4a59a]/20 text-[#d4a59a] hover:bg-[#d4a59a] hover:text-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hidden md:flex rounded-full sm:rounded-none shadow-md">
      <ChevronRight size={18} strokeWidth={1.5} />
    </button>
  );
}

function PrevArrow({ onClick }) {
  return (
    <button onClick={onClick} className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#0a0a0a]/90 border border-[#d4a59a]/20 text-[#d4a59a] hover:bg-[#d4a59a] hover:text-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hidden md:flex rounded-full sm:rounded-none shadow-md">
      <ChevronLeft size={18} strokeWidth={1.5} />
    </button>
  );
}

export function ProductSlider({ products = [] }) {
  const [slidesCount, setSlidesCount] = useState(4);

  useEffect(() => {
    const updateSlides = () => {
      if (window.innerWidth < 768) {
        setSlidesCount(2); // Mobile par ALWAYS 2 cards lock
      } else if (window.innerWidth < 1024) {
        setSlidesCount(3); // Tablet par 3 cards
      } else {
        setSlidesCount(4); // Desktop par 4 cards
      }
    };

    updateSlides();
    window.addEventListener("resize", updateSlides);
    return () => window.removeEventListener("resize", updateSlides);
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: slidesCount,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    swipeToSlide: true,
    arrows: slidesCount > 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    // overflow-hidden prevents the slider from pushing layout boundaries on swipe
    <div className="relative group px-0 sm:px-4 w-full max-w-full overflow-hidden">
      <Slider key={slidesCount} {...settings} className="w-full">
        {products.map((product, i) => (
          <div key={product.id} className="px-1.5 sm:px-3 outline-none w-full">
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </Slider>
    </div>
  );
}