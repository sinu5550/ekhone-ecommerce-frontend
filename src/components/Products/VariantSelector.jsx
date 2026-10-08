'use client';

import { useState, useEffect } from 'react';
import {
    extractVariantOptions,
    findMatchingVariant,
    getDefaultVariant,
    isHexColor,
    getColorName
} from '@/lib/variantHelpers';

export default function VariantSelector({ product, onVariantChange, className = '' }) {
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [variantOptions, setVariantOptions] = useState([]);

    useEffect(() => {
        const options = extractVariantOptions(product);
        setVariantOptions(options);

        const defaultVariant = getDefaultVariant(product);
        if (defaultVariant && defaultVariant.attributes) {
            setSelectedAttributes(defaultVariant.attributes);
            onVariantChange(defaultVariant, defaultVariant.attributes);
        }
    }, [product]);

    useEffect(() => {
        if (Object.keys(selectedAttributes).length === variantOptions.length && variantOptions.length > 0) {
            const matchingVariant = findMatchingVariant(product, selectedAttributes);
            if (matchingVariant) {
                onVariantChange(matchingVariant, selectedAttributes);
            } else {
                onVariantChange(null, selectedAttributes);
            }
        }
    }, [selectedAttributes, product, variantOptions.length]);

    const handleAttributeSelect = (attributeName, value) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attributeName]: value
        }));
    };

    if (!variantOptions.length) return null;

    return (
        <div className={`space-y-4 ${className}`}>
            {variantOptions.map((option) => {
                const isColorAttribute = option.attributeName.toLowerCase().includes('color') ||
                    option.attributeName.toLowerCase().includes('colour') ||
                    option.attributeName.toLowerCase().includes('কালার') ||
                    option.attributeName.toLowerCase().includes('রং');

                const selectedValue = selectedAttributes[option.attributeName];

                return (
                    <div key={option.attributeName} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm font-semibold text-gray-800 capitalize">
                                {option.attributeName}:{' '}
                                <span className="text-[#F45116] font-bold">
                                    {isHexColor(selectedValue) ? getColorName(selectedValue) : selectedValue || 'Choose'}
                                </span>
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {option.values.map((value) => {
                                const isSelected = selectedValue === value;
                                const isHex = isHexColor(value);

                                if (isHex || isColorAttribute) {
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => handleAttributeSelect(option.attributeName, value)}
                                            className={`group relative flex items-center gap-2 p-1.5 md:p-2 rounded-xl border text-xs md:text-sm transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#F45116] bg-[#F45116]/10 shadow-xs'
                                                    : 'border-gray-200 bg-white hover:border-gray-400'
                                            }`}
                                            title={getColorName(value)}
                                        >
                                            <span
                                                className="w-5 h-5 rounded-full border border-black/15 shadow-inner shrink-0"
                                                style={{ backgroundColor: isHex ? value : '#e5e7eb' }}
                                            />
                                            <span className="font-medium text-gray-800 pr-1">
                                                {getColorName(value)}
                                            </span>
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleAttributeSelect(option.attributeName, value)}
                                        className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl border text-xs md:text-sm font-medium transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-[#F45116] bg-[#F45116] text-white shadow-xs font-semibold'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        {value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
