"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-luxury-cream py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient light - Subtler for light theme */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-luxury-black mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Have questions or need assistance? Our team is here to help you navigate our premium platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Information */}
          <motion.div
             initial={{ opacity: 0, x: -30 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="space-y-8"
          >
            <div className="bg-white/70 border border-white p-8 rounded-3xl backdrop-blur-md shadow-[0_20px_50px_rgba(46,108,181,0.08)]">
              <h3 className="text-xl font-bold text-luxury-black mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center shrink-0 border border-gold-200 mr-4">
                    <MapPin className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Our Location</h4>
                    <p className="text-luxury-black font-medium">Vadodara, Gujarat, India</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center shrink-0 border border-gold-200 mr-4">
                    <Phone className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                     <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                     <p className="text-luxury-black font-medium">+91 7211119969</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center shrink-0 border border-gold-200 mr-4">
                    <Mail className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email Us</h4>
                    {/* <p className="text-luxury-black font-medium mb-1"><a href="mailto:support@gocal.co" className="hover:text-gold-600 transition-colors">support@gocal.co</a></p> */}
                    <p className="text-luxury-black font-medium"><a href="mailto:sales@gocal.co" className="hover:text-gold-600 transition-colors">imgocal@gmail.com</a></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gold-50 via-white to-gold-50 border border-gold-200 p-8 rounded-3xl shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gold-500/10 transition-colors duration-500" />
               <h3 className="text-lg font-bold text-luxury-black mb-2 relative z-10">Vendor Support</h3>
               <p className="text-sm text-gray-600 mb-6 relative z-10">Are you a vendor looking to list your business or upgrade your current active plan?</p>
               <Button 
                variant="primary" 
                className="w-full bg-luxury-black text-white hover:bg-luxury-charcoal border-none font-bold relative z-10"
                onClick={() => window.location.href = '/pricing'}
               >
                  View Pricing Plans
               </Button>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
             initial={{ opacity: 0, x: 30 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
             className="bg-white/70 border border-white p-8 md:p-10 rounded-3xl backdrop-blur-md shadow-[0_20px_50px_rgba(46,108,181,0.08)] flex flex-col h-full"
          >
            <h3 className="text-2xl font-serif font-bold text-luxury-black mb-6">Send a Message</h3>
            <form className="space-y-6 flex-1 flex flex-col" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-sm"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-500 mb-2">Message</label>
                <textarea 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-luxury-black placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all h-32 resize-none shadow-sm"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <Button type="submit" className="w-full h-12 bg-gold-500 text-luxury-black hover:bg-gold-600 font-bold border-none flex items-center justify-center gap-2 mt-auto shadow-md">
                Send Message <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
