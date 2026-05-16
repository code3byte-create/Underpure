import { useState } from "react";
import { Upload, X, Loader } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

export function CloudinaryUpload({ onImageUpload, preview, previewAlt = "Preview" }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { token } = useAuthStore();

  const handleUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const uploadUrl = isLocal 
        ? "http://127.0.0.1/backend/index.php/upload/image?folder=testimonials" 
        : "https://www.underpure.com/backend/index.php/upload/image?folder=testimonials";

      const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      let optimizedUrl = data.url;
      if (optimizedUrl.includes('/upload/')) {
        optimizedUrl = optimizedUrl.replace('/upload/', '/upload/f_auto,q_auto/');
      }

      onImageUpload(optimizedUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-sm p-8 transition-colors ${
          dragActive
            ? "border-[#d4a59a] bg-[#d4a59a]/5"
            : "border-[#d4a59a]/30 bg-[#0a0a0a]/50 hover:border-[#d4a59a]/50"
        }`}
      >
        <input
          type="file"
          id="image-upload"
          onChange={handleChange}
          accept="image/*"
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader size={40} className="text-[#d4a59a] animate-spin mb-3" />
              <p className="text-[#9a8f8c] font-['Montserrat'] text-sm">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <Upload size={40} className="text-[#d4a59a]/60 mb-3" strokeWidth={1.5} />
              <p className="text-[#f5f0ee] font-['Montserrat'] font-semibold text-sm">
                Drag & drop your image here
              </p>
              <p className="text-[#9a8f8c] font-['Montserrat'] text-xs mt-1">
                or click to browse (Max 5MB)
              </p>
            </>
          )}
        </div>
      </div>

      {preview && (
        <div className="relative rounded-sm overflow-hidden border border-[#d4a59a]/20">
          <img
            src={preview}
            alt={previewAlt}
            className="w-full h-48 object-cover"
          />
          <button
            onClick={() => onImageUpload("")}
            className="absolute top-2 right-2 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
            title="Remove image"
          >
            <X size={20} strokeWidth={2} />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/40 via-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );
}
