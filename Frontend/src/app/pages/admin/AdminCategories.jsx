import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, ChevronRight, FolderPlus, GitMerge, FilePlus, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { fetchCategories, createCategory, updateCategory, deleteCategory, fetchSizeClasses, createSizeClass, updateSizeClass, deleteSizeClass } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { useSiteSettingsStore } from "../../store/siteSettingsStore";

export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("main");
  const [editingCategory, setEditingCategory] = useState(null);
  const { token } = useAuthStore();
  const settings = useSiteSettingsStore();

  const [sizeClasses, setSizeClasses] = useState([]);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [editingSizeClass, setEditingSizeClass] = useState(null);
  const [sizeFormData, setSizeFormData] = useState({ name: "", sizes: "" });

  // Custom Modal States for Deletion
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null);
  const [deleteSizeConfirm, setDeleteSizeConfirm] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    subTitle: "",
    image: "",
    parentId: "",
    sizeClassId: "",
    priority: 0,
  });

  const [batchParentId, setBatchParentId] = useState("");
  const [tempSubItem, setTempSubItem] = useState({ name: "", slug: "", subTitle: "", image: "", sizeClassId: "" });
  const [pendingBatchList, setPendingBatchList] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCategories();
    loadSizeClasses();
  }, []);

  const loadSizeClasses = async () => {
    try {
      const data = await fetchSizeClasses();
      setSizeClasses(data);
    } catch (error) {
      console.error("Failed to load size classes");
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null, mode = "main") => {
    setModalMode(mode);
    setPendingBatchList([]);
    setBatchParentId("");
    setTempSubItem({ name: "", slug: "", subTitle: "", image: "" });

    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        subTitle: category.subTitle || "",
        image: category.image || "",
        parentId: category.parentId || "",
        sizeClassId: category.sizeClassId || "",
        priority: category.priority || 0,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", slug: "", subTitle: "", image: "", parentId: "", sizeClassId: "", priority: 0 });
    }
    setIsModalOpen(true);
  };

  const handleNameChange = (e, targetStateSetter) => {
    const val = e.target.value;
    targetStateSetter((prev) => ({ ...prev, name: val, slug: val.toLowerCase().replace(/\s+/g, '-') }));
  };

  const handleImageUpload = async (e, targetStateSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const toastId = toast.loading("Uploading image to Cloudinary...");

    const formData = new FormData();
    formData.append("file", file);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dcdogxx8v";
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "underpure_preset";
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        targetStateSetter((prev) => ({ ...prev, image: data.secure_url }));
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image. Please check Cloudinary settings.", { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const addSubToBatch = () => {
    if (!tempSubItem.name || !tempSubItem.slug) {
      toast.error("Name and Slug are required for sub-category.");
      return;
    }
    const newItem = { ...tempSubItem, id: Date.now().toString() };
    setPendingBatchList((prev) => [...prev, newItem]);
    setTempSubItem({ name: "", slug: "", subTitle: "", image: "", sizeClassId: "" });
  };

  const removeFromBatch = (id) => {
    setPendingBatchList((prev) => prev.filter(item => item.id !== id));
  };

  const handleSubmitMain = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, parentId: formData.parentId || null };

      if (editingCategory) {
        await updateCategory(token, editingCategory.id, payload);
        toast.success("Category updated!");
      } else {
        await createCategory(token, payload);
        toast.success("New category created!");
      }
      closeModalAndRefresh();
    } catch (error) {
      toast.error("Backend Error. Demo success.");
      closeModalAndRefresh();
    }
  };

  const handleSubmitBatchSub = async (e) => {
    e.preventDefault();
    if (!batchParentId) {
      toast.error("Please select a Parent Category.");
      return;
    }
    if (pendingBatchList.length === 0) {
      toast.error("Add at least one sub-category to the list.");
      return;
    }

    try {
      setLoading(true);
      const promises = pendingBatchList.map(item => {
        const { id, ...payloadWithoutTempId } = item;
        return createCategory(token, { ...payloadWithoutTempId, parentId: batchParentId });
      });

      await Promise.all(promises);
      toast.success(`Successfully created ${pendingBatchList.length} sub-categories!`);
      closeModalAndRefresh();
    } catch (error) {
      toast.error("Demo Mode: Bulk Creation Simulated.");
      closeModalAndRefresh();
    }
  };

  const closeModalAndRefresh = () => {
    setIsModalOpen(false);
    loadCategories();
  };

  const handleDeleteRequest = (id) => {
    setDeleteCategoryConfirm(id);
  };

  const executeDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;
    try {
      await deleteCategory(token, deleteCategoryConfirm);
      toast.success("Category deleted!");
      loadCategories();
    } catch (error) {
      toast.error("Delete failed in demo mode.");
    } finally {
      setDeleteCategoryConfirm(null);
    }
  };

  const handleSizeSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: sizeFormData.name,
      sizes: sizeFormData.sizes.split(",").map(s => s.trim()).filter(s => s !== "")
    };

    try {
      if (editingSizeClass) {
        await updateSizeClass(token, editingSizeClass.id, payload);
        toast.success("Size class updated!");
      } else {
        await createSizeClass(token, payload);
        toast.success("New size class created!");
      }
      setSizeFormData({ name: "", sizes: "" });
      setEditingSizeClass(null);
      loadSizeClasses();
    } catch (error) {
      toast.error("Failed to save size class");
    }
  };

  const handleEditSizeClass = (sc) => {
    setEditingSizeClass(sc);
    setSizeFormData({
      name: sc.name,
      sizes: sc.sizes.join(", ")
    });
  };

  const handleDeleteSizeClassRequest = (id) => {
    setDeleteSizeConfirm(id);
  };

  const executeDeleteSizeClass = async () => {
    if (!deleteSizeConfirm) return;
    try {
      await deleteSizeClass(token, deleteSizeConfirm);
      toast.success("Size class deleted!");
      loadSizeClasses();
    } catch (error) {
      toast.error("Failed to delete size class");
    } finally {
      setDeleteSizeConfirm(null);
    }
  };

  const toggleHeaderVisibility = async (catId) => {
    const listRaw = settings.headerCategories;
    const list = Array.isArray(listRaw) ? listRaw.map(String) : (typeof listRaw === "string" ? JSON.parse(listRaw).map(String) : []);

    const isSelected = list.includes(String(catId));
    const updated = isSelected
      ? list.filter(id => id !== String(catId))
      : [...list, String(catId)];

    const payload = { headerCategories: JSON.stringify(updated) };
    try {
      await settings.updateSettings(payload, token);
      toast.success(`Category ${isSelected ? 'removed from' : 'added to'} header!`);
    } catch (error) {
      toast.error("Failed to update header settings.");
    }
  };

  // DESKTOP TABLE RENDERER
  const renderCategoryRows = (parentId = null, level = 0) => {
    return categories
      .filter((cat) => cat.parentId == parentId)
      .map((cat) => {
        let isHeaderVisible = false;
        let listRaw = settings.headerCategories;
        if (typeof listRaw === "string") {
          try { listRaw = JSON.parse(listRaw); } catch (e) { listRaw = []; }
        }
        const list = Array.isArray(listRaw) ? listRaw.map(String) : [];
        isHeaderVisible = list.includes(String(cat.id));

        return (
          <Fragment key={cat.id}>
            <tr className="hover:bg-[#d4a59a]/5 transition-colors group border-b border-[#d4a59a]/10 w-full">
              <td className="py-4 px-6 md:px-8">
                <div className="flex items-center gap-4">
                  {level > 0 && (
                    <div className="flex shrink-0" style={{ marginLeft: `${level * 20}px` }}>
                      <ChevronRight size={14} className="text-[#d4a59a]/40" />
                    </div>
                  )}
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#0a0a0a] rounded-sm border border-[#d4a59a]/20 overflow-hidden flex items-center justify-center shadow-inner shrink-0">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-[#9a8f8c]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm md:text-base font-['Montserrat'] font-semibold text-[#f5f0ee] truncate">{cat.name}</p>
                      <span className="bg-[#1a1a1a] text-[#9a8f8c] text-[9px] px-1.5 py-0.5 rounded-sm border border-[#d4a59a]/10 font-mono shrink-0">P:{cat.priority || 0}</span>
                      {isHeaderVisible && (
                        <span className="bg-[#d4a59a]/20 text-[#d4a59a] text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-bold shrink-0">Header</span>
                      )}
                    </div>
                    <p className="text-xs text-[#9a8f8c] font-['Montserrat'] tracking-wide mt-0.5 truncate">{cat.subTitle}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 md:px-8">
                <span className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm ${level === 0 ? "bg-[#d4a59a]/10 text-[#d4a59a] font-bold" : "text-[#9a8f8c] border border-[#9a8f8c]/20"}`}>
                  {level === 0 ? "Main" : level === 1 ? "Sub" : "Child"}
                </span>
              </td>
              <td className="py-4 px-6 md:px-8 w-32">
                <div className="flex items-center justify-end gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleHeaderVisibility(cat.id)}
                    title={isHeaderVisible ? "Remove from Header" : "Show in Header"}
                    className={`p-2 rounded-sm border transition-colors ${isHeaderVisible ? "text-[#d4a59a] border-[#d4a59a]/50 bg-[#d4a59a]/10 hover:bg-[#d4a59a]/20" : "text-[#9a8f8c] border-[#d4a59a]/20 bg-[#0a0a0a] hover:text-[#f5f0ee] hover:border-[#d4a59a]/40"}`}
                  >
                    {isHeaderVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => handleOpenModal(cat, cat.parentId ? "sub" : "main")} className="text-[#9a8f8c] hover:text-[#d4a59a] p-2 bg-[#0a0a0a] rounded-sm border border-[#d4a59a]/20">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteRequest(cat.id)} className="text-[#9a8f8c] hover:text-[#8b4f5c] p-2 bg-[#0a0a0a] rounded-sm border border-[#8b4f5c]/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
            {renderCategoryRows(cat.id, level + 1)}
          </Fragment>
        );
      });
  };

  // MOBILE CARD RENDERER
  const renderCategoryCards = (parentId = null, level = 0) => {
    return categories
      .filter((cat) => cat.parentId == parentId)
      .map((cat) => {
        let isHeaderVisible = false;
        let listRaw = settings.headerCategories;
        if (typeof listRaw === "string") {
          try { listRaw = JSON.parse(listRaw); } catch (e) { listRaw = []; }
        }
        const list = Array.isArray(listRaw) ? listRaw.map(String) : [];
        isHeaderVisible = list.includes(String(cat.id));

        return (
          <Fragment key={cat.id}>
            <div
              className="bg-[#0d0d0d] border border-[#d4a59a]/15 p-3.5 rounded-sm relative shadow-sm flex flex-col gap-3"
              style={{ marginLeft: level > 0 ? `${level * 16}px` : '0px', width: level > 0 ? `calc(100% - ${level * 16}px)` : '100%' }}
            >
              <div className="flex gap-3 w-full">
                <div className="w-16 h-16 bg-[#0a0a0a] rounded-sm border border-[#d4a59a]/20 overflow-hidden flex items-center justify-center shrink-0">
                  {cat.image ? <img src={cat.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-[#9a8f8c]" />}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-['Montserrat'] font-semibold text-[#f5f0ee] truncate flex-1">{cat.name}</p>
                    <span className={`text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${level === 0 ? "bg-[#d4a59a]/10 text-[#d4a59a] font-bold" : "text-[#9a8f8c] border border-[#9a8f8c]/20"}`}>
                      {level === 0 ? "Main" : level === 1 ? "Sub" : "Child"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9a8f8c] font-['Montserrat'] tracking-wide mt-0.5 truncate">{cat.subTitle || "No subtitle"}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="bg-[#1a1a1a] text-[#9a8f8c] text-[9px] px-1.5 py-0.5 rounded-sm border border-[#d4a59a]/10 font-mono shrink-0">P:{cat.priority || 0}</span>
                    {isHeaderVisible && <span className="bg-[#d4a59a]/20 text-[#d4a59a] text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-bold shrink-0">Header</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d4a59a]/10">
                <button onClick={() => toggleHeaderVisibility(cat.id)} className={`flex-1 flex justify-center p-2 rounded-sm border transition-colors ${isHeaderVisible ? "text-[#d4a59a] border-[#d4a59a]/50 bg-[#d4a59a]/10" : "text-[#9a8f8c] border-[#d4a59a]/20 bg-[#0a0a0a]"}`}>
                  {isHeaderVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => handleOpenModal(cat, cat.parentId ? "sub" : "main")} className="flex-1 flex justify-center text-[#9a8f8c] hover:text-[#d4a59a] p-2 bg-[#0a0a0a] rounded-sm border border-[#d4a59a]/20">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDeleteRequest(cat.id)} className="flex-1 flex justify-center text-[#9a8f8c] hover:text-[#8b4f5c] p-2 bg-[#0a0a0a] rounded-sm border border-[#8b4f5c]/20">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {renderCategoryCards(cat.id, level + 1)}
          </Fragment>
        );
      });
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full overflow-x-hidden">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 sm:gap-6 w-full">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-4xl font-['Cormorant_Garamond'] font-medium text-[#f5f0ee]">Category Management</h1>
          <p className="text-[#9a8f8c] font-['Montserrat'] text-xs sm:text-sm md:text-sm mt-1">Organize your collections and sub-collections.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full xl:w-auto">
          <button
            onClick={() => setIsSizeModalOpen(true)}
            className="flex items-center justify-center gap-2 sm:gap-2.5 bg-transparent border border-[#d4a59a]/40 text-[#d4a59a] px-4 sm:px-6 py-3.5 sm:py-4 md:px-6 md:py-3.5 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm hover:bg-[#d4a59a]/10 transition-colors w-full sm:w-auto"
          >
            <GitMerge size={16} className="sm:w-[18px] sm:h-[18px]" /> Manage Sizes
          </button>

          <button
            onClick={() => handleOpenModal(null, "sub")}
            className="flex items-center justify-center gap-2 sm:gap-2.5 bg-transparent border border-[#d4a59a]/40 text-[#d4a59a] px-4 sm:px-6 py-3.5 sm:py-4 md:px-6 md:py-3.5 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm hover:bg-[#d4a59a]/10 transition-colors w-full sm:w-auto"
          >
            <FolderPlus size={16} className="sm:w-[18px] sm:h-[18px]" /> Add Sub Categories
          </button>

          <button
            onClick={() => handleOpenModal(null, "main")}
            className="flex items-center justify-center gap-2 bg-[#d4a59a] text-[#0a0a0a] px-4 sm:px-6 py-3.5 sm:py-4 md:px-8 md:py-3.5 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm hover:bg-[#f2c6b4] transition-colors shadow-md w-full sm:w-auto"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Main Category
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-[#111] rounded-sm border border-[#d4a59a]/15 shadow-xl w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-[#d4a59a]/20">
                <th className="py-5 px-8 text-[#d4a59a] font-['Montserrat'] text-xs font-bold tracking-widest uppercase">Name & Details</th>
                <th className="py-5 px-8 text-[#f5f0ee] font-['Montserrat'] text-xs font-bold tracking-widest uppercase">Type</th>
                <th className="py-5 px-8 text-[#f5f0ee] font-['Montserrat'] text-xs font-bold tracking-widest uppercase text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4a59a]/5 w-full">
              {loading ? (
                <tr><td colSpan="3" className="text-center py-20 text-[#9a8f8c] text-sm italic">Organizing hierarchy...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="3" className="text-center py-20 text-[#9a8f8c] text-sm">No categories found. Click 'New Main Category' to start.</td></tr>
              ) : (
                renderCategoryRows()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-3 w-full">
        {loading ? (
          <div className="text-center py-16 text-[#9a8f8c] text-xs italic border border-[#d4a59a]/10 rounded-sm bg-[#111]">Organizing hierarchy...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-[#9a8f8c] text-xs border border-[#d4a59a]/10 rounded-sm bg-[#111]">No categories found. Click 'New Main Category' to start.</div>
        ) : (
          renderCategoryCards()
        )}
      </div>

      {/* Main/Sub Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-4 md:p-8 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative w-full ${modalMode === 'sub' && !editingCategory ? 'max-w-4xl' : 'max-w-xl'} bg-[#111] border border-[#d4a59a]/30 rounded-sm shadow-2xl overflow-hidden z-10 transition-all flex flex-col max-h-[90vh] sm:max-h-[85vh]`}>
              <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/15 bg-[#1a1a1a] shrink-0">
                <h3 className="font-['Montserrat'] text-[10px] sm:text-sm md:text-base tracking-[0.15em] sm:tracking-[0.2em] font-bold uppercase text-[#d4a59a] truncate pr-2">
                  {modalMode === "main"
                    ? (editingCategory ? "Edit Main Category" : "New Main Category")
                    : (editingCategory ? "Edit Sub Category" : "Add Sub Categories (Bulk Add)")}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#9a8f8c] hover:text-[#f5f0ee] transition-transform hover:rotate-90 shrink-0"><X size={18} className="sm:w-[20px] sm:h-[20px]" strokeWidth={1.5} /></button>
              </div>

              <div className="overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 flex-1 w-full">
                {/* SCENARIO 1: Fresh Batch Creating Subs (Bulk Add) */}
                {modalMode === "sub" && !editingCategory && (
                  <form onSubmit={handleSubmitBatchSub} className="space-y-6 sm:space-y-8 w-full">
                    {/* Shared Parent Selection */}
                    <div className="bg-[#1a1a1a] border border-[#d4a59a]/20 p-4 sm:p-5 rounded-sm w-full">
                      <label className="block text-[10px] sm:text-xs md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#d4a59a] font-bold md:font-bold mb-2 sm:mb-3">Placement (Parent Category) *</label>
                      <select required value={batchParentId} onChange={(e) => setBatchParentId(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-[#f5f0ee] rounded-sm focus:border-[#d4a59a] outline-none">
                        <option value="">Select Parent Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <p className="text-[9px] sm:text-[11px] md:text-xs text-[#9a8f8c] font-['Montserrat'] mt-2 sm:mt-3 italic">All sub-categories in this batch will be added under this parent.</p>
                    </div>

                    {/* Temp Item Form - Add to Batch */}
                    <div className="bg-[#0a0a0a] border border-[#d4a59a]/15 p-4 sm:p-6 rounded-sm space-y-4 sm:space-y-5 w-full">
                      <p className="font-['Montserrat'] text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#9a8f8c] mb-1">Add Sub-Category Item to Batch List</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full">
                        <div>
                          <label className="block text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#9a8f8c] mb-2">Name</label>
                          <input type="text" value={tempSubItem.name} onChange={(e) => handleNameChange(e, setTempSubItem)} className="w-full bg-[#111] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none" placeholder="e.g. Lace Bras" />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#9a8f8c] mb-2">Slug (URL)</label>
                          <input type="text" value={tempSubItem.slug} onChange={(e) => setTempSubItem(prev => ({ ...prev, slug: e.target.value }))} className="w-full bg-[#111] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none font-mono" placeholder="lace-bras" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full">
                        <div>
                          <label className="block text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#9a8f8c] mb-2">Subtitle / Tagline</label>
                          <input type="text" value={tempSubItem.subTitle} onChange={(e) => setTempSubItem(prev => ({ ...prev, subTitle: e.target.value }))} className="w-full bg-[#111] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none" placeholder="Everyday support" />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#9a8f8c] mb-2">Image Upload</label>
                          <div className="flex items-center gap-3 sm:gap-4 w-full">
                            {tempSubItem.image && (
                              <img src={tempSubItem.image} alt="Preview" className="w-8 h-8 sm:w-10 sm:h-10 object-cover border border-[#d4a59a]/30 rounded-sm shrink-0" />
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setTempSubItem)} disabled={uploadingImage} className="w-full bg-[#111] border border-[#d4a59a]/20 px-3 py-2 sm:px-4 sm:py-2.5 text-[10px] sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none text-[#9a8f8c] file:mr-2 sm:file:mr-4 file:py-1 file:px-2 sm:file:px-3 file:rounded-sm file:border-0 file:text-[9px] sm:file:text-xs file:bg-[#d4a59a]/10 file:text-[#d4a59a] hover:file:bg-[#d4a59a]/20 cursor-pointer disabled:opacity-50" />
                          </div>
                        </div>
                      </div>

                      <div className="w-full">
                        <label className="block text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#9a8f8c] mb-2">Inventory Size Class (Optional)</label>
                        <select
                          value={tempSubItem.sizeClassId}
                          onChange={(e) => setTempSubItem(prev => ({ ...prev, sizeClassId: e.target.value }))}
                          className="w-full bg-[#111] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none text-[#f5f0ee]"
                        >
                          <option value="">Select Size Class</option>
                          {sizeClasses.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                        </select>
                      </div>

                      <button type="button" onClick={addSubToBatch} className="w-full md:w-auto flex items-center justify-center gap-2 sm:gap-2.5 text-center bg-transparent border border-[#d4a59a]/40 text-[#d4a59a] px-4 sm:px-6 py-3 text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-['Montserrat'] font-bold rounded-sm hover:bg-[#d4a59a]/10 transition-colors">
                        <FilePlus size={14} className="sm:w-[16px] sm:h-[16px]" /> Add Item to Batch List
                      </button>
                    </div>

                    {/* Batch List Display */}
                    <div className="space-y-3 sm:space-y-4 w-full">
                      <p className="font-['Montserrat'] text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#9a8f8c] mb-1 sm:mb-2">Pending Batch List ({pendingBatchList.length})</p>
                      {pendingBatchList.length === 0 ? (
                        <div className="text-center py-8 sm:py-10 border-2 border-dashed border-[#d4a59a]/15 rounded-sm bg-[#0d0d0d] w-full">
                          <p className="text-[10px] sm:text-xs text-[#9a8f8c] italic">No items added to batch list yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3 w-full">
                          {pendingBatchList.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 sm:gap-4 bg-[#1a1a1a] p-3 sm:p-4 rounded-sm border border-[#d4a59a]/10 w-full">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0a0a0a] rounded-sm flex-shrink-0 border border-[#d4a59a]/20 overflow-hidden">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-[#9a8f8c] m-auto mt-2 sm:mt-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-[#f5f0ee] font-['Montserrat'] truncate">{item.name}</p>
                                <p className="text-[10px] sm:text-xs text-[#9a8f8c] font-mono truncate">{item.slug}</p>
                              </div>
                              <button type="button" onClick={() => removeFromBatch(item.id)} className="p-1.5 sm:p-2 text-[#8b4f5c] hover:bg-[#8b4f5c]/10 rounded-sm shrink-0">
                                <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Batch Form */}
                    <div className="pt-6 sm:pt-8 border-t border-[#d4a59a]/10 mt-6 sm:mt-10 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 w-full">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 sm:px-6 py-3.5 sm:py-4 md:py-3.5 text-[10px] sm:text-xs md:text-sm tracking-wider uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#f5f0ee] border border-[#9a8f8c]/20 sm:border-transparent rounded-sm sm:rounded-none">Cancel</button>
                      <button type="submit" disabled={pendingBatchList.length === 0} className="bg-[#d4a59a] text-[#0a0a0a] px-6 sm:px-8 py-3.5 sm:py-4 md:py-3.5 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm hover:bg-[#f2c6b4] transition-colors shadow-md disabled:opacity-50">
                        Save ({pendingBatchList.length})
                      </button>
                    </div>
                  </form>
                )}

                {/* SCENARIO 2: Single Edit (Table Edit Click) or Fresh Main */}
                {((modalMode === "sub" && editingCategory) || modalMode === "main") && (
                  <form onSubmit={handleSubmitMain} className="space-y-5 sm:space-y-6 md:space-y-6 w-full">

                    {/* Parent Selector */}
                    <div className="bg-[#1a1a1a] border border-[#d4a59a]/20 p-4 sm:p-5 rounded-sm w-full">
                      <label className="block text-[10px] sm:text-xs md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#d4a59a] font-bold md:font-bold mb-2 sm:mb-3">Placement (Parent Category)</label>
                      <select value={formData.parentId || ""} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })} className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-[#f5f0ee] rounded-sm focus:border-[#d4a59a] outline-none">
                        <option value="">None (Main Category)</option>
                        {categories.map(c => {
                          if (editingCategory && c.id === editingCategory.id) return null;
                          return <option key={c.id} value={c.id}>{c.name}</option>;
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full">
                      <div>
                        <label className="block text-[10px] sm:text-xs md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#9a8f8c] font-bold md:font-bold mb-2 sm:mb-3">Category Name</label>
                        <input type="text" required value={formData.name} onChange={(e) => handleNameChange(e, setFormData)} className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none transition-colors" placeholder={modalMode === "main" ? "e.g. Intimates" : "e.g. Lace Bras"} />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#9a8f8c] font-bold md:font-bold mb-2 sm:mb-3">Slug (URL)</label>
                        <input type="text" required value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none font-mono transition-colors" placeholder={modalMode === "main" ? "intimates" : "lace-bras"} />
                      </div>
                    </div>

                    <div className="w-full">
                      <label className="block text-[10px] sm:text-xs md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#9a8f8c] font-bold md:font-bold mb-2 sm:mb-3">Priority (Ordering)</label>
                      <input type="number" value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))} className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none" placeholder="0" />
                      <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] mt-1.5 sm:mt-2 italic">Lower number = appears first (1 sab se pehle, phir 2, 3...). 0 = end mein.</p>
                    </div>

                    <div className="w-full">
                      <label className="block text-[10px] sm:text-xs md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#9a8f8c] font-bold md:font-bold mb-2 sm:mb-3">Inventory Size Class (Optional)</label>
                      <select
                        value={formData.sizeClassId || ""}
                        onChange={(e) => setFormData({ ...formData, sizeClassId: e.target.value })}
                        className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-[#f5f0ee] rounded-sm focus:border-[#d4a59a] outline-none"
                      >
                        <option value="">Select Size Class</option>
                        {sizeClasses.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                      </select>
                      <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] mt-1.5 sm:mt-2 italic">Products in this category will use these sizes for inventory management.</p>
                    </div>

                    <div className="w-full">
                      <label className="block text-[10px] sm:text-xs md:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#9a8f8c] font-bold md:font-bold mb-2 sm:mb-3">{editingCategory ? "Update Image (Optional)" : "Upload Image"}</label>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                        {formData.image && (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 border border-[#d4a59a]/30 rounded-sm overflow-hidden bg-[#0d0d0d] shrink-0">
                            <img src={formData.image} alt={formData.name || 'Category'} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 w-full min-w-0">
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setFormData)} disabled={uploadingImage} className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs md:text-sm rounded-sm focus:border-[#d4a59a] outline-none text-[#9a8f8c] file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2.5 file:px-3 sm:file:px-4 file:rounded-sm file:border-0 file:text-[9px] sm:file:text-xs file:font-semibold file:bg-[#d4a59a]/10 file:text-[#d4a59a] hover:file:bg-[#d4a59a]/20 cursor-pointer disabled:opacity-50 transition-colors" />
                          {formData.image && <p className="text-[9px] sm:text-[10px] text-[#9a8f8c]/60 font-mono truncate mt-2">Link: {formData.image}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 md:pt-4 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 border-t border-[#d4a59a]/10 mt-6 sm:mt-6 w-full">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 sm:px-6 py-3.5 sm:py-4 md:py-3.5 text-[10px] sm:text-xs md:text-sm tracking-wider uppercase font-['Montserrat'] font-bold text-[#9a8f8c] hover:text-[#f5f0ee] border border-[#9a8f8c]/20 sm:border-transparent rounded-sm sm:rounded-none">Cancel</button>
                      <button type="submit" className="bg-[#d4a59a] text-[#0a0a0a] px-6 sm:px-8 py-3.5 sm:py-4 md:py-3.5 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold rounded-sm hover:bg-[#f2c6b4] transition-colors shadow-md">
                        {editingCategory ? "Update Category" : "Save Main Category"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Size Management Modal */}
      <AnimatePresence>
        {isSizeModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-4 md:p-8 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSizeModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md w-full" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-[#111] border border-[#d4a59a]/30 rounded-sm shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh]">
              <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/15 bg-[#1a1a1a] shrink-0">
                <h3 className="font-['Montserrat'] text-[10px] sm:text-sm md:text-base tracking-[0.2em] font-bold uppercase text-[#d4a59a]">Size Class Management</h3>
                <button onClick={() => setIsSizeModalOpen(false)} className="text-[#9a8f8c] hover:text-[#f5f0ee] transition-transform hover:rotate-90"><X size={18} className="sm:w-[20px] sm:h-[20px]" /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-y-auto lg:overflow-hidden flex-1 w-full">
                {/* Left Side: Form */}
                <div className="lg:col-span-2 p-4 sm:p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-[#d4a59a]/10 bg-[#0d0d0d] w-full shrink-0 lg:shrink">
                  <h4 className="text-[#f5f0ee] font-['Montserrat'] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">{editingSizeClass ? "Edit Size Class" : "Define New Class"}</h4>
                  <form onSubmit={handleSizeSubmit} className="space-y-4 sm:space-y-6 w-full">
                    <div>
                      <label className="block text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#9a8f8c] font-bold mb-1.5 sm:mb-2">Class Name</label>
                      <input
                        type="text"
                        required
                        value={sizeFormData.name}
                        onChange={(e) => setSizeFormData({ ...sizeFormData, name: e.target.value })}
                        className="w-full bg-[#1a1a1a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none text-[#f5f0ee]"
                        placeholder="e.g. Standard Sizes"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#9a8f8c] font-bold mb-1.5 sm:mb-2">Sizes (Comma Separated)</label>
                      <textarea
                        required
                        rows={4}
                        value={sizeFormData.sizes}
                        onChange={(e) => setSizeFormData({ ...sizeFormData, sizes: e.target.value })}
                        className="w-full bg-[#1a1a1a] border border-[#d4a59a]/20 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-sm rounded-sm focus:border-[#d4a59a] outline-none text-[#f5f0ee] resize-none"
                        placeholder="e.g. Small, Medium, Large, XL"
                      />
                      <p className="text-[9px] sm:text-[10px] text-[#9a8f8c] mt-1.5 sm:mt-2 italic">Enter sizes separated by commas.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <button type="submit" className="w-full sm:flex-1 bg-[#d4a59a] text-[#0a0a0a] py-3 sm:py-3 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-bold rounded-sm hover:bg-[#f2c6b4] transition-colors">
                        {editingSizeClass ? "Update" : "Create"}
                      </button>
                      {editingSizeClass && (
                        <button
                          type="button"
                          onClick={() => { setEditingSizeClass(null); setSizeFormData({ name: "", sizes: "" }); }}
                          className="w-full sm:w-auto px-4 py-3 sm:py-0 border border-[#d4a59a]/20 text-[#9a8f8c] text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:text-[#f5f0ee] transition-colors rounded-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Right Side: List */}
                <div className="lg:col-span-3 p-4 sm:p-6 md:p-8 lg:overflow-y-auto custom-scrollbar w-full">
                  <h4 className="text-[#f5f0ee] font-['Montserrat'] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">Existing Size Classes</h4>
                  <div className="space-y-3 sm:space-y-4 w-full">
                    {sizeClasses.length === 0 ? (
                      <div className="text-center py-8 sm:py-10 border border-dashed border-[#d4a59a]/20 rounded-sm w-full">
                        <p className="text-[10px] sm:text-xs text-[#9a8f8c] italic">No size classes defined yet.</p>
                      </div>
                    ) : (
                      sizeClasses.map((sc) => (
                        <div key={sc.id} className="bg-[#1a1a1a] border border-[#d4a59a]/10 p-3 sm:p-4 rounded-sm group w-full">
                          <div className="flex items-center justify-between mb-2 sm:mb-3 w-full">
                            <h5 className="text-[#d4a59a] font-['Montserrat'] text-xs sm:text-sm font-bold truncate pr-2">{sc.name}</h5>
                            <div className="flex items-center gap-1 sm:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => handleEditSizeClass(sc)} className="p-1.5 text-[#9a8f8c] hover:text-[#d4a59a] transition-colors bg-[#0a0a0a] lg:bg-transparent rounded-sm"><Edit2 size={12} className="sm:w-[14px] sm:h-[14px]" /></button>
                              <button onClick={() => handleDeleteSizeClassRequest(sc.id)} className="p-1.5 text-[#9a8f8c] hover:text-[#8b4f5c] transition-colors bg-[#0a0a0a] lg:bg-transparent rounded-sm"><Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" /></button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full">
                            {sc.sizes.map((s, idx) => (
                              <span key={idx} className="bg-[#0a0a0a] text-[#9a8f8c] text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm border border-[#d4a59a]/10 truncate max-w-[100px] sm:max-w-none">{s}</span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM DELETE CATEGORY CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteCategoryConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm w-full" onClick={() => setDeleteCategoryConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90%] sm:w-full md:max-w-md bg-[#111] border border-[#d4a59a]/20 z-[60] p-6 sm:p-8 md:p-10 text-center rounded-sm shadow-2xl"
            >
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4 sm:mb-5" strokeWidth={1.5} />
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-2 sm:mb-3">Delete Category?</p>
              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8 font-medium px-2">Are you sure? Deleting a parent category will affect its sub-categories. This action cannot be undone.</p>
              <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
                <button onClick={() => setDeleteCategoryConfirm(null)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-semibold md:font-bold hover:bg-[#222] transition-colors rounded-sm">Cancel</button>
                <button onClick={executeDeleteCategory} className="flex-1 bg-red-500/90 text-white py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-bold hover:bg-red-500 transition-colors rounded-sm shadow-md">Yes, Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM DELETE SIZE CLASS CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteSizeConfirm && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md w-full" onClick={() => setDeleteSizeConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[90%] sm:w-full md:max-w-md bg-[#111] border border-[#d4a59a]/20 z-[60] p-6 sm:p-8 md:p-10 text-center rounded-sm shadow-2xl"
            >
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4 sm:mb-5" strokeWidth={1.5} />
              <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl md:text-4xl font-medium text-[#f5f0ee] mb-2 sm:mb-3">Delete Size Class?</p>
              <p className="text-xs sm:text-sm text-[#9a8f8c] font-['Montserrat'] mb-6 sm:mb-8 font-medium px-2">Are you sure you want to delete this size class? Products using it might be affected.</p>
              <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
                <button onClick={() => setDeleteSizeConfirm(null)} className="flex-1 bg-[#1a1a1a] border border-[#d4a59a]/20 text-[#f5f0ee] py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-semibold md:font-bold hover:bg-[#222] transition-colors rounded-sm">Cancel</button>
                <button onClick={executeDeleteSizeClass} className="flex-1 bg-red-500/90 text-white py-3 sm:py-3.5 md:py-4 text-[10px] sm:text-xs md:text-sm tracking-[0.15em] uppercase font-['Montserrat'] font-bold md:font-bold hover:bg-red-500 transition-colors rounded-sm shadow-md">Yes, Delete</button>
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