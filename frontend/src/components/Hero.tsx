import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Users, MessageSquare, Target } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Study
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"> Smarter</span>
                <br />
                Together
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 max-w-2xl">
                Join virtual study rooms, collaborate with peers worldwide, and get AI-powered assistance to achieve your academic goals.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Virtual Study Rooms</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">AI Study Assistant</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Real-time Chat</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Progress Tracking</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Start Studying Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="xl" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-blue-200">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-blue-200">Study Rooms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">95%</div>
                <div className="text-sm text-blue-200">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              <img 
                src={heroImage} 
                alt="Students collaborating in StudySync virtual study room"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-card animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand-green rounded-full"></div>
                <span className="text-sm font-medium text-gray-800">5 students online</span>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-brand-purple" />
                <div>
                  <div className="text-sm font-medium text-gray-800">AI Assistant</div>
                  <div className="text-xs text-gray-600">Ready to help</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;