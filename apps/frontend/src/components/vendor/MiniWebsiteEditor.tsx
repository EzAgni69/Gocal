import React, { useState } from 'react';
import { Save, Instagram, Facebook, MessageCircle, Twitter, Youtube, Clock, Palette, MapPin, Plus, Trash2, Upload, QrCode } from 'lucide-react';
import Image from 'next/image';
import { MiniWebsiteConfig, Vendor } from '../../types';
import { updateVendor } from '../../services/vendorService';
import { apiClient } from '../../services/apiClient';
import { Button } from '../ui/Button';

interface MiniWebsiteEditorProps {
    vendor: Vendor;
    onUpdate?: (updatedVendor: Vendor) => void;
}

export const MiniWebsiteEditor: React.FC<MiniWebsiteEditorProps> = ({ vendor, onUpdate }) => {
    const [config, setConfig] = useState<MiniWebsiteConfig>(vendor.miniWebsiteConfig || {});
    const [openingHours, setOpeningHours] = useState(vendor.openingHours || {});
    const [isSaving, setIsSaving] = useState(false);
    const [qrUploading, setQrUploading] = useState(false);
    const [qrError, setQrError] = useState<string | null>(null);

    const qrInputRef = React.useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await updateVendor(vendor.id, { 
                miniWebsiteConfig: config,
                openingHours: openingHours
            });
            if (onUpdate) onUpdate(updated);
            alert('Mini-website settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const updateSocial = (platform: keyof NonNullable<MiniWebsiteConfig['socialLinks']>, value: string) => {
        setConfig({
            ...config,
            socialLinks: {
                ...(config.socialLinks || {}),
                [platform]: value
            }
        });
    };

    const addSection = () => {
        const sections = [...(config.customSections || []), { title: 'New Section', content: '' }];
        setConfig({ ...config, customSections: sections });
    };

    const updateSection = (index: number, field: 'title' | 'content', value: string) => {
        const sections = [...(config.customSections || [])];
        sections[index] = { ...sections[index], [field]: value };
        setConfig({ ...config, customSections: sections });
    };

    const removeSection = (index: number) => {
        const sections = (config.customSections || []).filter((_section, i: number) => i !== index);
        setConfig({ ...config, customSections: sections });
    };

    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setQrError('Only image files are accepted');
            return;
        }
        setQrUploading(true);
        setQrError(null);
        try {
            const form = new FormData();
            form.append('image', file);
            const res = await apiClient('/api/upload/qr-code', { method: 'POST', body: form });
            if (res.ok) {
                const { imageUrl } = await res.json();
                setConfig({ ...config, qrCodeUrl: imageUrl });
            } else {
                const err = await res.json();
                setQrError(err.error || 'Upload failed');
            }
        } catch {
            setQrError('Network error during upload');
        } finally {
            setQrUploading(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-gray-800">Mini-Website Settings</h3>
                    <p className="text-sm text-gray-500">Customize your public presence on Gocal.</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-black text-white px-8 py-3 rounded-full hover:scale-105 transition-all shadow-xl shadow-black/10"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            {/* Brand Copy */}
            <section className="space-y-6 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-lg font-serif">Brand Copy</h4>
                        <p className="text-sm text-gray-500">Personalise the text shown in your mini-website's info section.</p>
                    </div>
                </div>
                <div className="grid gap-6">
                    {/* Business Label */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Business Label</label>
                            <span className="text-xs text-gray-400">{(config.businessLabel || '').length}/100</span>
                        </div>
                        <input
                            type="text"
                            maxLength={100}
                            placeholder="e.g. The Maison"
                            value={config.businessLabel || ''}
                            onChange={(e) => setConfig({ ...config, businessLabel: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                        />
                    </div>
                    {/* Tagline */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tagline</label>
                            <span className="text-xs text-gray-400">{(config.tagline || '').length}/150</span>
                        </div>
                        <input
                            type="text"
                            maxLength={150}
                            placeholder="e.g. Heritage & Elegance"
                            value={config.tagline || ''}
                            onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                        />
                    </div>
                    {/* About Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">About Description</label>
                            <span className="text-xs text-gray-400">{(config.aboutDescription || '').length}/1000</span>
                        </div>
                        <textarea
                            maxLength={1000}
                            placeholder="Describe your business to customers…"
                            value={config.aboutDescription || ''}
                            onChange={(e) => setConfig({ ...config, aboutDescription: e.target.value })}
                            className="w-full min-h-[120px] px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm resize-none"
                        />
                    </div>
                </div>
            </section>

            {/* Payment QR Code */}
            <section className="space-y-6 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-lg font-serif">Payment QR Code</h4>
                        <p className="text-sm text-gray-500">Recommended — helps customers pay you directly. You can change this anytime.</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {config.qrCodeUrl ? (
                        <>
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <Image src={config.qrCodeUrl} alt="Payment QR Code" fill className="object-cover rounded-xl border border-gray-200" />
                            </div>
                            <div className="flex flex-col gap-3">
                                <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                                <button
                                    onClick={() => qrInputRef.current?.click()}
                                    disabled={qrUploading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    <Upload className="w-4 h-4" />
                                    {qrUploading ? 'Uploading…' : 'Replace QR Code'}
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, qrCodeUrl: undefined })}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-100 bg-red-50 text-sm text-red-600 hover:bg-red-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove QR Code
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                <QrCode className="w-10 h-10 text-gray-300" />
                            </div>
                            <div>
                                <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                                <button
                                    onClick={() => qrInputRef.current?.click()}
                                    disabled={qrUploading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    <Upload className="w-4 h-4" />
                                    {qrUploading ? 'Uploading…' : 'Upload QR Code'}
                                </button>
                                <p className="text-xs text-gray-400 mt-2">JPEG, PNG, WebP or GIF · Max 5 MB</p>
                            </div>
                        </div>
                    )}
                </div>
                {qrError && <p className="text-sm text-red-500">{qrError}</p>}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Social Links */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                            <Instagram className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-serif">Social Presence</h4>
                    </div>
                    <div className="grid gap-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Instagram className="w-4 h-4" />
                            </span>
                            <input 
                                type="text"
                                placeholder="Instagram Profile URL"
                                value={config.socialLinks?.instagram || ''}
                                onChange={(e) => updateSocial('instagram', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <MessageCircle className="w-4 h-4" />
                            </span>
                            <input 
                                type="text"
                                placeholder="WhatsApp Number"
                                value={config.socialLinks?.whatsapp || ''}
                                onChange={(e) => updateSocial('whatsapp', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Facebook className="w-4 h-4" />
                            </span>
                            <input 
                                type="text"
                                placeholder="Facebook Page URL"
                                value={config.socialLinks?.facebook || ''}
                                onChange={(e) => updateSocial('facebook', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </section>

                {/* Location & Hours */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-serif">Location & Hours</h4>
                    </div>
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Google Maps Location URL</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                </span>
                                <input 
                                    type="text"
                                    placeholder="Paste Google Maps link here"
                                    value={config.googleMapsUrl || ''}
                                    onChange={(e) => setConfig({ ...config, googleMapsUrl: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Business Hours</label>
                            <input 
                                type="text"
                                placeholder="e.g. Mon-Sat: 10 AM - 8 PM"
                                value={(openingHours as any)?.general?.open || ''}
                                onChange={(e) => setOpeningHours({ ...openingHours, general: { open: e.target.value, close: '' } })}
                                className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Custom Sections */}
            <section className="space-y-8 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-xl font-serif">Custom Content Sections</h4>
                        <p className="text-sm text-gray-500">Add unique stories, policies, or highlights to your page.</p>
                    </div>
                    <Button 
                        onClick={addSection}
                        variant="outline"
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Section
                    </Button>
                </div>

                <div className="grid gap-6">
                    {config.customSections?.map((section, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group relative">
                            <button 
                                onClick={() => removeSection(idx)}
                                className="absolute -top-3 -right-3 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 shadow-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <input 
                                type="text"
                                value={section.title}
                                onChange={(e) => updateSection(idx, 'title', e.target.value)}
                                className="w-full text-lg font-serif mb-4 focus:ring-0 border-none p-0 outline-none text-gray-900 placeholder:text-gray-300"
                                placeholder="Section Title (e.g., Our Story)"
                            />
                            <textarea 
                                value={section.content}
                                onChange={(e) => updateSection(idx, 'content', e.target.value)}
                                className="w-full min-h-[120px] bg-gray-50 border-none rounded-xl p-4 text-gray-600 focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                                placeholder="Describe what makes this section special..."
                            />
                        </div>
                    ))}
                    {(!config.customSections || config.customSections.length === 0) && (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-sm italic">No custom sections added yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
