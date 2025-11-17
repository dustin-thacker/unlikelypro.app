import { useAuth } from "@/_core/hooks/useAuth";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Loader2 } from "lucide-react";
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
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Show loading while redirecting
  if (isAuthenticated && user) {
   return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Role Switcher for Testing */}
      <div className="fixed top-4 right-4 z-50">
        <RoleSwitcher />
      </div>
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      {/* Main Content */}
      <div className="text-center max-w-6xl w-full">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <img 
            src="/logo.png" 
            alt="Unlikely Professionals" 
            className="h-64 w-64 object-contain"
          />
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Building Code Compliance<br />
          Project Operations Portal
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12">
          Comprehensive building code compliance management,<br />
          jurisdiction coordination, and real-time project tracking.
        </p>

        {/* Trust Badge */}
        <div className="mb-8">
          <p className="text-lg text-gray-500 mb-2">Trusted Since 2018</p>
          <p className="text-2xl font-semibold text-white">Global Compliance Excellence</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">4,116</div>
            <div className="text-gray-400">Projects Completed</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">80+</div>
            <div className="text-gray-400">Jurisdictions Served</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">13</div>
            <div className="text-gray-400">States Covered</div>
          </div>
        </div>

        {/* USA Servicing */}
        <div className="mb-12 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-white mb-4">USA Servicing</h3>
          <p className="text-gray-400 leading-relaxed">
            Connecticut • Delaware • Massachusetts • Maine • Maryland • North Carolina • 
            New Hampshire • New Jersey • New York • Pennsylvania • Virginia • Vermont • 
            West Virginia
          </p>
        </div>

        {/* Office Locations */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-white mb-4">Office Locations</h3>
          <div className="space-y-3">
            <div>
              <span className="text-white font-medium">North America: </span>
              <span className="text-gray-400">
                New Haven, CT • Baltimore, MD • Richmond, VA • Tampa, FL
              </span>
            </div>
            <div>
              <span className="text-white font-medium">South Africa: </span>
              <span className="text-gray-400">
                Cape Town • Johannesburg
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
