import Navbar from "../components/Navbar";
import UploadForm from "../components/UploadForm";
import AnimatedGradient from "../components/AnimatedGradient";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      <AnimatedGradient />
      <div className="relative z-10">
        <Navbar />
      
      {/* Hero Section - Professional Tech Style */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-slate-900/40"></div>
        
        {/* Animated glow effect */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="text-center">
            <div className="inline-block mb-6 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse"></div>
                <span className="text-sm font-semibold text-slate-200">AI-Powered Quality Analysis</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight animate-fade-in-up">
              Professional Product
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-400 to-primary-500">
                Image Evaluation
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Ensure your ecommerce product images meet professional quality standards with comprehensive AI-driven analysis. 
              Advanced algorithms check resolution, lighting, background, and more.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-5 rounded-xl hover:bg-white/10 transition-all duration-300 group hover:scale-105">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">10+</div>
                    <div className="text-sm text-slate-400 font-medium">Quality Metrics</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-5 rounded-xl hover:bg-white/10 transition-all duration-300 group hover:scale-105">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">&lt;2s</div>
                    <div className="text-sm text-slate-400 font-medium">Analysis Time</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-6 py-5 rounded-xl hover:bg-white/10 transition-all duration-300 group hover:scale-105">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-sm text-slate-400 font-medium">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 text-slate-50" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="currentColor">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Feature Cards - Tech Professional Style */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <div className="card p-8 hover:shadow-xl transition-all duration-300 group border-l-4 border-primary-500 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-primary-700 transition-colors duration-300 relative z-10">Quality Verification</h3>
            <p className="text-slate-600 leading-relaxed text-sm relative z-10">
              Automated checks for resolution, blur detection, brightness, contrast, and sharpness ensuring professional ecommerce standards.
            </p>
          </div>
          
          <div className="card p-8 hover:shadow-xl transition-all duration-300 group border-l-4 border-accent-500 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-accent-700 transition-colors duration-300 relative z-10">Marketplace Standards</h3>
            <p className="text-slate-600 leading-relaxed text-sm relative z-10">
              Validates aspect ratios, background quality, watermark detection, and description consistency for compliance.
            </p>
          </div>
          
          <div className="card p-8 hover:shadow-xl transition-all duration-300 group border-l-4 border-warning-500 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-warning-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-warning-700 transition-colors duration-300 relative z-10">AI-Powered Insights</h3>
            <p className="text-slate-600 leading-relaxed text-sm relative z-10">
              Receive actionable improvement recommendations powered by advanced AI to enhance image quality and drive conversions.
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <UploadForm />
        </div>
      </div>
      </div>
    </div>
  );
}