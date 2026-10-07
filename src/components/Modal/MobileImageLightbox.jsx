'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaSearchPlus,
    FaSearchMinus,
    FaUndo,
} from 'react-icons/fa';

export default function MobileImageLightbox({
    isOpen,
    onClose,
    images = [],
    currentIndex = 0,
    onIndexChange,
    productName = 'Product'
}) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isGesturing, setIsGesturing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef(null);
    const lastTapTime = useRef(0);
    const initialPinchDist = useRef(0);
    const initialPinchScale = useRef(1);
    const lastTouchPos = useRef({ x: 0, y: 0 });
    const swipeStartX = useRef(0);
    const swipeStartY = useRef(0);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const currentScaleRef = useRef(1);
    const currentPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        currentScaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
        currentPosRef.current = position;
    }, [position]);

    const resetZoom = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        currentScaleRef.current = 1;
        currentPosRef.current = { x: 0, y: 0 };
    }, []);

    useEffect(() => {
        resetZoom();
    }, [currentIndex, isOpen, resetZoom]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && images.length > 1) {
                onIndexChange((currentIndex - 1 + images.length) % images.length);
            }
            if (e.key === 'ArrowRight' && images.length > 1) {
                onIndexChange((currentIndex + 1) % images.length);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex, images.length, onClose, onIndexChange]);

    if (!isOpen || !images.length) return null;

    const currentImage = images[currentIndex] || images[0];

    const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between select-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 text-white z-10">
                <span className="text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                </span>
                <div className="flex items-center gap-4">
                    <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded-full cursor-pointer" title="Zoom In">
                        <FaSearchPlus size={16} />
                    </button>
                    <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded-full cursor-pointer" title="Zoom Out">
                        <FaSearchMinus size={16} />
                    </button>
                    <button onClick={resetZoom} className="p-2 hover:bg-white/10 rounded-full cursor-pointer" title="Reset Zoom">
                        <FaUndo size={14} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full cursor-pointer" title="Close">
                        <FaTimes size={18} />
                    </button>
                </div>
            </div>

            {/* Main Image Area */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden p-2">
                <div 
                    className="relative w-full h-full max-h-[85vh] transition-transform duration-100 ease-out"
                    style={{
                        transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                    }}
                >
                    <Image
                        src={currentImage}
                        alt={`${productName} full view`}
                        fill
                        sizes="100vw"
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Left Arrow */}
                {images.length > 1 && (
                    <button
                        onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all cursor-pointer z-10"
                    >
                        <FaChevronLeft size={18} />
                    </button>
                )}

                {/* Right Arrow */}
                {images.length > 1 && (
                    <button
                        onClick={() => onIndexChange((currentIndex + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all cursor-pointer z-10"
                    >
                        <FaChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* Bottom Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto justify-center bg-black/40 z-10">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => onIndexChange(idx)}
                            className={`relative w-12 h-12 rounded border overflow-hidden shrink-0 cursor-pointer ${
                                currentIndex === idx ? 'border-[#F45116] scale-105' : 'border-white/20 opacity-60'
                            }`}
                        >
                            <Image src={img} alt="thumbnail" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
