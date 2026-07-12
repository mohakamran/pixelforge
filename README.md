# PixelForge — AI-Powered Client-Side Image Toolkit

PixelForge is a state-of-the-art, lightning-fast, and privacy-focused client-side image processing workstation. It runs entirely within the web browser sandbox using modern WebAssembly, Canvas 2D, and local Web Workers. Your images never leave your local machine — offering perfect security and speed with zero server overhead.

---

<img width="3840" height="6840" alt="pixelforge-screenshot" src="https://github.com/user-attachments/assets/a4cc5207-7dec-4d31-adfc-33ab1119d0ba" />

App Link: https://pixelforge-five-mu.vercel.app/

## 🚀 Key Features

- **⚡ 100% Client-Side Sandbox**: All image manipulations, compression, cropping, and PDF builds happen locally inside your web browser. No databases, logins, or tracking.
- **🎨 Visual Workstation**: Complete with interactive dual-image visual split comparators to preview changes side-by-side in real-time.
- **📊 Optimized Batch Queue**: Multi-file drag-and-drop queues with global stats counters, sorting, individual adjustments, and complete download bundles (as ZIP archives or multi-page PDFs).
- **✨ AI-Powered Auto-Enhance**: Server-side assistance powered by Google's Gemini 1.5 Flash to automatically detect composition details, alt text, tag search indexes, and calculate ideal image parameters.
- **🔄 Universal Transformer**: Rotating (left/right/90/180/270 degrees), mirroring (horizontal/vertical flipping), cropping with responsive presets (1:1, 16:9, etc.), and scaling dimensions safely.
- **🖼️ Sliders & Visual Filters**: Calibrate brightness, contrast, saturation, exposure, blur, hue rotation, temperature curves, magenta tinting, vignetting, grayscale, sepia, and color inversion.
- **✍️ Anti-Theft Watermarking**: Seamlessly embed customizable text overlays or brand logos with custom positions, padding, opacity scaling, and rotational angles.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (Vite, TypeScript, Tailwind CSS, Framer Motion)
- **Icons & Visuals**: Lucide Icons
- **Image Compilation**: Canvas 2D Context, HTML5 Blob API
- **Batch Compressing**: JSZip (for instant ZIP downloads), jsPDF (for document collation)
- **AI Integration**: Google @google/genai TypeScript SDK (Server-Side Proxying)

---

## ⚙️ Development & Local Setup

### 📦 Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 🚀 Running the App Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Secrets**:
   Copy `.env.example` to `.env` and fill in your Google Gemini API key:
   ```env
   GEMINI_API_KEY="YOUR_API_KEY_HERE"
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to experience PixelForge.

4. **Build for Production**:
   To compile the optimized static assets and bundle the full-stack server middleware:
   ```bash
   npm run build
   ```

5. **Start Production Server**:
   ```bash
   npm run start
   ```

---

## 🔒 Privacy & Safety Guarantee

Unlike traditional online conversion websites, **PixelForge does not upload your files to any remote server for processing**. 100% of image rendering, cropping, scaling, and compression takes place inside your CPU/GPU context via standard browser APIs. The only external API communication is an optional server request to Google Gemini if you choose to trigger the **AI Smart Assistant** tool.
