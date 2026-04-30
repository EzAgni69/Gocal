import React, { useState } from 'react';
import { Save, Sparkles, LayoutTemplate, Type, Palette } from 'lucide-react';
import { MiniWebsiteConfig, Vendor } from '../../types';
import { updateVendor } from '../../services/vendorService';
import { Button } from '../ui/Button';

interface ThemeEditorProps {
    vendor: Vendor;
    onUpdate?: (updatedVendor: Vendor) => void;
}

const FONTS = [
    { id: 'inter', name: 'Inter', className: 'font-sans' },
    { id: 'playfair', name: 'Playfair Display', className: 'font-serif' },
    { id: 'roboto', name: 'Roboto', className: 'font-sans' },
    { id: 'outfit', name: 'Outfit', className: 'font-sans' },
];

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ vendor, onUpdate }) => {
    const [config, setConfig] = useState<MiniWebsiteConfig>(vendor.miniWebsiteConfig || {});
    const [isSaving, setIsSaving] = useState(false);

    const isPremium = vendor.planType === 'card_website' || vendor.isPremium;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await updateVendor(vendor.id, { miniWebsiteConfig: config });
            if (onUpdate) onUpdate(updated);
            alert('Appearance settings saved successfully!');
        } catch (error) {
            console.error('Failed to save theme:', error);
            alert('Failed to save appearance settings');
        } finally {
            setIsSaving(false);
        }
    };

    const updateTheme = (key: keyof NonNullable<MiniWebsiteConfig['theme']>, value: string) => {
        setConfig({
            ...config,
            theme: {
                ...(config.theme || {}),
                [key]: value
            }
        });
    };

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-gray-800">Appearance details</h3>
                    <p className="text-sm text-gray-500">Design your marketplace contact card and full storefront.</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-black text-white px-8 py-3 rounded-full hover:scale-105 transition-all shadow-xl shadow-black/10"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Appearance'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Card Theming */}
                <section className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-serif">Contact Card Design</h4>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Card Style Theme</label>
                        <div className="grid grid-cols-3 gap-4">
                            {['minimal', 'elegant', 'bold'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => updateTheme('cardTheme', t)}
                                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${config.theme?.cardTheme === t ? 'border-black bg-gray-50 text-black' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <h5 className="text-sm font-bold text-gray-700">Brand Colors</h5>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                                <input 
                                    type="color"
                                    value={config.theme?.primaryColor || '#000000'}
                                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                                    className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-600">Primary Color</span>
                            </label>
                            
                            <label className="flex-1 flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                                <input 
                                    type="color"
                                    value={config.theme?.accentColor || '#D4AF37'}
                                    onChange={(e) => updateTheme('accentColor', e.target.value)}
                                    className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-600">Accent Color</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Typography & Layout (Premium) */}
                <section className={`space-y-6 p-8 rounded-3xl border shadow-sm transition-all ${isPremium ? 'bg-white border-gray-100' : 'bg-gray-50/50 border-gray-100 opacity-75'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-serif">Storefront Typography & Layout</h4>
                        {!isPremium && <span className="ml-auto text-xs font-bold uppercase tracking-widest text-gold-500 bg-gold-50 px-2 py-1 rounded">Premium Only</span>}
                    </div>

                    <div className={!isPremium ? 'pointer-events-none' : ''}>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block flex items-center gap-2">
                                <Type className="w-3 h-3" />
                                Custom Typography
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {FONTS.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => updateTheme('fontFamily', f.name)}
                                        className={`py-3 px-4 rounded-xl border-2 text-sm transition-all text-left ${config.theme?.fontFamily === f.name ? 'border-black bg-gray-50 text-black font-bold' : 'border-gray-100 text-gray-500 hover:border-gray-200'} ${f.className}`}
                                    >
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block flex items-center gap-2">
                                <Palette className="w-3 h-3" />
                                Action Button Style
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {['solid', 'outline', 'rounded', 'sharp'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => updateTheme('buttonStyle', style)}
                                        className={`py-2 px-4 border-2 text-sm font-medium capitalize transition-all
                                            ${style === 'rounded' ? 'rounded-full' : style === 'sharp' ? 'rounded-none' : 'rounded-lg'}
                                            ${config.theme?.buttonStyle === style ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500 hover:border-black'}
                                            ${style === 'outline' && config.theme?.buttonStyle === style ? 'bg-transparent text-black border-black' : ''}
                                        `}
                                    >
                                        {style} Button
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Product Card Layout</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['compact', 'split', 'expanded'].map(layout => (
                                    <button
                                        key={layout}
                                        onClick={() => updateTheme('cardLayout', layout)}
                                        className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize flex flex-col items-center gap-2 transition-all ${config.theme?.cardLayout === layout ? 'border-black bg-gray-50 text-black' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <div className="w-full h-12 bg-gray-100 rounded flex flex-col gap-1 p-1">
                                            {layout === 'compact' && <><div className="w-full h-6 bg-gray-200 rounded-sm"/><div className="w-full h-2 bg-gray-200 rounded-sm"/></>}
                                            {layout === 'split' && <div className="flex gap-1 h-full"><div className="w-1/2 h-full bg-gray-200 rounded-sm"/><div className="w-1/2 h-full bg-gray-200/50 rounded-sm"/></div>}
                                            {layout === 'expanded' && <><div className="w-full h-3 bg-gray-200 rounded-sm"/><div className="w-full h-3 bg-gray-200 rounded-sm"/><div className="w-full h-3 bg-gray-200 rounded-sm"/></>}
                                        </div>
                                        {layout} Layout
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
