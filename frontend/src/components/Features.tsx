import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Users, 
  MessageSquare, 
  Target, 
  BookOpen, 
  Timer, 
  Palette,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Virtual Study Rooms",
      description: "Create or join study rooms with students worldwide. Collaborate in real-time with up to 20 participants per room.",
      color: "brand-blue",
      gradient: "from-brand-blue to-brand-blue-light"
    },
    {
      icon: Brain,
      title: "AI Study Assistant",
      description: "Get instant help with concepts, generate practice quizzes, and receive personalized study recommendations 24/7.",
      color: "brand-purple",
      gradient: "from-brand-purple to-brand-purple-light"
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Communicate with your study partners through integrated chat. Share ideas, ask questions, and stay motivated together.",
      color: "brand-green",
      gradient: "from-brand-green to-brand-green-light"
    },
    {
      icon: Palette,
      title: "Interactive Whiteboard",
      description: "Draw diagrams, solve equations, and visualize concepts together on a collaborative digital whiteboard.",
      color: "brand-blue",
      gradient: "from-brand-blue to-brand-purple"
    },
    {
      icon: Timer,
      title: "Smart Study Timer",
      description: "Built-in Pomodoro timer helps you maintain focus with structured study sessions and automatic break reminders.",
      color: "brand-green",
      gradient: "from-brand-green to-brand-blue"
    },
    {
      icon: Target,
      title: "Progress Tracking",
      description: "Monitor your study sessions, track goals, and visualize your academic progress with detailed analytics.",
      color: "brand-purple",
      gradient: "from-brand-purple to-brand-green"
    },
    {
      icon: BookOpen,
      title: "Resource Sharing",
      description: "Upload and share study materials, notes, and documents with your study group members securely.",
      color: "brand-blue",
      gradient: "from-brand-blue to-brand-green"
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Get insights into your study habits, identify improvement areas, and track your academic growth over time.",
      color: "brand-green",
      gradient: "from-brand-green to-brand-purple"
    },
    {
      icon: Shield,
      title: "Safe Environment",
      description: "Moderated study spaces with privacy controls ensure a safe and focused learning environment for all students.",
      color: "brand-purple",
      gradient: "from-brand-purple to-brand-blue"
    }
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to Study Better
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            StudySync combines the power of collaboration, AI assistance, and smart tools to create the ultimate learning experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-8 h-full transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/50">
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-glow`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Feature Highlights */}
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-8 text-center bg-gradient-to-br from-brand-blue/5 to-brand-purple/5 border-brand-blue/20">
            <Zap className="w-12 h-12 text-brand-blue mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Real-time collaboration with zero lag. Experience seamless study sessions with instant updates.
            </p>
          </Card>

          <Card className="p-8 text-center bg-gradient-to-br from-brand-green/5 to-brand-blue/5 border-brand-green/20">
            <Users className="w-12 h-12 text-brand-green mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Global Community</h3>
            <p className="text-muted-foreground">
              Connect with students from top universities worldwide. Learn from diverse perspectives and cultures.
            </p>
          </Card>

          <Card className="p-8 text-center bg-gradient-to-br from-brand-purple/5 to-brand-green/5 border-brand-purple/20">
            <Brain className="w-12 h-12 text-brand-purple mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">AI-Powered</h3>
            <p className="text-muted-foreground">
              Advanced AI that understands your learning style and provides personalized assistance and recommendations.
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to Transform Your Study Experience?</h3>
            <p className="text-muted-foreground">Join thousands of students already studying smarter with StudySync.</p>
            <Button variant="hero" size="xl">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;