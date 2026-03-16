"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, User, Phone, Mail, MapPin, 
  Image as ImageIcon, CheckCircle2, ChevronRight, 
  ChevronLeft, Store, Globe, Star, AlertTriangle,
  Clock, XCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppContext } from '@/context/AppContext';
import { apiClient } from '@/services/apiClient';
import { ContactCardRequest, UserRole } from '@/types';

type PlanType = 'card_only' | 'card_website' | null;

interface FormData {
  plan: PlanType;
  fullName: string;
  phone: string;
  email: string;
  businessName: string;
  category: string;
  city: string;
  address: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: File | null;
  subscriptionPlan: '1_year' | '2_year' | '3_year' | null;
}

const initialFormData: FormData = {
  plan: null,
  fullName: '',
  phone: '',
  email: '',
  businessName: '',
  category: '',
  city: '',
  address: '',
  shortDescription: '',
  fullDescription: '',
  coverImage: null,
  subscriptionPlan: null,
};

const REJECTION_REASON_LABELS: Record<string, string> = {
  INCOMPLETE_INFO: 'Incomplete Information',
  DUPLICATE: 'Duplicate Listing',
  INAPPROPRIATE: 'Inappropriate Content',
  INVALID_BUSINESS: 'Invalid Business',
  OTHER: 'Other',
};

