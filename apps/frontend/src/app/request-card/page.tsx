"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, User, Phone, Mail, MapPin,
  CheckCircle2, ChevronRight,
  ChevronLeft, Store, Globe, Star, AlertTriangle,
  Clock, XCircle, Loader2, ChevronDown,
  Package, Plus, Trash2, Upload, Image as ImageIcon, Info,
  Link2, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppContext } from '@/context/AppContext';
import { apiClient } from '@/services/apiClient';
import { ContactCardRequest, UserRole } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanType = 'card_only' | 'card_website' | null;

export interface DraftProduct {
  _localId: string;
  name: string;
  price: string;
  quantity: string;
  unit: string;
  category: string;
  imageUrl: string;
  description: string;
  _uploading?: boolean;
  _uploadError?: string;
}

type OpeningHoursMap = { [day: string]: { open: string; close: string; closed?: boolean } };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const defaultOpeningHours: OpeningHoursMap = Object.fromEntries(
  DAYS.map(d => [d, { open: '09:00', close: '21:00', closed: false }])
);

interface FormData {
  plan: PlanType;
  fullName: string;
  phone: string;
  email: string;
  businessName: string;
  category: string;
  city: string;
  pincode: string;
  address: string;
  shortDescription: string;
  fullDescription: string;
  subscriptionPlan: '1_year' | '2_year' | '3_year' | null;
  draftProducts: DraftProduct[];
  openingHours: OpeningHoursMap;
  googleDirectionLink: string;
  logoUrl: string;
  mainPhotoUrl: string;
  mainPhotoDescription: string;
  galleryUrls: string[];
}

interface FieldErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  plan: null, fullName: '', phone: '', email: '',
  businessName: '', category: '', city: '', pincode: '', address: '',
  shortDescription: '', fullDescription: '',
  subscriptionPlan: null, draftProducts: [],
  openingHours: defaultOpeningHours,
  googleDirectionLink: '',
  logoUrl: '', mainPhotoUrl: '', mainPhotoDescription: '',
  galleryUrls: [],
};

const REJECTION_REASON_LABELS: Record<string, string> = {
  INCOMPLETE_INFO: 'Incomplete Information',
  DUPLICATE: 'Duplicate Listing',
  INAPPROPRIATE: 'Inappropriate Content',
  INVALID_BUSINESS: 'Invalid Business',
  OTHER: 'Other',
};

