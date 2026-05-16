import React from 'react';
import { motion } from 'framer-motion';
import { Truck, RefreshCw, Globe, ShieldCheck } from 'lucide-react';

export default function ShippingReturns() {
  const sections = [
    {
      title: 'Shipping Policy',
      icon: <Truck className="text-[#d4a59a] w-6 h-6" />,
      content: [
        'Standard Shipping (3-5 business days): Rs. 200',
        'Express Shipping (1-2 business days): Rs. 500',
        'Complimentary shipping on orders above Rs. 5,000',
        'All orders are processed within 24-48 hours.'
      ]
    },
    {
      title: 'Returns & Exchanges',
      icon: <RefreshCw className="text-[#d4a59a] w-6 h-6" />,
      content: [
        'Hassle-free returns within 7 days of delivery.',
        'Items must be unworn, with original tags and hygiene stickers intact.',
        'Exchanges are subject to stock availability.',
        'Refunds are processed within 5-7 business days after quality check.'
      ]
    },
    {
      title: 'International Shipping',
      icon: <Globe className="text-[#d4a59a] w-6 h-6" />,
      content: [
        'We currently ship to select international destinations.',
        'Shipping rates and delivery times vary by country.',
        'Customs duties and taxes are to be borne by the customer.'
      ]
    },
    {
      title: 'Quality Guarantee',
      icon: <ShieldCheck className="text-[#d4a59a] w-6 h-6" />,
      content: [
        'Every piece is inspected for quality before dispatch.',
        'In the rare case of a manufacturing defect, we offer a full replacement.',
        'Please contact us within 48 hours of delivery for defect claims.'
      ]
    }
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#f5f0ee] mb-4">Shipping & Returns</h1>
          <p className="text-[#9a8f8c] font-['Montserrat'] text-sm tracking-widest uppercase">Everything you need to know about your order</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section, idx) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#111] p-8 border border-[#d4a59a]/10 rounded-sm hover:border-[#d4a59a]/30 transition-colors"
            >
              <div className="mb-6">{section.icon}</div>
              <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0ee] mb-6 border-b border-[#d4a59a]/10 pb-2 inline-block">
                {section.title}
              </h3>
              <ul className="space-y-4 text-[#9a8f8c] font-['Montserrat'] text-sm leading-relaxed">
                {section.content.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[#d4a59a]">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 bg-[#1a1a1a] p-8 md:p-12 border border-[#d4a59a]/20 rounded-sm text-center">
          <h3 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0ee] mb-4">Need further assistance?</h3>
          <p className="text-[#9a8f8c] font-['Montserrat'] text-sm mb-8 max-w-lg mx-auto">
            Our customer care team is here to help with any questions regarding shipping or returns.
          </p>
          <a 
            href="/contact-us" 
            className="inline-block bg-[#d4a59a] text-[#0a0a0a] px-10 py-4 text-xs tracking-[0.2em] uppercase font-['Montserrat'] font-bold hover:bg-[#f2c6b4] transition-colors rounded-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