export default function RequestCardPage() {
  const { user, isAuthenticated, setShowAuthModal, setAuthModalMode } = useAppContext();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRequests, setExistingRequests] = useState<ContactCardRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Fetch user's existing requests on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingRequests(false);
      return;
    }
    
    const fetchMyRequests = async () => {
      try {
        const res = await apiClient('/api/card-requests/mine');
        if (res.ok) {
          const data = await res.json();
          setExistingRequests(data.requests || []);
        }
      } catch (err) {
        console.error('Failed to fetch existing requests:', err);
      } finally {
        setIsLoadingRequests(false);
      }
    };
    fetchMyRequests();
  }, [isAuthenticated]);

  // Auto-fill user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Derive total steps based on selected plan
  const totalSteps = formData.plan === 'card_website' ? 6 : 4;

  const handleNext = () => {
    if (step < totalSteps) setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setAuthModalMode('signin');
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    console.log('Submitting card request...', {
      planType: formData.plan,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      businessName: formData.businessName,
      category: formData.category,
      city: formData.city,
    });

    try {
      const payload = {
        planType: formData.plan,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        businessName: formData.businessName,
        category: formData.category,
        city: formData.city,
        address: formData.address || undefined,
        shortDescription: formData.shortDescription || undefined,
        fullDescription: formData.fullDescription || undefined,
        subscriptionPlan: formData.subscriptionPlan || undefined,
      };
      
      console.log('API Payload:', JSON.stringify(payload, null, 2));

      const res = await apiClient('/api/card-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('API Response Status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('API Response Data:', data);
        setIsSuccess(true);
        setExistingRequests(prev => [data.request, ...prev]);
      } else {
        const errData = await res.json();
        console.error('API Error Data:', errData);
        if (res.status === 409) {
          // Duplicate request
          setError(errData.error || 'You already have a pending request.');
        } else {
          setError(errData.error || 'Failed to submit request. Please try again.');
        }
      }
    } catch (err) {
      console.error('Submit error (catch block):', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="glass-premium rounded-2xl p-10 shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8 text-gold-400" />
          </div>
          <h2 className="text-2xl font-serif text-white mb-3">Sign In Required</h2>
          <p className="text-gray-400 mb-8">Please sign in to request a business listing on Gocal.</p>
          <Button
            onClick={() => { setAuthModalMode('signin'); setShowAuthModal(true); }}
            className="bg-gold-500 hover:bg-gold-600 text-white border-0 w-full"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingRequests) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  // If user has existing requests, show status
  const pendingRequest = existingRequests.find(r => r.status === 'PENDING');
  const rejectedRequests = existingRequests.filter(r => r.status === 'REJECTED');
  const approvedRequest = existingRequests.find(r => r.status === 'APPROVED');

  if (pendingRequest && !isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="glass-premium rounded-2xl p-8 md:p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-serif text-white mb-3">Request Under Review</h2>
              <p className="text-gray-400 mb-6 max-w-md">
                Your request for <strong className="text-white">{pendingRequest.businessName}</strong> is currently being reviewed by our team. You'll be notified once a decision is made.
              </p>
              
              <div className="w-full bg-black/20 rounded-xl p-6 border border-white/5 text-left space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Business:</span>
                  <span className="text-gray-200">{pendingRequest.businessName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category:</span>
                  <span className="text-gray-200">{pendingRequest.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan:</span>
                  <span className="text-gray-200">{pendingRequest.planType === 'card_website' ? 'Card + Mini Website' : 'Contact Card Only'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Submitted:</span>
                  <span className="text-gray-200">{new Date(pendingRequest.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Status:</span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full uppercase">
                    Pending Review
                  </span>
                </div>
              </div>

              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (approvedRequest && user?.role === UserRole.VENDOR && !isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="glass-premium rounded-2xl p-8 md:p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-serif text-white mb-3">You're Already Listed!</h2>
              <p className="text-gray-400 mb-8 max-w-md">
                Your business <strong className="text-white">{approvedRequest.businessName}</strong> has been approved and is live on Gocal. Switch to Vendor mode from the header to manage your listing.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Go Home
                </Button>
                <Button onClick={() => window.location.href = '/vendor'} className="bg-gold-500 hover:bg-gold-600 text-white border-0">
                  Go to Vendor Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Show rejected request notice if any */}
        {rejectedRequests.length > 0 && !isSuccess && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-300 mb-1">Previous Request Rejected</h4>
                <p className="text-xs text-red-400/80">
                  Reason: <strong>{REJECTION_REASON_LABELS[rejectedRequests[0].rejectionReason || 'OTHER']}</strong>
                  {rejectedRequests[0].rejectionNote && (
                    <span className="block mt-1 text-gray-400">"{rejectedRequests[0].rejectionNote}"</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2">You can submit a new request below with corrected information.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header & Progress Info */}
        {!isSuccess && (
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-serif text-white mb-2">Request Business Listing</h1>
            <p className="text-gray-400">Join our premium directory to reach more customers locally.</p>
            
            <div className="flex justify-center items-center mt-8 space-x-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div 
                    className={`w-10 h-2 rounded-full transition-all duration-300 ${
                      i + 1 === step 
                        ? 'bg-gold-500 w-16' 
                        : i + 1 < step 
                          ? 'bg-gold-600' 
                          : 'bg-white/10'
                    }`}
                  />
                  {i < totalSteps - 1 && <div className="w-2 h-px bg-transparent" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="glass-premium rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
          
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300">{error}</p>
                <button onClick={() => setError(null)} className="text-xs text-red-400/60 mt-1 hover:text-red-300 underline">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <StepSuccess key="success" />
            ) : step === 1 ? (
              <Step1Plan {...{ formData, updateFormData }} key="step1" />
            ) : step === 2 ? (
              <Step2Personal {...{ formData, updateFormData }} key="step2" />
            ) : step === 3 ? (
              <Step3Business {...{ formData, updateFormData }} key="step3" />
            ) : step === 4 && formData.plan === 'card_website' ? (
              <Step4Website {...{ formData, updateFormData }} key="step4" />
            ) : step === 5 && formData.plan === 'card_website' ? (
              <Step5Pricing {...{ formData, updateFormData }} key="step5" />
            ) : (
              <StepReview {...{ formData, isSubmitting, handleSubmit, handleEdit: setStep }} key="review" />
            )}
          </AnimatePresence>

          {/* Navigation Footer */}
          {!isSuccess && (
            <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1 || isSubmitting}
                className="text-gray-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button 
                  variant="primary" 
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !formData.plan) ||
                    (step === 2 && (!formData.fullName || !formData.phone)) ||
                    (step === 3 && (!formData.businessName || !formData.category || !formData.city)) ||
                    (step === 5 && formData.plan === 'card_website' && !formData.subscriptionPlan)
                  }
                  className="bg-gold-500 hover:bg-gold-600 text-white border-0"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  className="bg-gold-500 hover:bg-gold-600 text-white border-0 min-w-[140px]"
                >
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

// --- Steps Components (unchanged UI) ---

function Step1Plan({ formData, updateFormData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <h2 className="text-2xl font-serif text-white mb-6">Choose Your Presence</h2>
      <div className="grid md:grid-cols-2 gap-6 flex-1">
        
        {/* Contact Card Only Option */}
        <button
          onClick={() => updateFormData({ plan: 'card_only' })}
          className={`flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-300 text-left ${
            formData.plan === 'card_only' 
              ? 'border-gold-500 bg-gold-500/10' 
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className="p-3 rounded-lg bg-white/10 mb-4 inline-flex">
            <User className={`w-6 h-6 ${formData.plan === 'card_only' ? 'text-gold-400' : 'text-gray-400'}`} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Contact Card Only</h3>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            A focused digital business card. Perfect for individuals or small services looking for local discovery without the overhead of maintaining a website.
          </p>
          <ul className="space-y-2 mt-auto text-sm text-gray-300">
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500" /> Basic business details</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500" /> Click-to-call / WhatsApp</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500" /> Local search visibility</li>
          </ul>
        </button>

        {/* Contact Card + Mini Website Option */}
        <button
          onClick={() => updateFormData({ plan: 'card_website' })}
          className={`flex flex-col items-start p-6 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
            formData.plan === 'card_website' 
              ? 'border-gold-500 bg-gold-500/10' 
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className="absolute top-0 right-0 bg-gold-500 text-xs px-3 py-1 font-medium rounded-bl-lg">
            RECOMMENDED
          </div>
          <div className="p-3 rounded-lg bg-white/10 mb-4 inline-flex">
            <Globe className={`w-6 h-6 ${formData.plan === 'card_website' ? 'text-gold-400' : 'text-gray-400'}`} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Card + Mini Website</h3>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            The complete digital storefront. Showcase your products, services, and offers alongside your contact information.
          </p>
          <ul className="space-y-2 mt-auto text-sm text-gray-300">
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500" /> Everything in Contact Card</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500" /> Product/Service catalog</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500" /> Custom branding & gallery</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-gold-500" /> exclusive offers section</li>
          </ul>
        </button>

      </div>
    </motion.div>
  );
}

function Step2Personal({ formData, updateFormData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="text-2xl font-serif text-white mb-2">Personal Details</h2>
      <p className="text-gray-400 text-sm mb-8">How can we reach the business owner or representative?</p>
      
      <div className="space-y-6 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              value={formData.fullName}
              onChange={e => updateFormData({ fullName: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              placeholder="John Doe"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="tel"
                value={formData.phone}
                onChange={e => updateFormData({ phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="+91 9876543210"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email"
                value={formData.email}
                onChange={e => updateFormData({ email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Step3Business({ formData, updateFormData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="text-2xl font-serif text-white mb-2">Business Information</h2>
      <p className="text-gray-400 text-sm mb-8">Tell us about your locally operating business.</p>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Business Name *</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text"
                value={formData.businessName}
                onChange={e => updateFormData({ businessName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="e.g. Acme Services"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={e => updateFormData({ category: e.target.value })}
              className="w-full bg-luxury-charcoal/80 border border-white/10 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
            >
              <option value="" disabled>Select a category</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Gifts">Gifts</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other Services</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text"
                value={formData.city}
                onChange={e => updateFormData({ city: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="e.g. Vadodara"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Address</label>
            <input 
              type="text"
              value={formData.address}
              onChange={e => updateFormData({ address: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              placeholder="Street, Area, Pincode"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Short Description (Tagline)</label>
          <input 
            type="text"
            value={formData.shortDescription}
            onChange={e => updateFormData({ shortDescription: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
            placeholder="A brief 1-line summary of what you do"
            maxLength={100}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Step4Website({ formData, updateFormData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 className="text-2xl font-serif text-white mb-2">Mini Website Content</h2>
      <p className="text-gray-400 text-sm mb-8">Provide deeper context to attract sophisticated customers.</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Description</label>
          <textarea 
            value={formData.fullDescription}
            onChange={e => updateFormData({ fullDescription: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors min-h-[120px] resize-y"
            placeholder="Emphasize your years of experience, unique selling propositions, and the distinct quality of your service..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image / Logo</label>
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer">
            <ImageIcon className="w-8 h-8 text-gold-500 mx-auto mb-3" />
            <p className="text-sm text-gray-300 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">SVG, PNG, JPG or WEBP (max. 5MB)</p>
          </div>
        </div>
        
        <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-lg">
          <div className="flex items-start">
            <Star className="w-5 h-5 text-gold-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-white">Products & Offers setup</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                After your initial listing is approved, you will unlock the dashboard to add your extensive product catalog, image gallery, and exclusive promotional offers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Step5Pricing({ formData, updateFormData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <h2 className="text-2xl font-serif text-white mb-2">Pricing Strategy</h2>
      <p className="text-gray-400 text-sm mb-6">Choose a subscription plan for your Mini Website.</p>

      {/* Onboarding Fee */}
      <div className="bg-white/5 border border-gold-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-white font-medium">One-Time Onboarding</h4>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1 max-w-[200px] sm:max-w-none">Setup, domain configuration & data entry.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 line-through">₹3,000</p>
          <p className="text-lg sm:text-xl font-bold text-gold-500">₹1,500 <span className="text-[10px] sm:text-xs text-green-400 ml-1">(50% OFF)</span></p>
        </div>
      </div>

      <h3 className="text-lg font-medium text-white mb-4">Select Subscription Plan</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1 Year Plan */}
        <button
          onClick={() => updateFormData({ subscriptionPlan: '1_year' })}
          className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
            formData.subscriptionPlan === '1_year'
              ? 'border-gold-500 bg-gold-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          {formData.subscriptionPlan === '1_year' && (
            <div className="absolute top-3 right-3 text-gold-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <h4 className="font-medium text-white mb-1">1-Year Plan</h4>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white mb-1">₹4,000</p>
            <p className="text-xs text-gray-400">Standard pricing</p>
          </div>
        </button>

        {/* 2 Year Plan */}
        <button
          onClick={() => updateFormData({ subscriptionPlan: '2_year' })}
          className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
            formData.subscriptionPlan === '2_year'
              ? 'border-gold-500 bg-gold-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-luxury-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
            10% OFF
          </div>
          {formData.subscriptionPlan === '2_year' && (
            <div className="absolute top-3 right-3 text-gold-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <h4 className="font-medium text-white mb-1">2-Year Plan</h4>
          <div className="mt-4">
            <p className="text-xs text-gray-500 line-through">₹8,000</p>
            <p className="text-2xl font-bold text-white mb-1">₹7,200</p>
          </div>
        </button>

        {/* 3 Year Plan */}
        <button
          onClick={() => updateFormData({ subscriptionPlan: '3_year' })}
          className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
            formData.subscriptionPlan === '3_year'
              ? 'border-gold-500 bg-gold-500/10 shadow-[0_0_15px_rgba(74,144,217,0.2)]'
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
            20% OFF
          </div>
          {formData.subscriptionPlan === '3_year' && (
            <div className="absolute top-3 right-3 text-gold-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          <h4 className="font-medium text-white mb-1">3-Year Plan</h4>
          <div className="mt-4">
            <p className="text-xs text-gray-500 line-through">₹12,000</p>
            <p className="text-2xl font-bold text-white mb-1">₹9,600</p>
          </div>
        </button>
      </div>

    </motion.div>
  );
}

function StepReview({ formData, isSubmitting, handleSubmit, handleEdit }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-serif text-white mb-2">Review Summary</h2>
          <p className="text-gray-400 text-sm">Please verify your details before submitting.</p>
        </div>
      </div>

      <div className="bg-black/20 rounded-xl p-6 border border-white/5 flex-1 overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <div>
            <p className="text-xs text-gold-500 font-medium uppercase tracking-wider mb-1">Selected Plan</p>
            <p className="text-white text-lg font-medium">
              {formData.plan === 'card_website' ? 'Contact Card + Mini Website' : 'Contact Card Only'}
            </p>
          </div>
          <button onClick={() => handleEdit(1)} className="text-sm text-gray-400 hover:text-white underline">Edit</button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white font-medium flex items-center">
                <User className="w-4 h-4 mr-2 text-gold-500" />
                Personal Details
              </h4>
              <button onClick={() => handleEdit(2)} className="text-sm text-gray-500 hover:text-white">Edit</button>
            </div>
            <div className="space-y-3 test-sm text-gray-300">
              <div className="flex justify-between"><span className="text-gray-500">Name:</span> <span>{formData.fullName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span>{formData.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email:</span> <span>{formData.email || '-'}</span></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white font-medium flex items-center">
                <Store className="w-4 h-4 mr-2 text-gold-500" />
                Business Details
              </h4>
              <button onClick={() => handleEdit(3)} className="text-sm text-gray-500 hover:text-white">Edit</button>
            </div>
            <div className="space-y-3 test-sm text-gray-300">
              <div className="flex justify-between"><span className="text-gray-500">Business:</span> <span>{formData.businessName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Category:</span> <span>{formData.category || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Location:</span> <span>{formData.city ? `${formData.city}` : '-'}</span></div>
            </div>
          </div>
        </div>

        {formData.plan === 'card_website' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
              <h4 className="text-white font-medium flex items-center">
                <Globe className="w-4 h-4 mr-2 text-gold-500" />
                Website Info & Pricing
              </h4>
              <button onClick={() => handleEdit(4)} className="text-sm text-gray-500 hover:text-white">Edit</button>
            </div>
            <div className="text-sm text-gray-300 bg-white/5 p-4 rounded-lg">
              <span className="text-gray-500 block mb-1">Description Overview:</span>
              <p className="line-clamp-2">{formData.fullDescription || 'No description provided.'}</p>
            </div>
            
            {formData.subscriptionPlan && (
              <div className="text-sm text-gray-300 bg-white/5 p-4 rounded-lg flex justify-between items-center border border-gold-500/30 shadow-[0_4px_12px_rgba(74,144,217,0.1)]">
                <div>
                  <span className="text-gray-400 block mb-1 uppercase text-[10px] tracking-widest font-semibold">Pricing Plan Overview</span>
                  <span className="font-bold text-white text-base">
                    {formData.subscriptionPlan === '1_year' ? '1-Year Plan' : formData.subscriptionPlan === '2_year' ? '2-Year Plan' : '3-Year Plan'}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">Includes ₹1,500 Setup Fee</p>
                </div>
                <div className="text-right pl-4">
                  <span className="text-xl sm:text-2xl font-bold text-gold-500">
                    ₹{formData.subscriptionPlan === '1_year' ? '5,500' : formData.subscriptionPlan === '2_year' ? '8,700' : '11,100'}
                  </span>
                  <span className="block text-[10px] sm:text-xs text-gray-400 mt-0.5">Total Payable</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
}

function StepSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center py-10"
    >
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="text-3xl font-serif text-white mb-4">Request Submitted</h2>
      <p className="text-gray-400 max-w-md mx-auto mb-8">
        Thank you for your interest in joining Gocal. Our team is reviewing your details and will process your business listing shortly.
      </p>
      
      <div className="p-4 bg-white/5 rounded-xl border border-white/10 w-full max-w-sm mb-8">
         <p className="text-sm text-gray-300">
           <strong>Next steps:</strong> You will receive a confirmation email and SMS once your card is published. 
         </p>
      </div>

      <Button variant="outline" onClick={() => window.location.href = '/'}>
        Return to Home
      </Button>
    </motion.div>
  );
}
