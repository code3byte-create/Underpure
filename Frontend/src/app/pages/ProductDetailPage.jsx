import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import {
  Star,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Shield,
  Package,
  RotateCcw,
  Ruler,
  Minus,
  Plus,
} from "lucide-react";
import { fetchProduct, addToWishlist, removeFromWishlist } from "../lib/api";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useSiteSettingsStore } from "../store/siteSettingsStore";
import { toast } from "sonner";
import { SizeGuideModal } from "../components/shop/SizeGuideModal";
import { RelatedProducts } from "../components/shop/RelatedProducts";
import { ReviewsSection } from "../components/shop/ReviewsSection";
import { MOCK_PRODUCTS } from "../lib/mockData";

// ===== COLOR MAP LOGIC =====
const COLOR_MAP = {
  "noir": "#1a1a1a",
  "black": "#000000",
  "ivory": "#f8f9fa",
  "white": "#ffffff",
  "blush": "#f5d1c6",
  "dusty pink": "#dcae96",
  "pink": "#ffc0cb",
  "crimson": "#721121",
  "red": "#8b0000",
  "navy": "#1a2a3a",
  "nude": "#e3bc9a",
  "beige": "#f5eedc",
  "emerald": "#2e593f",
  "gold": "#d4af37",
  "silver": "#c0c0c0",
  "maroon": "#800000",
  "grey": "#808080",
  "gray": "#808080",
  "yellow": "#eab308",
  "purple": "#a855f7",
  "blue": "#3b82f6",
  "green": "#22c55e",
  "orange": "#f97316",
  "brown": "#a52a2a",
  "teal": "#14b8a6",
  "cyan": "#06b6d4",
  "magenta": "#d946ef",
  "olive": "#84cc16",
  "coral": "#ff7f50",
  "peach": "#ffe5b4",
  "lavender": "#e6e6fa",
  "mint": "#98ff98",
  "mustard": "#ffdb58",
  "rust": "#b7410e",
  "burgundy": "#800020",
  "khaki": "#c3b091",
  "charcoal": "#36454f"
};

