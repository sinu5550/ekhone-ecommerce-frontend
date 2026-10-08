'use client';

import { useState } from 'react';
import { Truck, MapPin, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ProductTabs({ product, selectedVariant = null }) {
    const [activeTab, setActiveTab] = useState('description');

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'specifications', label: 'Specifications' },
        { id: 'delivery', label: 'Delivery & Returns' },
    ];

    const currentSku = selectedVariant?.sku || product?.sku || 'N/A';

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 overflow-x-auto hide-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`text-xs md:text-sm px-5 py-3.5 font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                            activeTab === tab.id
                                ? 'bg-white text-[#F45116] border-[#F45116]'
                                : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 md:p-8">
                {activeTab === 'description' && (
                    <div
                        className="prose max-w-none text-gray-700 text-sm md:text-base leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: product.description || '<p>No detailed description provided for this product.</p>',
                        }}
                    />
                )}

                {activeTab === 'specifications' && (
                    <div className="space-y-3 text-xs md:text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-semibold text-gray-700">SKU:</span>
                                <span className="text-gray-600 font-mono">{currentSku}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-semibold text-gray-700">Brand:</span>
                                <span className="text-gray-600">{product.brand?.name || product.brandName || 'Authentic'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-semibold text-gray-700">Category:</span>
                                <span className="text-gray-600">{product.subCategory?.category?.name || product.category || 'General'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-semibold text-gray-700">Subcategory:</span>
                                <span className="text-gray-600">{product.subCategory?.name || 'General'}</span>
                            </div>
                            {product.unit?.name && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="font-semibold text-gray-700">Unit:</span>
                                    <span className="text-gray-600">{product.unit.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-semibold text-gray-700">Stock Status:</span>
                                <span className={product.status ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                                    {product.status ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'delivery' && (
                    <div className="space-y-6 text-sm text-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100 flex items-start gap-3.5">
                                <Truck className="w-5 h-5 text-[#F45116] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Fast Nationwide Delivery</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Inside Dhaka: 1-2 business days (৳{product.insideDhakaDeliveryCharge ?? 70})<br />
                                        Outside Dhaka: 2-4 business days (৳{product.outsideDhakaDeliveryCharge ?? 130})
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                                <RefreshCw className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Hassle-Free Returns</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Check the product in front of the delivery agent. Instant return available if damaged or mismatched.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                            <span>100% genuine and verified original products directly sourced from verified distributors.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
