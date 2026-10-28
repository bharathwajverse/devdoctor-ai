import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, AlertCircle, FileCheck2 } from 'lucide-react';

interface UploadZoneProps {
  image: string | null;
  onImageSelected: (base64DataUri: string, metadata: { name: string; sizeBytes: number; mimeType: string }) => void;
  onImageCleared: () => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  image,
  onImageSelected,
  onImageCleared,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeBytes: number; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setErrorMsg(null);

      // Validate MIME type
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedMimes.includes(file.type.toLowerCase())) {
        setErrorMsg('Unsupported format. Please upload a PNG, JPEG, or WebP screenshot.');
        return;
      }

      // Validate 10MB limit
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErrorMsg(`File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please crop or compress it.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUri = reader.result as string;
        setImageMeta({
          name: file.name,
          sizeBytes: file.size,
          mimeType: file.type || 'image/png',
        });
        onImageSelected(dataUri, {
          name: file.name,
          sizeBytes: file.size,
          mimeType: file.type || 'image/png',
        });
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  // Global clipboard paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled || !e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageMeta(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImageCleared();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {image ? (
        /* Image Preview Box */
        <div className="relative rounded-2xl border border-slate-700 bg-slate-900/90 overflow-hidden shadow-xl group">
          <div className="relative max-h-96 w-full flex items-center justify-center bg-slate-950 p-2 overflow-hidden">
            <img
              src={image}
              alt="Uploaded Error Screenshot"
              className="max-h-80 w-auto object-contain rounded-lg shadow-md"
            />
          </div>

          {/* Metadata bar */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              <span className="font-medium truncate max-w-xs">{imageMeta?.name || 'Screenshot'}</span>
              {imageMeta && (
                <span className="text-slate-500">
                  • {(imageMeta.sizeBytes / 1024).toFixed(1)} KB • {imageMeta.mimeType}
                </span>
              )}
            </div>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              title="Remove this screenshot"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Replace</span>
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UploadCloud className="h-7 w-7" />
            </div>

            <div>
              <p className="text-base font-semibold text-white">
                Drop your error screenshot here, or <span className="text-indigo-400 underline underline-offset-4">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PNG, JPEG, WebP up to 10MB • Or paste directly with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">Ctrl+V</kbd>
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Terminals • Browser Consoles • IDEs • Compiler Logs</span>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-2.5 flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
