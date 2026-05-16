import { motion, AnimatePresence } from "motion/react";
import { X, Ruler } from "lucide-react";

export function SizeGuideModal({ isOpen, onClose, category }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#d4a59a]/30 shadow-2xl rounded-md overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 md:px-8 md:py-6 border-b border-[#d4a59a]/15 bg-[#111]">
            <div className="flex items-center gap-3 text-[#d4a59a]">
              <Ruler size={24} strokeWidth={1.5} className="md:w-6 md:h-6" />
              <h3 className="font-['Montserrat'] text-sm md:text-sm tracking-[0.25em] font-bold uppercase mt-1">
                Size Guide (CM)
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#9a8f8c] hover:text-[#f5f0ee] transition-all hover:rotate-90 duration-300 p-2 bg-[#1a1a1a] rounded-sm"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto">
            <h4 className="font-['Cormorant_Garamond'] text-3xl md:text-3xl font-medium text-[#f5f0ee] mb-6">
              Measurement Chart
            </h4>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-sm border border-[#d4a59a]/20 bg-[#111] shadow-inner">
              <table className="w-full text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className="border-b border-[#d4a59a]/20 bg-[#1a1a1a]">
                    <th className="py-5 px-6 text-[#d4a59a] font-['Montserrat'] text-sm font-bold tracking-widest uppercase">Size</th>
                    <th className="py-5 px-6 text-[#f5f0ee] font-['Montserrat'] text-sm font-bold tracking-widest uppercase">Bust</th>
                    <th className="py-5 px-6 text-[#f5f0ee] font-['Montserrat'] text-sm font-bold tracking-widest uppercase">Waist</th>
                    <th className="py-5 px-6 text-[#f5f0ee] font-['Montserrat'] text-sm font-bold tracking-widest uppercase">Hips</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4a59a]/10">
                  <tr className="hover:bg-[#d4a59a]/10 transition-colors">
                    <td className="py-4 px-6 text-[#d4a59a] font-['Montserrat'] text-sm font-bold">S</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">83-85cm</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">64-66cm</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">89-91cm</td>
                  </tr>
                  <tr className="hover:bg-[#d4a59a]/10 transition-colors">
                    <td className="py-4 px-6 text-[#d4a59a] font-['Montserrat'] text-sm font-bold">M</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">87-89cm</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">68-70cm</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">93-95cm</td>
                  </tr>
                  <tr className="hover:bg-[#d4a59a]/10 transition-colors">
                    <td className="py-4 px-6 text-[#d4a59a] font-['Montserrat'] text-sm font-bold">L</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">91-93cm</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">72-74cm</td>
                    <td className="py-4 px-6 text-[#9a8f8c] font-['Montserrat'] text-sm font-medium">97-99cm</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pro Tip */}
            <div className="mt-8 border border-[#d4a59a]/30 bg-[#d4a59a]/10 p-6 md:p-6 rounded-sm shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d4a59a]" />
              <p className="text-[#d4a59a] text-[11px] md:text-xs tracking-[0.3em] uppercase font-['Montserrat'] font-bold mb-3">
                Pro Tip
              </p>
              <p className="text-[#f5f0ee] text-sm md:text-base font-['Montserrat'] leading-relaxed font-medium">
                If you are between sizes, we recommend choosing the larger size for a more comfortable fit.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}