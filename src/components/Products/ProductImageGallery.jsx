"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaSearchPlus } from "react-icons/fa";
import MobileImageLightbox from "@/components/Modal/MobileImageLightbox";

export default function ProductImageGallery({ images = [], productName = "" }) {
  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setSelectedImage(0);
  }, [images]);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  const handleImageClick = () => {
    if (validImages.length > 0) {
      setIsModalOpen(true);
    }
  };

  const hasImages = validImages.length > 0;
  const currentImage = validImages[selectedImage] || validImages[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 items-start w-full">
      {/* Thumbnail Images on Left */}
      {validImages.length >= 1 && (
        <div className="flex md:flex-col gap-2.5 md:gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[550px] hide-scrollbar shrink-0 w-full md:w-auto">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative shrink-0 w-16 md:w-20 h-16 md:h-20 border rounded-xl overflow-hidden transition-all cursor-pointer ${
                selectedImage === index
                  ? "border-[#F45116] shadow-md ring-2 ring-[#F45116]/30"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="(max-width: 768px) 64px, 80px"
                className="object-cover p-0.5"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Container with zoom (1:1 ratio, p-1, matching edge rounding) */}
      <div
        className={`relative flex-1 w-full aspect-square overflow-hidden bg-gray-50 rounded-2xl border border-gray-200 p-1 group ${
          hasImages ? "cursor-pointer md:cursor-crosshair" : "flex items-center justify-center"
        }`}
        onMouseMove={hasImages ? handleMouseMove : undefined}
        onMouseEnter={hasImages ? () => setIsZoomed(true) : undefined}
        onMouseLeave={hasImages ? () => setIsZoomed(false) : undefined}
        onClick={handleImageClick}
      >
        {hasImages && currentImage ? (
          <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden">
            <Image
              src={currentImage}
              alt={`${productName} - Image ${selectedImage + 1}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover rounded-xl sm:rounded-2xl transition-transform duration-300 ease-out"
              style={{
                transform: isZoomed ? "scale(1.6)" : "scale(1)",
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
              }}
            />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 pointer-events-none rounded-xl sm:rounded-2xl" />

            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block z-10">
              <FaSearchPlus className="text-gray-700 text-sm" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-2 select-none">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">No Image Available</span>
          </div>
        )}
      </div>

      {/* Mobile Fullscreen Lightbox Modal */}
      {hasImages && (
        <MobileImageLightbox
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={validImages}
          currentIndex={selectedImage}
          onIndexChange={setSelectedImage}
          productName={productName}
        />
      )}
    </div>
  );
}
