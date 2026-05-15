import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ImageLightbox({ currentIndex, images, onClose, onNext, onPrev }) {
  if (currentIndex === null) return null;

  const currentImage = images[currentIndex];
  const src = currentImage?.kind === "url" ? currentImage.url : currentImage?.previewUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={onClose}>
      <div className="relative max-h-screen max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={`Contract ${currentIndex + 1}`} className="h-full w-full object-contain rounded-lg" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-600 p-2 text-white hover:bg-slate-700"
        >
          <X className="h-6 w-6" />
        </button>

        {currentIndex > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-600 p-2 text-white hover:bg-slate-700"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {currentIndex < images.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-600 p-2 text-white hover:bg-slate-700"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-semibold text-white">
          {currentIndex + 1}/{images.length}
        </p>
      </div>
    </div>
  );
}
