import React, { useState } from 'react';
import { Shield, Zap, Sparkles, AlertCircle, X } from 'lucide-react';
import { ToolType } from '../types';

interface FooterProps {
  setActiveTool: (tool: ToolType | null) => void;
}

export default function Footer({ setActiveTool }: FooterProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const tools = [
    { type: 'compress' as ToolType, label: 'Compress Image' },
    { type: 'convert' as ToolType, label: 'Convert Format' },
    { type: 'resize' as ToolType, label: 'Resize / Scale' },
    { type: 'crop' as ToolType, label: 'Crop / Cut' },
    { type: 'rotate' as ToolType, label: 'Rotate & Flip' },
    { type: 'watermark' as ToolType, label: 'Add Watermark' },
    { type: 'adjust' as ToolType, label: 'Filters & Adjustments' },
    { type: 'pdf' as ToolType, label: 'Images to PDF' },
    { type: 'ai' as ToolType, label: 'AI Smart Analyzer' },
  ];

  return (
    <footer className="w-full frosted-footer pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Philosophy */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                PF
              </div>
              <span className="font-extrabold text-lg text-gray-900 dark:text-white">
                PixelForge
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
              A lightning-fast, privacy-first browser image processing workspace. No uploads, no servers, no registration, no tracking. Process everything right in your browser sandbox.
            </p>
            <div className="flex items-center space-x-3 text-xs text-gray-400 dark:text-zinc-500 font-semibold pt-2">
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Local Sandbox</span>
              </span>
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span>Instant CPU</span>
              </span>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Toolkit
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-600 dark:text-zinc-300">
              {tools.slice(0, 5).map((t) => (
                <li key={t.type}>
                  <button
                    onClick={() => {
                      setActiveTool(t.type);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* More Tools */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Creative Suite
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-600 dark:text-zinc-300">
              {tools.slice(5).map((t) => (
                <li key={t.type}>
                  <button
                    onClick={() => {
                      setActiveTool(t.type);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* legal & support info */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Privacy & Legal
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-gray-600 dark:text-zinc-300">
              <li>
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowTerms(true)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <a href="mailto:support@pixelforge.io" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Support Desk
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  GitHub Project
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Browser Sandbox Privacy Notice banner */}
        <div className="p-4 rounded-xl bg-white/20 dark:bg-zinc-950/20 backdrop-blur-xs border border-blue-100/30 dark:border-zinc-800/30 flex items-start space-x-3 text-xs mb-8">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">
            <strong className="text-gray-900 dark:text-white font-bold">Privacy sandboxed:</strong> PixelForge processes images entirely in your local browser sandbox via the Canvas API and WebAssembly. Your photos never touch external servers or cloud services, keeping your personal data 100% confidential.
          </div>
        </div>

        {/* copyright and system details */}
        <div className="border-t border-gray-200/50 dark:border-zinc-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 dark:text-zinc-500 font-semibold gap-4">
          <div>
            &copy; {new Date().getFullYear()} PixelForge. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span>Powered by HTML5 &amp; WebAssembly</span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-zinc-500 dark:text-zinc-400">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span>Full-Speed Hardware Acceleration</span>
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setShowPrivacy(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                Privacy Guaranteed
              </span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Privacy Policy</h3>
              <p className="text-[11px] text-gray-400 font-semibold">Last Updated: July 2026</p>
            </div>

            <div className="space-y-4 text-xs font-semibold text-gray-600 dark:text-zinc-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 space-y-4">
              <p>
                At PixelForge, we believe that your images and personal details belong strictly to you. Our design is 100% committed to complete user privacy, local execution, and total client autonomy.
              </p>
              <h4 className="font-extrabold text-gray-800 dark:text-zinc-200 mt-2 text-sm">1. Local Processing Sandbox</h4>
              <p>
                Unlike online converter platforms that upload files to cloud datacenters, 100% of image rendering, cropping, color calibrations, and compression happens locally inside your device memory (RAM) and graphics context. We never upload your original files or download links to any remote host.
              </p>
              <h4 className="font-extrabold text-gray-800 dark:text-zinc-200 mt-2 text-sm">2. Optional AI Assistant Requests</h4>
              <p>
                If you explicitly choose to invoke the **AI Smart Assistant** feature, only the selected image file is temporarily sent to our secure, server-side Google Gemini 1.5 proxy endpoint solely to detect alt tags and optimize image parameters. These images are processed in-memory, never stored, and are discarded immediately after analysis.
              </p>
              <h4 className="font-extrabold text-gray-800 dark:text-zinc-200 mt-2 text-sm">3. No Trackers, Cookies, or Retargeting</h4>
              <p>
                PixelForge does not store cookies, configure user account logins, or leverage cross-site advertisement scripts. We collect zero tracking telemetry, guaranteeing a quiet, secure workspace.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowPrivacy(false)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setShowTerms(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/30">
                User-Owner Rights
              </span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Terms of Service</h3>
              <p className="text-[11px] text-gray-400 font-semibold">Last Updated: July 2026</p>
            </div>

            <div className="space-y-4 text-xs font-semibold text-gray-600 dark:text-zinc-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 space-y-4">
              <p>
                By loading or interacting with PixelForge, you agree to comply with and be bound by the simple usage terms detailed below.
              </p>
              <h4 className="font-extrabold text-gray-800 dark:text-zinc-200 mt-2 text-sm">1. Licensing & Intended Usage</h4>
              <p>
                PixelForge is a free utility workstation built to empower developers, writers, and designers. You can use the compiled outputs for any commercial or personal purpose without royalty fees, visual attribution mandates, or limitations.
              </p>
              <h4 className="font-extrabold text-gray-800 dark:text-zinc-200 mt-2 text-sm">2. Disclaimer of Warranties</h4>
              <p>
                This open-source, client-side web application is provided "as is" without representation or guarantee of any kind, express or implied. The developers are not liable for accidental loss of queue states, layout shift issues, or download failures in older browser versions.
              </p>
              <h4 className="font-extrabold text-gray-800 dark:text-zinc-200 mt-2 text-sm">3. Intellectual Property (Ownership)</h4>
              <p>
                You retain complete, undisputed ownership and copyright of any media files loaded into the application. PixelForge does not assert or hold any licensing privileges over your processed visual creations.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowTerms(false)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
