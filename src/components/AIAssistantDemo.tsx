import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  MessageSquare, 
  Send, 
  Sparkles, 
  BookOpen, 
  Calculator,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

const AIAssistantDemo = () => {
  const [selectedExample, setSelectedExample] = useState(0);

  const chatExamples = [
    {
      category: "Mathematics",
      icon: Calculator,
      color: "brand-blue",
      messages: [
        {
          type: "user",
          content: "Can you explain derivatives in simple terms?",
          timestamp: "2:14 PM"
        },
        {
          type: "ai",
          content: "Sure! Think of a derivative as the 'rate of change' - like how fast a car is going at any moment. If you have a function f(x), the derivative f'(x) tells you how quickly f(x) is changing at each point.",
          timestamp: "2:14 PM"
        },
        {
          type: "ai",
          content: "For example, if f(x) = x², then f'(x) = 2x. This means when x = 3, the function is changing at a rate of 6 units per unit of x.",
          timestamp: "2:14 PM"
        },
        {
          type: "user",
          content: "Can you create a practice problem for me?",
          timestamp: "2:15 PM"
        },
        {
          type: "ai",
          content: "📝 **Practice Problem**: Find the derivative of f(x) = 3x³ + 2x² - 5x + 7\n\nTake your time and let me know what you get! I'll help you check your work.",
          timestamp: "2:15 PM"
        }
      ]
    },
    {
      category: "Study Tips",
      icon: Lightbulb,
      color: "brand-purple",
      messages: [
        {
          type: "user",
          content: "I'm struggling to stay focused during long study sessions. Any tips?",
          timestamp: "3:22 PM"
        },
        {
          type: "ai",
          content: "Absolutely! Here are some proven techniques to maintain focus:\n\n🍅 **Pomodoro Technique**: Study for 25 minutes, then take a 5-minute break\n📱 **Remove distractions**: Put your phone in another room\n🎯 **Set specific goals**: Instead of 'study math,' try 'complete 10 calculus problems'\n💧 **Stay hydrated**: Dehydration affects concentration",
          timestamp: "3:22 PM"
        },
        {
          type: "user",
          content: "How do I make effective study notes?",
          timestamp: "3:24 PM"
        },
        {
          type: "ai",
          content: "Great question! Here's my note-taking framework:\n\n📋 **Cornell Method**: Divide your page into notes, cues, and summary sections\n🌈 **Use colors**: Different colors for definitions, examples, and key concepts\n📝 **Write in your own words**: Don't just copy - rephrase to test understanding\n🔗 **Connect ideas**: Draw arrows and links between related concepts",
          timestamp: "3:24 PM"
        }
      ]
    },
    {
      category: "Science",
      icon: BookOpen,
      color: "brand-green",
      messages: [
        {
          type: "user",
          content: "What's the difference between ionic and covalent bonds?",
          timestamp: "4:10 PM"
        },
        {
          type: "ai",
          content: "Great chemistry question! Here's a clear breakdown:\n\n⚡ **Ionic Bonds**:\n• Form between metals and non-metals\n• Electrons are transferred from one atom to another\n• Creates charged ions (positive and negative)\n• Example: NaCl (table salt)\n\n🤝 **Covalent Bonds**:\n• Form between non-metals\n• Electrons are shared between atoms\n• No charged ions formed\n• Example: H₂O (water)",
          timestamp: "4:10 PM"
        },
        {
          type: "user",
          content: "Can you give me a memory trick to remember this?",
          timestamp: "4:11 PM"
        },
        {
          type: "ai",
          content: "🧠 **Memory Trick**: \n\n**Ionic** = **\"I Own It\"** → One atom takes ownership of electrons (transfer)\n\n**Covalent** = **\"Co-Share\"** → Atoms cooperate and share electrons\n\nAlso remember: **Metals Give, Non-metals Take** in ionic bonds!",
          timestamp: "4:11 PM"
        }
      ]
    }
  ];

  const quickActions = [
    { label: "Generate Quiz", icon: "📝" },
    { label: "Explain Concept", icon: "💡" },
    { label: "Study Schedule", icon: "📅" },
    { label: "Memory Tips", icon: "🧠" }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-8 h-8 text-brand-purple" />
            <Badge variant="secondary" className="bg-brand-purple/10 text-brand-purple border-brand-purple/20">
              AI-Powered
            </Badge>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Your Personal Study Assistant
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get instant help with any subject, generate practice questions, and receive personalized study guidance available 24/7.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {chatExamples.map((example, index) => {
              const Icon = example.icon;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedExample(index)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                    selectedExample === index
                      ? `bg-gradient-to-r from-${example.color} to-${example.color}-light text-white shadow-glow`
                      : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{example.category}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Interface */}
          <Card className="p-0 overflow-hidden shadow-elevated bg-white">
            {/* Chat Header */}
            <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-card">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">StudySync AI Assistant</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Online • Instant responses</span>
                  </div>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary" className="bg-brand-purple/10 text-brand-purple">
                    {chatExamples[selectedExample].category}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {chatExamples[selectedExample].messages.map((message, index) => (
                <div key={index} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'ai' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-4 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-gradient-primary text-white ml-auto' 
                        : 'bg-gray-50 text-gray-900'
                    }`}>
                      <div className="whitespace-pre-line text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <div className="w-full h-full bg-gradient-secondary flex items-center justify-center text-white text-sm font-semibold">
                        You
                      </div>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex flex-wrap gap-2 mb-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-brand-blue/20 hover:bg-brand-blue/5 transition-all duration-200 text-sm"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    placeholder="Ask me anything about your studies..." 
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/50 transition-all"
                  />
                  <Sparkles className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <Button variant="default" size="lg" className="px-6">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 text-center bg-gradient-to-br from-brand-blue/5 to-brand-purple/5 border-brand-blue/20">
              <MessageSquare className="w-8 h-8 text-brand-blue mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Instant Responses</h4>
              <p className="text-sm text-muted-foreground">Get immediate answers to any academic question, 24/7</p>
            </Card>

            <Card className="p-6 text-center bg-gradient-to-br from-brand-purple/5 to-brand-green/5 border-brand-purple/20">
              <Sparkles className="w-8 h-8 text-brand-purple mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Personalized Learning</h4>
              <p className="text-sm text-muted-foreground">AI adapts to your learning style and academic level</p>
            </Card>

            <Card className="p-6 text-center bg-gradient-to-br from-brand-green/5 to-brand-blue/5 border-brand-green/20">
              <BookOpen className="w-8 h-8 text-brand-green mx-auto mb-3" />
              <h4 className="font-semibold mb-2">All Subjects</h4>
              <p className="text-sm text-muted-foreground">Mathematics, Science, Literature, History, and more</p>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Experience AI-Powered Learning</h3>
            <p className="text-muted-foreground">Join students who are already getting better grades with AI assistance.</p>
            <Button variant="hero" size="xl" className="group">
              Try AI Assistant Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantDemo;