"use client";

import { useState, useCallback, useEffect } from "react";
import { VanPhoto } from "@/components/public/van-photo";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";

interface Image {
  url: string;
  alt: string;
}

interface VanGalleryProps {
  images: Image[];
  slug: string;
}

export function VanGallery({ images, slug }: VanGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextImage, prevImage]);

  if (!images.length) return null;

  const activeImage = images[activeIndex];

  return (
    <div>
      {/* Main Image */}
      <div 
        className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted cursor-pointer group"
        onClick={() => setIsLightboxOpen(true)}
      >
        <span 
          className="relative block size-full" 
          style={{ viewTransitionName: `van-photo-${slug}` } as React.CSSProperties}
        >
          <VanPhoto
            src={activeImage.url}
            alt={activeImage.alt}
            slug={slug}
            shot="side-profile"
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </span>
        
        {/* Overlay icon to indicate clickability */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white p-3 rounded-full backdrop-blur-sm">
            <Maximize2 className="size-6" />
          </div>
        </div>

        {/* Navigation Arrows for main image (only if > 1 image) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {images.map((img, idx) => (
            <li
              key={img.url}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
                idx === activeIndex ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              } bg-muted`}
              onClick={() => setActiveIndex(idx)}
            >
              <VanPhoto src={img.url} alt={img.alt} slug={slug} sizes="15vw" />
            </li>
          ))}
        </ul>
      )}

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X className="size-6" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-8" />
                </button>
              </>
            )}

            <div 
              className="relative w-full max-w-6xl max-h-[85vh] aspect-auto flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.url}
                alt={activeImage.alt}
                className="max-w-full max-h-[85vh] object-contain rounded-md"
              />
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
              {activeIndex + 1} / {images.length}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