const getColorCode = (name) => {
  const key = name.trim().toLowerCase();
  return COLOR_MAP[key] || "#444444";
};

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { freeShippingThreshold } = useSiteSettingsStore();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const [displayPrice, setDisplayPrice] = useState(0);
  const [displayOriginalPrice, setDisplayOriginalPrice] = useState(null);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const { addItem } = useCartStore();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setImgIdx(0);
    fetchProduct(slug)
      .then((p) => {
        setProduct(p);

        let firstSize = "";
        if (p.sizes && p.sizes.length > 0) {
          firstSize = typeof p.sizes[0] === 'string' ? p.sizes[0] : p.sizes[0].name;
        }

        setSelectedSize(firstSize);
        setSelectedColor("");

        let initialPrice = p.price;
        if (firstSize && typeof p.sizes[0] !== 'string' && p.sizes[0].price) {
          initialPrice = p.sizes[0].price;
        }
        setDisplayPrice(initialPrice);
        setDisplayOriginalPrice(p.originalPrice || null);
      })
      .catch(() => {
        const mockProduct = MOCK_PRODUCTS.find((p) => p.slug === slug);
        if (mockProduct) {
          setProduct(mockProduct);
          let mFirstSize = mockProduct.sizes[0] || "";
          mFirstSize = typeof mFirstSize === 'string' ? mFirstSize : mFirstSize.name;

          setSelectedSize(mFirstSize);
          setSelectedColor("");
          setDisplayPrice(mockProduct.price);
          setDisplayOriginalPrice(mockProduct.originalPrice || null);
        } else {
          toast.error("Product not found");
          navigate("/shop");
        }
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const getDisplayImages = () => {
    if (!product) return [];
    const selectedColorLower = (selectedColor || "").trim().toLowerCase();

    if (!selectedColorLower) {
      const allImages = new Set();
      if (product.images) product.images.forEach(img => allImages.add(img));
      if (product.image) allImages.add(product.image);

      if (product.inventory) {
        product.inventory.forEach(inv => {
          if (inv.images) inv.images.forEach(img => allImages.add(img));
        });
      }
      if (product.colors) {
        product.colors.forEach(c => {
          if (c.images) c.images.forEach(img => allImages.add(img));
        });
      }
      if (product.colorImages) {
        Object.values(product.colorImages).forEach(imgs => {
          if (imgs) imgs.forEach(img => allImages.add(img));
        });
      }
      const arr = Array.from(allImages);
      return arr.length > 0 ? arr : [];
    }

    if (product.inventory && Array.isArray(product.inventory)) {
      const inv = product.inventory.find(i => (i.color || "").trim().toLowerCase() === selectedColorLower);
      if (inv && inv.images && inv.images.length > 0) {
        return inv.images;
      }
    }

    if (product.colors && Array.isArray(product.colors)) {
      const matchedColor = product.colors.find(c => {
        const cName = typeof c === 'string' ? c : c.name;
        return cName.trim().toLowerCase() === selectedColorLower;
      });
      if (matchedColor && matchedColor.images && matchedColor.images.length > 0) {
        return matchedColor.images;
      }
    }

    const matchedKey = Object.keys(product.colorImages || {}).find(
      (key) => key.trim().toLowerCase() === selectedColorLower
    );
    if (matchedKey && product.colorImages[matchedKey] && product.colorImages[matchedKey].length > 0) {
      return product.colorImages[matchedKey];
    }
    
    return product.images?.length > 0 ? product.images : (product.image ? [product.image] : []);
  };

  const displayImages = getDisplayImages();

  useEffect(() => {
    if (!product || displayImages.length <= 1) return;
    const interval = setInterval(() => {
      setImgIdx((prev) => (prev + 1) % displayImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [product, displayImages]);

  const getAvailableColorsForSize = (sizeName) => {
    if (!product || !product.sizes) return product ? product.colors : [];
    const sizeObj = product.sizes.find(s => (typeof s === 'string' ? s : s.name) === sizeName);

    if (sizeObj && typeof sizeObj !== 'string' && sizeObj.colors && Array.isArray(sizeObj.colors)) {
      if (sizeObj.colors.length === 0) return product.colors;
      return product.colors.filter(c => {
        const colorName = (typeof c === 'string' ? c : c.name).trim().toLowerCase();
        return sizeObj.colors.some(sc => sc.trim().toLowerCase() === colorName);
      });
    }
    return product.colors;
  };

  const handleColorClick = (color) => {
    setSelectedColor(color);
    setImgIdx(0);

    if (product && product.inventory) {
      const colorLower = color.trim().toLowerCase();
      const inv = product.inventory.find(i => (i.color || "").trim().toLowerCase() === colorLower);
      if (inv && inv.sizes) {
        const currentSizeObj = inv.sizes.find(s => s.size === selectedSize);
        if (!currentSizeObj || currentSizeObj.stock <= 0) {
          const availableSize = inv.sizes.find(s => s.stock > 0);
          if (availableSize) {
            setSelectedSize(availableSize.size);
          }
        }
      }
    }
  };

  const handleSizeClick = (sizeName) => {
    setSelectedSize(sizeName);
    if (!product) return;
  };

  const getStockForSelectedVariant = () => {
    if (!product || !selectedSize) return 0;
    
    if (!selectedColor) {
      let totalStockForSize = 0;
      if (product.inventory && product.inventory.length > 0) {
        product.inventory.forEach(inv => {
          const sizeObj = inv?.sizes?.find(s => s.size === selectedSize);
          if (sizeObj) totalStockForSize += (sizeObj.stock || 0);
        });
      } else {
        totalStockForSize = product.stockCount || 10;
      }
      return totalStockForSize > 0 ? totalStockForSize : 1; 
    }

    const selectedColorLower = selectedColor.trim().toLowerCase();
    const inv = product.inventory?.find(i => (i.color || "").trim().toLowerCase() === selectedColorLower);
    const sizeObj = inv?.sizes?.find(s => s.size === selectedSize);
    return sizeObj ? (sizeObj.stock || 0) : 0;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      toast.error("Please select a colour");
      return;
    }
    setAddingToCart(true);
    setTimeout(() => {
      const currentMainImage = displayImages[0];
      const productWithUpdatedData = {
        ...product,
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        image: currentMainImage
      };
      addItem(productWithUpdatedData, selectedSize, selectedColor, quantity);
      toast.success(`Added to your bag — ${selectedSize}, ${selectedColor}`);
      setAddingToCart(false);
    }, 400);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated || !token) {
      toast.error("Please sign in to save to your wishlist");
      return;
    }
    if (!product) return;
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(token, product.id);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(token, product.id);
        setIsWishlisted(true);
        toast.success("Saved to wishlist ✦");
      }
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const nextImg = () => product && setImgIdx((i) => (i + 1) % displayImages.length);
  const prevImg = () => product && setImgIdx((i) => (i - 1 + displayImages.length) % displayImages.length);

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-20">
            <div className="aspect-[3/4] bg-[#141414] animate-pulse rounded-sm" />
            <div className="space-y-4 sm:space-y-5 pt-4">
              <div className="h-4 w-24 bg-[#141414] animate-pulse" />
              <div className="h-10 w-3/4 bg-[#141414] animate-pulse" />
              <div className="h-6 w-24 bg-[#141414] animate-pulse" />
              <div className="h-24 bg-[#141414] animate-pulse" />
              <div className="h-12 bg-[#141414] animate-pulse" />
              <div className="h-14 bg-[#d4a59a]/20 animate-pulse rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const discount = displayOriginalPrice && displayOriginalPrice > displayPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : null;
  const availableColors = getAvailableColorsForSize(selectedSize);

  return (
    <div className="bg-[#0a0a0a] min-h-screen pb-28 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 w-full overflow-x-hidden">

        {/* Breadcrumb - swipeable on mobile */}
        <div className="flex items-center gap-2 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto overscroll-x-contain whitespace-nowrap pb-2 scrollbar-hide">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold md:font-semibold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors shrink-0"
          >
            <ArrowLeft size={14} md:size={14} />
            Back
          </button>
          <span className="text-[#9a8f8c]/30 text-[10px] sm:text-xs shrink-0">/</span>
          <Link to="/shop" className="text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-semibold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors shrink-0">
            Shop
          </Link>
          <span className="text-[#9a8f8c]/30 text-[10px] sm:text-xs shrink-0">/</span>
          <Link
            to={`/shop?category=${product.category}`}
            className="text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-semibold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors capitalize shrink-0"
          >
            {product.category}
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-16 lg:gap-20">
          {/* ===== IMAGES (MOBILE OPTIMIZED SIZE) ===== */}
          <div className="w-full max-w-[320px] sm:max-w-[400px] md:max-w-none mx-auto">
            <div className="relative overflow-hidden aspect-[4/5] bg-[#141414] mb-3 group rounded-sm shadow-md w-full">
              <motion.img
                key={`${selectedColor}-${imgIdx}`}
                src={displayImages[imgIdx]} alt={product.name}
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x500/141414/d4a59a?text=UnderPure"; }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* DISCOUNT BADGE — takes priority over regular badge */}
              {discount && discount > 0 ? (
                <span className="absolute top-4 left-4 sm:top-5 sm:left-5 z-10 flex items-stretch overflow-hidden rounded-sm shadow-lg font-['Montserrat'] font-extrabold text-[10px] sm:text-xs md:text-sm tracking-[0.1em] uppercase">
                  <span className="bg-[#8b4f5c] text-white px-3 py-2 sm:px-4 sm:py-2.5 flex items-center">
                    {discount}% OFF
                  </span>
                  <span className="bg-[#6d3342] text-white/85 px-2.5 py-2 sm:px-3 sm:py-2.5 flex items-center text-[9px] sm:text-[10px]">
                    Save Rs. {(displayOriginalPrice - displayPrice).toLocaleString()}
                  </span>
                </span>
              ) : product.badge ? (
                <span className={`absolute top-4 left-4 sm:top-5 sm:left-5 text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] uppercase px-3 py-1.5 sm:px-4 sm:py-2 font-['Montserrat'] font-bold z-10 rounded-sm shadow-sm ${
                  product.badge === "SALE" ? "bg-[#8b4f5c] text-[#f5f0ee]" :
                  product.badge === "NEW" ? "bg-[#d4a59a] text-[#0a0a0a]" :
                  product.badge === "EXCLUSIVE" ? "bg-[#0a0a0a] text-[#d4a59a] border border-[#d4a59a]/30" :
                  product.badge === "BESTSELLER" ? "bg-[#f2c6b4] text-[#0a0a0a]" :
                  "bg-[#f5f0ee]/95 text-[#0a0a0a]"
                }`}>
                  {product.badge}
                </span>
              ) : null}

              {displayImages.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#0a0a0a]/70 text-[#f5f0ee] md:opacity-0 group-hover:opacity-100 transition-all z-10 rounded-full shadow-md active:scale-95">
                    <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#0a0a0a]/70 text-[#f5f0ee] md:opacity-0 group-hover:opacity-100 transition-all z-10 rounded-full shadow-md active:scale-95">
                    <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
                    {displayImages.map((_, i) => (
                      <button
                        key={i} onClick={() => setImgIdx(i)}
                        className={`h-1.5 sm:h-2 rounded-full transition-all ${imgIdx === i ? "bg-[#d4a59a] w-4 sm:w-5" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"}`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {displayImages.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto overscroll-x-contain pb-3 scrollbar-hide mt-3 sm:mt-4 w-full justify-center md:justify-start">
                {displayImages.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-20 sm:w-20 sm:h-24 shrink-0 overflow-hidden border-2 transition-all rounded-sm ${imgIdx === i ? "border-[#d4a59a] opacity-100" : "border-transparent opacity-60 hover:opacity-100 hover:border-[#d4a59a]/40"}`}>
                    <img src={img} alt={`${product.name} view ${i + 1}`} onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x500/141414/d4a59a?text=UnderPure"; }} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== PRODUCT INFO ===== */}
          <div className="py-0 sm:py-2">
            <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#d4a59a] font-['Montserrat'] font-bold md:font-bold mb-2 sm:mb-4 capitalize">
              {product.category === "briefs" ? "Briefs & Thongs" : product.category}
            </p>

            <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-[#f5f0ee] mb-3 sm:mb-5 leading-tight sm:leading-tight">
              {product.name}
            </h1>

            {product.rating > 0 && (
              <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
                <div className="flex gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} md:size={16} className={s <= Math.round(product.rating) ? "text-[#d4a59a]" : "text-[#3a3a3a]"} fill={s <= Math.round(product.rating) ? "currentColor" : "none"} strokeWidth={1} />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] font-medium">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            <div className="flex items-baseline flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8 border-b border-[#d4a59a]/10 pb-5 sm:pb-6 md:pb-8">
              <span className="text-2xl sm:text-3xl md:text-4xl font-['Montserrat'] font-bold md:font-semibold text-[#f5f0ee]">
                Rs. {displayPrice}
              </span>
              {displayOriginalPrice && (
                <>
                  <span className="font-['Montserrat'] text-sm sm:text-lg md:text-xl text-[#9a8f8c] line-through font-medium ml-1">
                    Rs. {displayOriginalPrice}
                  </span>
                  {discount && (
                    <span className="text-[10px] sm:text-xs md:text-sm font-['Montserrat'] text-[#8b4f5c] font-bold bg-[#8b4f5c]/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-sm whitespace-nowrap ml-2">
                      Save {discount}%
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="text-sm sm:text-base md:text-base text-[#9a8f8c] font-['Montserrat'] leading-relaxed mb-6 sm:mb-10 font-medium md:font-normal">
              {product.description}
            </p>

            {/* ===== VISUAL COLOUR SELECTION ===== */}
            {availableColors.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] mb-3 sm:mb-4">
                  Colour: <span className="text-[#d4a59a] font-bold ml-1">{selectedColor || "Select Colour"}</span>
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {availableColors.map((colorItem) => {
                    const color = typeof colorItem === 'string' ? colorItem : colorItem.name;
                    const hexCode = (typeof colorItem === 'object' && colorItem.hex) ? colorItem.hex : getColorCode(color);
                    const isLightColor = hexCode.toLowerCase() === "#ffffff" || hexCode.toLowerCase() === "#f8f9fa" || hexCode.toLowerCase() === "#f5eedc";

                    return (
                      <button
                        key={color} onClick={() => handleColorClick(color)} title={color}
                        className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all ${selectedColor === color
                          ? "ring-2 ring-offset-2 ring-offset-[#0a0a0a] ring-[#d4a59a]"
                          : "ring-1 ring-[#d4a59a]/30 hover:ring-[#d4a59a]/80"
                          }`}
                        style={{ backgroundColor: hexCode }}
                      >
                        {selectedColor === color && (
                          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isLightColor ? 'bg-black' : 'bg-white'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== SIZE SELECTION ===== */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8 sm:mb-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee]">
                    Size: <span className="text-[#d4a59a] font-bold ml-1">{selectedSize}</span>
                  </p>
                  <button onClick={() => setSizeGuideOpen(true)} className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#d4a59a] transition-colors border-b border-[#9a8f8c]/30 hover:border-[#d4a59a] pb-0.5">
                    <Ruler size={14} md:size={14} strokeWidth={2} />
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                  {product.sizes.map((sizeItem) => {
                    const size = typeof sizeItem === 'string' ? sizeItem : sizeItem.name;
                    const inv = product.inventory?.find(i => (i.color || "").trim().toLowerCase() === (selectedColor || "").trim().toLowerCase());
                    const sizeObj = inv?.sizes?.find(s => s.size === size);
                    const hasStock = sizeObj ? (sizeObj.stock > 0) : false;

                    return (
                      <button
                        key={size} onClick={() => handleSizeClick(size)}
                        className={`py-2.5 sm:py-3 md:py-2.5 text-xs sm:text-sm font-['Montserrat'] font-bold md:font-medium tracking-wide border transition-all text-center rounded-sm relative ${selectedSize === size
                          ? "border-[#d4a59a] text-[#d4a59a] bg-[#d4a59a]/10 shadow-sm"
                          : "border-[#d4a59a]/20 text-[#9a8f8c] hover:border-[#d4a59a]/60 hover:text-[#f5f0ee] bg-[#111] md:bg-transparent"
                          } ${!hasStock ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                      >
                        {size}
                        {!hasStock && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-[1px] bg-[#9a8f8c] rotate-12 opacity-50" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== FIXED MOBILE BOTTOM BAR / DESKTOP NORMAL ROW ===== */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] md:bg-transparent border-t border-[#d4a59a]/20 md:border-none p-3 sm:p-4 md:p-0 flex flex-row items-stretch gap-2 sm:gap-3 md:gap-4 md:mb-8 h-[76px] sm:h-[84px] md:h-14 w-full md:relative transition-all shadow-[0_-10px_40px_rgba(0,0,0,0.4)] md:shadow-none">

              <div className="flex items-center border border-[#d4a59a]/30 bg-[#111] md:bg-transparent rounded-sm flex-shrink-0 w-24 sm:w-28 md:w-auto">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-2 sm:px-4 h-full text-[#9a8f8c] hover:text-[#d4a59a] transition-colors flex items-center justify-center flex-1">
                  <Minus size={14} className="sm:w-4 sm:h-4" />
                </button>
                <span className="flex items-center justify-center h-full text-xs sm:text-sm text-[#f5f0ee] font-['Montserrat'] font-bold w-6 sm:w-8 text-center">
                  {quantity}
                </span>
                <button onClick={() => setQuantity((q) => Math.min(getStockForSelectedVariant(), q + 1))} className="px-2 sm:px-4 h-full text-[#9a8f8c] hover:text-[#d4a59a] transition-colors flex items-center justify-center flex-1">
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || getStockForSelectedVariant() === 0}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 bg-[#d4a59a] text-[#0a0a0a] text-[10px] sm:text-xs md:text-sm tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm md:shadow-md rounded-sm active:scale-[0.98]"
              >
                {addingToCart ? <span>Adding…</span> : getStockForSelectedVariant() === 0 ? <span>Sold Out</span> : <><ShoppingBag size={16} strokeWidth={2} className="md:w-[18px] md:h-[18px]" />Add to Bag</>}
              </button>

              <button
                onClick={handleWishlist} disabled={wishlistLoading}
                className={`w-12 sm:w-14 flex items-center justify-center border transition-all rounded-sm shadow-sm flex-shrink-0 active:scale-95 ${isWishlisted ? "border-[#d4a59a] text-[#d4a59a] bg-[#d4a59a]/10" : "border-[#d4a59a]/30 text-[#9a8f8c] bg-[#111] md:bg-transparent hover:border-[#d4a59a] hover:text-[#d4a59a]"}`}
                aria-label="Save to wishlist"
              >
                <Heart size={18} strokeWidth={1.5} fill={isWishlisted ? "currentColor" : "none"} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {selectedColor && getStockForSelectedVariant() <= (product.low_stock_threshold || 5) && getStockForSelectedVariant() > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] sm:text-xs md:text-sm text-[#d4a59a] font-['Montserrat'] font-bold mb-6 sm:mb-8 mt-4 md:mt-0 flex items-center gap-2 bg-[#d4a59a]/5 p-2.5 sm:p-3 rounded-sm border border-[#d4a59a]/20">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#d4a59a] flex-shrink-0 animate-pulse" />
                Only {getStockForSelectedVariant()} left in {selectedColor}
              </motion.p>
            )}

            <div className="border-t border-[#d4a59a]/15 pt-6 sm:pt-8 mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
              {[
                { icon: Package, label: "Free Shipping", sub: `Orders over Rs. ${freeShippingThreshold}` },
                { icon: RotateCcw, label: "Free Returns", sub: "30-day policy" },
                { icon: Shield, label: "Secure Payment", sub: "100% encrypted" },
              ].map((item) => (
                <div key={item.label} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2.5 bg-[#111] md:bg-transparent p-3 sm:p-0 rounded-sm border border-[#d4a59a]/5 md:border-none">
                  <item.icon size={20} md:size={24} strokeWidth={1.5} className="text-[#d4a59a] shrink-0 sm:w-6 sm:h-6" />
                  <div>
                    <p className="text-[10px] sm:text-[11px] md:text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold text-[#f5f0ee] mb-0.5 sm:mb-1">
                      {item.label}
                    </p>
                    <p className="text-[9px] sm:text-[10px] md:text-xs font-['Montserrat'] text-[#9a8f8c] font-medium sm:font-normal">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {product.longDescription && (
          <div className="mt-12 sm:mt-16 md:mt-24 border-t border-[#d4a59a]/15 pt-8 sm:pt-12 md:pt-14 bg-[#0d0d0d] md:bg-transparent p-5 sm:p-6 md:p-0 rounded-sm md:rounded-none">
            <div className="max-w-3xl">
              <h3 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-4 sm:mb-6">
                About This Piece
              </h3>
              <p className="text-[#9a8f8c] text-sm sm:text-sm md:text-base font-['Montserrat'] leading-relaxed font-medium md:font-normal">
                {product.longDescription}
              </p>
            </div>
          </div>
        )}

        {product.reviewCount > 0 && <ReviewsSection product={product} />}
        <RelatedProducts currentProductId={product.id} category={product.category} />
      </div>

      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} category={product.category} />
    </div>
  );
}