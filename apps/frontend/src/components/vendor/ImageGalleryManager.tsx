import React, { useState } from 'react';
import { Plus, X, Image as ImageIcon, Trash2, Edit2, GripVertical, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryImage } from '../../types';
import { addGalleryImage, removeGalleryImage, updateGalleryImage } from '../../services/vendorService';
import { Button } from '../ui/Button';
import Image from 'next/image';

interface ImageGalleryManagerProps {
    vendorId: string;
    initialImages: GalleryImage[];
}

export const ImageGalleryManager: React.FC<ImageGalleryManagerProps> = ({ vendorId, initialImages }) => {
    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [editCaption, setEditCaption] = useState('');

    const handleAddImage = async () => {
        const url = prompt('Enter image URL (In production, this would be a file upload)');
        if (!url) return;

        setIsUploading(true);
        try {
            const result = await addGalleryImage(vendorId, url, '', images.length);
            setImages([...images, result.image]);
        } catch (error) {
            console.error('Failed to add image:', error);
            alert('Failed to add image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = async (imageId: string) => {
        if (!confirm('Are you sure you want to remove this image?')) return;

        try {
            await removeGalleryImage(vendorId, imageId);
            setImages(images.filter(img => img.id !== imageId));
        } catch (error) {
            console.error('Failed to remove image:', error);
            alert('Failed to remove image');
        }
    };

    const handleStartEdit = (image: GalleryImage) => {
        setEditingImageId(image.id);
        setEditCaption(image.caption || '');
    };

    const handleSaveEdit = async () => {
        if (!editingImageId) return;

        try {
            await updateGalleryImage(vendorId, editingImageId, editCaption);
            setImages(images.map(img => img.id === editingImageId ? { ...img, caption: editCaption } : img));
            setEditingImageId(null);
        } catch (error) {
            console.error('Failed to update image:', error);
            alert('Failed to update image');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-serif text-gray-800">Gallery</h3>
                    <p className="text-sm text-gray-500">Showcase your products and store atmosphere.</p>
                </div>
                <Button 
                    onClick={handleAddImage} 
                    disabled={isUploading}
                    className="bg-black text-white hover:bg-gray-800 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Add Image'}
                </Button>
            </div>

            {images.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium text-gray-500">No gallery images yet</p>
                    <p className="text-sm">Click "Add Image" to start building your gallery.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => (
                            <motion.div
                                key={img.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500"
                            >
                                <div className="aspect-[4/5] relative overflow-hidden">
                                    <Image 
                                        src={img.imageUrl} 
                                        alt={img.caption || 'Gallery image'} 
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                                    
                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        <button 
                                            onClick={() => handleStartEdit(img)}
                                            className="p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white hover:text-black transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleRemoveImage(img.id)}
                                            className="p-2 bg-red-500/90 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Grip icon for future drag & drop */}
                                    <div className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="p-4">
                                    {editingImageId === img.id ? (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={editCaption}
                                                onChange={(e) => setEditCaption(e.target.value)}
                                                placeholder="Enter caption..."
                                                className="flex-1 bg-gray-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                                                autoFocus
                                            />
                                            <button 
                                                onClick={handleSaveEdit}
                                                className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setEditingImageId(null)}
                                                className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 font-light truncate italic">
                                            {img.caption || 'No caption added'}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
