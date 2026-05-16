import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Search, Star, Layers, UploadCloud, Upload, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchSizeClasses,
} from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  slug: "",
  category: "",
  subCategory: "",
  price: 0,
  originalPrice: "",
  description: "",
  longDescription: "",
  image: "",
  variants: [],
  inStock: true,
  badge: "",
  featured: false,
  stockCount: 0,
  lowStockThreshold: 5,
  inventory: [] // Array of { color, images: [], sizes: [{ size, stock }] }
};

const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function AdminProducts() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sizeClasses, setSizeClasses] = useState([]);

  const [builderVariants, setBuilderVariants] = useState([]);
  const [tempSize, setTempSize] = useState("");
  const [tempColor, setTempColor] = useState({});
  const [customBadgeActive, setCustomBadgeActive] = useState(false);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");

  useEffect(() => {
    loadProducts();
    loadCategoriesData();
    loadSizeClassesData();
  }, []);

  const loadSizeClassesData = async () => {
    try {
      const data = await fetchSizeClasses();
      setSizeClasses(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCategoriesData = async () => {
    try {
      const cats = await fetchCategories();
      setCategoriesList(cats || []);
    } catch (error) {
      console.error(error);
      toast.error("Categories couldn't be loaded.");
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data.products || data || []);
    } catch (error) {
      console.error(error);
      toast.error("Database se products load nahi ho sakay.");
    } finally {
      setLoading(false);
    }
  };

  const initBuilderVariants = (sizes = [], colors = []) => {
    const bv = sizes.map(s => {
      const sizeName = typeof s === 'string' ? s : s.name;
      const sizePrice = typeof s === 'string' ? "" : s.price;
      const existingSizeColors = typeof s === 'string' ? null : s.colors;

      let sizeColors;
      if (existingSizeColors && Array.isArray(existingSizeColors)) {
        sizeColors = existingSizeColors.map(cName => {
          const colorObj = colors.find(c => (typeof c === 'string' ? c : c.name) === cName);
          const colorImages = colorObj ? (typeof colorObj === 'string' ? [] : (colorObj.images || [])) : [];
          return { name: cName, images: colorImages };
        });
      } else {
        sizeColors = colors.map(c => {
          const colorName = typeof c === 'string' ? c : c.name;
          const colorImages = typeof c === 'string' ? [] : (c.images || []);
          return { name: colorName, images: colorImages };
        });
      }

      return {
        size: sizeName,
        price: sizePrice,
        colors: sizeColors
      };
    });
    return bv;
  };

  const flattenBuilderVariants = (bv) => {
    const flat = [];
    bv.forEach(sObj => {
      sObj.colors.forEach(cObj => {
        flat.push({
          id: Math.random().toString(),
          size: sObj.size,
          color: cObj.name,
          images: cObj.images
        });
      });
    });
    return flat;
  };

  const openCreate = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM });
    setCustomBadgeActive(false);
    setDiscountType("none");
    setDiscountValue("");
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      ...p,
      price: p.price || 0,
      originalPrice: p.originalPrice || "",
      inventory: p.inventory || []
    });
    setCustomBadgeActive(p.badge && !["NEW", "SALE", "EXCLUSIVE", "BESTSELLER"].includes(p.badge));
    if (p.originalPrice && p.originalPrice > p.price) {
      setDiscountType("fixed");
      setDiscountValue(p.originalPrice - p.price);
    } else {
      setDiscountType("none");
      setDiscountValue("");
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditProduct(null);
    setForm(EMPTY_FORM);
  };

  const setField = (key, value) =>
    setForm((f) => ({ ...f, [key]: value }));


  const handleMainImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    toast.promise(
      compressImage(file),
      {
        loading: 'Compressing and optimizing main image...',
        success: (base64) => {
          setField("image", base64);
          return 'Main image optimized and ready!';
        },
        error: 'Failed to compress main image.',
      }
    );
    e.target.value = null;
  };

  const handleInventoryImageUpload = (e, invIdx) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const compressPromises = files.map(file => compressImage(file));

    toast.promise(
      Promise.all(compressPromises),
      {
        loading: `Compressing and optimizing ${files.length} image(s)...`,
        success: (base64Images) => {
          const newInventory = [...form.inventory];
          newInventory[invIdx].images = [...(newInventory[invIdx].images || []), ...base64Images];
          setField("inventory", newInventory);
          return `${files.length} image(s) compressed and uploaded successfully!`;
        },
        error: 'Failed to optimize images.',
      }
    );

    e.target.value = null;
  };

  const removeInventoryImage = (invIdx, imgIdx) => {
    const newInventory = [...form.inventory];
    newInventory[invIdx].images.splice(imgIdx, 1);
    setField("inventory", newInventory);
  };

  const addInventoryColor = () => {
    const newInventory = [...form.inventory, { color: "", colorHex: "#000000", images: [], sizes: [] }];
    setField("inventory", newInventory);
  };

  const removeInventoryColor = (idx) => {
    const newInventory = [...form.inventory];
    newInventory.splice(idx, 1);
    setField("inventory", newInventory);
  };

  const updateInventoryColorName = (idx, name) => {
    const newInventory = [...form.inventory];
    newInventory[idx].color = name;
    setField("inventory", newInventory);
  };

  const updateInventoryColorHex = (idx, hex) => {
    const newInventory = [...form.inventory];
    newInventory[idx].colorHex = hex;
    setField("inventory", newInventory);
  };

  const toggleInventorySize = (invIdx, sizeName) => {
    const newInventory = [...form.inventory];
    const sizeIdx = newInventory[invIdx].sizes.findIndex(s => s.size === sizeName);

    if (sizeIdx > -1) {
      newInventory[invIdx].sizes.splice(sizeIdx, 1);
    } else {
      newInventory[invIdx].sizes.push({ size: sizeName, stock: 0 });
    }
    setField("inventory", newInventory);
  };

  const updateInventorySizeStock = (invIdx, sizeName, value) => {
    const newInventory = [...form.inventory];
    let sizes = newInventory[invIdx].sizes || [];
    const sizeIdx = sizes.findIndex(s => s.size === sizeName);
    const numVal = value === "" ? 0 : Number(value);

    if (sizeIdx > -1) {
      sizes[sizeIdx].stock = numVal;
    } else {
      sizes.push({ size: sizeName, stock: numVal });
    }

    newInventory[invIdx].sizes = sizes;
    setField("inventory", newInventory);
  };

  const getAvailableSizesForCategory = () => {
    const categorySlug = form.subCategory || form.category;
    const category = categoriesList.find(c => c.slug === categorySlug);
    if (!category || !category.sizeClassId) return [];
    const sizeClass = sizeClasses.find(sc => sc.id === category.sizeClassId);
    return sizeClass ? sizeClass.sizes : [];
  };

  const handleSave = async () => {
    if (!token) return;

    if (!form.name?.trim() || form.price === "" || form.price === null) {
      toast.error("Name and price are required");
      return;
    }

    setSaving(true);

    const slug =
      form.slug?.trim() ||
      form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const finalCategorySlug = form.subCategory || form.category;

    const calculatedStockCount = form.inventory ? form.inventory.reduce((acc, item) => {
      return acc + (item.sizes || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    }, 0) : 0;

    const finalOriginalPrice = form.originalPrice ? Number(form.originalPrice) : null;
    const finalPrice = Number(form.price);

    const payload = {
      ...form,
      category: finalCategorySlug,
      slug,
      price: finalPrice,
      originalPrice: finalOriginalPrice && finalOriginalPrice > finalPrice ? finalOriginalPrice : null,
      featured: form.featured ? 1 : 0,
      inStock: calculatedStockCount > 0 ? 1 : 0,
      stockCount: calculatedStockCount,
      inventory: form.inventory,
      sizes: [...new Set(form.inventory.flatMap(item => item.sizes.map(s => s.size)))],
      colors: form.inventory.map(item => ({ name: item.color, hex: item.colorHex || '#000000', images: item.images }))
    };

    try {
      if (editProduct) {
        await updateProduct(token, editProduct.id, payload);
        toast.success("Product successfully database me update ho gaya!");
      } else {
        await createProduct(token, payload);
        toast.success("Naya product database me create ho gaya!");
      }
      closeModal();
      loadProducts();
    } catch (err) {
      console.error("Backend Save Error:", err);
      toast.error(err.message || "Backend Error: Data save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    try {
      await deleteProduct(token, id);
      setProducts((p) => p.filter((prod) => prod.id !== id));
      toast.success("Product successfully database se delete ho gaya.");
    } catch (err) {
      toast.error(err.message || "Backend Error: Delete fail ho gaya.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-4 md:gap-0 w-full">
        <div>
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-medium text-[#f5f0ee]">
            Products
          </h1>
          <p className="text-[#9a8f8c] text-xs sm:text-sm md:text-sm font-['Montserrat'] mt-1 sm:mt-2">
            {products.length} pieces in the database
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-[#d4a59a] text-[#0a0a0a] px-5 py-3.5 sm:px-6 sm:py-4 md:px-8 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm w-full md:w-auto shadow-md shrink-0"
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 md:mb-8 max-w-md w-full">
        <Search
          size={16} className="absolute left-3.5 sm:left-4 md:left-5 top-1/2 -translate-y-1/2 text-[#9a8f8c] sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full bg-[#111] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs sm:text-sm md:text-sm font-['Montserrat'] pl-10 sm:pl-12 md:pl-14 pr-4 py-3 sm:py-3.5 md:py-4 outline-none placeholder-[#9a8f8c]/50 transition-colors rounded-sm"
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3 sm:space-y-4 w-full">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 md:h-20 bg-[#141414] animate-pulse rounded-sm w-full" />
          ))}
        </div>
      ) : (
        <div className="w-full">
          {/* ====== DESKTOP VIEW (Table View) ====== */}
          <div className="hidden md:block border border-[#d4a59a]/20 overflow-hidden bg-[#0d0d0d] rounded-sm w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#d4a59a]/20 bg-[#0a0a0a]">
                    {["Product", "Category", "Price", "Stock", "Featured", ""].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-5 text-left text-[10px] lg:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#9a8f8c]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4a59a]/10">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#d4a59a]/10 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-16 object-cover bg-[#1a1a1a] flex-shrink-0 border border-[#d4a59a]/20 rounded-sm"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-[#1a1a1a] flex-shrink-0 border border-[#d4a59a]/20 rounded-sm flex items-center justify-center">
                              <ImageIcon size={20} className="text-[#9a8f8c] opacity-50" />
                            </div>
                          )}
                          <div className="min-w-0 pr-2">
                            <p className="text-sm font-['Montserrat'] text-[#f5f0ee] font-medium truncate">
                              {p.name}
                            </p>
                            {p.badge && (
                              <span className="text-[10px] tracking-[0.15em] uppercase text-[#d4a59a] font-['Montserrat'] font-bold inline-block mt-1">
                                {p.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs lg:text-sm font-['Montserrat'] text-[#9a8f8c] capitalize">
                        {p.category}
                      </td>
                      <td className="px-6 py-4 text-xs lg:text-sm font-['Montserrat'] text-[#f5f0ee] whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span>Rs. {Number(p.price).toLocaleString()}</span>
                          {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#9a8f8c] line-through text-[10px]">
                                Rs. {Number(p.originalPrice).toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold text-[#8b4f5c] bg-[#8b4f5c]/10 border border-[#8b4f5c]/20 px-1.5 py-0.5 rounded-sm">
                                -{Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100)}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] lg:text-[10px] tracking-[0.1em] uppercase font-['Montserrat'] font-bold px-2 py-1 lg:px-3 lg:py-1.5 rounded-sm whitespace-nowrap ${p.inStock
                            ? "text-green-400 bg-green-400/10 border border-green-400/20"
                            : "text-red-400 bg-red-400/10 border border-red-400/20"
                            }`}
                        >
                          {p.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-['Montserrat'] text-[#d4a59a]">
                        {p.featured ? "✦" : "—"}
                      </td>
                      <td className="px-6 py-4 w-28">
                        <div className="flex items-center gap-2 lg:gap-3 justify-end opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-[#9a8f8c] hover:text-[#d4a59a] transition-colors p-1.5 lg:p-2 bg-[#111] hover:bg-[#d4a59a]/10 rounded-sm border border-[#d4a59a]/20"
                          >
                            <Edit2 size={14} className="lg:w-[16px] lg:h-[16px]" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="text-[#9a8f8c] hover:text-red-400 transition-colors p-1.5 lg:p-2 bg-[#111] hover:bg-red-400/10 rounded-sm border border-[#d4a59a]/20"
                          >
                            <Trash2 size={14} className="lg:w-[16px] lg:h-[16px]" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-[#9a8f8c] text-sm font-['Montserrat']"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ====== MOBILE VIEW ====== */}
          <div className="md:hidden space-y-3 sm:space-y-4 w-full">
            {filtered.map((p) => (
              <div key={p.id} className="bg-[#0d0d0d] border border-[#d4a59a]/15 p-3.5 sm:p-4 rounded-sm relative shadow-sm w-full">
                <div className="flex gap-3 sm:gap-4 w-full">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-16 h-20 sm:w-20 sm:h-24 object-cover bg-[#1a1a1a] rounded-sm shrink-0" />
                  ) : (
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-[#1a1a1a] rounded-sm flex items-center justify-center border border-[#d4a59a]/20 shrink-0">
                      <ImageIcon size={20} className="sm:w-[24px] sm:h-[24px] text-[#9a8f8c] opacity-50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-sm sm:text-base font-['Montserrat'] text-[#f5f0ee] font-semibold mb-1 truncate">{p.name}</p>
                    <p className="text-[9px] sm:text-[10px] tracking-[0.1em] uppercase font-['Montserrat'] text-[#d4a59a] font-bold mb-1.5 sm:mb-2 truncate">{p.category}</p>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm font-['Montserrat'] font-semibold text-[#f5f0ee]">Rs. {p.price}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#d4a59a]/10 w-full">
                  <button onClick={() => openEdit(p)} className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-[#9a8f8c] font-['Montserrat'] font-semibold hover:text-[#d4a59a] border border-[#d4a59a]/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-sm bg-[#111] flex-1">
                    <Edit2 size={12} strokeWidth={2} /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-red-400 font-['Montserrat'] font-semibold hover:bg-red-400/10 border border-red-400/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-sm bg-[#111] flex-1">
                    <Trash2 size={12} strokeWidth={2} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 border border-[#d4a59a]/10 rounded-sm bg-[#111]">
                <p className="text-xs text-[#9a8f8c] italic">No products found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== Create/Edit Modal ====== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-y-0 inset-x-0 md:inset-y-4 md:right-auto md:left-1/2 md:-translate-x-1/2 md:w-[750px] w-full bg-[#111] border-l md:border border-[#d4a59a]/20 z-50 flex flex-col shadow-2xl md:rounded-sm max-h-screen"
            >
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 sm:py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/15 bg-[#111] shrink-0">
                <p className="text-[10px] sm:text-sm md:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold md:font-bold text-[#f5f0ee] truncate">
                  {editProduct ? "Edit Product" : "New Product"}
                </p>
                <button
                  onClick={closeModal}
                  className="text-[#9a8f8c] hover:text-[#f5f0ee] hover:rotate-90 transition-all p-1.5 sm:p-2 -mr-1.5 sm:-mr-2 bg-[#1a1a1a] rounded-sm border border-[#d4a59a]/10 shrink-0"
                >
                  <X size={16} className="sm:w-[20px] md:w-[24px] sm:h-[20px] md:h-[24px]" strokeWidth={1.5} />
                </button>
              </div>

              <div className="px-4 sm:px-5 py-5 md:px-8 md:py-8 space-y-5 sm:space-y-6 md:space-y-6 pb-24 md:pb-8 flex-1 overflow-y-auto custom-scrollbar w-full">

                {/* ===== MAIN IMAGE UPLOAD (Device) ===== */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 bg-[#1a1a1a] border border-[#d4a59a]/20 p-4 sm:p-5 rounded-sm w-full">
                  {form.image ? (
                    <div className="relative group w-20 h-20 sm:w-24 sm:h-24 mx-auto sm:mx-0 shrink-0">
                      <img src={form.image} alt="Main" className="w-full h-full object-cover rounded-sm border border-[#d4a59a]/30" />
                      <button onClick={() => setField("image", "")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-md">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#0a0a0a] rounded-sm border border-[#d4a59a]/20 flex flex-col items-center justify-center text-[#9a8f8c] shrink-0 mx-auto sm:mx-0">
                      <ImageIcon size={20} className="sm:w-[24px] sm:h-[24px] mb-1 opacity-50" />
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold">Main Img</span>
                    </div>
                  )}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <label className="block text-[10px] sm:text-[11px] md:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-semibold md:font-bold text-[#f5f0ee] mb-1.5 sm:mb-2">
                      Upload Main Image
                    </label>
                    <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] mb-3 truncate px-2 sm:px-0">This image represents the product in the shop catalog.</p>

                    <label className="cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 bg-[#d4a59a]/10 border border-[#d4a59a]/30 text-[#d4a59a] px-4 py-2 sm:px-5 sm:py-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#d4a59a] hover:text-[#0a0a0a] transition-colors w-full sm:w-auto">
                      <UploadCloud size={14} className="sm:w-[16px] sm:h-[16px]" /> Select File
                      <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
                    </label>
                  </div>
                </div>

                <Field label="Product Name *">
                  <input
                    type="text"
                    value={form.name || ""}
                    onChange={(e) => setField("name", e.target.value)}
                    className={INPUT_CLS}
                    placeholder="e.g. Silk Noir Chemise"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 w-full">
                  <Field label="Category *">
                    <select
                      value={form.category || ""}
                      onChange={(e) => setField("category", e.target.value)}
                      className={INPUT_CLS}
                    >
                      <option value="" disabled>Select Category</option>
                      {categoriesList.filter(c => !c.parentId).map((cat) => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Sub Category">
                    <select
                      value={form.subCategory || ""}
                      onChange={(e) => setField("subCategory", e.target.value)}
                      className={INPUT_CLS}
                      disabled={!form.category}
                    >
                      <option value="">None / Select Sub-Category</option>
                      {categoriesList
                        .filter(c => {
                          const parent = categoriesList.find(p => p.slug === form.category);
                          return parent && c.parentId === parent.id;
                        })
                        .map((sub) => (
                          <option key={sub.id} value={sub.slug}>{sub.name}</option>
                        ))
                      }
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 w-full bg-[#1a1a1a] p-4 sm:p-5 rounded-sm border border-[#d4a59a]/20">
                  <Field label="Base Price (Rs.) *">
                    <input
                      type="number"
                      value={form.originalPrice || form.price || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, '');
                        setField("originalPrice", val);
                        if (discountType === "none") setField("price", val);
                        else if (discountType === "percentage") setField("price", Math.max(0, Math.round(Number(val) - (Number(val) * Number(discountValue) / 100))));
                        else if (discountType === "fixed") setField("price", Math.max(0, Number(val) - Number(discountValue)));
                      }}
                      className={INPUT_CLS}
                      placeholder="e.g. 5000"
                    />
                  </Field>
                  <Field label="Final Selling Price (Rs.) *">
                    <input
                      type="number"
                      value={form.price === 0 ? "" : form.price}
                      onChange={(e) => {
                        setField("price", e.target.value.replace(/^0+(?=\d)/, ''));
                        setDiscountType("none");
                        setDiscountValue("");
                      }}
                      className={INPUT_CLS}
                      placeholder="e.g. 4500"
                    />
                  </Field>
                  
                  <Field label="Discount Type">
                    <select
                      value={discountType}
                      onChange={(e) => {
                        const type = e.target.value;
                        setDiscountType(type);
                        const orig = Number(form.originalPrice || form.price);
                        if (!orig) return;
                        setField("originalPrice", orig);
                        if (type === "none") {
                          setDiscountValue("");
                          setField("price", orig);
                        } else if (type === "percentage") {
                          const val = Number(discountValue);
                          if (val >= 0) setField("price", Math.max(0, Math.round(orig - (orig * val / 100))));
                        } else if (type === "fixed") {
                          const val = Number(discountValue);
                          if (val >= 0) setField("price", Math.max(0, orig - val));
                        }
                      }}
                      className={INPUT_CLS}
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (Rs.)</option>
                    </select>
                  </Field>

                  {discountType !== "none" && (
                    <Field label={`Discount Value ${discountType === "percentage" ? "(%)" : "(Rs.)"}`}>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+(?=\d)/, '');
                          setDiscountValue(val);
                          const orig = Number(form.originalPrice || form.price);
                          if (!orig) return;
                          
                          if (discountType === "percentage") {
                            setField("price", Math.max(0, Math.round(orig - (orig * Number(val) / 100))));
                          } else if (discountType === "fixed") {
                            setField("price", Math.max(0, orig - Number(val)));
                          }
                        }}
                        className={INPUT_CLS}
                        placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                      />
                    </Field>
                  )}
                </div>

                {/* ===== LIVE DISCOUNT PREVIEW ===== */}
                {discountType !== "none" && Number(discountValue) > 0 && Number(form.originalPrice) > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#d4a59a]/20 rounded-sm p-4 sm:p-5 w-full">
                    <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] mb-3">
                      ✦ Discount Preview
                    </p>
                    <div className="flex items-center gap-4 sm:gap-6">
                      {/* Mini product image mock */}
                      <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-[#0d0d0d] rounded-sm border border-[#d4a59a]/20 shrink-0 overflow-hidden flex items-center justify-center">
                        {form.image ? (
                          <img src={form.image} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <span className="text-[#9a8f8c]/30 text-[8px] font-['Montserrat'] uppercase tracking-widest text-center px-1">No Image</span>
                        )}
                        {/* Discount badge on mock image */}
                        {(() => {
                          const orig = Number(form.originalPrice);
                          const curr = Number(form.price);
                          const disc = orig > curr ? Math.round(((orig - curr) / orig) * 100) : 0;
                          return disc > 0 ? (
                            <span className="absolute top-1.5 left-1.5 flex items-stretch overflow-hidden rounded-sm font-['Montserrat'] font-extrabold text-[7px] tracking-wide uppercase shadow-md">
                              <span className="bg-[#8b4f5c] text-white px-1.5 py-0.5">{disc}%</span>
                              <span className="bg-[#6d3342] text-white/90 px-1.5 py-0.5">OFF</span>
                            </span>
                          ) : null;
                        })()}
                      </div>
                      {/* Price breakdown */}
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-['Montserrat'] font-bold text-[#f5f0ee]">
                            Rs. {Number(form.price).toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm font-['Montserrat'] text-[#9a8f8c] line-through">
                            Rs. {Number(form.originalPrice).toLocaleString()}
                          </span>
                        </div>
                        {(() => {
                          const orig = Number(form.originalPrice);
                          const curr = Number(form.price);
                          const disc = orig > curr ? Math.round(((orig - curr) / orig) * 100) : 0;
                          const saved = orig - curr;
                          return disc > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] sm:text-xs font-['Montserrat'] font-bold text-[#8b4f5c] bg-[#8b4f5c]/10 border border-[#8b4f5c]/20 px-2 py-1 rounded-sm">
                                {disc}% OFF
                              </span>
                              <span className="text-[10px] sm:text-xs font-['Montserrat'] text-green-400 font-semibold">
                                Customer saves Rs. {saved.toLocaleString()}
                              </span>
                            </div>
                          ) : null;
                        })()}
                        <p className="text-[9px] sm:text-[10px] font-['Montserrat'] text-[#9a8f8c] italic mt-1">
                          This badge will appear on the product image in shop & product page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Field label="Short Description">
                  <textarea
                    value={form.description || ""}
                    onChange={(e) => setField("description", e.target.value)}
                    rows={3}
                    className={INPUT_CLS}
                  />
                </Field>

                {/* ===== NEW INVENTORY BUILDER ===== */}
                <div className="bg-[#1a1a1a] p-4 sm:p-5 md:p-6 rounded-sm border border-[#d4a59a]/15 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 w-full border-b border-[#d4a59a]/10 sm:border-0 pb-3 sm:pb-0">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-[#d4a59a] sm:w-[20px] sm:h-[20px]" />
                      <label className="text-[10px] sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a]">
                        Inventory & Variants
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={addInventoryColor}
                      className="text-[9px] sm:text-[10px] bg-[#d4a59a]/10 border border-[#d4a59a]/30 sm:border-0 sm:bg-transparent px-3 py-1.5 sm:p-0 font-bold uppercase tracking-widest text-[#d4a59a] hover:text-[#f2c6b4] transition-colors flex items-center justify-center gap-1.5 rounded-sm sm:rounded-none w-full sm:w-auto"
                    >
                      <Plus size={12} className="sm:w-[14px] sm:h-[14px]" /> Add Color Variant
                    </button>
                  </div>

                  {form.inventory.length === 0 ? (
                    <div className="text-center py-8 sm:py-10 border border-dashed border-[#d4a59a]/20 rounded-sm w-full">
                      <p className="text-[10px] sm:text-xs text-[#9a8f8c] italic">No color variants added. Start by adding one above.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6 w-full">
                      {form.inventory.map((item, invIdx) => (
                        <div key={invIdx} className="bg-[#0d0d0d] border border-[#d4a59a]/20 p-4 sm:p-5 rounded-sm relative group w-full">
                          <button
                            type="button"
                            onClick={() => removeInventoryColor(invIdx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 sm:p-1.5 rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} className="sm:w-[14px] sm:h-[14px]" strokeWidth={3} />
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                            {/* Color Info */}
                            <div className="space-y-3 sm:space-y-4 w-full">
                              <div>
                                <label className="block text-[9px] sm:text-[10px] uppercase tracking-widest text-[#9a8f8c] font-bold mb-1.5 sm:mb-2">Color & Hex Code</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={item.colorHex || "#000000"}
                                    onChange={(e) => updateInventoryColorHex(invIdx, e.target.value)}
                                    className="w-10 h-10 sm:w-12 sm:h-12 border-0 bg-transparent rounded-sm cursor-pointer p-0"
                                  />
                                  <input
                                    type="text"
                                    value={item.color}
                                    onChange={(e) => updateInventoryColorName(invIdx, e.target.value)}
                                    className="w-full bg-[#111] border border-[#d4a59a]/20 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#f5f0ee] rounded-sm focus:border-[#d4a59a] outline-none"
                                    placeholder="e.g. Midnight Black"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] sm:text-[10px] uppercase tracking-widest text-[#9a8f8c] font-bold mb-1.5 sm:mb-2">Color Images</label>
                                <div className="space-y-3 sm:space-y-4 w-full">
                                  {/* Images Grid */}
                                  {item.images && item.images.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full">
                                      {item.images.map((img, imgIdx) => (
                                        <div key={imgIdx} className="relative group/img w-12 h-16 sm:w-16 sm:h-20 bg-[#0a0a0a] border border-[#d4a59a]/20 rounded-sm shrink-0">
                                          <img src={img} className="w-full h-full object-cover rounded-sm" />
                                          <button
                                            type="button"
                                            onClick={() => removeInventoryImage(invIdx, imgIdx)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity"
                                          >
                                            <X size={10} strokeWidth={3} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <label className="block cursor-pointer bg-[#d4a59a]/5 border border-[#d4a59a]/20 text-[#d4a59a] px-3 py-2 sm:px-4 sm:py-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center rounded-sm hover:bg-[#d4a59a]/20 transition-colors w-full">
                                    <Upload size={12} className="inline sm:w-[14px] sm:h-[14px] mr-1 mb-0.5 sm:mr-1.5" /> Upload Images
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleInventoryImageUpload(e, invIdx)} />
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Sizes for this color */}
                            <div className="space-y-3 sm:space-y-4 w-full">
                              <label className="block text-[9px] sm:text-[10px] uppercase tracking-widest text-[#9a8f8c] font-bold mb-1.5 sm:mb-2">Available Sizes & Stock</label>
                              <div className="space-y-1.5 sm:space-y-2 max-h-[140px] sm:max-h-[180px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar w-full">
                                {getAvailableSizesForCategory().length === 0 ? (
                                  <p className="text-[9px] sm:text-[10px] text-yellow-500/70 italic p-2 border border-dashed border-yellow-500/20 rounded-sm">Please select a category first to see available sizes.</p>
                                ) : (
                                  getAvailableSizesForCategory().map(size => {
                                    const sizeData = item.sizes.find(s => s.size === size);
                                    const isSelected = !!sizeData;
                                    const stockValue = sizeData ? sizeData.stock : 0;

                                    return (
                                      <div key={size} className={`flex items-center justify-between p-1.5 sm:p-2 rounded-sm border w-full ${isSelected ? 'border-[#d4a59a]/40 bg-[#d4a59a]/5' : 'border-[#d4a59a]/10 bg-transparent'}`}>
                                        <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-1 min-w-0 pr-1">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleInventorySize(invIdx, size)}
                                            className="accent-[#d4a59a] shrink-0"
                                          />
                                          <span className="text-[10px] sm:text-xs font-bold text-[#f5f0ee] truncate">{size}</span>
                                        </label>
                                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                          <span className="text-[8px] sm:text-[9px] text-[#9a8f8c] uppercase font-bold hidden sm:inline">Stock:</span>
                                          <input
                                            type="number"
                                            value={stockValue === 0 && !isSelected ? "" : stockValue}
                                            onChange={(e) => updateInventorySizeStock(invIdx, size, e.target.value.replace(/^0+(?=\d)/, ''))}
                                            className="w-10 sm:w-16 bg-[#000] border border-[#d4a59a]/20 px-1 py-1 sm:px-2 sm:py-1 text-[10px] sm:text-xs text-[#f5f0ee] rounded-sm text-center focus:border-[#d4a59a] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 w-full">
                  <Field label="Badge">
                    <div className="flex gap-2 w-full">
                      {!customBadgeActive ? (
                        <>
                          <select
                            value={form.badge || ""}
                            onChange={(e) => setField("badge", e.target.value || null)}
                            className={INPUT_CLS + " flex-1 min-w-0"}
                          >
                            <option value="">None</option>
                            {Array.from(new Set([
                              "NEW", "SALE", "EXCLUSIVE", "BESTSELLER", "TRENDING", "LIMITED EDITION", "CLEARANCE", "ESSENTIAL", "HOT",
                              ...(products.map(p => p.badge).filter(Boolean))
                            ])).map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomBadgeActive(true);
                              setField("badge", "");
                            }}
                            className="px-3 bg-[#d4a59a]/10 text-[#d4a59a] hover:bg-[#d4a59a]/20 text-[10px] tracking-widest uppercase font-['Montserrat'] font-bold rounded-sm border border-[#d4a59a]/20 transition-colors shrink-0"
                          >
                            + Custom
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={form.badge || ""}
                            onChange={(e) => setField("badge", e.target.value.toUpperCase())}
                            className={INPUT_CLS + " flex-1 min-w-0"}
                            placeholder="e.g. HOT, TRENDING..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomBadgeActive(false);
                              setField("badge", "");
                            }}
                            className="px-3 bg-[#1a1a1a] text-[#9a8f8c] hover:text-[#f5f0ee] text-[10px] tracking-widest uppercase font-['Montserrat'] font-bold rounded-sm border border-[#d4a59a]/10 transition-colors shrink-0"
                          >
                            Dropdown
                          </button>
                        </>
                      )}
                    </div>
                  </Field>
                  <Field label="Low Stock Threshold">
                    <input
                      type="number"
                      min={0}
                      value={form.lowStockThreshold ?? 5}
                      onChange={(e) => setField("lowStockThreshold", Number(e.target.value))}
                      className={INPUT_CLS}
                      placeholder="Alert when stock below..."
                    />
                  </Field>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-8 bg-[#1a1a1a] p-4 sm:p-5 md:p-6 rounded-sm border border-[#d4a59a]/20 w-full">
                  <Toggle
                    label="In Stock"
                    value={form.inStock !== false}
                    onChange={(v) => setField("inStock", v)}
                  />
                  <Toggle
                    label="Featured"
                    value={form.featured === true}
                    onChange={(v) => setField("featured", v)}
                  />
                </div>

                {/* Buttons for Desktop */}
                <div className="hidden md:flex gap-4 pt-6 border-t border-[#d4a59a]/15 w-full">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/30 text-[#f5f0ee] py-4 text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm hover:bg-[#222]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-[#d4a59a] text-[#0a0a0a] py-4 text-xs tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] disabled:opacity-60 rounded-sm shadow-md"
                  >
                    {saving ? "Saving…" : editProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </div>

              {/* Fixed Footer for Mobile */}
              <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#111] border-t border-[#d4a59a]/15 p-3 sm:p-4 flex gap-2 sm:gap-3 z-20 w-full">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3.5 sm:py-4 text-[10px] sm:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-semibold rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#d4a59a] text-[#0a0a0a] py-3.5 sm:py-4 text-[10px] sm:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] disabled:opacity-60 rounded-sm shadow-md"
                >
                  {saving ? "Saving…" : editProduct ? "Save" : "Create"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90%] md:w-full max-w-md bg-[#111] border border-[#d4a59a]/20 p-6 sm:p-8 md:p-10 text-center rounded-sm shadow-2xl z-10"
            >
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium md:font-medium text-[#f5f0ee] mb-2 sm:mb-3 md:mb-4">
                Delete Product?
              </p>
              <p className="text-xs sm:text-sm md:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8 md:mb-10">
                This action cannot be undone.
              </p>
              <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3 sm:py-4 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-semibold md:font-bold rounded-sm hover:bg-[#222]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-500/90 text-white py-3 sm:py-4 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-bold hover:bg-red-500 rounded-sm shadow-md"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; sm:width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4a59a60; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4a59a; }
      `}</style>
    </div>
  );
}

const INPUT_CLS =
  "w-full bg-[#1a1a1a] border border-[#d4a59a]/20 focus:border-[#d4a59a]/50 text-[#f5f0ee] text-xs sm:text-sm md:text-sm font-['Montserrat'] px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4 outline-none transition-colors rounded-sm";

function Field({ label, children }) {
  return (
    <div className="w-full">
      <label className="block text-[10px] sm:text-[11px] md:text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-semibold md:font-bold text-[#9a8f8c] mb-1.5 sm:mb-2 md:mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2.5 sm:gap-3 md:gap-4 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className={`w-9 h-5 sm:w-11 sm:h-6 md:w-12 md:h-7 rounded-full relative transition-colors shrink-0 ${value ? "bg-[#d4a59a]" : "bg-[#333]"
          }`}
      >
        <div
          className={`absolute top-0.5 md:top-1 w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 rounded-full bg-white transition-all shadow-sm ${value ? "left-4 sm:left-5.5 md:left-6" : "left-0.5 sm:left-0.5 md:left-1"
            }`}
        />
      </div>
      <span className="text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold sm:font-semibold md:font-bold text-[#f5f0ee] md:text-[#9a8f8c] truncate pr-1">
        {label}
      </span>
    </label>
  );
}