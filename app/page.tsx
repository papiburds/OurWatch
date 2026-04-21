import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background Image 
        Requirement: Place your graffiti image in /public/bg-graffiti.jpg 
      */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-graffiti.jpg')" }}
      ></div>
      
      {/* Blue Brand Overlay */}
      <div className="absolute inset-0 z-0 bg-[#3b82f6]/80 backdrop-blur-[2px]"></div>

      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto text-white">
        
        {/* OurWatch Icon/Logo */}
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30 backdrop-blur-sm shadow-lg">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold text-xl">
            !
          </div>
        </div>

        {/* Branding Headers */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-2">
          OurWatch
        </h1>
        <h2 className="text-xl md:text-3xl font-medium mb-6">
          Crowd-Sourcing Incident Alerts
        </h2>

        {/* Value Proposition */}
        <p className="text-sm md:text-base text-blue-50 max-w-2xl leading-relaxed mb-10 font-medium">
          Empowering communities through real-time incident reporting and alerts. Keep your neighborhood safe by staying informed and connected.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          
          {/* Sign In - Links to your existing login folder */}
          <Link 
            href="/login" 
            className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-lg w-full sm:w-auto"
          >
            Sign In <span className="text-xl leading-none">›</span>
          </Link>

          {/* Create Account - Links to your existing register folder */}
          <Link 
            href="/register" 
            className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg w-full sm:w-auto text-center"
          >
            Create account
          </Link>

          {/* View Statistics - Now correctly pointing to /stats to avoid 404 */}
          <Link 
            href="/stats" 
            className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg w-full sm:w-auto text-center"
          >
            View Statistics
          </Link>

        </div>
      </main>
    </div>
  );
}