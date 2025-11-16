import { useAuth } from "@/_core/hooks/useAuth";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Button } from "@/components/ui/button";
import { Loader2, FileCheck, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show loading while redirecting
  if (isAuthenticated && user) {
   return (
    <div className="min-h-screen flex flex-col">
      {/* Role Switcher for Testing */}
      <div className="fixed top-4 right-4 z-50">
        <RoleSwitcher />
      </div>
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <h1 className="text-2xl font-bold text-slate-900">{APP_TITLE}</h1>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-slate-900 mb-6">
          Streamline Your Inspection Projects
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Upload plans and permits, extract data automatically with AI, verify information, 
          and schedule inspections—all in one seamless workflow.
        </p>
        <Button
          size="lg"
          onClick={() => window.location.href = getLoginUrl()}
          className="text-lg px-8 py-6"
        >
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Smart Document Upload
            </h3>
            <p className="text-slate-600">
              Upload building plans and permits in PDF format. Our AI automatically extracts 
              key information including property owner, address, jurisdiction, and permit numbers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Data Verification
            </h3>
            <p className="text-slate-600">
              Review and verify the extracted information before proceeding. Make corrections 
              or add additional details to ensure accuracy.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Easy Scheduling
            </h3>
            <p className="text-slate-600">
              Schedule your inspection with just a few clicks. Select your preferred date 
              and time, and track the status of your project.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Create your account and submit your first inspection project today.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = getLoginUrl()}
            className="text-lg px-8 py-6"
          >
            Sign Up Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
