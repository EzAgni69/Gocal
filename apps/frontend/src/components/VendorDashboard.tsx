import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Upload, Save, Sparkles, Image as ImageIcon, LayoutGrid, FileText, Trash2, Edit2, Package, Menu, X } from 'lucide-react';
import { Vendor, Product, AnalyticsData } from '../types';
import { generateVendorDescription } from '../services/geminiService';
import { AddProductModal } from './AddProductModal';
import { VENDOR_CATEGORY_CONFIG } from '../constants';

interface VendorDashboardProps {
  vendor: Vendor;
  analyticsData: AnalyticsData[];
}

const DEFAULT_PRODUCT_IMAGE = 'https://placehold.co/200x200/f3f4f6/9ca3af?text=No+Image';

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ vendor, analyticsData }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'products' | 'analytics'>('profile');
  const [description, setDescription] = useState(vendor.description);
  const [isGenerating, setIsGenerating] = useState(false);
  const [products, setProducts] = useState<Product[]>(vendor.products || []);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Mock CSV parsing - in reality would parse CSV and extract products
      const mockProducts: Product[] = [
        {
          id: `p-${Date.now()}`,
          name: "Imported Item 1",
          price: 100,
          category: "Imported",
          inStock: true,
        },
        {
          id: `p-${Date.now() + 1}`,
          name: "Imported Item 2",
          price: 150,
          category: "Imported",
          inStock: true,
        },
      ];

      setProducts([...products, ...mockProducts]);
      alert(`✅ Imported ${mockProducts.length} products from CSV. No image required for your vendor type.`);
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

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p => p.id === product.id ? product : p));
    } else {
      // Add new product
      setProducts([...products, product]);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    setDeleteConfirmId(null);
  };

  const formatPrice = (price: number, unit?: string) => {
    const formattedPrice = `₹${price.toLocaleString()}`;
    if (unit && config.showUnit) {
      return `${formattedPrice}/${unit}`;
    }
    return formattedPrice;
  };

  return (
    <div className="flex min-h-screen pt-22 bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-luxury-black text-white hidden md:flex flex-col fixed md:relative h-full z-10">
        <div className="p-6">
          <h2 className="text-2xl font-serif text-gold-400">Vanij Vendor</h2>
          <p className="text-gray-300 text-xs mt-1">Plan: {vendor.isPremium ? 'Premium Website' : 'Standard'}</p>
          <p className="text-gray-400 text-xs mt-0.5">Category: {vendor.category}</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center p-3 rounded text-sm transition-colors ${activeTab === 'profile' ? 'bg-gray-800 text-gold-400' : 'text-gray-300 hover:text-white'}`}
          >
            <FileText className="w-4 h-4 mr-3" /> Profile
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center p-3 rounded text-sm transition-colors ${activeTab === 'products' ? 'bg-gray-800 text-gold-400' : 'text-gray-300 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4 mr-3" /> Products
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center p-3 rounded text-sm transition-colors ${activeTab === 'analytics' ? 'bg-gray-800 text-gold-400' : 'text-gray-300 hover:text-white'}`}
          >
            <Sparkles className="w-4 h-4 mr-3" /> Analytics
          </button>
        </nav>
      </aside>

       {/* Mobile Sidebar Overlay & Drawer */}
       {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-64 bg-luxury-black text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
             <div className="p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-serif text-gold-400">Vanij Vendor</h2>
                <p className="text-gray-300 text-xs mt-1">Plan: {vendor.isPremium ? 'Premium Website' : 'Standard'}</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              <button
                onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center p-3 rounded text-sm transition-colors ${activeTab === 'profile' ? 'bg-gray-800 text-gold-400' : 'text-gray-300 hover:text-white'}`}
              >
                <FileText className="w-4 h-4 mr-3" /> Profile
              </button>
              <button
                onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center p-3 rounded text-sm transition-colors ${activeTab === 'products' ? 'bg-gray-800 text-gold-400' : 'text-gray-300 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4 mr-3" /> Products
              </button>
              <button
                onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center p-3 rounded text-sm transition-colors ${activeTab === 'analytics' ? 'bg-gray-800 text-gold-400' : 'text-gray-300 hover:text-white'}`}
              >
                <Sparkles className="w-4 h-4 mr-3" /> Analytics
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-serif font-bold text-luxury-black">Dashboard</h1>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-gold-100 text-gold-700 rounded-full">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </span>
        </div>

        {/* PROFILE MANAGEMENT */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-serif mb-6 text-gray-800">Edit Store Profile</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Business Description</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg h-40 focus:ring-2 focus:ring-gold-400 outline-none text-gray-900"
                  />
                  <button
                    onClick={handleAIWrite}
                    disabled={isGenerating}
                    className="absolute bottom-4 right-4 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center hover:bg-purple-200 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {isGenerating ? 'Thinking...' : 'AI Rewrite'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Phone</label>
                  <input type="text" defaultValue={vendor.phone} className="w-full p-2 border border-gray-300 rounded text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">City</label>
                  <input type="text" defaultValue={vendor.city} className="w-full p-2 border border-gray-300 rounded text-gray-900" />
                </div>
              </div>

              <button className="flex items-center justify-center w-full py-3 bg-luxury-black text-white rounded-lg hover:bg-gray-800">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif text-gray-800">Product Catalog</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {!config.requiresImage && '💡 Images are optional for your vendor type'}
                </p>
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-bold">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk CSV Upload
                  <input type="file" className="hidden" accept=".csv" onChange={handleCSVUpload} />
                </label>
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded text-sm font-bold flex items-center"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No products yet</p>
                <p className="text-sm mt-1">Add your first product to get started</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="py-3">Image</th>
                    <th className="py-3">Name</th>
                    <th className="py-3">Price</th>
                    {config.showQuantity && <th className="py-3">Stock</th>}
                    <th className="py-3">Status</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-gray-800">{p.name}</span>
                        {p.sku && <span className="block text-xs text-gray-400">SKU: {p.sku}</span>}
                      </td>
                      <td className="py-3 text-gold-600 font-medium">
                        {formatPrice(p.price, p.unit)}
                      </td>
                      {config.showQuantity && (
                        <td className="py-3">
                          {p.quantity !== undefined ? (
                            <span className={`${p.quantity < 10 ? 'text-orange-500' : 'text-gray-600'}`}>
                              {p.quantity} {p.unit || 'units'}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.inStock !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3">
                        {deleteConfirmId === p.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-red-600 text-xs font-bold hover:underline"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-gray-500 text-xs hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-serif text-gray-800">Performance Insights</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-600">Weekly Visits & Clicks</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="visits" fill="#0f172a" radius={[4, 4, 0, 0]} name="Profile Visits" />
                      <Bar dataKey="clicks" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Website Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-600">Growth Trends</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="favorites" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add/Edit Product Modal */}
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
    </div>
  );
};