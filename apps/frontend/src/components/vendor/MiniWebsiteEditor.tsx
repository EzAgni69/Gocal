import React, { useState } from 'react';
import { Save, Instagram, Facebook, MessageCircle, Twitter, Youtube, Clock, Palette, MapPin, Plus, Trash2 } from 'lucide-react';
import { MiniWebsiteConfig, Vendor } from '../../types';
import { updateVendor } from '../../services/vendorService';
import { Button } from '../ui/Button';

interface MiniWebsiteEditorProps {
    vendor: Vendor;
    onUpdate?: (updatedVendor: Vendor) => void;
}

export const MiniWebsiteEditor: React.FC<MiniWebsiteEditorProps> = ({ vendor, onUpdate }) => {
    const [config, setConfig] = useState<MiniWebsiteConfig>(vendor.miniWebsiteConfig || {});
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await updateVendor(vendor.id, { miniWebsiteConfig: config });
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

                {/* Appearance & Branding */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Palette className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-serif">Branding</h4>
                    </div>
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Primary Theme Color</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="color"
                                    value={config.theme?.primaryColor || '#000000'}
                                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                                    className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-sm font-mono text-gray-600">{config.theme?.primaryColor || '#000000'}</span>
                            </div>
                        </div>
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
