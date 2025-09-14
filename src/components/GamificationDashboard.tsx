'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Crown, 
  Target, 
  Zap, 
  Award, 
  Flame,
  Users,
  MessageSquare,
  Calendar,
  Briefcase,
  BookOpen,
  Heart,
  TrendingUp,
  Gift,
  Sparkles,
  Medal
} from 'lucide-react';
import { GamificationProfile, Badge as BadgeType, Achievement, User, NFTAchievement } from '@/types';
import { useNFTAchievements } from '@/lib/blockchain/nftAchievements';

interface GamificationData {
  profile: GamificationProfile;
  recentAchievements: Achievement[];
  leaderboard: Array<{
    rank: number;
    user: User;
    points: number;
    level: number;
    badges: BadgeType[];
  }>;
  challenges: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    reward: number;
    endDate: Date;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    requirement: number;
    current: number;
    reward: string;
    unlocked: boolean;
  }>;
  nftCollection: NFTAchievement[];
}

interface GamificationDashboardProps {
  user: User;
  onClaimReward: (rewardId: string) => void;
  onJoinChallenge: (challengeId: string) => void;
}

const LevelBadge = ({ level, points }: { level: number; points: number }) => {
  const getLevelInfo = (level: number) => {
    if (level >= 50) return { title: 'Legend', color: 'from-yellow-400 to-orange-500', icon: Crown };
    if (level >= 25) return { title: 'Master', color: 'from-purple-500 to-pink-500', icon: Star };
    if (level >= 15) return { title: 'Expert', color: 'from-blue-500 to-cyan-500', icon: Trophy };
    if (level >= 8) return { title: 'Advanced', color: 'from-green-500 to-emerald-500', icon: Award };
    if (level >= 3) return { title: 'Intermediate', color: 'from-orange-400 to-red-500', icon: Target };
    return { title: 'Beginner', color: 'from-gray-400 to-gray-600', icon: Zap };
  };

  const { title, color, icon: Icon } = getLevelInfo(level);

  return (
    <motion.div 
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${color} text-white shadow-lg`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-4 w-4" />
      <span className="font-semibold">Level {level}</span>
      <span className="text-xs opacity-80">({title})</span>
    </motion.div>
  );
};

const AchievementCard = ({ achievement, onClaim }: { 
  achievement: Achievement; 
  onClaim?: () => void; 
}) => {
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'networking': return Users;
      case 'communication': return MessageSquare;
      case 'events': return Calendar;
      case 'career': return Briefcase;
      case 'learning': return BookOpen;
      case 'community': return Heart;
      default: return Trophy;
    }
  };

  const Icon = getAchievementIcon(achievement.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
            <p className="text-sm text-gray-600">{achievement.description}</p>
          </div>
        </div>
        <Badge 
          variant={achievement.verified ? "default" : "secondary"}
          className={achievement.verified ? "bg-green-100 text-green-800" : ""}
        >
          {achievement.points} pts
        </Badge>
      </div>
      {onClaim && (
        <Button size="sm" onClick={onClaim} className="w-full">
          <Gift className="h-4 w-4 mr-2" />
          Claim Reward
        </Button>
      )}
    </motion.div>
  );
};

const ChallengeCard = ({ challenge, onJoin }: {
  challenge: GamificationData['challenges'][0];
  onJoin: () => void;
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercentage = (challenge.progress / challenge.target) * 100;
  const isCompleted = challenge.progress >= challenge.target;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
            <Badge className={getDifficultyColor(challenge.difficulty)}>
              {challenge.difficulty}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{challenge.progress}/{challenge.target}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">{challenge.reward} points</span>
        </div>
        
        {isCompleted ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <Medal className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        ) : (
          <Button size="sm" onClick={onJoin} variant="outline">
            Join Challenge
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const NFTShowcase = ({ nfts }: { nfts: NFTAchievement[] }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {nfts.map((nft) => (
        <motion.div
          key={nft.id}
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 border border-gray-200 rounded-lg p-3 text-center"
        >
          <div className="w-full h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg mb-3 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h5 className="font-semibold text-sm text-gray-900 mb-1">{nft.title}</h5>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              nft.rarity === 'Legendary' ? 'border-yellow-400 text-yellow-600' :
              nft.rarity === 'Epic' ? 'border-purple-400 text-purple-600' :
              nft.rarity === 'Rare' ? 'border-blue-400 text-blue-600' :
              'border-gray-400 text-gray-600'
            }`}
          >
            {nft.rarity}
          </Badge>
        </motion.div>
      ))}
      {nfts.length === 0 && (
        <div className="col-span-full text-center py-8">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No NFT achievements yet</p>
          <p className="text-sm text-gray-500">Complete challenges to earn NFT rewards!</p>
        </div>
      )}
    </div>
  );
};

