'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  MessageSquare,
  FileText,
  Zap,
  Bot,
  ArrowRight,
  CheckCircle,
  Star,
  Rocket,
  Shield,
  Zap as ZapIcon,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  gradient: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to BoltX! 🚀',
    subtitle: 'Your AI Chat Companion',
    description:
      'Ready to chat with the smartest AI? BoltX makes conversations feel natural, helpful, and fun.',
    icon: <Sparkles className="size-8" />,
    features: [
      'Chat with advanced AI',
      'Upload images & files',
      'Beautiful, fast interface',
      'Works on all devices',
    ],
    color: 'from-violet-500 to-purple-600',
    gradient: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20',
  },
  {
    id: 2,
    title: 'Upload Anything 📁',
    subtitle: 'Images, Documents, Code',
    description:
      'Just drag and drop! Upload photos, PDFs, or code files and watch the AI understand everything.',
    icon: <FileText className="size-8" />,
    features: [
      'Drop images for analysis',
      'Upload PDFs & documents',
      'Share code snippets',
      'AI understands everything',
    ],
    color: 'from-blue-500 to-cyan-600',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20',
  },
  {
    id: 3,
    title: 'Smart Features ⚡',
    subtitle: 'Make AI Work for You',
    description:
      'Use keyboard shortcuts, save conversations, and let AI remember your preferences.',
    icon: <Zap className="size-8" />,
    features: [
      'Keyboard shortcuts (⌘K)',
      'Save chat history',
      'AI remembers you',
      'Quick actions',
    ],
    color: 'from-green-500 to-emerald-600',
    gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20',
  },
  {
    id: 4,
    title: "You're All Set! 🎉",
    subtitle: 'Start Chatting Now',
    description:
      'Everything is ready! Start your first conversation and discover what AI can do for you.',
    icon: <MessageSquare className="size-8" />,
    features: [
      'Try the suggested prompts',
      'Ask anything you want',
      'Upload files anytime',
      'Have fun exploring!',
    ],
    color: 'from-orange-500 to-red-600',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-red-600/20',
  },
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding and redirect to chat
      localStorage.setItem('boltX-onboarding-completed', 'true');
      sessionStorage.removeItem('boltX-onboarding-seen');
      router.push('/');
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('boltX-onboarding-completed', 'true');
    sessionStorage.removeItem('boltX-onboarding-seen');
    router.push('/');
  };

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 size-80 bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 size-80 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative w-full max-w-4xl">
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={skipOnboarding}
              className="absolute -top-4 -right-4 z-10 size-10 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </motion.button>

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="text-2xl font-bold text-foreground">BoltX</div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <Badge variant="secondary">
                  <Rocket className="size-3 mr-1" />
                  Welcome aboard!
                </Badge>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <div className="w-64 mx-auto h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${progress}%` } as React.CSSProperties}
                  />
                </div>
                <p className="text-muted-foreground text-sm mt-2">
                  Step {currentStep + 1} of {onboardingSteps.length}
                </p>
              </motion.div>
            </div>

            {/* Main Content */}
            <motion.div
              key={currentStep}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Card className="backdrop-blur-xl border shadow-2xl">
                <CardContent className="p-8">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left Side - Content */}
                    <div className="space-y-6">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className={`inline-flex items-center justify-center size-16 rounded-2xl ${currentStepData.gradient} text-white`}
                      >
                        {currentStepData.icon}
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-4"
                      >
                        <div>
                          <h2 className="text-3xl font-bold text-foreground mb-2">
                            {currentStepData.title}
                          </h2>
                          <p className="text-xl text-muted-foreground font-medium">
                            {currentStepData.subtitle}
                          </p>
                        </div>

                        <p className="text-muted-foreground leading-relaxed">
                          {currentStepData.description}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="space-y-3"
                      >
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          Key Features
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {currentStepData.features.map((feature, index) => (
                            <motion.div
                              key={feature}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.8 + index * 0.1 }}
                              className="flex items-center gap-3 text-sm text-muted-foreground"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              {feature}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Side - Visual */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="relative"
                    >
                      <div
                        className={`w-full h-80 rounded-2xl ${currentStepData.gradient} border flex items-center justify-center`}
                      >
                        <div className="text-center space-y-4">
                          <div className="text-6xl text-white">
                            {currentStepData.icon}
                          </div>
                          <div className="space-y-2">
                            <div className="w-32 h-2 bg-white/20 rounded-full mx-auto" />
                            <div className="w-24 h-2 bg-white/20 rounded-full mx-auto" />
                            <div className="w-28 h-2 bg-white/20 rounded-full mx-auto" />
                          </div>
                        </div>
                      </div>

                      {/* Floating Elements */}
                      <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: 'easeInOut',
                        }}
                        className="absolute -top-4 -right-4 size-8 bg-white/20 rounded-full flex items-center justify-center"
                      >
                        <Shield className="w-4 h-4 text-white" />
                      </motion.div>

                      <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{
                          duration: 4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: 'easeInOut',
                        }}
                        className="absolute -bottom-4 -left-4 size-8 bg-white/20 rounded-full flex items-center justify-center"
                      >
                        <ZapIcon className="w-4 h-4 text-white" />
                      </motion.div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-between mt-8"
            >
              <Button
                variant="ghost"
                onClick={skipOnboarding}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {onboardingSteps.map((step, index) => (
                    <motion.button
                      key={step.id}
                      onClick={() => setCurrentStep(index)}
                      className={`size-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-primary scale-125'
                          : 'bg-muted hover:bg-muted-foreground'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6"
                >
                  {currentStep === onboardingSteps.length - 1 ? (
                    <>
                      Start Chatting! 🚀
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  );
}