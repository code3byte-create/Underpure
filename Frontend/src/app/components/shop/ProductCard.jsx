import { Link } from "react-router";
import { Heart } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { addToWishlist, removeFromWishlist } from "../../lib/api";

export function ProductCard({ product, wishlistedIds = [], onWishlistChange = () => { } }) {
  const { isAuthenticated, token } = useAuthStore();
  const isWishlisted = wishlistedIds.includes(product.id);

  // Hover image ke liye logic
  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : product.image;
  const secondaryImage = product.images && product.images.length > 1 ? product.images[1] : primaryImage;

  const origPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const currPrice = Number(product.price);
  const discount = origPrice && origPrice > currPrice
    ? Math.round(((origPrice - currPrice) / origPrice) * 100)
    : null;

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      toast.error("Please sign in to save items");
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(token, product.id);
        onWishlistChange(wishlistedIds.filter(id => id !== product.id));
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(token, product.id);
        onWishlistChange([...wishlistedIds, product.id]);
        toast.success("Saved to wishlist ✦");
      }
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  return (
    <div className="group/card flex flex-col relative w-full h-full">
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden aspect-[4/5] bg-[#141414] rounded-sm mb-3 md:mb-4 border border-[#d4a59a]/10 group-hover/card:border-[#d4a59a]/30 transition-colors w-full"
      >
        {/* SECONDARY IMAGE */}
        <img
          src={secondaryImage}
          alt={`${product.name} alternate view`}
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x500/141414/d4a59a?text=UnderPure"; }}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover/card:scale-110 ${
            product.stock_count !== null && product.stock_count <= 0 ? "grayscale opacity-50" : ""
          }`}
        />

        {/* PRIMARY IMAGE */}
        <img
          src={primaryImage}
          alt={product.name}
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x500/141414/d4a59a?text=UnderPure"; }}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] ease-out group-hover/card:opacity-0 group-hover/card:scale-110 ${
            product.stock_count !== null && product.stock_count <= 0 ? "grayscale opacity-50" : ""
          }`}
        />

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 bg-[#0a0a0a]/60 backdrop-blur-md rounded-full flex items-center justify-center text-[#f5f0ee] hover:bg-[#d4a59a] hover:text-[#0a0a0a] transition-all opacity-100 md:opacity-0 group-hover/card:opacity-100 active:scale-95"
          aria-label="Wishlist"
        >
          <Heart size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        {/* ===== BADGE (top-left on image) — Priority: SOLD OUT > DISCOUNT > regular badge ===== */}
        {product.stock_count !== null && product.stock_count <= 0 ? (
          /* SOLD OUT */
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5 font-['Montserrat'] font-bold bg-[#8b4f5c] text-white rounded-sm shadow-sm">
            SOLD OUT
          </span>
        ) : discount && discount > 0 ? (
          /* DISCOUNT BADGE — split pill design */
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex items-stretch overflow-hidden rounded-sm shadow-lg font-['Montserrat'] font-extrabold text-[9px] sm:text-[10px] tracking-[0.1em] uppercase">
            <span className="bg-[#8b4f5c] text-white px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center">
              {discount}%
            </span>
            <span className="bg-[#6d3342] text-white/90 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center">
              OFF
            </span>
          </span>
        ) : product.badge ? (
          /* Regular badge (NEW, EXCLUSIVE, BESTSELLER, etc.) */
          <span
            className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5 font-['Montserrat'] font-bold rounded-sm shadow-sm ${
              product.badge === "SALE"
                ? "bg-[#8b4f5c] text-white"
                : product.badge === "NEW"
                ? "bg-[#d4a59a] text-[#0a0a0a]"
                : product.badge === "EXCLUSIVE"
                ? "bg-[#0a0a0a] text-[#d4a59a] border border-[#d4a59a]/30"
                : product.badge === "BESTSELLER"
                ? "bg-[#f2c6b4] text-[#0a0a0a]"
                : "bg-[#f5f0ee]/95 text-[#0a0a0a]"
            }`}
          >
            {product.badge}
          </span>
        ) : null}
      </Link>

      {/* Product Details */}
      <div className="flex flex-col flex-1 px-1 min-w-0">
        <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] text-[#9a8f8c] font-semibold mb-1 sm:mb-1.5 truncate">
          {product.category}
        </p>

        <Link to={`/product/${product.slug}`}>
          <h3 className="font-['Cormorant_Garamond'] text-lg sm:text-xl md:text-2xl font-medium text-[#f5f0ee] group-hover/card:text-[#d4a59a] transition-colors line-clamp-1 mb-1.5 sm:mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Price Row */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-auto pt-1">
          <span className="text-sm sm:text-base md:text-lg font-['Montserrat'] font-bold text-[#f5f0ee]">
            Rs. {currPrice.toLocaleString()}
          </span>
          {origPrice && origPrice > currPrice && (
            <span className="text-xs sm:text-sm font-['Montserrat'] text-[#9a8f8c] line-through font-medium">
              Rs. {origPrice.toLocaleString()}
            </span>
          )}
          {discount && discount > 0 && (
            <span className="text-[9px] sm:text-[10px] font-['Montserrat'] text-[#8b4f5c] font-bold bg-[#8b4f5c]/10 px-1.5 py-0.5 rounded-sm whitespace-nowrap border border-[#8b4f5c]/20 ml-auto">
              Save Rs. {(origPrice - currPrice).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}