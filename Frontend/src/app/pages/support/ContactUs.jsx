import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Instagram, Facebook } from 'lucide-react';
import { useSiteSettingsStore } from '../../store/siteSettingsStore';

export default function ContactUs() {
  const { storeEmail, storePhone, storeAddress, instagramUrl, facebookUrl } = useSiteSettingsStore();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#f5f0ee] mb-4">Contact Us</h1>
          <p className="text-[#9a8f8c] font-['Montserrat'] text-sm tracking-widest uppercase">We'd love to hear from you</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0ee] mb-8">Get In Touch</h2>
            <p className="text-[#9a8f8c] font-['Montserrat'] text-sm leading-relaxed mb-10">
              Whether you have a question about sizing, shipping, or just want to share some feedback, our team is ready to assist you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#111] border border-[#d4a59a]/20 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="text-[#d4a59a] w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-['Montserrat'] text-[10px] tracking-widest uppercase text-[#d4a59a] mb-1">Email</h4>
                  <p className="text-[#f5f0ee] font-medium">{storeEmail || "hello@underpure.com"}</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#111] border border-[#d4a59a]/20 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="text-[#d4a59a] w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-['Montserrat'] text-[10px] tracking-widest uppercase text-[#d4a59a] mb-1">WhatsApp / Phone</h4>
                  <p className="text-[#f5f0ee] font-medium">{storePhone || "+44 20 7123 4567"}</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#111] border border-[#d4a59a]/20 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="text-[#d4a59a] w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-['Montserrat'] text-[10px] tracking-widest uppercase text-[#d4a59a] mb-1">Office</h4>
                  <p className="text-[#f5f0ee] font-medium">{storeAddress || "Lahore, Pakistan"}</p>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h4 className="font-['Montserrat'] text-[10px] tracking-widest uppercase text-[#9a8f8c] mb-6">Follow Our Journey</h4>
              <div className="flex gap-4">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-[#111] border border-[#d4a59a]/10 rounded-full flex items-center justify-center text-[#9a8f8c] hover:text-[#d4a59a] hover:border-[#d4a59a]/40 transition-all">
                    <Instagram size={18} />
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-[#111] border border-[#d4a59a]/10 rounded-full flex items-center justify-center text-[#9a8f8c] hover:text-[#d4a59a] hover:border-[#d4a59a]/40 transition-all">
                    <Facebook size={18} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111] p-8 md:p-12 border border-[#d4a59a]/10 rounded-sm shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4a59a]/40 to-transparent"></div>
            
            {status === 'success' ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-[#d4a59a]/10 rounded-full flex items-center justify-center mb-8 border border-[#d4a59a]/30">
                  <Send className="text-[#d4a59a] w-8 h-8" />
                </div>
                <h3 className="font-['Cormorant_Garamond'] text-3xl text-[#f5f0ee] mb-4">Message Sent</h3>
                <p className="text-[#9a8f8c] font-['Montserrat'] text-sm leading-relaxed mb-8">
                  Thank you for reaching out. A member of our team will get back to you within 24 hours.
                </p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="text-[#d4a59a] font-['Montserrat'] text-[10px] tracking-widest uppercase font-bold border-b border-[#d4a59a]/40 pb-1"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-[#9a8f8c] font-bold">Your Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 rounded-sm px-4 py-3.5 text-sm text-[#f5f0ee] focus:border-[#d4a59a] outline-none transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-[#9a8f8c] font-bold">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 rounded-sm px-4 py-3.5 text-sm text-[#f5f0ee] focus:border-[#d4a59a] outline-none transition-colors"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] tracking-widest uppercase text-[#9a8f8c] font-bold">Subject</label>
                  <input 
                    required
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 rounded-sm px-4 py-3.5 text-sm text-[#f5f0ee] focus:border-[#d4a59a] outline-none transition-colors"
                    placeholder="Sizing Enquiry"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] tracking-widest uppercase text-[#9a8f8c] font-bold">Message</label>
                  <textarea 
                    required
                    rows="5"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#d4a59a]/20 rounded-sm px-4 py-3.5 text-sm text-[#f5f0ee] focus:border-[#d4a59a] outline-none transition-colors resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button 
                  disabled={status === 'submitting'}
                  type="submit"
                  className="w-full bg-[#d4a59a] text-[#0a0a0a] py-4 rounded-sm font-['Montserrat'] text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#f2c6b4] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                  <Send size={14} />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
