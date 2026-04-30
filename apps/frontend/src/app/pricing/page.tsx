"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, Zap, Shield, ArrowRight, Store, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { UserRole } from '@/types';

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, user, setShowAuthModal, setAuthModalMode } = useAppContext();
  const [billingCycle, setBillingCycle] = useState<'1_year' | '2_year' | '3_year'>('1_year');

  const handleGetStarted = (plan: 'card_only' | 'card_website') => {
    if (!isAuthenticated || !user) {
      setAuthModalMode('signin');
      setShowAuthModal(true);
      return;
    }
    
    // In a real app we might pass the selected plan via query params, 
    // but the Request Card page starts fresh anyway.
    router.push('/request-card');
  };

  return (
    <div className="min-h-screen bg-luxury-cream py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 pt-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-luxury-black mb-6">
              Simple, transparent pricing for your digital success.
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Choose the perfect plan to grow your local business. Start with a Contact Card or unlock the full power of a Mini Website.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: Contact Card Only */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col p-8 md:p-10 rounded-3xl bg-white border border-gray-100 shadow-xl hover:shadow-2xl hover:border-gold-200 transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="p-3 rounded-xl bg-gold-50 w-fit mb-6">
                <Store className="w-8 h-8 text-gold-600" />
              </div>
              <h3 className="text-2xl font-bold text-luxury-black mb-2">Contact Card</h3>
              <p className="text-gray-500 text-sm mb-6 min-h-[40px]">
                A focused digital business card for local discovery.
              </p>
              
              <div className="mb-8">
                 <span className="text-4xl font-bold text-luxury-black">Free</span>
                 <p className="text-sm text-gray-400 mt-2">Forever</p>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">Basic business details</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">Click-to-call / WhatsApp links</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">Local search visibility</span>
                </li>
              </ul>

              <Button
                variant="outline"
                className="w-full text-luxury-black border-gray-200 hover:bg-gold-50 hover:border-gold-300"
                onClick={() => handleGetStarted('card_only')}
              >
                Create Contact Card
              </Button>
            </div>
          </motion.div>

          {/* Card 2: Contact Card + Mini Website */}
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="flex flex-col p-8 md:p-10 rounded-3xl bg-white border border-gold-200 shadow-[0_20px_50px_rgba(74,144,217,0.1)] hover:shadow-[0_30px_60px_rgba(74,144,217,0.15)] relative group overflow-hidden"
          >
             <div className="absolute top-0 right-0 bg-gold-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Most Popular
            </div>

            <div className="relative z-10 flex flex-col h-full">
               <div className="p-3 rounded-xl bg-gold-500/10 w-fit mb-6">
                <Globe className="w-8 h-8 text-gold-600" />
              </div>
              <h3 className="text-2xl font-bold text-luxury-black mb-2">Mini Website</h3>
              <p className="text-gray-500 text-sm mb-6 min-h-[40px]">
                The complete digital storefront to showcase your offerings.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center mb-6 border border-gray-200">
                 {(['1_year', '2_year', '3_year'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg transition-all ${
                        billingCycle === cycle
                          ? 'bg-white text-gold-600 shadow-sm border border-gold-100'
                          : 'text-gray-500 hover:text-luxury-black'
                      }`}
                    >
                      {cycle === '1_year' ? '1 Year' : cycle === '2_year' ? '2 Years' : '3 Years'}
                    </button>
                 ))}
              </div>

              {/* Pricing Display */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                 <div className="flex items-end mb-2">
                    <span className="text-5xl font-bold text-luxury-black">
                      ₹{billingCycle === '1_year' ? '4,000' : billingCycle === '2_year' ? '7,200' : '9,600'}
                    </span>
                    <span className="text-gray-500 ml-2 mb-1">/ {billingCycle.replace('_', ' ')}</span>
                 </div>
                 
                 {/* Discount Tags */}
                 <div className="h-6">
                   {billingCycle === '2_year' && (
                     <span className="inline-flex items-center text-xs font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-md border border-green-100">
                       Save 10% (₹800 discount)
                     </span>
                   )}
                   {billingCycle === '3_year' && (
                     <span className="inline-flex items-center text-xs font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100">
                       Save 20% (₹2,400 discount)
                     </span>
                   )}
                 </div>
              </div>

               {/* Onboarding Fee Highlight */}
               <div className="bg-gold-50 border border-gold-100 rounded-xl p-4 mb-8">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-700 font-bold">One-Time Onboarding Fee</span>
                    <div className="text-right">
                       <span className="text-gray-400 line-through text-xs mr-2">₹3,000</span>
                       <span className="text-gold-600 font-bold">₹1,500</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">Includes setup, data entry, and domain configuration (50% OFF).</p>
               </div>

              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm"><strong className="text-luxury-black font-bold">Everything in Contact Card</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">Product & Service catalog</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">Custom branding & image gallery</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">Exclusive promotional offers section</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">Advanced search ranking & visibility</span>
                </li>
              </ul>

              <Button
                variant="primary"
                className="w-full bg-gold-500 hover:bg-gold-600 text-white border-none h-12 text-base shadow-lg shadow-gold-500/30"
                onClick={() => handleGetStarted('card_website')}
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>

        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto border-t border-gray-200 pt-16">
           <div className="text-center">
             <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
               <Shield className="w-6 h-6 text-gold-500" />
             </div>
             <h4 className="text-luxury-black font-bold mb-2">Secure & Reliable</h4>
             <p className="text-sm text-gray-500">Your data is hosted securely with 99.9% uptime guarantees.</p>
           </div>
           <div className="text-center">
             <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
               <Zap className="w-6 h-6 text-gold-500" />
             </div>
             <h4 className="text-luxury-black font-bold mb-2">Fast Setup</h4>
             <p className="text-sm text-gray-500">Get your digital presence online within 48 hours of approval.</p>
           </div>
           <div className="text-center">
             <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
               <Star className="w-6 h-6 text-gold-500" />
             </div>
             <h4 className="text-luxury-black font-bold mb-2">Premium Support</h4>
             <p className="text-sm text-gray-500">Dedicated support to help you manage your digital storefront.</p>
           </div>
        </div>

      </div>
    </div>
  );
}
