'use client';

import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const footerLinks = {
    platform: [
        { label: 'Browse Vendors', href: '/' },
        { label: 'Pricing', href: '/pricing' },
    ],
    company: [
        { label: 'About Us', href: '/about' },
    ],
    support: [
        // { label: 'Help Center', href: '#' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
    ],
};

export const Footer = () => {
    const router = useRouter();
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    // Hide footer on mini-website/store pages
    if (pathname?.startsWith('/store/')) return null;

    return (
        <footer className="bg-luxury-black text-white">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center mb-6">
                            <span className="font-serif text-3xl font-bold tracking-tight">
                                Gocal<span className="text-gold-500">.</span>
                            </span>
                        </div>
                        <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
                            India's premier B2B commerce platform connecting businesses with verified vendors across textiles, electronics, and more.
                        </p>


                    </div>

                    {/* Links Sections */}
                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
                        <ul className="space-y-3">
                            {footerLinks.platform.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-gold-400 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-gold-400 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Support</h4>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-gold-400 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span>© {currentYear} Gocal.co. All rights reserved.</span>
                            <span className="hidden md:inline">|</span>
                            <span className="hidden md:flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Vadodara, India
                            </span>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-gold-500 text-gray-400 hover:text-luxury-black transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-gold-500 text-gray-400 hover:text-luxury-black transition-all">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-gold-500 text-gray-400 hover:text-luxury-black transition-all">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
