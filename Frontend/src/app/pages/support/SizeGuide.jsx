import React from 'react';
import { motion } from 'framer-motion';

export default function SizeGuide() {
  const sizes = [
    { size: 'XS', bust: '30-32', waist: '24-25', hips: '33-34' },
    { size: 'S', bust: '32-34', waist: '26-27', hips: '35-36' },
    { size: 'M', bust: '34-36', waist: '28-29', hips: '37-38' },
    { size: 'L', bust: '36-38', waist: '30-31', hips: '39-40' },
    { size: 'XL', bust: '38-40', waist: '32-33', hips: '41-42' },
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#f5f0ee] mb-4">Size Guide</h1>
          <p className="text-[#9a8f8c] font-['Montserrat'] text-sm tracking-widest uppercase">Find your perfect fit</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111] border border-[#d4a59a]/10 rounded-sm overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#d4a59a]/20 bg-[#1a1a1a]">
                  <th className="px-6 py-4 text-[#d4a59a] font-['Montserrat'] text-xs tracking-widest uppercase">Size</th>
                  <th className="px-6 py-4 text-[#d4a59a] font-['Montserrat'] text-xs tracking-widest uppercase">Bust (in)</th>
                  <th className="px-6 py-4 text-[#d4a59a] font-['Montserrat'] text-xs tracking-widest uppercase">Waist (in)</th>
                  <th className="px-6 py-4 text-[#d4a59a] font-['Montserrat'] text-xs tracking-widest uppercase">Hips (in)</th>
                </tr>
              </thead>
              <tbody className="text-[#9a8f8c] font-['Montserrat'] text-sm">
                {sizes.map((row, i) => (
                  <tr key={row.size} className="border-b border-[#d4a59a]/5 hover:bg-[#d4a59a]/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#f5f0ee]">{row.size}</td>
                    <td className="px-6 py-4">{row.bust}</td>
                    <td className="px-6 py-4">{row.waist}</td>
                    <td className="px-6 py-4">{row.hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111] p-8 border border-[#d4a59a]/10 rounded-sm">
            <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0ee] mb-4">How to Measure</h3>
            <ul className="space-y-4 text-[#9a8f8c] font-['Montserrat'] text-sm leading-relaxed">
              <li><span className="text-[#d4a59a] font-bold mr-2">Bust:</span> Measure around the fullest part of your chest.</li>
              <li><span className="text-[#d4a59a] font-bold mr-2">Waist:</span> Measure around the narrowest part of your waistline.</li>
              <li><span className="text-[#d4a59a] font-bold mr-2">Hips:</span> Measure around the fullest part of your hips.</li>
            </ul>
          </div>
          <div className="bg-[#111] p-8 border border-[#d4a59a]/10 rounded-sm">
            <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#f5f0ee] mb-4">Fit Tips</h3>
            <p className="text-[#9a8f8c] font-['Montserrat'] text-sm leading-relaxed">
              If you're between sizes, we recommend sizing up for a more comfortable fit, or sizing down for a more snug, sculpted feel. Most of our pieces have high stretch content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
