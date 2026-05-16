import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Wind, Sun, AlertTriangle } from 'lucide-react';

export default function CareInstructions() {
  const steps = [
    {
      title: 'Gentle Hand Wash',
      icon: <Droplets className="w-10 h-10 text-[#d4a59a]" />,
      description: 'Lingerie is delicate. We recommend hand washing in cool water using a mild, alcohol-free detergent. Soak for 5-10 minutes and gently squeeze.'
    },
    {
      title: 'Air Dry Only',
      icon: <Wind className="w-10 h-10 text-[#d4a59a]" />,
      description: 'Never use a tumble dryer. Dry your pieces flat on a clean towel or hang them over a plastic hanger. Heat from dryers can damage elastic and lace.'
    },
    {
      title: 'Avoid Direct Sun',
      icon: <Sun className="w-10 h-10 text-[#d4a59a]" />,
      description: 'Direct sunlight can fade the vibrant colors of your lingerie. Dry in a shaded, well-ventilated area to preserve the fabric integrity.'
    },
    {
      title: 'Storage & Handling',
      icon: <AlertTriangle className="w-10 h-10 text-[#d4a59a]" />,
      description: 'Store your bras by nesting them inside each other to maintain cup shape. Avoid folding lace pieces to prevent snagging.'
    }
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#f5f0ee] mb-4">Care Instructions</h1>
          <p className="text-[#9a8f8c] font-['Montserrat'] text-sm tracking-widest uppercase">Preserve the elegance of your pieces</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={step.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#111] p-10 border border-[#d4a59a]/10 rounded-sm text-center flex flex-col items-center group hover:bg-[#1a1a1a] transition-all"
            >
              <div className="mb-8 transform group-hover:scale-110 transition-transform duration-500">
                {step.icon}
              </div>
              <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0ee] mb-6">
                {step.title}
              </h3>
              <p className="text-[#9a8f8c] font-['Montserrat'] text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 bg-[#111] border border-[#d4a59a]/10 rounded-sm overflow-hidden flex flex-col md:flex-row"
        >
          <div className="flex-1 p-10 md:p-16">
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0ee] mb-6">Expert Tip</h2>
            <p className="text-[#9a8f8c] font-['Montserrat'] text-base leading-relaxed italic border-l-2 border-[#d4a59a] pl-6">
              "To keep your delicate lace looking new for years, add a tablespoon of white vinegar to the final rinse water. It helps remove soap residue and restores the fabric's natural luster."
            </p>
          </div>
          <div className="w-full md:w-1/3 bg-[#d4a59a]/5 flex items-center justify-center p-10">
            <div className="w-full aspect-square border border-[#d4a59a]/30 rounded-full flex flex-col items-center justify-center text-center p-6">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#d4a59a] font-bold mb-2">Since</span>
              <span className="font-['Cormorant_Garamond'] text-4xl text-[#f5f0ee]">2024</span>
              <span className="text-[9px] tracking-[0.2em] uppercase text-[#9a8f8c] mt-2">Quality First</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
