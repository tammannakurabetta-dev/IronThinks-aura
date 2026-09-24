import React, { useState, useRef } from 'react';
import { api } from '../../api/client';
import { UploadCloud, Image as ImageIcon, X, Loader2, Check } from 'lucide-react';

interface SymptomPhotoUploaderProps {
  onImagesUploaded: (urls: string[]) => void;
  maxFiles?: number;
}

export const SymptomPhotoUploader: React.FC<SymptomPhotoUploaderProps> = ({
  onImagesUploaded,
  maxFiles = 4,
}) => {
  const [images, setImages] = useState<Array<{ url: string; file?: File; uploading: boolean }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side image compression via canvas
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/jpeg',
          0.85
        );
      };
    });
  };

  const processAndUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, maxFiles - images.length);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      const localPreview = URL.createObjectURL(file);
      const newEntry = { url: localPreview, file, uploading: true };

      setImages(prev => [...prev, newEntry]);

      try {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
        const uploadedUrl = await api.uploadSymptomImage(compressedFile);

        setImages(prev => {
          const updated = prev.map(img =>
            img.url === localPreview ? { url: uploadedUrl, uploading: false } : img
          );
          onImagesUploaded(updated.map(u => u.url));
          return updated;
        });
      } catch (err) {
        console.error('Image upload failed:', err);
        setImages(prev => prev.filter(img => img.url !== localPreview));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processAndUploadFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      onImagesUploaded(filtered.map(u => u.url));
      return filtered;
    });
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) processAndUploadFiles(e.target.files);
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop crop leaf / symptom photos here, or <span className="text-emerald-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG with auto-compression (Max {maxFiles} images)
            </p>
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950"
            >
              <img
                src={img.url}
                alt={`Symptom ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {img.uploading ? (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compressing...
                </div>
              ) : (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  <span className="p-1 rounded-full bg-emerald-500 text-slate-950">
                    <Check className="w-3 h-3" />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className="p-1 rounded-full bg-slate-900/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
