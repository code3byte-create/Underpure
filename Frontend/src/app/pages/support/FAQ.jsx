import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search } from 'lucide-react';

const faqs = [
  {
    category: 'Orders & Payment',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, bank transfers, and Cash on Delivery (COD) for domestic orders.'
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'Orders can be cancelled or modified within 2 hours of placement. After this window, processing begins and changes may not be possible.'
      }
    ]
  },
  {
    category: 'Sizing & Fit',
    questions: [
      {
        q: 'How do I know my size?',
        a: 'Please refer to our detailed Size Guide. If you are still unsure, our experts can help you via WhatsApp or Email.'
      },
      {
        q: 'Do you offer custom sizing?',
        a: 'Currently, we offer a range of standard sizes from XS to XL. Custom sizing is not available at this time.'
      }
    ]
  },
  {
    category: 'Returns',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 7-day return policy for unused items with original tags. Hygiene stickers must remain intact.'
      },
      {
        q: 'How long do refunds take?',
        a: 'Once the returned item passes quality check, refunds are processed within 5-7 business days.'
      }
    ]
  }
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState(faqs[0].category);
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="bg-[#0a0a0a] min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#f5f0ee] mb-4">Frequently Asked Questions</h1>
          <p className="text-[#9a8f8c] font-['Montserrat'] text-sm tracking-widest uppercase">Find quick answers to common queries</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {faqs.map((cat) => (
            <button
              key={cat.category}
              onClick={() => { setActiveCategory(cat.category); setExpandedIndex(null); }}
              className={`px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold rounded-sm border transition-all ${activeCategory === cat.category ? 'bg-[#d4a59a] text-[#0a0a0a] border-[#d4a59a]' : 'text-[#9a8f8c] border-[#d4a59a]/20 hover:border-[#d4a59a]/50'}`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {faqs.find(c => c.category === activeCategory).questions.map((item, idx) => (
                <div key={idx} className="mb-4 border border-[#d4a59a]/10 rounded-sm overflow-hidden bg-[#111]">
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-[#1a1a1a] transition-colors"
                  >
                    <span className="font-['Cormorant_Garamond'] text-xl text-[#f5f0ee] font-medium">{item.q}</span>
                    {expandedIndex === idx ? (
                      <Minus className="text-[#d4a59a] w-5 h-5 shrink-0" />
                    ) : (
                      <Plus className="text-[#d4a59a] w-5 h-5 shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedIndex === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 pt-2 text-[#9a8f8c] font-['Montserrat'] text-sm leading-relaxed border-t border-[#d4a59a]/5">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 text-center">
          <p className="text-[#9a8f8c] font-['Montserrat'] text-sm mb-6">Can't find what you're looking for?</p>
          <a 
            href="/contact-us" 
            className="text-[10px] tracking-[0.2em] uppercase font-['Montserrat'] font-bold text-[#d4a59a] border-b border-[#d4a59a]/40 hover:border-[#d4a59a] transition-all pb-1"
          >
            Ask a personal question
          </a>
        </div>
      </div>
    </div>
  );
}
