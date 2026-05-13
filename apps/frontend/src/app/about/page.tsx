"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-luxury-cream py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient light - Subtler for light theme */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-luxury-black mb-6">
            About Gocal
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            India's premier B2B commerce platform connecting businesses with verified vendors across multiple domains.
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="bg-white/70 border border-white p-8 md:p-12 rounded-3xl backdrop-blur-md shadow-[0_20px_50px_rgba(46,108,181,0.08)]"
        >
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-serif font-bold text-luxury-black mb-4 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-gold-500 inline-block"></span>
                Our Mission
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                At Gocal, we are dedicated to transforming how local businesses connect, grow, and succeed in the digital era. By providing a streamlined, premium platform, we empower vendors to showcase their products and services to a broader audience, fostering trust and seamless commerce.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-luxury-black mb-4 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-gold-500 inline-block"></span>
                What We Do
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                We bridge the gap between discerning consumers and high-quality local businesses. From comprehensive directory listings and dynamic contact cards to fully-featured mini-websites, Gocal offers the tools necessary for businesses to establish a powerful online presence. Our state-of-the-art technology ensures that your digital storefront is secure, lightning-fast, and simply beautiful.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-luxury-black mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-gold-500 inline-block"></span>
                Why Choose Us?
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gold-500/30 hover:shadow-lg transition-all duration-300 group">
                  <h3 className="text-luxury-black font-bold mb-2 text-lg group-hover:text-gold-600 transition-colors">Curated Selection</h3>
                  <p className="text-gray-500 text-sm">We provide a platform exclusively for verified and premium local vendors.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gold-500/30 hover:shadow-lg transition-all duration-300 group">
                  <h3 className="text-luxury-black font-bold mb-2 text-lg group-hover:text-gold-600 transition-colors">Premium Storefronts</h3>
                  <p className="text-gray-500 text-sm">Digital footprints that perfectly match your brand's aesthetic.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gold-500/30 hover:shadow-lg transition-all duration-300 group">
                  <h3 className="text-luxury-black font-bold mb-2 text-lg group-hover:text-gold-600 transition-colors">Robust Support</h3>
                  <p className="text-gray-500 text-sm">Secure, reliable hosting with dedicated vendor support.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-gold-500/30 hover:shadow-lg transition-all duration-300 group">
                  <h3 className="text-luxury-black font-bold mb-2 text-lg group-hover:text-gold-600 transition-colors">Community Focus</h3>
                  <p className="text-gray-500 text-sm">A commitment to local economic growth and community collaboration.</p>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
