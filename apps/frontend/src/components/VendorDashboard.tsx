import React, { useState, useEffect } from 'react';
import { 
  Upload, Save, Sparkles, Image as ImageIcon, LayoutGrid, 
  FileText, Trash2, Edit2, Package, Menu, X, 
  Store, Globe, CreditCard, ExternalLink, Camera, MessageCircle, Palette,
  BarChart3, Clock, Loader2, Info
} from 'lucide-react';
import { Vendor, Product } from '../types';
import { generateVendorDescription } from '../services/geminiService';
import { AddProductModal } from './AddProductModal';
import { VENDOR_CATEGORY_CONFIG } from '../constants';
import { ImageGalleryManager } from './vendor/ImageGalleryManager';
import { MiniWebsiteEditor } from './vendor/MiniWebsiteEditor';
import { ThemeEditor } from './vendor/ThemeEditor';
import { updateVendor, addProduct, updateProduct, deleteProduct, importProductsCSV } from '../services/vendorService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import Image from 'next/image';
import { apiClient } from '../services/apiClient';

interface VendorDashboardProps {
  vendor: Vendor;
}

const DEFAULT_PRODUCT_IMAGE = 'https://placehold.co/200x200/f3f4f6/9ca3af?text=No+Image';

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ vendor: initialVendor }) => {
  const [vendor, setVendor] = useState<Vendor>(initialVendor);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'storefront' | 'products' | 'analytics'>('profile');
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>(vendor.products || []);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState(vendor.name);
  const [description, setDescription] = useState(vendor.description);
  const [shortDescription, setShortDescription] = useState(vendor.shortDescription);
  const [phone, setPhone] = useState(vendor.phone);
  const [city, setCity] = useState(vendor.city);
  const [address, setAddress] = useState(vendor.address);
  const [coverImage, setCoverImage] = useState(vendor.coverImage);
  const [websiteUrl, setWebsiteUrl] = useState(vendor.websiteUrl || '');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCSVHelp, setShowCSVHelp] = useState(false);

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files are accepted');
      return;
    }
    setIsUploadingCover(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await apiClient('/api/upload/main-photo', { method: 'POST', body: form });
      if (res.ok) {
        const { imageUrl } = await res.json();
        setCoverImage(imageUrl);
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch {
      alert('Network error during upload');
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const config = VENDOR_CATEGORY_CONFIG[vendor.category] || {
    requiresImage: false,
    showQuantity: false,
    showUnit: false,
    showMinOrder: false,
    showSku: false,
    showDescription: true,
  };

  const handleAIWrite = async () => {
    setIsGenerating(true);
    const desc = await generateVendorDescription(vendor.name, vendor.category, vendor.city, "Premium, Quality, Trust");
    setDescription(desc);
    setIsGenerating(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await updateVendor(vendor.id, {
        name,
        description,
        shortDescription,
        phone,
        city,
        address,
        coverImage,
        websiteUrl
      });
      setVendor(updated);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsImporting(true);

      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          alert('CSV file must have a header row and at least one data row.');
          setIsImporting(false);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const priceIdx = headers.indexOf('price');

        if (nameIdx === -1 || priceIdx === -1) {
          alert('CSV must include "name" and "price" columns.');
          setIsImporting(false);
          return;
        }

        const items = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim());
          return {
            name: cols[nameIdx] || 'Untitled',
            price: parseFloat(cols[priceIdx]) || 0,
            category: cols[headers.indexOf('category')] || undefined,
            description: cols[headers.indexOf('description')] || undefined,
            quantity: cols[headers.indexOf('quantity')] ? parseFloat(cols[headers.indexOf('quantity')]) : undefined,
            unit: cols[headers.indexOf('unit')] || undefined,
            sku: cols[headers.indexOf('sku')] || undefined,
            inStock: cols[headers.indexOf('instock')]?.toLowerCase() !== 'false',
          };
        }).filter(item => item.name && item.name !== 'Untitled');

        if (items.length === 0) {
          alert('No valid products found in CSV.');
          setIsImporting(false);
          return;
        }

        const result = await importProductsCSV(vendor.id, items);
        setProducts(prev => [...prev, ...result.products]);
        alert(`✅ Successfully imported ${result.count} products from CSV.`);
      } catch (error) {
        console.error('CSV import error:', error);
        alert('Failed to import CSV. Please check the file format and try again.');
      } finally {
        setIsImporting(false);
        // Reset file input
        e.target.value = '';
      }
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      if (editingProduct) {
        const updated = await updateProduct(vendor.id, product.id, product);
        setProducts(products.map(p => p.id === product.id ? updated : p));
      } else {
        const created = await addProduct(vendor.id, product);
        setProducts([...products, created]);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(vendor.id, productId);
      setProducts(products.filter(p => p.id !== productId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
      setDeleteConfirmId(null);
    }
  };

  const formatPrice = (price: number, unit?: string) => {
    const formattedPrice = `₹${price.toLocaleString()}`;
    if (unit && config.showUnit) {
      return `${formattedPrice}/${unit}`;
    }
    return formattedPrice;
  };

  const tabs = [
    { id: 'profile', label: 'Identity', icon: CreditCard },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'storefront', label: 'Storefront', icon: Store },
    { id: 'products', label: 'Collection', icon: Package },
    { id: 'analytics', label: 'Insights', icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen pt-32 bg-[#FDFCFB] pb-8 font-sans selection:bg-gold-200">
      {/* Sidebar - Luxurious Dark Theme */}
      <aside className="w-72 shrink-0 bg-[#0A0A0A] border-r border-white/5 text-white hidden lg:flex flex-col sticky top-32 h-[calc(100vh-8rem)] z-30 shadow-2xl overflow-hidden ml-6 rounded-[2.5rem] my-auto">
        <div className="p-10 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/10 rounded-full blur-[80px]" />
          
          <h2 className="text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-gold-600 font-bold tracking-tighter mb-2">Gocal</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded">
              {vendor.isPremium ? 'Maison' : 'Standard'}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-3 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center px-6 py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-500 relative group ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-gold-500/10 to-transparent text-gold-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border-l-2 border-gold-500' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className={`w-5 h-5 mr-4 transition-transform duration-500 group-hover:scale-110 ${activeTab === tab.id ? 'text-gold-400' : 'text-gray-600'}`} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-gold-500/5 blur-xl -z-10" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 mt-auto border-t border-white/5">
           <a 
            href={vendor.planType === 'card_only' || !vendor.websiteUuid ? `/vendor/${vendor.id}` : `/store/${vendor.websiteUuid}`} 
            target="_blank" 
            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
           >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gold-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-gray-400 group-hover:text-white transition-colors">View Live</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gold-400 transition-all" />
           </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between mb-8 bg-white p-5 rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <Menu className="w-6 h-6 text-black" />
           </button>
           <h1 className="text-xl font-serif font-bold tracking-tight">Management</h1>
           <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-serif">
              {vendor.name.charAt(0)}
           </div>
        </div>

        <AnimatePresence mode="wait">
          {/* PROFILE / IDENTITY TAB */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row gap-12 items-start">
                {/* Form Section */}
                <div className="flex-1 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-gray-100 space-y-10">
                  <div>
                    <h2 className="text-3xl font-serif mb-2">Business Identity</h2>
                    <p className="text-gray-500 font-light">Manage how your business appears on the marketplace.</p>
                  </div>

                  <div className="space-y-8">
                    {/* Cover Image Upload Preview */}
                    <div className="relative group">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3 block">Marketplace Cover</label>
                      <div className="relative h-56 rounded-3xl overflow-hidden bg-gray-100 group">
                        {coverImage && <Image src={coverImage} alt="Cover" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                          <button 
                            onClick={() => coverInputRef.current?.click()}
                            disabled={isUploadingCover}
                            className="bg-white text-black px-6 py-3 rounded-full flex items-center gap-2 font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                          >
                            <Camera className="w-4 h-4" /> {isUploadingCover ? 'Uploading...' : 'Change Image'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block px-1">Business Name</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block px-1">Contact Phone</label>
                        <input 
                          type="text" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block px-1">Marketplace Tagline (Short)</label>
                       <input 
                        type="text" 
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="Ex: Finest Handcrafted Jewelry in Vadodara"
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-serif italic" 
                       />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block px-1">Main Description (Bio)</label>
                        {/* <button
                          onClick={handleAIWrite}
                          disabled={isGenerating}
                          className="text-[10px] font-bold text-purple-600 flex items-center hover:scale-105 transition-transform"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {isGenerating ? 'Drafting...' : 'AI Rewrite'}
                        </button> */}
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-5 bg-gray-50 border-none rounded-2xl h-44 focus:ring-2 focus:ring-black outline-none transition-all text-gray-700 leading-relaxed font-light"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block px-1">Full Address</label>
                         <input 
                          type="text" 
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block px-1">External Website URL</label>
                         <input 
                          type="text" 
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all" 
                         />
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="w-full py-5 bg-black text-white rounded-2xl hover:scale-[1.01] transition-all shadow-2xl shadow-black/10 font-bold uppercase tracking-widest text-xs"
                    >
                      {isSaving ? 'Processing...' : 'Save Identity Changes'}
                    </Button>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="w-full md:w-96 space-y-6 sticky top-44">
                   <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 px-4">Marketplace Preview</h3>
                   <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-black/5 border border-gray-100 group hover:shadow-gold-500/5 transition-all">
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        {coverImage && <Image src={coverImage} alt="Cover Preview" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />}
                      </div>
                      <div className="p-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded tracking-tighter uppercase">{vendor.category}</span>
                          {vendor.isPremium && <span className="text-[9px] font-bold bg-gold-400 text-white px-2 py-0.5 rounded tracking-tighter uppercase">Premium</span>}
                        </div>
                        <h4 className="text-2xl font-serif font-bold mb-2">{name || 'Your Business Name'}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2 font-light italic mb-4">{shortDescription || 'Your short marketplace bio will appear here...'}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-1 text-gold-500 shrink-0">
                            {[1,2,3,4,5].map(s => <Sparkles key={s} className="w-3 h-3 fill-gold-500" />)}
                          </div>
                          <span className="text-[10px] tracking-widest uppercase font-bold text-gray-400 truncate max-w-[200px] text-right" title={address || city}>{address || city}</span>
                        </div>
                      </div>
                   </div>
                   <p className="text-center text-[10px] text-gray-400 px-10">This is how consumers will see your "Contact Card" in the main search.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-16"
            >
              <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-black/[0.02] border border-gray-100">
                <ThemeEditor vendor={vendor} onUpdate={(v) => setVendor(v)} />
              </div>
            </motion.div>
          )}

          {/* STOREFRONT / MINI-WEBSITE TAB */}
          {activeTab === 'storefront' && (
            <motion.div
              key="storefront"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-16"
            >
              <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-black/[0.02] border border-gray-100">
                <MiniWebsiteEditor vendor={vendor} onUpdate={(v) => setVendor(v)} />
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-black/[0.02] border border-gray-100">
                <ImageGalleryManager vendorId={vendor.id} initialImages={vendor.galleryImages || []} />
              </div>
            </motion.div>
          )}

          {/* PRODUCTS CATALOG TAB */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-black/[0.02] border border-gray-100">
                <div className="flex justify-between items-end mb-10">
                  <div>
                    <h2 className="text-3xl font-serif mb-2">Curated Collection</h2>
                    <p className="text-gray-500 font-light">
                      {config.requiresImage ? 'Visual collection of your offerings.' : 'Your store listings and inventory details.'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-4">
                      <label className={`cursor-pointer px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center border border-gray-100 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {isImporting ? 'Importing...' : 'Import CSV'}
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVUpload} disabled={isImporting} />
                      </label>
                      <Button
                        onClick={handleAddProduct}
                        className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-bold tracking-widest uppercase hover:scale-105 transition-all shadow-xl shadow-black/10"
                      >
                        <Package className="w-4 h-4 mr-2" /> Add Selection
                      </Button>
                    </div>
                    <button 
                      onClick={() => setShowCSVHelp(!showCSVHelp)}
                      className="text-[9px] text-gold-600 font-bold tracking-widest uppercase hover:text-gold-700 transition-colors flex items-center gap-1.5 px-2"
                    >
                      <Info className="w-3 h-3" />
                      {showCSVHelp ? 'Hide Format' : 'View CSV Format'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showCSVHelp && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8 overflow-hidden"
                    >
                      <div className="bg-gold-50/30 border border-gold-100/50 rounded-2xl p-6 text-[11px]">
                        <div className="flex items-center gap-2 mb-4 text-gold-700 font-bold uppercase tracking-[0.2em] text-[9px]">
                          <Info className="w-3.5 h-3.5" />
                          CSV Import Specification
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] mb-1.5">Required Headers</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="bg-white border border-gold-200 px-2 py-1 rounded-md font-mono text-gold-700">name</span>
                                <span className="bg-white border border-gold-200 px-2 py-1 rounded-md font-mono text-gold-700">price</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] mb-1.5">Optional Headers</p>
                              <div className="flex flex-wrap gap-2">
                                {['category', 'description', 'quantity', 'unit', 'sku', 'instock'].map(h => (
                                  <span key={h} className="bg-white border border-gray-100 px-2 py-1 rounded-md font-mono text-gray-500">{h}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] mb-1.5">Sample Row Content</p>
                            <div className="bg-white/50 border border-gold-100 rounded-xl p-4 font-mono text-gray-600 leading-relaxed overflow-x-auto whitespace-nowrap">
                              name,price,category,description,quantity,unit,sku,instock<br/>
                              Gold Necklace,15000,Jewelry,Handcrafted,10,pcs,GN-01,true
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {products.length === 0 ? (
                  <div className="text-center py-24 text-gray-300">
                    <Package className="w-20 h-20 mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-serif italic">Your collection is currently empty.</p>
                    <button onClick={handleAddProduct} className="mt-4 text-gold-500 font-bold text-xs uppercase tracking-widest hover:underline transition-all">Begin Curating</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-50 text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase">
                          <th className="pb-6 pl-2">Selection</th>
                          <th className="pb-6">Price Point</th>
                          {config.showQuantity && <th className="pb-6">Inventory</th>}
                          <th className="pb-6">Availability</th>
                          <th className="pb-6 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {products.map((p) => (
                          <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-6 pl-2">
                               <div className="flex items-center gap-5">
                                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                    {p.image ? (
                                      <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-6 h-6" /></div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-serif text-lg text-gray-900 group-hover:text-black transition-colors">{p.name}</span>
                                    <span className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-1">{p.category}</span>
                                  </div>
                               </div>
                            </td>
                            <td className="py-6 font-medium text-gray-900">
                               {formatPrice(p.price, p.unit)}
                            </td>
                            {config.showQuantity && (
                              <td className="py-6">
                                <span className={`text-sm tracking-tight ${p.quantity && p.quantity < 10 ? 'text-orange-500 font-bold' : 'text-gray-500'}`}>
                                  {p.quantity ? `${p.quantity} ${p.unit || 'units'}` : '—'}
                                </span>
                              </td>
                            )}
                            <td className="py-6">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-[0.15em] uppercase border ${
                                p.inStock !== false 
                                ? 'bg-green-50/50 text-green-600 border-green-100' 
                                : 'bg-red-50/50 text-red-600 border-red-100'
                              }`}>
                                {p.inStock !== false ? 'Available' : 'Sold Out'}
                              </span>
                            </td>
                            <td className="py-6 text-right pr-2">
                               <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => handleEditProduct(p)} className="p-2 text-gray-400 hover:text-black transition-colors"><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={() => setDeleteConfirmId(p.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ANALYTICS TAB — Coming Soon */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="bg-white p-16 rounded-[3rem] shadow-xl shadow-black/[0.02] border border-gray-100 text-center">
                <div className="max-w-md mx-auto space-y-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-10 h-10 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-serif mb-3">Insights Coming Soon</h3>
                    <p className="text-gray-500 font-light leading-relaxed">
                      We&apos;re building a powerful analytics dashboard to track your store&apos;s visits, favorites, and customer inquiries. Stay tuned.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">In Development</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        vendorCategory={vendor.category}
        editProduct={editingProduct}
      />

       {/* Confirm Delete Popup */}
       <AnimatePresence>
          {deleteConfirmId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setDeleteConfirmId(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif mb-2">Remove Product?</h3>
                <p className="text-gray-500 font-light mb-8 text-sm">This item will be permanently removed from your curated collection.</p>
                <div className="flex gap-4">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">Keep It</button>
                  <button onClick={() => handleDeleteProduct(deleteConfirmId)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20">Remove</button>
                </div>
              </motion.div>
            </div>
          )}
       </AnimatePresence>
    </div>
  );
};