export default function GamificationDashboard({ 
  user, 
  onClaimReward, 
  onJoinChallenge 
}: GamificationDashboardProps) {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { achievements: nftAchievements, connectWallet, walletConnected } = useNFTAchievements(user.id);

  // Mock data for hackathon
  const mockData: GamificationData = {
    profile: {
      userId: user.id,
      totalPoints: 2450,
      level: 12,
      badges: [
        {
          id: 'networking-pro',
          name: 'Networking Pro',
          description: 'Connected with 50+ alumni',
          iconUrl: '/badges/networking-pro.svg',
          rarity: 'Epic',
          unlockedAt: new Date('2024-01-15'),
          nftTokenId: '123'
        },
        {
          id: 'event-champion',
          name: 'Event Champion',
          description: 'Attended 10+ networking events',
          iconUrl: '/badges/event-champion.svg',
          rarity: 'Rare',
          unlockedAt: new Date('2024-02-01')
        },
        {
          id: 'mentor-guide',
          name: 'Mentor Guide',
          description: 'Mentored 5+ students successfully',
          iconUrl: '/badges/mentor-guide.svg',
          rarity: 'Legendary',
          unlockedAt: new Date('2024-02-20'),
          nftTokenId: '456'
        }
      ],
      achievements: [],
      streaks: [
        {
          type: 'login',
          current: 15,
          best: 28,
          lastUpdated: new Date()
        },
        {
          type: 'networking',
          current: 7,
          best: 12,
          lastUpdated: new Date()
        }
      ],
      leaderboardPosition: 8
    },
    recentAchievements: [
      {
        id: 'recent-1',
        title: 'Social Butterfly',
        description: 'Made 10 new connections this week',
        type: 'platform',
        date: new Date(),
        verified: true,
        points: 150
      },
      {
        id: 'recent-2',
        title: 'Event Enthusiast',
        description: 'Attended 3 events in one month',
        type: 'professional',
        date: new Date(),
        verified: true,
        points: 200
      }
    ],
    leaderboard: [
      {
        rank: 1,
        user: { ...user, id: '1', firstName: 'Alice', lastName: 'Johnson' },
        points: 5240,
        level: 28,
        badges: [
          { id: '1', name: 'Legend', description: '', iconUrl: '', rarity: 'Legendary', unlockedAt: new Date() }
        ]
      },
      {
        rank: 2,
        user: { ...user, id: '2', firstName: 'Bob', lastName: 'Smith' },
        points: 4890,
        level: 25,
        badges: [
          { id: '2', name: 'Master', description: '', iconUrl: '', rarity: 'Epic', unlockedAt: new Date() }
        ]
      },
      {
        rank: 8,
        user: user,
        points: 2450,
        level: 12,
        badges: [
          { id: '3', name: 'Expert', description: '', iconUrl: '', rarity: 'Rare', unlockedAt: new Date() }
        ]
      }
    ],
    challenges: [
      {
        id: 'network-builder',
        title: 'Network Builder Challenge',
        description: 'Connect with 25 new alumni this month',
        progress: 18,
        target: 25,
        reward: 500,
        endDate: new Date('2024-02-28'),
        difficulty: 'Medium'
      },
      {
        id: 'event-master',
        title: 'Event Master',
        description: 'Attend 5 virtual networking events',
        progress: 3,
        target: 5,
        reward: 350,
        endDate: new Date('2024-03-15'),
        difficulty: 'Easy'
      },
      {
        id: 'mentor-excellence',
        title: 'Mentorship Excellence',
        description: 'Successfully mentor 3 students to completion',
        progress: 1,
        target: 3,
        reward: 1000,
        endDate: new Date('2024-04-30'),
        difficulty: 'Expert'
      }
    ],
    milestones: [
      {
        id: 'first-connection',
        title: 'First Connection',
        description: 'Make your first alumni connection',
        requirement: 1,
        current: 45,
        reward: 'Networking Starter Badge',
        unlocked: true
      },
      {
        id: 'century-club',
        title: 'Century Club',
        description: 'Reach 100 total connections',
        requirement: 100,
        current: 45,
        reward: 'Legendary NFT Badge',
        unlocked: false
      }
    ],
    nftCollection: nftAchievements || []
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setGamificationData(mockData);
      setLoading(false);
    }, 1000);
  }, [user.id]);

  const handleClaimReward = (rewardId: string) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    onClaimReward(rewardId);
  };

  if (loading || !gamificationData) {
    return (
      <div className="gamification-dashboard p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const nextLevelPoints = (gamificationData.profile.level + 1) * 100;
  const currentLevelProgress = gamificationData.profile.totalPoints % 100;

  return (
    <div className="gamification-dashboard max-w-7xl mx-auto p-6">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  scale: 0.5
                }}
                animate={{ 
                  y: window.innerHeight + 20,
                  rotate: 360,
                  scale: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 3,
                  delay: Math.random() * 0.5,
                  ease: "linear"
                }}
                className={`absolute w-4 h-4 ${
                  ['bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-red-400'][Math.floor(Math.random() * 5)]
                } rounded-full`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎮 Gamification Hub</h1>
            <p className="text-blue-100 mb-4">Level up your networking game!</p>
            <LevelBadge level={gamificationData.profile.level} points={gamificationData.profile.totalPoints} />
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold mb-2">{gamificationData.profile.totalPoints.toLocaleString()}</div>
            <div className="text-blue-200 mb-4">Total Points</div>
            <div className="space-y-2">
              <div className="text-sm text-blue-200">Progress to Level {gamificationData.profile.level + 1}</div>
              <div className="w-48 bg-blue-800 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentLevelProgress / 100) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="text-xs text-blue-300">{currentLevelProgress}/100 points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">
                  {gamificationData.profile.streaks[0].current} days
                </p>
                <p className="text-xs text-gray-500">Best: {gamificationData.profile.streaks[0].best} days</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leaderboard Rank</p>
                <p className="text-2xl font-bold text-blue-600">
                  #{gamificationData.profile.leaderboardPosition}
                </p>
                <p className="text-xs text-gray-500">Platform-wide</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Badges</p>
                <p className="text-2xl font-bold text-purple-600">
                  {gamificationData.profile.badges.length}
                </p>
                <p className="text-xs text-gray-500">Collected</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NFT Collection</p>
                <p className="text-2xl font-bold text-green-600">
                  {gamificationData.nftCollection.length}
                </p>
                <p className="text-xs text-gray-500">Unique NFTs</p>
              </div>
              <Sparkles className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="nft">NFT Collection</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gamificationData.recentAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    onClaim={() => handleClaimReward(achievement.id)}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Active Streaks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Active Streaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gamificationData.profile.streaks.map((streak) => (
                  <div key={streak.type} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold capitalize">{streak.type} Streak</h4>
                      <p className="text-sm text-gray-600">Keep it up!</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">{streak.current}</div>
                      <div className="text-xs text-gray-500">Best: {streak.best}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Progress Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Progress Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {gamificationData.milestones.map((milestone) => (
                  <div key={milestone.id} className={`p-4 rounded-lg border-2 ${
                    milestone.unlocked 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{milestone.title}</h4>
                      {milestone.unlocked && (
                        <Badge className="bg-green-100 text-green-800">Unlocked</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                    <Progress 
                      value={(milestone.current / milestone.requirement) * 100} 
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{milestone.current}/{milestone.requirement}</span>
                      <span>Reward: {milestone.reward}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <div className="grid gap-6">
            {gamificationData.challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={() => onJoinChallenge(challenge.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamificationData.profile.badges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-lg border-2 ${
                  badge.rarity === 'Legendary' ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' :
                  badge.rarity === 'Epic' ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' :
                  badge.rarity === 'Rare' ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50' :
                  'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50'
                }`}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    badge.rarity === 'Legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    badge.rarity === 'Epic' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                    badge.rarity === 'Rare' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                    'bg-gradient-to-br from-gray-400 to-slate-500'
                  }`}>
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">{badge.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge 
                      variant="outline"
                      className={
                        badge.rarity === 'Legendary' ? 'border-yellow-400 text-yellow-600' :
                        badge.rarity === 'Epic' ? 'border-purple-400 text-purple-600' :
                        badge.rarity === 'Rare' ? 'border-blue-400 text-blue-600' :
                        'border-gray-400 text-gray-600'
                      }
                    >
                      {badge.rarity}
                    </Badge>
                    {badge.nftTokenId && (
                      <Badge variant="outline" className="border-green-400 text-green-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        NFT
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Unlocked {badge.unlockedAt.toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nft" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  NFT Achievement Collection
                </CardTitle>
                {!walletConnected && (
                  <Button onClick={connectWallet} size="sm">
                    Connect Wallet
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <NFTShowcase nfts={gamificationData.nftCollection} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gamificationData.leaderboard.map((entry) => (
                  <motion.div
                    key={entry.user.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      entry.user.id === user.id 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        entry.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                        'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {entry.rank <= 3 ? (
                          entry.rank === 1 ? <Crown className="h-6 w-6" /> :
                          <Medal className="h-6 w-6" />
                        ) : (
                          entry.rank
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {entry.user.firstName} {entry.user.lastName}
                          {entry.user.id === user.id && (
                            <span className="text-blue-600 ml-2">(You)</span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2">
                          <LevelBadge level={entry.level} points={entry.points} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">points</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}