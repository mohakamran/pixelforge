import React from 'react';
import { Sparkles, Image, Settings, HelpCircle, Info, Moon, Sun, UploadCloud } from 'lucide-react';
import { ToolType } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  activeTool: ToolType | null;
  setActiveTool: (tool: ToolType | null) => void;
  onScrollToFAQ: () => void;
  onScrollToFeatures: () => void;
  onScrollToAbout: () => void;
  onTriggerUpload: () => void;
  hasFiles: boolean;
}

export default function Navbar({
  darkMode,
  setDarkMode,
  activeTool,
  setActiveTool,
  onScrollToFAQ,
  onScrollToFeatures,
  onScrollToAbout,
  onTriggerUpload,
  hasFiles,
}: NavbarProps) {
  const toolsList: { type: ToolType; label: string; icon: React.ReactNode }[] = [
    { type: 'compress', label: 'Compress Image', icon: <Sparkles className="w-4 h-4 text-emerald-500" /> },
    { type: 'convert', label: 'Convert Format', icon: <Settings className="w-4 h-4 text-indigo-500" /> },
    { type: 'resize', label: 'Resize / Scale', icon: <Settings className="w-4 h-4 text-blue-500" /> },
    { type: 'crop', label: 'Crop / Cut', icon: <Image className="w-4 h-4 text-purple-500" /> },
    { type: 'rotate', label: 'Rotate & Flip', icon: <Image className="w-4 h-4 text-pink-500" /> },
    { type: 'watermark', label: 'Add Watermark', icon: <Image className="w-4 h-4 text-amber-500" /> },
    { type: 'adjust', label: 'Adjust & Filters', icon: <Settings className="w-4 h-4 text-sky-500" /> },
    { type: 'pdf', label: 'PDF Compilation', icon: <Sparkles className="w-4 h-4 text-red-500" /> },
    { type: 'ai', label: 'AI Analyzer', icon: <Sparkles className="w-4 h-4 text-violet-500" /> },
  ];

  return (
    <header className="frosted-nav sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setActiveTool(null)} 
          className="flex items-center space-x-2 cursor-pointer group"
          id="navbar-logo-container"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            PF
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
            PixelForge
          </span>
        </div>

        {/* Desktop Nav Actions */}
        <nav className="hidden md:flex items-center space-x-1 font-medium text-sm text-gray-600 dark:text-zinc-300">
          {/* Tools Menu */}
          <div className="relative group/menu">
            <button className="px-3 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors flex items-center space-x-1 cursor-pointer">
              <span>Tools</span>
              <svg className="w-4 h-4 transition-transform group-hover/menu:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 frosted-card rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-150 transform scale-95 group-hover/menu:scale-100 origin-top-left z-50">
              <div className="p-2 grid grid-cols-1 gap-1">
                {toolsList.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setActiveTool(t.type)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2.5 transition-colors cursor-pointer ${
                      activeTool === t.type
                        ? 'bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-white/40 dark:hover:bg-white/5 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={onScrollToFeatures} 
            className="px-3 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={onScrollToFAQ} 
            className="px-3 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            FAQ
          </button>
          <button 
            onClick={onScrollToAbout} 
            className="px-3 py-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            About
          </button>
        </nav>

        {/* Global Controls */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Toggle theme"
            id="theme-toggle-btn"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Contextual Upload Button */}
          {!hasFiles ? (
            <button
              onClick={onTriggerUpload}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center space-x-1.5 cursor-pointer"
              id="navbar-upload-btn"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Images</span>
            </button>
          ) : activeTool ? (
            <button
              onClick={() => setActiveTool(null)}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-semibold text-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              id="navbar-queue-btn"
            >
              <Image className="w-4 h-4 text-blue-500" />
              <span>View Queue</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready for Processing</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
