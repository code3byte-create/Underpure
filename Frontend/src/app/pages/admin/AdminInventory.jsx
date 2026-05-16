import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  RefreshCcw,
  ChevronRight,
  TrendingDown,
  Layers,
  Edit2,
  Save,
  X,
  Download,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { fetchProducts, updateProduct } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editInventory, setEditInventory] = useState([]);
  const [editThreshold, setEditThreshold] = useState(5);
  const { token } = useAuthStore();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStock = (product) => {
    if (!product.inventory || !Array.isArray(product.inventory)) return 0;
    return product.inventory.reduce((acc, item) => {
      return acc + (item.sizes || []).reduce((sizeAcc, s) => sizeAcc + (s.stock || 0), 0);
    }, 0);
  };

  const isLowStock = (product) => {
    const total = calculateTotalStock(product);
    const threshold = product.low_stock_threshold || 5;
    return total > 0 && total <= threshold;
  };

  const isOutOfStock = (product) => {
    return calculateTotalStock(product) === 0;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "low_stock") return matchesSearch && isLowStock(p);
    if (filter === "out_of_stock") return matchesSearch && isOutOfStock(p);
    return matchesSearch;
  });

  const startEditing = (p) => {
    setEditingId(p.id);
    setEditInventory(JSON.parse(JSON.stringify(p.inventory || [])));
    setEditThreshold(p.low_stock_threshold || 5);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditInventory([]);
  };

  const updateEditStock = (invIdx, sizeName, value) => {
    const newInv = [...editInventory];
    const sizeIdx = newInv[invIdx].sizes.findIndex(s => s.size === sizeName);
    if (sizeIdx > -1) {
      newInv[invIdx].sizes[sizeIdx].stock = Number(value);
      setEditInventory(newInv);
    }
  };

  const saveInventory = async (product) => {
    try {
      const payload = {
        name: product.name,
        slug: product.slug,
        price: product.price,
        description: product.description,
        longDescription: product.long_description || product.longDescription,
        originalPrice: product.original_price || product.originalPrice,
        stockCount: calculateTotalStock({ inventory: editInventory }),
        lowStockThreshold: Number(editThreshold),
        category: product.category,
        badge: product.badge,
        inventory: editInventory,
        sizes: [...new Set(editInventory.flatMap(item => item.sizes.map(s => s.size)))],
        colors: editInventory.map(item => ({ name: item.color, images: item.images || [] }))
      };

      await updateProduct(token, product.id, payload);
      toast.success("Inventory & Threshold updated");
      setEditingId(null);
      loadProducts();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to update inventory. Check console for details.");
    }
  };

  const stats = {
    totalItems: products.length,
    lowStock: products.filter(p => isLowStock(p)).length,
    outOfStock: products.filter(p => isOutOfStock(p)).length
  };

  const exportInventory = () => {
    const headers = ["Product Name", "Color", "Size", "Current Stock", "Threshold"];
    const rows = products.flatMap(p =>
      (p.inventory || []).flatMap(inv =>
        (inv.sizes || []).map(s => [
          p.name,
          inv.color,
          s.size,
          s.stock,
          p.low_stock_threshold || 5
        ])
      )
    );

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 w-full overflow-x-hidden p-4 sm:p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 sm:gap-6 w-full">
        <div className="space-y-1 sm:space-y-2 w-full xl:w-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-['Cormorant_Garamond'] font-light tracking-[0.05em] sm:tracking-[0.1em] text-[#f5f0ee]">
            Inventory <span className="text-[#d4a59a] italic font-light">Control</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-['Montserrat'] tracking-widest text-[#9a8f8c] uppercase">
            Manage stock levels across all variants
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 w-full xl:w-auto">
          <StatCard
            label="Total"
            value={stats.totalItems}
            icon={Package}
            color="text-[#d4a59a]"
          />
          <StatCard
            label="Low Stock"
            value={stats.lowStock}
            icon={TrendingDown}
            color="text-yellow-500"
          />
          <StatCard
            label="Out of Stock"
            value={stats.outOfStock}
            icon={AlertTriangle}
            color="text-red-500"
            isFullWidthMobile={true}
          />
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-[#111] border border-[#d4a59a]/10 p-3 sm:p-4 md:p-6 rounded-sm flex flex-col xl:flex-row gap-3 sm:gap-4 items-center justify-between w-full">
        <div className="relative w-full xl:w-96 group">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#9a8f8c] group-focus-within:text-[#d4a59a] transition-colors sm:w-[18px] sm:h-[18px]" size={16} />
          <input
            type="text"
            placeholder="Search product inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#d4a59a]/15 rounded-sm py-2.5 sm:py-3 pl-9 sm:pl-12 pr-3 sm:pr-4 text-xs sm:text-sm font-['Montserrat'] focus:border-[#d4a59a]/40 focus:outline-none transition-all placeholder:text-[#9a8f8c]/30"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto overflow-x-auto scrollbar-hide">
          <Filter size={14} className="text-[#9a8f8c] mr-0 sm:mr-1 shrink-0 sm:w-[16px] sm:h-[16px] hidden sm:block" />
          <div className="flex bg-[#0a0a0a] border border-[#d4a59a]/15 rounded-sm p-1 shrink-0 w-full sm:w-auto">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All"
            />
            <FilterButton
              active={filter === "low_stock"}
              onClick={() => setFilter("low_stock")}
              label="Low"
              count={stats.lowStock}
            />
            <FilterButton
              active={filter === "out_of_stock"}
              onClick={() => setFilter("out_of_stock")}
              label="Empty"
              count={stats.outOfStock}
            />
          </div>
          <div className="flex gap-2 shrink-0 ml-auto sm:ml-0 mt-2 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={exportInventory}
              className="flex-1 sm:flex-none p-2.5 sm:p-3 bg-[#0a0a0a] border border-[#d4a59a]/15 rounded-sm hover:border-[#d4a59a]/40 text-[#9a8f8c] hover:text-[#d4a59a] transition-all flex justify-center items-center gap-1.5 group"
              title="Export to CSV"
            >
              <Download size={14} className="group-hover:-translate-y-0.5 transition-transform sm:w-[16px] sm:h-[16px]" />
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold hidden lg:inline">Export</span>
            </button>
            <button
              onClick={loadProducts}
              className="p-2.5 sm:p-3 bg-[#0a0a0a] border border-[#d4a59a]/15 rounded-sm hover:border-[#d4a59a]/40 text-[#9a8f8c] hover:text-[#d4a59a] transition-all flex items-center justify-center shrink-0"
            >
              <RefreshCcw size={14} className={`sm:w-[16px] sm:h-[16px] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-[#0a0a0a] border border-[#d4a59a]/10 rounded-sm overflow-hidden shadow-2xl w-full">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#111] border-b border-[#d4a59a]/10">
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#9a8f8c]">Product Info</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#9a8f8c]">Category</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#9a8f8c]">Status</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#9a8f8c]">Threshold</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#9a8f8c]">Total Stock</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#9a8f8c] text-right">Quick Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4a59a]/5 w-full">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-[#9a8f8c] italic text-sm">
                    No products found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    totalStock={calculateTotalStock(product)}
                    isLow={isLowStock(product)}
                    isOut={isOutOfStock(product)}
                    isEditing={editingId === product.id}
                    onEdit={() => startEditing(product)}
                    onCancel={cancelEditing}
                    onSave={() => saveInventory(product)}
                    editInventory={editInventory}
                    updateEditStock={updateEditStock}
                    editThreshold={editThreshold}
                    setEditThreshold={setEditThreshold}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4 w-full">
        {filteredProducts.length === 0 ? (
          <div className="px-4 py-16 text-center text-[#9a8f8c] italic text-xs border border-[#d4a59a]/10 bg-[#111] rounded-sm">
            No products found matching your criteria.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductMobileCard
              key={product.id}
              product={product}
              totalStock={calculateTotalStock(product)}
              isLow={isLowStock(product)}
              isOut={isOutOfStock(product)}
              isEditing={editingId === product.id}
              onEdit={() => startEditing(product)}
              onCancel={cancelEditing}
              onSave={() => saveInventory(product)}
              editInventory={editInventory}
              updateEditStock={updateEditStock}
              editThreshold={editThreshold}
              setEditThreshold={setEditThreshold}
            />
          ))
        )}
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, isFullWidthMobile }) {
  return (
    <div className={`bg-[#111] border border-[#d4a59a]/10 p-3 sm:p-5 rounded-sm min-w-[130px] sm:min-w-[160px] flex-1 lg:flex-none flex items-start gap-2.5 sm:gap-4 ${isFullWidthMobile ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}>
      <div className={`p-2 sm:p-2.5 rounded-sm bg-black border border-[#d4a59a]/5 shrink-0 ${color}`}>
        <Icon size={16} className="sm:w-[20px] sm:h-[20px]" />
      </div>
      <div className="min-w-0 pr-1">
        <p className="text-[8px] sm:text-[10px] tracking-widest uppercase text-[#9a8f8c] mb-0.5 sm:mb-1 font-bold truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-['Cormorant_Garamond'] font-medium text-[#f5f0ee] truncate">{value}</p>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 sm:px-4 sm:py-2 flex-1 sm:flex-none text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-widest font-bold transition-all rounded-sm flex items-center justify-center gap-1.5 sm:gap-2 ${active
          ? "bg-[#d4a59a] text-[#0a0a0a]"
          : "text-[#9a8f8c] hover:text-[#f5f0ee] hover:bg-white/5"
        }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] shrink-0 ${active ? "bg-black/20" : "bg-[#d4a59a]/20 text-[#d4a59a]"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ProductTableRow({
  product,
  totalStock,
  isLow,
  isOut,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  editInventory,
  updateEditStock,
  editThreshold,
  setEditThreshold
}) {
  return (
    <>
      <tr className={`group transition-colors w-full ${isEditing ? 'bg-[#1a1a1a]' : 'hover:bg-white/[0.02]'}`}>
        <td className="px-6 py-5 w-[300px]">
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-16 bg-[#111] border border-[#d4a59a]/10 rounded-sm overflow-hidden shrink-0">
              {product.image ? (
                <img src={product.image} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20">
                  <Package size={20} />
                </div>
              )}
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-sm font-semibold text-[#f5f0ee] truncate group-hover:text-[#d4a59a] transition-colors">{product.name}</p>
              <p className="text-[10px] text-[#9a8f8c] font-['Montserrat'] tracking-wider mt-1 truncate">{product.slug}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-5">
          <span className="text-xs text-[#9a8f8c] uppercase tracking-wider font-semibold truncate max-w-[120px] inline-block">{product.category_label || product.category || "None"}</span>
        </td>
        <td className="px-6 py-5">
          {isOut ? (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 whitespace-nowrap">Out of Stock</span>
          ) : isLow ? (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 whitespace-nowrap">Low Stock</span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20 whitespace-nowrap">Optimal</span>
          )}
        </td>
        <td className="px-6 py-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#9a8f8c]/40" />
            <span className="text-xs font-['Montserrat'] text-[#f5f0ee] font-bold">
              {isEditing ? (
                <input
                  type="number"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(e.target.value)}
                  className="w-12 bg-[#0a0a0a] border border-[#d4a59a]/30 px-1 py-1 rounded-sm text-center text-[#d4a59a] focus:outline-none"
                />
              ) : (
                product.low_stock_threshold || 5
              )}
            </span>
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="flex flex-col">
            <span className={`text-lg font-['Cormorant_Garamond'] font-semibold ${isOut ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-[#f5f0ee]'}`}>
              {totalStock} <span className="text-xs text-[#9a8f8c] font-sans">units</span>
            </span>
            <div className="w-24 h-1 bg-[#111] rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${isOut ? 'w-0' : isLow ? 'w-1/3 bg-yellow-500' : 'w-full bg-green-500'}`}
              />
            </div>
          </div>
        </td>
        <td className="px-6 py-5 text-right w-32">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="p-2.5 bg-[#d4a59a]/10 border border-[#d4a59a]/20 text-[#d4a59a] rounded-sm hover:bg-[#d4a59a] hover:text-[#0a0a0a] transition-all group-hover:scale-110"
            >
              <Edit2 size={16} />
            </button>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onSave}
                className="p-2.5 bg-green-500/20 border border-green-500/40 text-green-500 rounded-sm hover:bg-green-500 hover:text-white transition-all"
              >
                <Save size={16} />
              </button>
              <button
                onClick={onCancel}
                className="p-2.5 bg-red-500/20 border border-red-500/40 text-red-500 rounded-sm hover:bg-red-500 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded Editing Area (Desktop) */}
      {isEditing && (
        <tr className="bg-[#151515] animate-in slide-in-from-top-4 duration-300 w-full">
          <td colSpan="6" className="px-8 py-8 border-b border-[#d4a59a]/20 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {editInventory.map((item, invIdx) => (
                <div key={invIdx} className="bg-[#0d0d0d] border border-[#d4a59a]/15 p-5 rounded-sm w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#d4a59a]/20 border border-[#d4a59a]/30 flex items-center justify-center shrink-0">
                      <Layers size={14} className="text-[#d4a59a]" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#f5f0ee] truncate">{item.color}</h3>
                  </div>

                  <div className="space-y-3 w-full">
                    {item.sizes.map((s) => (
                      <div key={s.size} className="flex items-center justify-between bg-black/40 p-2.5 rounded-sm border border-[#d4a59a]/5 group/item w-full">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#9a8f8c]">{s.size}</span>
                          <span className={`text-[8px] uppercase tracking-tighter ${s.stock <= (product.low_stock_threshold || 5) ? 'text-yellow-500' : 'text-green-500/50'}`}>
                            {s.stock === 0 ? 'Empty' : s.stock <= (product.low_stock_threshold || 5) ? 'Critical' : 'Available'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#111] border border-[#d4a59a]/20 rounded-sm overflow-hidden">
                            <button
                              onClick={() => updateEditStock(invIdx, s.size, Math.max(0, s.stock - 1))}
                              className="px-2 py-1.5 hover:bg-[#d4a59a]/10 text-[#9a8f8c] hover:text-[#d4a59a] border-r border-[#d4a59a]/10 transition-colors"
                            >-</button>
                            <input
                              type="number"
                              value={s.stock}
                              onChange={(e) => updateEditStock(invIdx, s.size, e.target.value)}
                              className="w-16 bg-transparent px-2 py-1.5 text-xs text-[#f5f0ee] text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => updateEditStock(invIdx, s.size, s.stock + 1)}
                              className="px-2 py-1.5 hover:bg-[#d4a59a]/10 text-[#9a8f8c] hover:text-[#d4a59a] border-l border-[#d4a59a]/10 transition-colors"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {editInventory.length === 0 && (
                <div className="col-span-full py-10 text-center border border-dashed border-[#d4a59a]/20 rounded-sm w-full">
                  <p className="text-xs text-[#9a8f8c] italic">No color variants defined for this product.</p>
                  <p className="text-[10px] text-[#d4a59a] uppercase tracking-widest mt-2">Manage variants in Products tab</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ProductMobileCard({
  product,
  totalStock,
  isLow,
  isOut,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  editInventory,
  updateEditStock,
  editThreshold,
  setEditThreshold
}) {
  return (
    <div className={`bg-[#0d0d0d] border border-[#d4a59a]/15 p-3.5 rounded-sm relative shadow-sm w-full transition-colors ${isEditing ? 'border-[#d4a59a]/40 bg-[#1a1a1a]' : ''}`}>
      <div className="flex gap-3 w-full mb-3">
        <div className="w-16 h-20 bg-[#111] border border-[#d4a59a]/10 rounded-sm overflow-hidden shrink-0">
          {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={16} /></div>}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-sm font-semibold text-[#f5f0ee] truncate">{product.name}</p>
          <p className="text-[10px] text-[#9a8f8c] font-['Montserrat'] tracking-wider mt-0.5 truncate">{product.category_label || product.category || "None"}</p>

          <div className="flex items-center gap-2 mt-2">
            {isOut ? (
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">Out of Stock</span>
            ) : isLow ? (
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Low Stock</span>
            ) : (
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">Optimal</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-[#d4a59a]/10 rounded-sm p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-[#9a8f8c] uppercase tracking-wider font-bold">Total Stock</span>
          <span className={`text-sm font-['Cormorant_Garamond'] font-bold ${isOut ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-[#f5f0ee]'}`}>{totalStock}</span>
        </div>
        <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${isOut ? 'w-0' : isLow ? 'w-1/3 bg-yellow-500' : 'w-full bg-green-500'}`} />
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#0a0a0a] border border-[#d4a59a]/10 rounded-sm p-2 px-3 mb-3">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-[#9a8f8c]/40" />
          <span className="text-[10px] uppercase text-[#9a8f8c] font-bold tracking-widest">Threshold</span>
        </div>
        {isEditing ? (
          <input type="number" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} className="w-12 bg-[#111] border border-[#d4a59a]/30 px-1 py-0.5 rounded-sm text-center text-[#d4a59a] focus:outline-none text-[10px]" />
        ) : (
          <span className="text-xs font-['Montserrat'] text-[#f5f0ee] font-bold">{product.low_stock_threshold || 5}</span>
        )}
      </div>

      {/* Mobile Editing Expanded Area */}
      {isEditing && (
        <div className="mb-3 space-y-3 bg-[#111] border border-[#d4a59a]/20 p-3 rounded-sm animate-in slide-in-from-top-2 duration-300">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4a59a]">Variant Stock</p>
          {editInventory.map((item, invIdx) => (
            <div key={invIdx} className="bg-[#0d0d0d] border border-[#d4a59a]/15 p-2.5 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={10} className="text-[#d4a59a]" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#f5f0ee]">{item.color}</h3>
              </div>
              <div className="space-y-2">
                {item.sizes.map((s) => (
                  <div key={s.size} className="flex items-center justify-between bg-black/40 p-2 rounded-sm border border-[#d4a59a]/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#9a8f8c]">{s.size}</span>
                      <span className={`text-[8px] uppercase tracking-tighter ${s.stock <= (product.low_stock_threshold || 5) ? 'text-yellow-500' : 'text-green-500/50'}`}>
                        {s.stock === 0 ? 'Empty' : s.stock <= (product.low_stock_threshold || 5) ? 'Critical' : 'Available'}
                      </span>
                    </div>
                    <div className="flex items-center bg-[#111] border border-[#d4a59a]/20 rounded-sm overflow-hidden">
                      <button onClick={() => updateEditStock(invIdx, s.size, Math.max(0, s.stock - 1))} className="px-2 py-1 text-[#9a8f8c] hover:text-[#d4a59a] border-r border-[#d4a59a]/10">-</button>
                      <input type="number" value={s.stock} onChange={(e) => updateEditStock(invIdx, s.size, e.target.value)} className="w-10 bg-transparent px-1 py-1 text-[10px] text-[#f5f0ee] text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button onClick={() => updateEditStock(invIdx, s.size, s.stock + 1)} className="px-2 py-1 text-[#9a8f8c] hover:text-[#d4a59a] border-l border-[#d4a59a]/10">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {editInventory.length === 0 && <p className="text-[9px] text-[#9a8f8c] italic text-center py-2">No variants.</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d4a59a]/10">
        {!isEditing ? (
          <button onClick={onEdit} className="flex-1 flex justify-center items-center gap-1.5 text-[10px] text-[#9a8f8c] font-['Montserrat'] font-semibold hover:text-[#d4a59a] border border-[#d4a59a]/20 py-2 rounded-sm bg-[#111]">
            <Edit2 size={12} strokeWidth={2} /> Edit Inventory
          </button>
        ) : (
          <div className="flex w-full gap-2">
            <button onClick={onCancel} className="flex-1 flex justify-center items-center gap-1.5 text-[10px] text-red-400 font-['Montserrat'] font-semibold hover:bg-red-400/10 border border-red-400/20 py-2 rounded-sm bg-[#111]">
              <X size={12} strokeWidth={2} /> Cancel
            </button>
            <button onClick={onSave} className="flex-1 flex justify-center items-center gap-1.5 text-[10px] text-green-500 font-['Montserrat'] font-semibold hover:bg-green-500/10 border border-green-500/20 py-2 rounded-sm bg-[#111]">
              <Save size={12} strokeWidth={2} /> Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}