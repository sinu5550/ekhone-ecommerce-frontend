'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Building, Home, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/apiClient';
import Swal from 'sweetalert2';
import { divisions, districts, upazilas } from "@/lib/data";

const AddressEditDrawer = ({ isOpen, onClose, address, onSuccess }) => {
    const [formData, setFormData] = useState({
        recipientName: '',
        phoneNumber: '',
        address: '',
        upazila: '',
        postalCode: '',
        district: '',
        division: '',
        city: '',
        country: 'Bangladesh',
        type: 'Home',
        isDefault: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredUpazilas, setFilteredUpazilas] = useState([]);

    // Initialize form with address data when drawer opens
    useEffect(() => {
        if (address && isOpen) {
            const initialData = {
                recipientName: address.recipientName || '',
                phoneNumber: address.phoneNumber || '',
                address: address.address || '',
                upazila: address.upazila || '',
                postalCode: address.postalCode || '',
                district: address.district || '',
                division: address.division || '',
                city: address.city || address.division || '',
                country: address.country || 'Bangladesh',
                type: address.type || 'Home',
                isDefault: address.isDefault || false
            };

            setFormData(initialData);
            setErrors({});

            // Trigger district filtering based on division
            if (address.division) {
                const divisionData = divisions.find((div) => div.name === address.division);
                if (divisionData) {
                    const districtList = districts.filter(
                        (dist) => dist.division_id === divisionData.id
                    );
                    setFilteredDistricts(districtList);
                }
            }

            // Trigger upazila filtering based on district
            if (address.district) {
                const districtData = districts.find((dist) => dist.name === address.district);
                if (districtData) {
                    const upazilaList = upazilas.filter(
                        (upazila) => upazila.district_id === districtData.id
                    );
                    setFilteredUpazilas(upazilaList);
                }
            }

            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [address, isOpen]);

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting]);

    // Filter districts based on selected division
    useEffect(() => {
        if (formData.division) {
            const divisionData = divisions.find((div) => div.name === formData.division);
            if (divisionData) {
                const districtList = districts.filter(
                    (dist) => dist.division_id === divisionData.id
                );
                setFilteredDistricts(districtList);
            }
        }
    }, [formData.division]);

    // Filter upazilas based on selected district
    useEffect(() => {
        if (formData.district) {
            const districtData = districts.find((dist) => dist.name === formData.district);
            if (districtData) {
                const upazilaList = upazilas.filter(
                    (upazila) => upazila.district_id === districtData.id
                );
                setFilteredUpazilas(upazilaList);
            }
        }
    }, [formData.district]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.recipientName?.trim()) {
            newErrors.recipientName = 'Recipient name is required';
        } else if (formData.recipientName.trim().length < 2) {
            newErrors.recipientName = 'Recipient name must be at least 2 characters';
        }

        if (!formData.phoneNumber?.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^(?:\+88|01)?\d{9,11}$/.test(formData.phoneNumber.trim().replace(/\s+/g, ''))) {
            newErrors.phoneNumber = 'Invalid Bangladeshi phone number (e.g., 017XXXXXXXX)';
        }

        if (!formData.address.trim()) newErrors.address = 'Street address is required';
        if (!formData.division) newErrors.division = 'Division is required';
        if (!formData.district) newErrors.district = 'District is required';
        if (!formData.upazila) newErrors.upazila = 'Upazila/Thana is required';
        if (!formData.postalCode.trim()) {
            newErrors.postalCode = 'Postal code is required';
        } else if (!/^\d{4}$/.test(formData.postalCode.trim())) {
            newErrors.postalCode = 'Postal code must be 4 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (!address || !address.id) {
                throw new Error('No address selected for editing');
            }

            const payload = {
                recipientName: formData.recipientName.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                address: formData.address.trim(),
                upazila: formData.upazila,
                postalCode: formData.postalCode.trim(),
                district: formData.district,
                division: formData.division,
                city: formData.city?.trim() || formData.division,
                country: formData.country || 'Bangladesh',
                type: formData.type || 'Home',
                isDefault: formData.isDefault
            };

            const result = await apiClient(`/api/customer/addresses/${address.id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });

            // Handle unwrapped address object or standard response wrapper
            if (result && (result.id || result.success || result.data || result.message === 'Address updated successfully')) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Address updated successfully',
                    confirmButtonColor: '#F45116',
                    timer: 1500,
                    showConfirmButton: false
                });

                if (onSuccess) {
                    await onSuccess();
                }

                onClose();
            } else {
                throw new Error(result?.message || 'Failed to update address');
            }
        } catch (error) {
            console.error('Edit address error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update address',
                confirmButtonColor: '#F45116'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] overflow-hidden flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        key="address-edit-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={!isSubmitting ? handleClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer z-[99999]"
                    />

                    {/* Drawer Slide-Over Panel */}
                    <motion.div
                        key="address-edit-panel"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 260 }}
                        className="relative w-full max-w-lg md:max-w-xl bg-white h-full h-[100dvh] max-h-[100dvh] flex flex-col shadow-2xl z-[100000] overflow-hidden font-outfit"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#F45116]/10 flex items-center justify-center text-[#F45116]">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#F45116] bg-[#F45116]/5 px-2 py-0.5 rounded-full">
                                            Update Details
                                        </span>
                                    </div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                                        Edit Shipping Address
                                    </h2>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-black transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Drawer Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 overscroll-contain">
                            <form id="address-edit-drawer-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Recipient Name */}
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Recipient Name <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <User size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                name="recipientName"
                                                value={formData.recipientName}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50/70 border rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none transition-all ${
                                                    errors.recipientName
                                                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                        : 'border-gray-200 focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15'
                                                }`}
                                                placeholder="Full name of recipient"
                                            />
                                        </div>
                                        {errors.recipientName && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.recipientName}</p>
                                        )}
                                    </div>

                                    {/* Phone Number */}
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Phone Number <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <Phone size={16} />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50/70 border rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none transition-all ${
                                                    errors.phoneNumber
                                                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                        : 'border-gray-200 focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15'
                                                }`}
                                                placeholder="01XXXXXXXXX"
                                            />
                                        </div>
                                        {errors.phoneNumber && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phoneNumber}</p>
                                        )}
                                    </div>

                                    {/* Division */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Division <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="division"
                                            value={formData.division}
                                            onChange={(e) => handleSelectChange('division', e.target.value)}
                                            disabled={isSubmitting}
                                            className={`w-full px-3.5 py-2.5 bg-gray-50/70 border rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none transition-all cursor-pointer ${
                                                errors.division
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-gray-200 focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15'
                                            }`}
                                        >
                                            <option value="">Select Division</option>
                                            {divisions.map((division) => (
                                                <option key={division.id} value={division.name}>
                                                    {division.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.division && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.division}</p>
                                        )}
                                    </div>

                                    {/* District */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            District <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="district"
                                            value={formData.district}
                                            onChange={(e) => handleSelectChange('district', e.target.value)}
                                            disabled={!formData.division || isSubmitting}
                                            className={`w-full px-3.5 py-2.5 bg-gray-50/70 border rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                                errors.district
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-gray-200 focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15'
                                            }`}
                                        >
                                            <option value="">
                                                {formData.division ? "Select District" : "Select Division First"}
                                            </option>
                                            {filteredDistricts.map((district) => (
                                                <option key={district.id} value={district.name}>
                                                    {district.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.district && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.district}</p>
                                        )}
                                    </div>

                                    {/* Upazila */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Upazila/Thana <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="upazila"
                                            value={formData.upazila}
                                            onChange={(e) => handleSelectChange('upazila', e.target.value)}
                                            disabled={!formData.district || isSubmitting}
                                            className={`w-full px-3.5 py-2.5 bg-gray-50/70 border rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                                errors.upazila
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-gray-200 focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15'
                                            }`}
                                        >
                                            <option value="">
                                                {formData.district ? "Select Upazila / Thana" : "Select District First"}
                                            </option>
                                            {filteredUpazilas.map((upazila) => (
                                                <option key={upazila.id} value={upazila.name}>
                                                    {upazila.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.upazila && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.upazila}</p>
                                        )}
                                    </div>

                                    {/* Postal Code */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Postal Code <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            maxLength="4"
                                            className={`w-full px-3.5 py-2.5 bg-gray-50/70 border rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none transition-all ${
                                                errors.postalCode
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-gray-200 focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15'
                                            }`}
                                            placeholder="e.g. 1216"
                                        />
                                        {errors.postalCode && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.postalCode}</p>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15 transition-all"
                                            placeholder="City name"
                                        />
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            readOnly
                                            className="w-full px-3.5 py-2.5 bg-gray-100/70 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Full Street Address */}
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Street Address / Landmark <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows="3"
                                            disabled={isSubmitting}
                                            className={`w-full px-3.5 py-2.5 bg-gray-50/70 border rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none transition-all ${
                                                errors.address
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-gray-200 focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/15'
                                            }`}
                                            placeholder="House No, Road No, Area, Apartment Details"
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.address}</p>
                                        )}
                                    </div>

                                    {/* Address Type */}
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                                            Address Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { value: 'Home', label: 'Home', icon: Home },
                                                { value: 'Office', label: 'Office', icon: Building },
                                                { value: 'Other', label: 'Other', icon: MapPin }
                                            ].map(({ value, label, icon: Icon }) => {
                                                const isSelected = formData.type === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => handleSelectChange('type', value)}
                                                        disabled={isSubmitting}
                                                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'border-[#F45116] bg-[#F45116]/5 text-[#F45116] font-bold shadow-xs'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <Icon size={16} className={isSelected ? 'text-[#F45116]' : 'text-gray-400'} />
                                                        <span className="text-xs md:text-sm">{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Set as Default */}
                                    <div className="col-span-1 md:col-span-2 pt-2">
                                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                name="isDefault"
                                                checked={formData.isDefault}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className="w-4 h-4 rounded text-[#F45116] focus:ring-[#F45116] border-gray-300 transition-colors cursor-pointer accent-[#F45116]"
                                            />
                                            <span className="text-xs md:text-sm text-gray-700 font-medium">
                                                Set as default shipping address
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Drawer Sticky Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm flex items-center justify-end gap-3 flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-semibold text-xs md:text-sm hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="address-edit-drawer-form"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-[#F45116] hover:bg-[#D9400B] text-white font-semibold text-xs md:text-sm rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Update Address</span>
                                        <ArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddressEditDrawer;
