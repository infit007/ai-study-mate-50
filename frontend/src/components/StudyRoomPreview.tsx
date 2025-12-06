import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MessageSquare, Brain, Palette, Timer } from "lucide-react";

const StudyRoomPreview = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Experience Virtual Study Rooms
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join immersive study environments where you can collaborate, chat, and learn together with students from around the world.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Study Room Interface Mockup */}
          <Card className="p-8 shadow-elevated bg-gradient-to-br from-white to-gray-50">
            {/* Room Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Calculus Study Group</h3>
                  <p className="text-muted-foreground">Mathematics • Derivatives & Integration</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-brand-green text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                Live Session
              </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Study Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Whiteboard */}
                <Card className="p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Collaborative Whiteboard
                    </h4>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded border-2 border-white shadow-sm"></div>
                      <div className="w-6 h-6 bg-blue-500 rounded border-2 border-white shadow-sm"></div>
                      <div className="w-6 h-6 bg-green-500 rounded border-2 border-white shadow-sm"></div>
                      <div className="w-6 h-6 bg-purple-500 rounded border-2 border-white shadow-sm"></div>
                    </div>
                  </div>
                  <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                    {/* Simulated Whiteboard Content */}
                    <div className="absolute top-4 left-4 text-lg font-bold text-blue-600">
                      f'(x) = lim(h→0) [f(x+h) - f(x)] / h
                    </div>
                    <div className="absolute bottom-8 right-8">
                      <svg className="w-24 h-16" viewBox="0 0 100 60">
                        <path d="M10 50 Q30 10 50 30 T90 20" stroke="#10b981" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                    <div className="text-muted-foreground">
                      Draw, annotate, and solve problems together
                    </div>
                  </div>
                </Card>

                {/* Study Timer */}
                <Card className="p-6 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Timer className="w-5 h-5 text-brand-purple" />
                      <div>
                        <h4 className="font-semibold">Pomodoro Session</h4>
                        <p className="text-sm text-muted-foreground">Focus time with breaks</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-brand-purple">25:00</div>
                      <div className="text-sm text-muted-foreground">Minutes remaining</div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-brand-purple to-brand-blue rounded-full"></div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Participants */}
                <Card className="p-6 bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4" />
                    <h4 className="font-semibold">Participants (4)</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Alex Chen", subject: "Mathematics", status: "online" },
                      { name: "Sarah Kim", subject: "Physics", status: "online" },
                      { name: "Mike Rodriguez", subject: "Engineering", status: "away" },
                      { name: "Emma Wilson", subject: "Mathematics", status: "online" },
                    ].map((user, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <div className="w-full h-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-sm font-semibold">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.subject}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Chat */}
                <Card className="p-6 bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4" />
                    <h4 className="font-semibold">Group Chat</h4>
                  </div>
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    <div className="text-sm">
                      <span className="font-medium text-brand-blue">Alex:</span>{" "}
                      <span className="text-muted-foreground">Can someone explain the chain rule?</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-brand-green">Sarah:</span>{" "}
                      <span className="text-muted-foreground">Sure! Let me draw it on the whiteboard</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-brand-purple">AI Assistant:</span>{" "}
                      <span className="text-muted-foreground">The chain rule is used for composite functions...</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Type a message..." 
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                    <Button size="sm" variant="default">Send</Button>
                  </div>
                </Card>

                {/* AI Assistant */}
                <Card className="p-6 bg-gradient-to-br from-brand-purple/5 to-brand-blue/5 border-brand-purple/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-4 h-4 text-brand-purple" />
                    <h4 className="font-semibold">AI Study Assistant</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant help with concepts, generate practice questions, or ask for study tips.
                  </p>
                  <Button variant="accent" size="sm" className="w-full">
                    Ask AI Assistant
                  </Button>
                </Card>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button variant="hero" size="xl">
            Join Your First Study Room
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StudyRoomPreview;