import { useAuth } from "@/_core/hooks/useAuth";
import RoleSwitcher from "@/components/RoleSwitcher";
import CustomCursor from "@/components/CustomCursor";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their role-specific dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        setLocation("/admin");
      } else if (user.role === 'client_scheduler') {
        setLocation("/scheduler/projects");
      } else if (user.role === 'client_ap') {
        setLocation("/ap");
      } else if (user.role === 'field_tech') {
        setLocation("/field-tech");
      } else {
        setLocation("/my-projects");
      }
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <CustomCursor />
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  // Show loading while redirecting
  if (isAuthenticated && user) {
   return (
    <div className="min-h-screen flex flex-col bg-black">
      <CustomCursor />
      {/* Role Switcher for Testing */}
      <div className="fixed top-4 right-4 z-50">
        <RoleSwitcher />
      </div>
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <CustomCursor />
      
      {/* Main Content */}
      <div className="text-center max-w-6xl w-full">
        {/* Logo */}
        <div className="mb-16 flex justify-center">
          <img 
            src="/logo.png" 
            alt="Unlikely Professionals" 
            className="h-56 w-56 md:h-64 md:w-64 object-contain"
          />
        </div>

        {/* Main Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-white leading-tight tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
            Welcome to the<br />
            Code Compliance Project Operations Application
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-2" style={{ fontFamily: "'Lora', serif" }}>(CoCo POps)</p>
        </div>

        {/* Subtitle */}
        <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto mb-8 font-light leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
          A Comprehensive project compliance management,<br />
          jurisdictional coordination, interactive building code compliance agent,<br />
          and real-time project tracking system for AEC Professionals.
        </p>

        {/* Portal Button */}
        <div className="mb-12">
          <Link href="/login">
            <Button
              className="bg-gray-300 hover:bg-gray-400 text-black font-normal px-8 py-6 text-base md:text-lg rounded-md transition-colors"
              style={{ fontFamily: "'Lora', serif", cursor: 'pointer' }}
            >
              Login
            </Button>
          </Link>
        </div>

        {/* Horizontal Divider */}
        <div className="w-full max-w-2xl mx-auto mb-12">
          <hr className="border-gray-700" />
        </div>

        {/* Trust Badge */}
        <div className="mb-12">
          <p className="text-base md:text-lg text-gray-500 mb-3 font-light" style={{ fontFamily: "'Lora', serif" }}>Trusted Since 2018</p>
          <p className="text-xl md:text-2xl font-medium text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Global Compliance Excellence</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-normal text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>4,116</div>
            <div className="text-gray-400 text-sm md:text-base font-light" style={{ fontFamily: "'Lora', serif" }}>Projects Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-normal text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>80+</div>
            <div className="text-gray-400 text-sm md:text-base font-light" style={{ fontFamily: "'Lora', serif" }}>Jurisdictions Served</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-normal text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>13</div>
            <div className="text-gray-400 text-sm md:text-base font-light" style={{ fontFamily: "'Lora', serif" }}>States Covered</div>
          </div>
        </div>

        {/* USA Servicing */}
        <div className="mb-16 max-w-4xl mx-auto">
          <h3 className="text-lg md:text-xl font-medium text-white mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>USA Servicing</h3>
          <p className="text-gray-400 leading-relaxed text-sm md:text-base font-light" style={{ fontFamily: "'Lora', serif" }}>
            Connecticut • Delaware • Massachusetts • Maine • Maryland • North Carolina • 
            New Hampshire • New Jersey • New York • Pennsylvania • Virginia • Vermont • 
            West Virginia
          </p>
        </div>

        {/* Office Locations */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg md:text-xl font-medium text-white mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>Office Locations</h3>
          <div className="space-y-4">
            <div>
              <span className="text-white font-normal text-sm md:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>North America: </span>
              <span className="text-gray-400 text-sm md:text-base font-light" style={{ fontFamily: "'Lora', serif" }}>
                New Haven, CT • Baltimore, MD • Richmond, VA • Tampa, FL
              </span>
            </div>
            <div>
              <span className="text-white font-normal text-sm md:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>South Africa: </span>
              <span className="text-gray-400 text-sm md:text-base font-light" style={{ fontFamily: "'Lora', serif" }}>
                Cape Town • Johannesburg
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