const UNITS = ['pcs', 'kg', 'grams', 'liters', 'ml', 'dozen', 'set', 'pair', 'box', 'service'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mkProduct(): DraftProduct {
  return { _localId: Math.random().toString(36).slice(2), name: '', price: '', quantity: '', unit: 'pcs', category: '', imageUrl: '', description: '' };
}

function phoneValid(p: string) { return /^\+?[\d\s\-()\u2013]{7,20}$/.test(p.trim()); }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RequestCardPage() {
  const { user, isAuthenticated, setShowAuthModal, setAuthModalMode } = useAppContext();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRequests, setExistingRequests] = useState<ContactCardRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // card_only: 1 Plan → 2 Personal → 3 Business → 4 Opening Hours → 5 Products → 6 Media → 7 Review
  // card_website: 1 Plan → 2 Personal → 3 Business → 4 Opening Hours → 5 Products → 6 Media → 7 Website → 8 Pricing → 9 Review
  const totalSteps = formData.plan === 'card_website' ? 9 : 7;
  const reviewStep = totalSteps;

  useEffect(() => {
    if (!isAuthenticated) { setIsLoadingRequests(false); return; }
    apiClient('/api/card-requests/mine')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setExistingRequests(d.requests || []); })
      .catch(() => {})
      .finally(() => setIsLoadingRequests(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) setFormData(prev => ({
      ...prev,
      fullName: prev.fullName || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || (user as any).phone || '',
    }));
  }, [user]);

  const updateFormData = (data: Partial<FormData>) => setFormData(prev => ({ ...prev, ...data }));

  // ── Per-step validation ───────────────────────────────────────────────────
  const validateStep = (s: number): boolean => {
    const errs: FieldErrors = {};
    if (s === 2) {
      if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
      if (!formData.phone.trim()) errs.phone = 'Phone number is required';
      else if (!phoneValid(formData.phone)) errs.phone = 'Invalid phone format (7–20 digits)';
    }
    if (s === 3) {
      if (!formData.businessName.trim()) errs.businessName = 'Business name is required';
      if (!formData.category) errs.category = 'Please select a category';
      if (!formData.city.trim()) errs.city = 'City is required';
    }
    if (s === 5) {
      formData.draftProducts.forEach((p, i) => {
        if (p.name.trim() && (!p.price || isNaN(Number(p.price)) || Number(p.price) < 0)) {
          errs[`product_price_${i}`] = 'Enter a valid price (≥ 0)';
        }
      });
    }
    if (s === 8 && formData.plan === 'card_website' && !formData.subscriptionPlan) {
      errs.subscriptionPlan = 'Please select a subscription plan';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep(step) && step < totalSteps) setStep(s => s + 1); };
  const handleBack = () => { if (step > 1) { setFieldErrors({}); setStep(s => s - 1); } };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    if (!isAuthenticated) { setAuthModalMode('signin'); setShowAuthModal(true); return; }
    setIsSubmitting(true); setError(null);
    try {
      const products = formData.draftProducts
        .filter(p => p.name.trim())
        .map(p => ({
          name: p.name.trim(),
          price: Number(p.price) || 0,
          quantity: p.quantity ? Number(p.quantity) : undefined,
          unit: p.unit || undefined,
          category: p.category || undefined,
          imageUrl: p.imageUrl || undefined,
          description: p.description || undefined,
        }));

      const payload = {
        planType: formData.plan,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        businessName: formData.businessName,
        category: formData.category,
        city: formData.city,
        pincode: formData.pincode || undefined,
        address: formData.address || undefined,
        shortDescription: formData.shortDescription || undefined,
        fullDescription: formData.fullDescription || undefined,
        subscriptionPlan: formData.subscriptionPlan || undefined,
        draftProducts: products.length ? products : undefined,
        openingHours: formData.openingHours,
        googleDirectionLink: formData.googleDirectionLink || undefined,
        logoUrl: formData.logoUrl || undefined,
        mainPhotoUrl: formData.mainPhotoUrl || undefined,
        mainPhotoDescription: formData.mainPhotoDescription || undefined,
        galleryUrls: formData.galleryUrls.length > 0 ? formData.galleryUrls : undefined,
      };

      const res = await apiClient('/api/card-requests', { method: 'POST', body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setIsSuccess(true);
        setExistingRequests(prev => [data.request, ...prev]);
      } else {
        const err = await res.json();
        setError(res.status === 409 ? err.error : (err.error || 'Failed to submit. Please try again.'));
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Auth / Loading guards ─────────────────────────────────────────────────
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-luxury-cream flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-2xl text-center max-w-md">
        <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Store className="w-8 h-8 text-gold-600" /></div>
        <h2 className="text-2xl font-serif text-luxury-black mb-3">Sign In Required</h2>
        <p className="text-gray-500 mb-8">Please sign in to request a business listing on Gocal.</p>
        <Button onClick={() => { setAuthModalMode('signin'); setShowAuthModal(true); }} className="bg-gold-500 hover:bg-gold-600 text-white border-0 w-full">Sign In to Continue</Button>
      </div>
    </div>
  );

  if (isLoadingRequests) return (
    <div className="min-h-screen bg-luxury-cream flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
    </div>
  );

  const pendingRequest = existingRequests.find(r => r.status === 'PENDING');
  const rejectedRequests = existingRequests.filter(r => r.status === 'REJECTED');
  const approvedRequest = existingRequests.find(r => r.status === 'APPROVED');

  if (pendingRequest && !isSuccess) return (
    <div className="min-h-screen bg-luxury-cream py-12 px-4 flex items-center justify-center">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-2xl max-w-2xl w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6 border border-amber-100"><Clock className="w-8 h-8 text-amber-500" /></div>
          <h2 className="text-2xl font-serif text-luxury-black mb-3">Request Under Review</h2>
          <p className="text-gray-500 mb-6">Your request for <strong className="text-luxury-black">{pendingRequest.businessName}</strong> is being reviewed.</p>
          <div className="w-full bg-gray-50 rounded-xl p-6 border border-gray-100 text-left space-y-3 mb-6">
            {[['Business', pendingRequest.businessName], ['Category', pendingRequest.category], ['Plan', pendingRequest.planType === 'card_website' ? 'Card + Mini Website' : 'Contact Card Only'], ['Submitted', new Date(pendingRequest.createdAt).toLocaleDateString()]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-gray-400">{k}:</span><span className="text-luxury-black font-medium">{v}</span></div>
            ))}
          </div>
          <Button variant="outline" className="border-gray-200" onClick={() => window.location.href = '/'}>Return to Home</Button>
        </div>
      </div>
    </div>
  );

  // Vendors with an approved request can still submit a new one — don't block them.

  // ── Step rendering logic ──────────────────────────────────────────────────
  const getStepContent = () => {
    if (isSuccess) return <StepSuccess key="success" />;
    if (step === 1) return <Step1Plan formData={formData} updateFormData={updateFormData} key="step1" />;
    if (step === 2) return <Step2Personal formData={formData} updateFormData={updateFormData} errors={fieldErrors} key="step2" />;
    if (step === 3) return <Step3Business formData={formData} updateFormData={updateFormData} errors={fieldErrors} key="step3" />;
    if (step === 4) return <Step4OpeningHours formData={formData} updateFormData={updateFormData} key="step4" />;
    if (step === 5) return <Step5Products formData={formData} updateFormData={updateFormData} errors={fieldErrors} key="step5" />;
    if (step === 6) return <Step6Media formData={formData} updateFormData={updateFormData} key="step6" />;
    if (step === 7 && formData.plan === 'card_website') return <Step7Website formData={formData} updateFormData={updateFormData} key="step7" />;
    if (step === 8 && formData.plan === 'card_website') return <Step8Pricing formData={formData} updateFormData={updateFormData} errors={fieldErrors} key="step8" />;
    return <StepReview formData={formData} isSubmitting={isSubmitting} handleSubmit={handleSubmit} handleEdit={s => { setFieldErrors({}); setStep(s); }} key="review" />;
  };

  const isNextDisabled = (step === 1 && !formData.plan);

  return (
    <div className="min-h-screen bg-luxury-cream py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {approvedRequest && user?.role === UserRole.VENDOR && !isSuccess && (
          <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-green-700 mb-1">You already have an active listing</h4>
                <p className="text-xs text-green-600"><strong>{approvedRequest.businessName}</strong> is live. You can still submit a new request for an additional listing below.</p>
              </div>
            </div>
          </div>
        )}

        {rejectedRequests.length > 0 && !isSuccess && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-red-700 mb-1">Previous Request Rejected</h4>
                <p className="text-xs text-red-600">Reason: <strong>{REJECTION_REASON_LABELS[rejectedRequests[0].rejectionReason || 'OTHER']}</strong>
                  {rejectedRequests[0].rejectionNote && <span className="block mt-1 text-gray-500">"{rejectedRequests[0].rejectionNote}"</span>}
                </p>
                <p className="text-xs text-gray-400 mt-2">Submit a new request below with corrected information.</p>
              </div>
            </div>
          </div>
        )}

        {!isSuccess && (
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-serif text-luxury-black mb-2 font-bold">Request Business Listing</h1>
            <p className="text-gray-500">Join our premium local directory and reach more customers.</p>
            <div className="flex justify-center items-center mt-8 gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i + 1 === step ? 'bg-gold-500 w-12 shadow-sm' : i + 1 < step ? 'bg-gold-500/50 w-6' : 'bg-gray-200 w-6'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">Step {step} of {totalSteps}</p>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
                <button onClick={() => setError(null)} className="text-xs text-red-400 mt-1 hover:text-red-500 underline">Dismiss</button>
              </div>
            </div>
          )}

          <div className="flex-1">
            <AnimatePresence mode="wait">{getStepContent()}</AnimatePresence>
          </div>

          {!isSuccess && (
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
              <Button variant="ghost" onClick={handleBack} disabled={step === 1 || isSubmitting} className="text-gray-500 hover:text-luxury-black">
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              {step < totalSteps ? (
                <Button variant="primary" onClick={handleNext} disabled={isNextDisabled} className="bg-gold-500 hover:bg-gold-600 text-white border-0">
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} className="bg-gold-500 hover:bg-gold-600 text-white border-0 min-w-[140px]">
                  Submit Request
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

const stepMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" />{msg}</p>;
}

function InputField({ label, required, icon: Icon, error, children }: { label: string; required?: boolean; icon?: React.ElementType; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}{required && <span className="text-gold-500 ml-1">*</span>}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
        {children}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

// ─── Step 1: Plan ─────────────────────────────────────────────────────────────
function Step1Plan({ formData, updateFormData }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void }) {
  return (
    <motion.div {...stepMotion} className="flex flex-col h-full">
      <h2 className="text-2xl font-serif text-luxury-black mb-2 font-bold">Choose Your Presence</h2>
      <p className="text-gray-500 text-sm mb-8">Select the plan that best fits your business needs.</p>
      <div className="grid md:grid-cols-2 gap-6 flex-1">
        {([
          { id: 'card_only' as const, Icon: User, title: 'Contact Card Only', desc: 'A focused digital business card. Perfect for local discovery.', features: ['Basic business details', 'Click-to-call & WhatsApp', 'Local search visibility'], recommended: false },
          { id: 'card_website' as const, Icon: Globe, title: 'Card + Mini Website', desc: 'The complete digital storefront. Showcase products, services, and offers.', features: ['Everything in Contact Card', 'Product & service catalog', 'Custom branding & gallery', 'Exclusive offers section'], recommended: true },
        ]).map(({ id, Icon, title, desc, features, recommended }) => (
          <button key={id} onClick={() => updateFormData({ plan: id as PlanType })}
            className={`relative flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-300 text-left ${formData.plan === id ? 'border-gold-500 bg-gold-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:border-gold-200'}`}>
            {recommended && <div className="absolute top-0 right-0 bg-gold-500 text-white text-[10px] px-3 py-1 font-bold rounded-bl-lg uppercase">Recommended</div>}
            <div className="p-3 rounded-lg bg-white shadow-sm mb-4 inline-flex">
              <Icon className={`w-6 h-6 ${formData.plan === id ? 'text-gold-600' : 'text-gray-400'}`} />
            </div>
            <h3 className="text-xl font-bold text-luxury-black mb-2">{title}</h3>
            <p className="text-gray-500 text-sm mb-4 leading-relaxed">{desc}</p>
            <ul className="space-y-2 mt-auto text-sm text-gray-600">
              {features.map(f => <li key={f} className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500 flex-shrink-0" />{f}</li>)}
            </ul>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Step 2: Personal ─────────────────────────────────────────────────────────
function Step2Personal({ formData, updateFormData, errors }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void; errors: FieldErrors }) {
  const cls = "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-medium";
  
  // Ensure phone starts with +91 if not already prefixed
  const handlePhoneChange = (value: string) => {
    if (!value.startsWith('+91') && value.length > 0) {
      updateFormData({ phone: '+91 ' + value.replace(/^\+91\s*/, '') });
    } else {
      updateFormData({ phone: value });
    }
  };

  return (
    <motion.div {...stepMotion}>
      <h2 className="text-2xl font-serif text-luxury-black mb-2 font-bold">Personal Details</h2>
      <p className="text-gray-500 text-sm mb-8">How can we reach the business owner or representative?</p>
      <div className="space-y-6 max-w-lg">
        <InputField label="Full Name" required icon={User} error={errors.fullName}>
          <input type="text" value={formData.fullName} onChange={e => updateFormData({ fullName: e.target.value })} className={cls} placeholder="John Doe" />
        </InputField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Phone Number" required icon={Phone} error={errors.phone}>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={e => handlePhoneChange(e.target.value)} 
              className={cls} 
              placeholder="+91 9876543210" 
            />
          </InputField>
          <InputField label="Email Address" icon={Mail} error={errors.email}>
            <input type="email" value={formData.email} onChange={e => updateFormData({ email: e.target.value })} className={cls} placeholder="john@example.com" />
          </InputField>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Business ─────────────────────────────────────────────────────────
function Step3Business({ formData, updateFormData, errors }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void; errors: FieldErrors }) {
  const cls = "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-medium";
  const clsLeft = "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-medium";
  return (
    <motion.div {...stepMotion}>
      <h2 className="text-2xl font-serif text-luxury-black mb-2 font-bold">Business Information</h2>
      <p className="text-gray-500 text-sm mb-8">Tell us about your locally operating business.</p>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Business Name" required icon={Store} error={errors.businessName}>
            <input type="text" value={formData.businessName} onChange={e => updateFormData({ businessName: e.target.value })} className={clsLeft} placeholder="e.g. Acme Services" />
          </InputField>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category<span className="text-gold-500 ml-1">*</span></label>
            <div className="relative">
              <select value={formData.category} onChange={e => updateFormData({ category: e.target.value })}
                className={`${cls} appearance-none`}>
                <option value="" disabled>Select a category</option>
                {['Electrician','Plumber','Carpenter','Gifts','Food & Beverages','Healthcare','Education','Retail','Beauty & Wellness','Home Services','Auto Services','Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <FieldError msg={errors.category} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField label="City" required icon={MapPin} error={errors.city}>
            <input type="text" value={formData.city} onChange={e => updateFormData({ city: e.target.value })} className={clsLeft} placeholder="e.g. Vadodara" />
          </InputField>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
            <input type="text" value={formData.pincode} onChange={e => updateFormData({ pincode: e.target.value })} className={cls} placeholder="e.g. 390001" maxLength={10} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Address</label>
            <input type="text" value={formData.address} onChange={e => updateFormData({ address: e.target.value })} className={cls} placeholder="Street, Area" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tagline / Short Description</label>
          <input type="text" value={formData.shortDescription} onChange={e => updateFormData({ shortDescription: e.target.value })}
            className={cls} placeholder="A brief 1-line summary of what you do" maxLength={200} />
          <p className="text-xs text-gray-400 mt-1 text-right">{formData.shortDescription.length}/200</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Google Maps Direction Link <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input 
              type="url" 
              value={formData.googleDirectionLink} 
              onChange={e => updateFormData({ googleDirectionLink: e.target.value })} 
              className={clsLeft} 
              placeholder="https://maps.google.com/..." 
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Paste your Google Maps share link for easy navigation</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step 4: Opening Hours ────────────────────────────────────────────────────
function Step4OpeningHours({ formData, updateFormData }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void }) {
  const updateDay = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const updated = { ...formData.openingHours, [day]: { ...formData.openingHours[day], [field]: value } };
    updateFormData({ openingHours: updated });
  };

  return (
    <motion.div {...stepMotion}>
      <h2 className="text-2xl font-serif text-luxury-black mb-2 font-bold">Opening Hours</h2>
      <p className="text-gray-500 text-sm mb-8">Set your business operating hours for each day of the week.</p>
      
      <div className="space-y-3">
        {DAYS.map(day => {
          const hours = formData.openingHours[day];
          return (
            <div key={day} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-28 flex-shrink-0">
                <p className="font-bold text-luxury-black text-sm">{day}</p>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="time"
                  value={hours.open}
                  onChange={e => updateDay(day, 'open', e.target.value)}
                  disabled={hours.closed}
                  className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="time"
                  value={hours.close}
                  onChange={e => updateDay(day, 'close', e.target.value)}
                  disabled={hours.closed}
                  className="bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hours.closed || false}
                  onChange={e => updateDay(day, 'closed', e.target.checked)}
                  className="w-4 h-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                />
                <span className="text-sm text-gray-600">Closed</span>
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gold-50 border border-gold-100 rounded-xl flex items-start gap-2">
        <Clock className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-600">These hours will be displayed on your business listing to help customers know when you're available.</p>
      </div>
    </motion.div>
  );
}

// ─── Step 5: Products & Pricing ───────────────────────────────────────────────
function Step5Products({ formData, updateFormData, errors }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void; errors: FieldErrors }) {
  const products = formData.draftProducts;

  const addProduct = () => {
    if (products.length >= 20) return;
    updateFormData({ draftProducts: [...products, mkProduct()] });
  };

  const removeProduct = (id: string) => updateFormData({ draftProducts: products.filter(p => p._localId !== id) });

  const updateProduct = (id: string, changes: Partial<DraftProduct>) =>
    updateFormData({ draftProducts: products.map(p => p._localId === id ? { ...p, ...changes } : p) });

  return (
    <motion.div {...stepMotion}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-2xl font-serif text-luxury-black font-bold">Initial Product Catalog</h2>
          <p className="text-gray-500 text-sm mt-1">Add products/services you offer. <span className="text-gold-600 font-medium">Optional</span> — you can also add these later from your dashboard.</p>
        </div>
        <span className="text-xs text-gray-400 tabular-nums pt-1">{products.length}/20</span>
      </div>

      <div className="bg-gold-50 border border-gold-100 rounded-xl p-3 mb-6 flex items-start gap-2">
        <Info className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-600">Products you add here will be visible on your listing after admin approval. Image upload is optional.</p>
      </div>

      <div className="space-y-4">
        {products.map((product, idx) => (
          <ProductRow
            key={product._localId}
            product={product}
            index={idx}
            errors={errors}
            onChange={changes => updateProduct(product._localId, changes)}
            onRemove={() => removeProduct(product._localId)}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center mb-4">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">No products added yet</p>
          <p className="text-xs text-gray-400">Click below to start adding your product catalog</p>
        </div>
      )}

      {products.length < 20 && (
        <button onClick={addProduct}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gold-200 text-gold-600 hover:bg-gold-50 hover:border-gold-400 transition-all font-semibold text-sm">
          <Plus className="w-4 h-4" /> Add Product / Service
        </button>
      )}
    </motion.div>
  );
}

function ProductRow({ product, index, errors, onChange, onRemove }: {
  product: DraftProduct; index: number; errors: FieldErrors;
  onChange: (c: Partial<DraftProduct>) => void; onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const inCls = "w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all";

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ _uploading: true, _uploadError: undefined });
    try {
      const form = new FormData();
      form.append('image', file);
      // Use apiClient which prepends the backend base URL and adds auth
      const res = await apiClient('/api/upload/product-image', { method: 'POST', body: form });
      if (res.ok) {
        const { imageUrl } = await res.json();
        onChange({ imageUrl, _uploading: false });
      } else {
        const err = await res.json();
        onChange({ _uploading: false, _uploadError: err.error || 'Upload failed' });
      }
    } catch {
      onChange({ _uploading: false, _uploadError: 'Network error during upload' });
    }
  }, [onChange]);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product #{index + 1}</span>
        <button onClick={onRemove} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Row 1: Name + Price + Quantity + Unit */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">Name<span className="text-gold-500 ml-0.5">*</span></label>
          <input type="text" value={product.name} onChange={e => onChange({ name: e.target.value })} className={inCls} placeholder="e.g. Rose Bouquet" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Price (₹)<span className="text-gold-500 ml-0.5">*</span></label>
          <input type="number" min="0" step="0.01" value={product.price} onChange={e => onChange({ price: e.target.value })} className={inCls} placeholder="0.00" />
          <FieldError msg={errors[`product_price_${index}`]} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Quantity</label>
          <input type="number" min="0" step="0.01" value={product.quantity} onChange={e => onChange({ quantity: e.target.value })} className={inCls} placeholder="e.g. 1" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Unit</label>
          <select value={product.unit} onChange={e => onChange({ unit: e.target.value })} className={`${inCls} appearance-none`}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: Category + Description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
          <input type="text" value={product.category} onChange={e => onChange({ category: e.target.value })} className={inCls} placeholder="e.g. Flowers" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Short Description</label>
          <input type="text" value={product.description} onChange={e => onChange({ description: e.target.value })} className={inCls} placeholder="Optional detail" maxLength={120} />
        </div>
      </div>

      {/* Row 3: Image */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">Product Image <span className="text-gray-400 font-normal">(optional)</span></label>
        <div className="flex items-center gap-3">
          {product.imageUrl ? (
            <div className="relative w-16 h-16 flex-shrink-0">
              <img src={product.imageUrl} alt="preview" className="w-full h-full object-cover rounded-lg border border-gray-200" />
              <button onClick={() => onChange({ imageUrl: '' })} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600">×</button>
            </div>
          ) : (
            <div className="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-6 h-6 text-gray-300" />
            </div>
          )}
          <div className="flex-1">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={handleFileChange} />
            <button onClick={() => fileRef.current?.click()} disabled={product._uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gold-300 hover:bg-gold-50 transition-all disabled:opacity-50">
              {product._uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {product._uploading ? 'Uploading…' : product.imageUrl ? 'Replace Image' : 'Upload Image'}
            </button>
            <p className="text-xs text-gray-400 mt-1">Max 5 MB · JPEG, PNG, WEBP, GIF</p>
            {product._uploadError && <p className="text-xs text-red-500 mt-1">{product._uploadError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: Media Uploads ────────────────────────────────────────────────────
function Step6Media({ formData, updateFormData }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void }) {
  const [uploading, setUploading] = useState<{ logo?: boolean; mainPhoto?: boolean; gallery?: boolean }>({});
  const [uploadErrors, setUploadErrors] = useState<{ logo?: string; mainPhoto?: string; gallery?: string }>({});
  
  const logoRef = useRef<HTMLInputElement>(null);
  const mainPhotoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, logo: true }));
    setUploadErrors(prev => ({ ...prev, logo: undefined }));
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await apiClient('/api/upload/logo', { method: 'POST', body: form });
      if (res.ok) {
        const { imageUrl } = await res.json();
        updateFormData({ logoUrl: imageUrl });
      } else {
        const err = await res.json();
        setUploadErrors(prev => ({ ...prev, logo: err.error || 'Upload failed' }));
      }
    } catch {
      setUploadErrors(prev => ({ ...prev, logo: 'Network error during upload' }));
    } finally {
      setUploading(prev => ({ ...prev, logo: false }));
    }
  };

  const handleMainPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, mainPhoto: true }));
    setUploadErrors(prev => ({ ...prev, mainPhoto: undefined }));
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await apiClient('/api/upload/main-photo', { method: 'POST', body: form });
      if (res.ok) {
        const { imageUrl } = await res.json();
        updateFormData({ mainPhotoUrl: imageUrl });
      } else {
        const err = await res.json();
        setUploadErrors(prev => ({ ...prev, mainPhoto: err.error || 'Upload failed' }));
      }
    } catch {
      setUploadErrors(prev => ({ ...prev, mainPhoto: 'Network error during upload' }));
    } finally {
      setUploading(prev => ({ ...prev, mainPhoto: false }));
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (formData.galleryUrls.length + files.length > 6) {
      setUploadErrors(prev => ({ ...prev, gallery: 'Maximum 6 gallery images allowed' }));
      return;
    }
    setUploading(prev => ({ ...prev, gallery: true }));
    setUploadErrors(prev => ({ ...prev, gallery: undefined }));
    try {
      const form = new FormData();
      files.forEach(file => form.append('images', file));
      const res = await apiClient('/api/upload/gallery', { method: 'POST', body: form });
      if (res.ok) {
        const { imageUrls } = await res.json();
        updateFormData({ galleryUrls: [...formData.galleryUrls, ...imageUrls] });
      } else {
        const err = await res.json();
        setUploadErrors(prev => ({ ...prev, gallery: err.error || 'Upload failed' }));
      }
    } catch {
      setUploadErrors(prev => ({ ...prev, gallery: 'Network error during upload' }));
    } finally {
      setUploading(prev => ({ ...prev, gallery: false }));
    }
  };

  const removeGalleryImage = (index: number) => {
    updateFormData({ galleryUrls: formData.galleryUrls.filter((_, i) => i !== index) });
  };

  return (
    <motion.div {...stepMotion}>
      <h2 className="text-2xl font-serif text-luxury-black mb-2 font-bold">Media & Photos</h2>
      <p className="text-gray-500 text-sm mb-8">Upload images to make your listing stand out. <span className="text-gold-600 font-medium">All optional</span></p>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Business Logo <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center gap-4">
            {formData.logoUrl ? (
              <div className="relative w-24 h-24 flex-shrink-0">
                <img src={formData.logoUrl} alt="logo" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                <button onClick={() => updateFormData({ logoUrl: '' })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600">×</button>
              </div>
            ) : (
              <div className="w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Camera className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div className="flex-1">
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => logoRef.current?.click()} disabled={uploading.logo}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gold-300 hover:bg-gold-50 transition-all disabled:opacity-50">
                {uploading.logo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading.logo ? 'Uploading…' : formData.logoUrl ? 'Replace Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">Square format recommended · Max 5 MB</p>
              {uploadErrors.logo && <p className="text-xs text-red-500 mt-1">{uploadErrors.logo}</p>}
            </div>
          </div>
        </div>

        {/* Main Photo Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Main Business Photo <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-start gap-4">
            {formData.mainPhotoUrl ? (
              <div className="relative w-32 h-24 flex-shrink-0">
                <img src={formData.mainPhotoUrl} alt="main" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                <button onClick={() => updateFormData({ mainPhotoUrl: '', mainPhotoDescription: '' })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600">×</button>
              </div>
            ) : (
              <div className="w-32 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div className="flex-1">
              <input ref={mainPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleMainPhotoUpload} />
              <button onClick={() => mainPhotoRef.current?.click()} disabled={uploading.mainPhoto}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gold-300 hover:bg-gold-50 transition-all disabled:opacity-50 mb-2">
                {uploading.mainPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading.mainPhoto ? 'Uploading…' : formData.mainPhotoUrl ? 'Replace Photo' : 'Upload Photo'}
              </button>
              {formData.mainPhotoUrl && (
                <input
                  type="text"
                  value={formData.mainPhotoDescription}
                  onChange={e => updateFormData({ mainPhotoDescription: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  placeholder="Photo description (optional)"
                  maxLength={500}
                />
              )}
              <p className="text-xs text-gray-400 mt-1">Showcase your storefront or workspace · Max 5 MB</p>
              {uploadErrors.mainPhoto && <p className="text-xs text-red-500 mt-1">{uploadErrors.mainPhoto}</p>}
            </div>
          </div>
        </div>

        {/* Gallery Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Gallery Images <span className="text-gray-400 font-normal">(optional, max 6)</span></label>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {formData.galleryUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={url} alt={`gallery ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                <button onClick={() => removeGalleryImage(idx)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600">×</button>
              </div>
            ))}
          </div>
          {formData.galleryUrls.length < 6 && (
            <>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
              <button onClick={() => galleryRef.current?.click()} disabled={uploading.gallery}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gold-300 hover:bg-gold-50 transition-all disabled:opacity-50">
                {uploading.gallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading.gallery ? 'Uploading…' : 'Add Gallery Images'}
              </button>
              <p className="text-xs text-gray-400 mt-1">Upload multiple images at once · {6 - formData.galleryUrls.length} remaining</p>
            </>
          )}
          {uploadErrors.gallery && <p className="text-xs text-red-500 mt-1">{uploadErrors.gallery}</p>}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gold-50 border border-gold-100 rounded-xl flex items-start gap-2">
        <Info className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-600">High-quality images help attract more customers. You can always update these later from your dashboard.</p>
      </div>
    </motion.div>
  );
}

// ─── Step 7: Website Content (card_website only) ──────────────────────────────
function Step7Website({ formData, updateFormData }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void }) {
  return (
    <motion.div {...stepMotion}>
      <h2 className="text-2xl font-serif text-luxury-black mb-2 font-bold">Mini Website Content</h2>
      <p className="text-gray-500 text-sm mb-8">Provide deeper context to attract sophisticated customers.</p>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Full Description</label>
          <textarea value={formData.fullDescription} onChange={e => updateFormData({ fullDescription: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-luxury-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-medium min-h-[140px] resize-y"
            placeholder="Describe your business in detail — years of experience, USPs, quality of service…" maxLength={2000} />
          <p className="text-xs text-gray-400 mt-1 text-right">{formData.fullDescription.length}/2000</p>
        </div>
        <div className="p-4 bg-gold-50 border border-gold-100 rounded-xl">
          <div className="flex items-start">
            <Star className="w-5 h-5 text-gold-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-luxury-black">Gallery & Offers</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">After approval you can upload a photo gallery and set up exclusive promotional offers from your Vendor Dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step 8: Pricing (card_website only) ─────────────────────────────────────
function Step8Pricing({ formData, updateFormData, errors }: { formData: FormData; updateFormData: (d: Partial<FormData>) => void; errors: FieldErrors }) {
  const plans = [
    { id: '1_year', label: '1-Year Plan', price: '₹4,000', original: null, badge: null },
    { id: '2_year', label: '2-Year Plan', price: '₹7,200', original: '₹8,000', badge: '10% OFF' },
    { id: '3_year', label: '3-Year Plan', price: '₹9,600', original: '₹12,000', badge: '20% OFF', hot: true },
  ] as const;
  return (
    <motion.div {...stepMotion} className="flex flex-col h-full">
      <h2 className="text-2xl font-serif text-luxury-black mb-2 font-bold">Pricing Plan</h2>
      <p className="text-gray-500 text-sm mb-6">Choose a subscription plan for your Mini Website.</p>
      <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div><h4 className="text-luxury-black font-bold">One-Time Setup Fee</h4><p className="text-xs text-gray-500 mt-0.5">Domain configuration & data entry</p></div>
        <div className="text-right"><p className="text-xs text-gray-400 line-through">₹3,000</p><p className="text-2xl font-bold text-gold-600">₹1,500 <span className="text-xs text-green-600 font-bold">(50% OFF)</span></p></div>
      </div>
      <h3 className="text-xs font-bold text-luxury-black uppercase tracking-wider mb-4">Select Subscription Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(({ id, label, price, original, badge, hot }: any) => (
          <button key={id} onClick={() => updateFormData({ subscriptionPlan: id })}
            className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${formData.subscriptionPlan === id ? 'border-gold-500 bg-gold-50 shadow-md scale-[1.03]' : 'border-gray-100 bg-gray-50 hover:border-gold-200'}`}>
            {badge && <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap ${hot ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gold-500'}`}>{badge}</div>}
            {formData.subscriptionPlan === id && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-gold-600" />}
            <h4 className="font-bold text-luxury-black mb-1">{label}</h4>
            <div className="mt-4">{original && <p className="text-xs text-gray-400 line-through">{original}</p>}<p className="text-2xl font-bold text-luxury-black">{price}</p></div>
          </button>
        ))}
      </div>
      <FieldError msg={errors.subscriptionPlan} />
    </motion.div>
  );
}

// ─── Step Review ──────────────────────────────────────────────────────────────
function StepReview({ formData, isSubmitting, handleSubmit, handleEdit }: { formData: FormData; isSubmitting: boolean; handleSubmit: () => void; handleEdit: (s: number) => void }) {
  const productsWithName = formData.draftProducts.filter(p => p.name.trim());
  return (
    <motion.div {...stepMotion} className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-6">
        <div><h2 className="text-2xl font-serif text-luxury-black mb-1 font-bold">Review Summary</h2><p className="text-gray-500 text-sm">Verify your details before submitting.</p></div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex-1 overflow-y-auto space-y-6">
        {/* Plan */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div><p className="text-xs text-gold-600 font-medium uppercase tracking-wider mb-1">Selected Plan</p>
            <p className="text-luxury-black font-semibold">{formData.plan === 'card_website' ? 'Contact Card + Mini Website' : 'Contact Card Only'}</p></div>
          <button onClick={() => handleEdit(1)} className="text-sm text-gray-400 hover:text-gold-600 underline">Edit</button>
        </div>

        {/* Personal + Business */}
        <div className="grid md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
          <ReviewSection title="Personal Details" icon={User} onEdit={() => handleEdit(2)} items={[['Name', formData.fullName], ['Phone', formData.phone], ['Email', formData.email || '—']]} />
          <ReviewSection title="Business Details" icon={Store} onEdit={() => handleEdit(3)} items={[['Business', formData.businessName], ['Category', formData.category], ['City', formData.city], ['Address', formData.address || '—']]} />
        </div>

        {/* Products */}
        {productsWithName.length > 0 && (
          <div className="pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-luxury-black font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-gold-500" /> Products ({productsWithName.length})</h4>
              <button onClick={() => handleEdit(4)} className="text-sm text-gray-400 hover:text-gold-600 underline">Edit</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {productsWithName.map(p => (
                <div key={p._localId} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><ImageIcon className="w-4 h-4 text-gray-300" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-luxury-black text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">₹{p.price}{p.quantity ? ` · ${p.quantity} ${p.unit}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Website / Pricing (card_website only) */}
        {formData.plan === 'card_website' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-luxury-black font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-gold-500" /> Website Info</h4>
              <button onClick={() => handleEdit(5)} className="text-sm text-gray-400 hover:text-gold-600 underline">Edit</button>
            </div>
            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100 line-clamp-2">{formData.fullDescription || 'No description provided.'}</p>
            {formData.subscriptionPlan && (
              <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gold-200">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Subscription</p>
                  <p className="font-bold text-luxury-black">{formData.subscriptionPlan === '1_year' ? '1-Year' : formData.subscriptionPlan === '2_year' ? '2-Year' : '3-Year'} Plan</p>
                  <p className="text-xs text-gray-400">+ ₹1,500 setup fee</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold-600">₹{formData.subscriptionPlan === '1_year' ? '5,500' : formData.subscriptionPlan === '2_year' ? '8,700' : '11,100'}</p>
                  <p className="text-xs text-gray-400">Total payable</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReviewSection({ title, icon: Icon, onEdit, items }: { title: string; icon: React.ElementType; onEdit: () => void; items: [string, string][] }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-luxury-black font-semibold flex items-center gap-2"><Icon className="w-4 h-4 text-gold-500" />{title}</h4>
        <button onClick={onEdit} className="text-sm text-gray-400 hover:text-gold-600 underline">Edit</button>
      </div>
      <div className="space-y-2">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-gray-400">{k}:</span>
            <span className="text-luxury-black font-medium max-w-[60%] text-right truncate">{v || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step Success ─────────────────────────────────────────────────────────────
function StepSuccess() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center py-10">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-3xl font-serif text-luxury-black mb-4">Request Submitted!</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8">Thank you for your interest in joining Gocal. Our team will review your details and publish your listing shortly.</p>
      <div className="p-4 bg-gold-50 rounded-xl border border-gold-100 w-full max-w-sm mb-8">
        <p className="text-sm text-gray-700 font-medium">Next steps</p>
        <p className="text-xs text-gray-500 mt-1">You will receive a confirmation once your listing is approved. Average review time is 1–2 business days.</p>
      </div>
      <Button variant="outline" className="border-gray-200 text-luxury-black hover:bg-gray-50" onClick={() => window.location.href = '/'}>
        Return to Home
      </Button>
    </motion.div>
  );
}
