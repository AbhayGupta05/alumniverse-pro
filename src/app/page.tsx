'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import GamificationDashboard from '@/components/GamificationDashboard';
import VRNetworking from '@/components/VRNetworking';
import {
  Sparkles,
  Users,
  TrendingUp,
  Award,
  Gamepad2,
  Headphones,
  BarChart3,
  Zap,
  Brain,
  Blocks,
  Globe
} from 'lucide-react';
import { User, UserRole } from '@/types';

// Mock user data for demo
const mockUser: User = {
  id: '1',
  email: 'demo@alumniverse.com',
  username: 'demo_user',
  firstName: 'Alex',
  lastName: 'Johnson',
  role: UserRole.ALUMNI,
  status: 'active' as any,
  profileImage: '/avatars/demo-user.jpg',
  institution: {
    id: '1',
    name: 'Tech University',
    type: 'University',
    location: 'San Francisco, CA',
    website: 'https://techuniv.edu',
    establishedYear: 1985
  },
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date()
};

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Intelligent alumni-student connections using OpenAI embeddings and semantic analysis',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Comprehensive D3.js dashboards with live metrics and interactive visualizations',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Award,
    title: 'Gamification System',
    description: 'Engagement through points, badges, leaderboards, and achievement tracking',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Headphones,
    title: 'VR/AR Networking',
    description: 'Immersive virtual networking events using A-Frame and spatial audio',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Blocks,
    title: 'Blockchain NFTs',
    description: 'Mint achievement NFTs on Polygon testnet with metadata and rarity systems',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Globe,
    title: 'Dual-Interface System',
    description: 'Institute-specific and global alumni views with advanced filtering',
    color: 'from-teal-500 to-blue-500'
  }
];

export default function Home() {
  const [activeDemo, setActiveDemo] = useState<'analytics' | 'gamification' | 'vr'>('analytics');

  const handleClaimReward = (rewardId: string) => {
    console.log('Claiming reward:', rewardId);
  };

  const handleJoinChallenge = (challengeId: string) => {
    console.log('Joining challenge:', challengeId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/20"></div>
          {/* Animated particles */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => {
              // Use default dimensions for SSR, will be correct on hydration
              const defaultWidth = 1920;
              const defaultHeight = 1080;
              const width = typeof window !== 'undefined' ? window.innerWidth : defaultWidth;
              const height = typeof window !== 'undefined' ? window.innerHeight : defaultHeight;
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  initial={{
                    x: Math.random() * width,
                    y: Math.random() * height,
                  }}
                  animate={{
                    x: Math.random() * width,
                    y: Math.random() * height,
                  }}
                  transition={{
                    duration: Math.random() * 20 + 10,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              <span className="text-sm font-semibold">AlumniVerse Pro - Next-Gen Alumni Platform</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
            >
              The Future of
              <br />
              Alumni Networking
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto"
            >
              AI-powered matching, blockchain achievements, VR networking, and real-time analytics 
              for the next generation of alumni engagement.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Zap className="h-5 w-5 mr-2" />
                Explore Demo
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Users className="h-5 w-5 mr-2" />
                View Features
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Revolutionary Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built with cutting-edge technologies for modern educational institutions and their communities.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Demo Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Interactive Demo</h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience the power of AlumniVerse Pro with our live demonstrations.
          </p>
          
          <div className="flex justify-center">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
              <Button
                variant={activeDemo === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveDemo('analytics')}
                className="rounded-none"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics Dashboard
              </Button>
              <Button
                variant={activeDemo === 'gamification' ? 'default' : 'ghost'}
                onClick={() => setActiveDemo('gamification')}
                className="rounded-none"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Gamification
              </Button>
              <Button
                variant={activeDemo === 'vr' ? 'default' : 'ghost'}
                onClick={() => setActiveDemo('vr')}
                className="rounded-none"
              >
                <Headphones className="h-4 w-4 mr-2" />
                VR Networking
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {activeDemo === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AnalyticsDashboard user={mockUser} userRole="alumni" />
            </motion.div>
          )}
          
          {activeDemo === 'gamification' && (
            <motion.div
              key="gamification"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <GamificationDashboard
                user={mockUser}
                onClaimReward={handleClaimReward}
                onJoinChallenge={handleJoinChallenge}
              />
            </motion.div>
          )}
          
          {activeDemo === 'vr' && (
            <motion.div
              key="vr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <VRNetworking 
                event={{
                  id: 'demo-event',
                  title: 'VR Networking Demo',
                  description: 'Experience immersive VR networking',
                  startDateTime: new Date(),
                  endDateTime: new Date(),
                  maxParticipants: 50
                } as any}
                user={mockUser}
                participants={[mockUser]}
                onJoinEvent={() => {}}
                onLeaveEvent={() => {}}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-gray-600">
              Leveraging the latest tools and frameworks for optimal performance and scalability.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: 'Next.js 14', desc: 'React Framework' },
              { name: 'TypeScript', desc: 'Type Safety' },
              { name: 'Tailwind CSS', desc: 'Styling' },
              { name: 'D3.js', desc: 'Data Visualization' },
              { name: 'OpenAI', desc: 'AI Integration' },
              { name: 'Web3.js', desc: 'Blockchain' },
              { name: 'A-Frame', desc: 'VR/AR' },
              { name: 'Framer Motion', desc: 'Animations' },
              { name: 'Radix UI', desc: 'Components' },
              { name: 'Vercel', desc: 'Deployment' },
              { name: 'Socket.IO', desc: 'Real-time' },
              { name: 'Prisma', desc: 'Database ORM' }
            ].map((tech) => (
              <motion.div
                key={tech.name}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 h-20 flex items-center justify-center mb-2">
                  <span className="font-semibold text-gray-900">{tech.name}</span>
                </div>
                <p className="text-sm text-gray-600">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 mr-3" />
            <h3 className="text-2xl font-bold">AlumniVerse Pro</h3>
          </div>
          <p className="text-gray-400 mb-6">
            Revolutionizing alumni engagement through AI, blockchain, and immersive technologies.
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="outline" className="text-gray-300 border-gray-700">
              Built for Hackathon 2024
            </Badge>
            <Badge variant="outline" className="text-gray-300 border-gray-700">
              Open Source Ready
            </Badge>
            <Badge variant="outline" className="text-gray-300 border-gray-700">
              Vercel Deployable
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
