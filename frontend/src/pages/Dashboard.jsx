import { useState } from "react";
import Navbar from "../components/Navbar";
import UploadForm from "../components/UploadForm";
import AnimatedGradient from "../components/AnimatedGradient";

export default function Dashboard() {
  const [showChecks, setShowChecks] = useState(false);

  // The 10 comprehensive checks your app performs
  const checks = [
    { name: "Resolution Check", desc: "Ensures min 1000×1000 px", icon: "📐" },
    { name: "Blur Detection", desc: "Laplacian focus analysis", icon: "🔍" },
    { name: "Sharpness Analysis", desc: "Edge clarity detection", icon: "✨" },
    { name: "Lighting Validation", desc: "Brightness & contrast", icon: "💡" },
    { name: "Aspect Ratio", desc: "Marketplace standard ratios", icon: "🖼️" },
    { name: "Background Quality", desc: "Neutral background scoring", icon: "🧹" },
    { name: "Watermark Status", desc: "Detects text/logo overlays", icon: "🚫" },
    { name: "AI Description Match", desc: "CLIP model consistency", icon: "🤖" },
    { name: "Vision Heatmap", desc: "Explainable AI attention", icon: "🗺️" },
    { name: "Smart Suggestions", desc: "Actionable fix recommendations", icon: "✅" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <AnimatedGradient />
      <div className="relative z-10">
        <Navbar />
      
      {/* Hero Section - Professional Tech Style */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden pb-32">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-slate-900/40"></div>
        
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 relative z-10">
          <div className="text-center">
            <div className="inline-block mb-6 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="text-sm font-semibold text-slate-200">AI-Powered Quality Analysis</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight animate-fade-in-up">
              Professional Product
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 pt-2">
                Image Evaluation
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Ensure your ecommerce product images meet professional quality standards. 
              Our advanced algorithms run comprehensive technical and AI consistency tests.
            </p>

            <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <button 
                type="button"
                onClick={() => setShowChecks(!showChecks)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg flex items-center mx-auto gap-3 text-lg backdrop-blur-sm group cursor-pointer"
              >
                {showChecks ? "Hide Quality Checks" : "📋 View all 10 AI Checks"}
                <svg className={`w-5 h-5 transition-transform duration-300 ${showChecks ? 'rotate-180' : 'group-hover:translate-y-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 z-0">
          <svg className="w-full h-16 text-slate-50" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="currentColor">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {showChecks && (
        <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-20 mb-12 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-5 gap-4 border border-gray-100">
            {checks.map((check, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                <span className="text-3xl mb-2">{check.icon}</span>
                <h3 className="text-sm font-bold text-slate-800 mb-1">{check.name}</h3>
                <p className="text-xs text-slate-500">{check.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Upload Form Embed - Forced Relative z-20 to prevent clicks being blocked */}
      <div className={`max-w-5xl mx-auto px-6 pb-24 relative z-20 ${!showChecks ? '-mt-24' : 'mt-0'}`}>
        <UploadForm />
      </div>
      
      </div>
    </div>
  );
}