// Core Types for AlumniVerse Pro

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  institution?: Institution;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  INSTITUTION_ADMIN = 'institution_admin', 
  ALUMNI = 'alumni',
  STUDENT = 'student'
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  location: string;
  website?: string;
  logo?: string;
  establishedYear?: number;
  description?: string;
}

export interface AlumniProfile {
  id: string;
  userId: string;
  user: User;
  
  // Academic Info
  graduationYear: number;
  graduationMonth: number;
  department: string;
  degreeType: string;
  major?: string;
  minor?: string;
  gpa?: number;
  
  // Professional Info
  currentPosition?: string;
  currentCompany?: string;
  industry?: string;
  workLocation?: string;
  yearsExperience?: number;
  
  // Profile Data
  bio?: string;
  skills: Skill[];
  achievements: Achievement[];
  experiences: WorkExperience[];
  
  // Social Links
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  personalWebsite?: string;
  
  // Settings
  profileVisibility: 'public' | 'institute' | 'private';
  allowMessages: boolean;
  allowJobOffers: boolean;
  isMentor: boolean;
  mentorCategories: string[];
  
  // Analytics
  profileCompleteness: number;
  networkingScore: number;
  lastActive: Date;
  
  // NFT Achievements
  nftAchievements: NFTAchievement[];
}

export interface StudentProfile {
  id: string;
  userId: string;
  user: User;
  
  // Academic Info
  currentYear: number;
  department: string;
  degreeType: string;
  major?: string;
  expectedGraduation: number;
  gpa?: number;
  
  // Profile Data
  bio?: string;
  skills: Skill[];
  projects: Project[];
  
  // Career Interests
  careerInterests: string[];
  isSeekingInternship: boolean;
  isSeekingMentorship: boolean;
  
  // Privileges & Restrictions
  canViewAlumniProfiles: boolean;
  canMessageAlumni: boolean;
  messageLimit: number; // Daily limit
  canViewContactInfo: boolean;
  canAttendEvents: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  verified: boolean;
  endorsements: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'academic' | 'professional' | 'personal' | 'platform';
  date: Date;
  verified: boolean;
  points: number;
}

export interface NFTAchievement {
  id: string;
  tokenId: string;
  contractAddress: string;
  title: string;
  description: string;
  imageUrl: string;
  metadata: any;
  mintedAt: Date;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface WorkExperience {
  id: string;
  companyName: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
  skills: string[];
  achievements: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate: Date;
  endDate?: Date;
  isOngoing: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'networking' | 'reunion' | 'workshop' | 'seminar' | 'virtual' | 'hybrid';
  date: Date;
  endDate?: Date;
  location?: string;
  virtualLink?: string;
  maxAttendees?: number;
  currentAttendees: number;
  organizerId: string;
  organizer: User;
  isVirtual: boolean;
  isPublic: boolean;
  requiresApproval: boolean;
  tags: string[];
  
  // VR/AR Event Data
  vrSpaceId?: string;
  vrSpaceData?: VRSpaceConfig;
  
  // Access Control
  allowedRoles: UserRole[];
  allowedInstitutions: string[];
}

export interface VRSpaceConfig {
  sceneType: 'conference' | 'networking' | 'exhibition' | 'campus';
  maxParticipants: number;
  spatialAudio: boolean;
  avatarSystem: boolean;
  interactiveObjects: VRObject[];
}

export interface VRObject {
  id: string;
  type: 'presentation_screen' | 'networking_zone' | 'info_booth';
  position: { x: number; y: number; z: number };
  data: any;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'direct' | 'group' | 'announcement';
  status: 'sent' | 'delivered' | 'read';
  sentAt: Date;
  readAt?: Date;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  filename?: string;
  size?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  postedById: string;
  postedBy: User;
  applications: JobApplication[];
  isActive: boolean;
  expiresAt?: Date;
  tags: string[];
  
  // AI-powered matching
  skillsRequired: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  matchingScore?: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicant: User;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
  aiMatchScore: number;
}

// AI & Analytics Types
export interface AIRecommendation {
  id: string;
  type: 'alumni_match' | 'event' | 'job' | 'skill' | 'connection';
  targetId: string;
  confidence: number;
  reason: string;
  metadata: any;
}

export interface AnalyticsData {
  userId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface NetworkAnalytics {
  connectionCount: number;
  connectionGrowthRate: number;
  engagementScore: number;
  influenceScore: number;
  networkReach: number;
  commonConnections: User[];
  careerProgressionPrediction: CareerPrediction;
}

export interface CareerPrediction {
  suggestedRoles: string[];
  skillGaps: string[];
  recommendedCourses: string[];
  careerPathProbability: number;
  timeToGoal: number; // in months
}

// Gamification Types
export interface GamificationProfile {
  userId: string;
  totalPoints: number;
  level: number;
  badges: Badge[];
  achievements: Achievement[];
  streaks: Streak[];
  leaderboardPosition: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlockedAt: Date;
  nftTokenId?: string;
}

export interface Streak {
  type: 'login' | 'networking' | 'event_attendance' | 'profile_update';
  current: number;
  best: number;
  lastUpdated: Date;
}

// Dual Interface Types
export interface AlumniInterfaceContext {
  viewMode: 'institute' | 'global';
  institutionId?: string;
  filters: AlumniFilters;
  preferences: InterfacePreferences;
}

export interface AlumniFilters {
  graduationYear?: number[];
  department?: string[];
  location?: string[];
  company?: string[];
  skills?: string[];
  industry?: string[];
  isMentor?: boolean;
  availability?: 'available' | 'busy' | 'offline';
}

export interface InterfacePreferences {
  defaultView: 'institute' | 'global';
  notifications: {
    newConnections: boolean;
    events: boolean;
    jobs: boolean;
    messages: boolean;
  };
  privacy: {
    showInGlobalDirectory: boolean;
    allowCrossInstitutionMessages: boolean;
  };
}

// Student Privilege System
export interface StudentPrivileges {
  canViewAlumniProfiles: boolean;
  canViewContactInfo: boolean;
  canSendMessages: boolean;
  dailyMessageLimit: number;
  canApplyToJobs: boolean;
  canAttendEvents: boolean;
  canViewSalaryInfo: boolean;
  canAccessMentorship: boolean;
  restrictedFeatures: string[];
}

export interface PrivilegeRequest {
  id: string;
  studentId: string;
  student: StudentProfile;
  requestType: 'message_increase' | 'contact_access' | 'event_access';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  requestedAt: Date;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}