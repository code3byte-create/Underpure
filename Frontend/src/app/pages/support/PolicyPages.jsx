import React from 'react';
import { motion } from 'framer-motion';

const PolicyLayout = ({ title, children }) => (
  <div className="bg-[#0a0a0a] min-h-screen pt-28 pb-20 px-4">
    <div className="max-w-3xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 border-b border-[#d4a59a]/20 pb-8"
      >
        <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#f5f0ee] mb-4">{title}</h1>
        <p className="text-[#9a8f8c] font-['Montserrat'] text-[10px] tracking-widest uppercase">Last Updated: May 2024</p>
      </motion.div>
      <div className="prose prose-invert prose-rose max-w-none font-['Montserrat'] text-sm text-[#9a8f8c] leading-relaxed space-y-8">
        {children}
      </div>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <PolicyLayout title="Privacy Policy">
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">1. Information We Collect</h3>
      <p>We collect information you provide directly to us when you create an account, make a purchase, or communicate with us. This includes name, email, shipping address, and payment info.</p>
    </section>
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">2. How We Use Your Information</h3>
      <p>We use your information to process orders, provide customer support, and send promotional communications (if opted in). We do not sell your personal data to third parties.</p>
    </section>
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">3. Data Security</h3>
      <p>We implement industry-standard security measures to protect your data. All payment transactions are encrypted using SSL technology.</p>
    </section>
  </PolicyLayout>
);

export const TermsOfService = () => (
  <PolicyLayout title="Terms of Service">
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">1. Introduction</h3>
      <p>By accessing UnderPure, you agree to comply with these Terms of Service. These terms govern your use of our website and purchase of our products.</p>
    </section>
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">2. Product Descriptions</h3>
      <p>We strive for accuracy in product descriptions and colors. However, we cannot guarantee that your monitor's display of any color will be accurate.</p>
    </section>
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">3. Intellectual Property</h3>
      <p>All content on this site, including images and text, is the property of UnderPure and is protected by copyright laws.</p>
    </section>
  </PolicyLayout>
);

export const CookiePolicy = () => (
  <PolicyLayout title="Cookie Policy">
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">What are Cookies?</h3>
      <p>Cookies are small text files stored on your device that help us improve your browsing experience and remember your preferences.</p>
    </section>
    <section>
      <h3 className="text-[#f5f0ee] text-lg font-['Cormorant_Garamond'] mb-4">How We Use Cookies</h3>
      <p>We use essential cookies for site functionality (like the shopping cart) and analytical cookies to understand how our visitors interact with the site.</p>
    </section>
  </PolicyLayout>
);
