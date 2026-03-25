import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface PhotoUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  aspectRatio?: "1/1" | "4/3" | "16/9";
  placeholder?: string;
}

const PhotoUpload = ({
  images,
  onImagesChange,
  maxImages = 6,
  aspectRatio = "1/1",
  placeholder = "Glissez une image ou cliquez pour sélectionner",
}: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    // Upload not yet implemented — return a local object URL as a stub
    return URL.createObjectURL(file);
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const urls = await Promise.all(toUpload.map(uploadFile));
      onImagesChange([...images, ...urls]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange, uploadFile]);

  const removeImage = (idx: number) => {
    onImagesChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={url} className="relative group" style={{ aspectRatio }}>
              <img src={url} alt="" className="w-full h-full object-cover" style={{ borderRadius: "3px" }} />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-foreground/60 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ borderRadius: "50%" }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {images.length < maxImages && (
        <div
          className={`border-[1.5px] border-dashed p-10 text-center cursor-pointer transition-all ${
            dragOver ? "border-terra bg-secondary/20" : "border-terra/25 bg-terra-wash/30"
          }`}
          style={{ borderRadius: "3px" }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
        >
          {uploading ? (
            <Loader2 size={20} className="mx-auto text-terra animate-spin" />
          ) : (
            <>
              <Upload size={20} className="mx-auto text-muted-foreground mb-2" />
              <p className="font-body text-[12px] text-muted-foreground tracking-[0.2em]" style={{ fontWeight: 200 }}>
                {placeholder}
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
