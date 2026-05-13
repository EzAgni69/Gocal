import React, { useState, useEffect } from 'react';
import { X, Upload, ImageIcon, Package } from 'lucide-react';
import { Product, VendorCategoryConfig } from '../types';
import { VENDOR_CATEGORY_CONFIG, UNIT_OPTIONS, CATEGORIES } from '../constants';
import Image from 'next/image';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    vendorCategory: string;
    editProduct?: Product | null;
}

const DEFAULT_PLACEHOLDER = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image';

export const AddProductModal: React.FC<AddProductModalProps> = ({
    isOpen,
    onClose,
    onSave,
    vendorCategory,
    editProduct,
}) => {
    const config: VendorCategoryConfig = VENDOR_CATEGORY_CONFIG[vendorCategory] || {
        requiresImage: false,
        showQuantity: false,
        showUnit: false,
        showMinOrder: false,
        showSku: false,
        showDescription: true,
    };

    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        price: 0,
        category: '',
        description: '',
        image: '',
        quantity: undefined,
        unit: config.defaultUnit || '',
        minOrderQty: undefined,
        sku: '',
        inStock: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imagePreview, setImagePreview] = useState<string>('');

    useEffect(() => {
        if (editProduct) {
            setFormData({
                ...editProduct,
                unit: editProduct.unit || config.defaultUnit || '',
            });
            setImagePreview(editProduct.image || '');
        } else {
            setFormData({
                name: '',
                price: 0,
                category: '',
                description: '',
                image: '',
                quantity: undefined,
                unit: config.defaultUnit || '',
                minOrderQty: undefined,
                sku: '',
                inStock: true,
            });
            setImagePreview('');
        }
    }, [editProduct, isOpen, config.defaultUnit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        let processedValue: string | number | boolean = value;
        if (type === 'number') {
            processedValue = value === '' ? 0 : parseFloat(value);
        } else if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required: Name
        if (!formData.name?.trim()) {
            newErrors.name = 'Product name is required';
        }

        // Required: Price
        if (!formData.price || formData.price <= 0) {
            newErrors.price = 'Valid price is required';
        }

        // Required: Category
        if (!formData.category?.trim()) {
            newErrors.category = 'Product category is required';
        }

        // Conditional: Image required for certain vendor types
        if (config.requiresImage && !formData.image?.trim()) {
            newErrors.image = 'Image is required for this vendor type';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const product: Product = {
            id: editProduct?.id || `p-${Date.now()}`,
            name: formData.name!.trim(),
            price: formData.price!,
            category: formData.category!.trim(),
            image: formData.image?.trim() || undefined,
            description: formData.description?.trim() || undefined,
            quantity: config.showQuantity ? formData.quantity : undefined,
            unit: config.showUnit ? formData.unit : undefined,
            minOrderQty: config.showMinOrder ? formData.minOrderQty : undefined,
            sku: config.showSku ? formData.sku?.trim() : undefined,
            inStock: formData.inStock ?? true,
        };

        onSave(product);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-serif text-gray-800">
                        {editProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Image Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Product Image {config.requiresImage ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
                        </label>
                        <div className="flex gap-4">
                            <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" onError={() => setImagePreview('')} />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="url"
                                    name="image"
                                    value={formData.image || ''}
                                    onChange={handleImageUrlChange}
                                    placeholder="Paste image URL..."
                                    className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-gold-400 outline-none ${errors.image ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {!config.requiresImage && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 A placeholder will be shown if no image is provided
                                    </p>
                                )}
                                {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Name - Always Required */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            placeholder="e.g., Fresh Mangoes, Gold Necklace..."
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold-400 outline-none ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Price & Quantity Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price || ''}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold-400 outline-none ${errors.price ? 'border-red-400' : 'border-gray-300'}`}
                            />
                            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                        </div>

                        {config.showQuantity && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Available Stock
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity || ''}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Stock qty"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Unit & Min Order Row - For Fruits/Grocery */}
                    {(config.showUnit || config.showMinOrder) && (
                        <div className="grid grid-cols-2 gap-4">
                            {config.showUnit && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Unit
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit || config.defaultUnit || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 outline-none bg-white"
                                    >
                                        {UNIT_OPTIONS.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {config.showMinOrder && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Min. Order Qty
                                    </label>
                                    <input
                                        type="number"
                                        name="minOrderQty"
                                        value={formData.minOrderQty || ''}
                                        onChange={handleChange}
                                        min="1"
                                        placeholder="e.g., 1"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Product Category <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category || ''}
                            onChange={handleChange}
                            placeholder="e.g., Fruits, Rings, T-Shirts..."
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-gold-400 outline-none ${errors.category ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                    </div>

                    {/* SKU - For inventory-tracked vendors */}
                    {config.showSku && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                SKU <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku || ''}
                                onChange={handleChange}
                                placeholder="e.g., JWL-RING-001"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 outline-none"
                            />
                        </div>
                    )}

                    {/* Description - Optional for simpler vendors */}
                    {config.showDescription && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Description <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Brief product description..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-400 outline-none resize-none"
                            />
                        </div>
                    )}

                    {/* In Stock Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="inStock"
                            id="inStock"
                            checked={formData.inStock ?? true}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                        />
                        <label htmlFor="inStock" className="text-sm font-medium text-gray-700">
                            Item is currently in stock
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3 bg-luxury-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Package className="w-4 h-4" />
                        {editProduct ? 'Update Product' : 'Add Product'}
                    </button>
                </form>
            </div>
        </div>
    );
};
