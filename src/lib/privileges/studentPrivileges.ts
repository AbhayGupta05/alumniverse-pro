// Student Privilege System - Advanced Access Control
import { StudentProfile, StudentPrivileges, PrivilegeRequest, AlumniProfile, User } from '@/types';

export class StudentPrivilegeManager {
  private readonly DEFAULT_PRIVILEGES: StudentPrivileges = {
    canViewAlumniProfiles: true,
    canViewContactInfo: false,
    canSendMessages: true,
    dailyMessageLimit: 5,
    canApplyToJobs: true,
    canAttendEvents: true,
    canViewSalaryInfo: false,
    canAccessMentorship: true,
    restrictedFeatures: [
      'advanced_networking',
      'premium_events',
      'salary_insights',
      'direct_contact_info',
      'unlimited_messaging'
    ]
  };

  private readonly TIER_UPGRADES = {
    'academic_performance': {
      condition: (student: StudentProfile) => (student.gpa || 0) >= 3.5,
      benefits: {
        dailyMessageLimit: 10,
        canViewSalaryInfo: true,
        restrictedFeatures: ['premium_events', 'direct_contact_info']
      },
      badge: 'Academic Excellence'
    },
    'engagement_level': {
      condition: (student: StudentProfile, engagementScore: number) => engagementScore >= 80,
      benefits: {
        dailyMessageLimit: 15,
        canViewContactInfo: true,
        restrictedFeatures: ['premium_events']
      },
      badge: 'Highly Engaged'
    },
    'mentorship_active': {
      condition: (student: StudentProfile) => student.isSeekingMentorship,
      benefits: {
        canAccessMentorship: true,
        dailyMessageLimit: 8,
        restrictedFeatures: ['salary_insights', 'premium_events', 'direct_contact_info']
      },
      badge: 'Mentorship Seeker'
    },
    'project_showcase': {
      condition: (student: StudentProfile) => student.projects.length >= 3,
      benefits: {
        canViewSalaryInfo: true,
        dailyMessageLimit: 12,
        restrictedFeatures: ['premium_events']
      },
      badge: 'Project Builder'
    }
  };

  /**
   * Calculate dynamic privileges for a student based on their profile and activity
   */
  async calculatePrivileges(
    student: StudentProfile, 
    engagementData?: any
  ): Promise<StudentPrivileges> {
    let privileges = { ...this.DEFAULT_PRIVILEGES };
    const earnedBadges: string[] = [];

    // Check each tier upgrade condition
    for (const [tierName, tier] of Object.entries(this.TIER_UPGRADES)) {
      let conditionMet = false;

      if (tierName === 'engagement_level' && engagementData) {
        conditionMet = tier.condition(student, engagementData.score);
      } else {
        conditionMet = tier.condition(student);
      }

      if (conditionMet) {
        // Apply tier benefits
        privileges = { ...privileges, ...tier.benefits };
        earnedBadges.push(tier.badge);
        
        // Track privilege upgrade
        await this.trackPrivilegeUpgrade(student.userId, tierName, tier.badge);
      }
    }

    // Special cases for final year students
    if (student.expectedGraduation <= new Date().getFullYear()) {
      privileges.canViewSalaryInfo = true;
      privileges.dailyMessageLimit += 5;
      privileges.restrictedFeatures = privileges.restrictedFeatures.filter(
        f => f !== 'salary_insights'
      );
    }

    // Apply pending privilege requests
    const approvedRequests = await this.getApprovedRequests(student.userId);
    privileges = this.applyApprovedRequests(privileges, approvedRequests);

    return privileges;
  }

  /**
   * Check if student can perform a specific action
   */
  async canPerformAction(
    studentId: string, 
    action: string, 
    context?: any
  ): Promise<{ allowed: boolean; reason?: string; upgradeAvailable?: boolean }> {
    const student = await this.getStudentProfile(studentId);
    const privileges = await this.calculatePrivileges(student);
    
    switch (action) {
      case 'view_alumni_profile':
        return {
          allowed: privileges.canViewAlumniProfiles,
          reason: privileges.canViewAlumniProfiles ? undefined : 'Profile viewing restricted'
        };
        
      case 'view_contact_info':
        if (!privileges.canViewContactInfo) {
          return {
            allowed: false,
            reason: 'Contact information access requires higher engagement level',
            upgradeAvailable: true
          };
        }
        return { allowed: true };
        
      case 'send_message':
        if (!privileges.canSendMessages) {
          return { 
            allowed: false, 
            reason: 'Messaging privileges suspended' 
          };
        }
        
        // Check daily limit
        const messageCount = await this.getTodayMessageCount(studentId);
        if (messageCount >= privileges.dailyMessageLimit) {
          return {
            allowed: false,
            reason: `Daily message limit reached (${privileges.dailyMessageLimit})`,
            upgradeAvailable: true
          };
        }
        
        return { allowed: true };
        
      case 'view_salary_info':
        if (!privileges.canViewSalaryInfo) {
          return {
            allowed: false,
            reason: 'Salary information requires academic excellence or final year status',
            upgradeAvailable: true
          };
        }
        return { allowed: true };
        
      case 'apply_to_job':
        return {
          allowed: privileges.canApplyToJobs,
          reason: privileges.canApplyToJobs ? undefined : 'Job application privileges restricted'
        };
        
      case 'access_premium_feature':
        const feature = context?.feature;
        if (privileges.restrictedFeatures.includes(feature)) {
          return {
            allowed: false,
            reason: `Premium feature "${feature}" requires privilege upgrade`,
            upgradeAvailable: true
          };
        }
        return { allowed: true };
        
      default:
        return { allowed: false, reason: 'Unknown action' };
    }
  }

  /**
   * Request privilege upgrade
   */
  async requestPrivilegeUpgrade(
    studentId: string,
    requestType: PrivilegeRequest['requestType'],
    reason: string
  ): Promise<PrivilegeRequest> {
    const student = await this.getStudentProfile(studentId);
    
    const request: PrivilegeRequest = {
      id: `req_${Date.now()}_${studentId}`,
      studentId,
      student,
      requestType,
      reason,
      status: 'pending',
      requestedAt: new Date()
    };

    // Save request to database
    await this.savePrivilegeRequest(request);
    
    // Notify administrators
    await this.notifyAdministrators(request);
    
    // Auto-approve certain requests based on criteria
    if (await this.shouldAutoApprove(request)) {
      return await this.approveRequest(request.id, 'system');
    }
    
    return request;
  }

  /**
   * Smart privilege suggestions based on student activity
   */
  async getPrivilegeSuggestions(studentId: string): Promise<any[]> {
    const student = await this.getStudentProfile(studentId);
    const currentPrivileges = await this.calculatePrivileges(student);
    const suggestions = [];

    // Suggest academic performance upgrade
    if ((student.gpa || 0) >= 3.0 && (student.gpa || 0) < 3.5) {
      suggestions.push({
        type: 'academic_improvement',
        title: 'Boost Your GPA',
        description: 'Maintain a 3.5+ GPA to unlock salary insights and increased messaging limits',
        progress: ((student.gpa || 0) / 3.5) * 100,
        benefits: ['View salary information', '10 daily messages', 'Academic Excellence badge']
      });
    }

    // Suggest project showcase
    if (student.projects.length < 3) {
      suggestions.push({
        type: 'project_building',
        title: 'Build Your Portfolio',
        description: `Add ${3 - student.projects.length} more projects to unlock premium features`,
        progress: (student.projects.length / 3) * 100,
        benefits: ['Salary insights', '12 daily messages', 'Project Builder badge']
      });
    }

    // Suggest mentorship engagement
    if (!student.isSeekingMentorship) {
      suggestions.push({
        type: 'mentorship_engagement',
        title: 'Join Mentorship Program',
        description: 'Seek mentorship to unlock additional networking privileges',
        progress: 0,
        benefits: ['Enhanced mentorship access', '8 daily messages', 'Mentorship Seeker badge']
      });
    }

    return suggestions;
  }

  /**
   * Alumni interaction filters for students
   */
  async filterAlumniForStudent(
    studentId: string,
    alumni: AlumniProfile[]
  ): Promise<AlumniProfile[]> {
    const privileges = await this.calculatePrivileges(
      await this.getStudentProfile(studentId)
    );

    return alumni.map(alumniProfile => {
      const filtered = { ...alumniProfile };

      // Filter contact information
      if (!privileges.canViewContactInfo) {
        filtered.user = {
          ...filtered.user,
          email: '***@***.com' // Masked email
        };
        // Remove phone and personal email
        delete filtered.personalWebsite;
        delete filtered.linkedinUrl;
        delete filtered.twitterUrl;
      }

      // Filter salary information from work experiences
      if (!privileges.canViewSalaryInfo) {
        filtered.experiences = filtered.experiences.map(exp => ({
          ...exp,
          // Remove salary-related information
          achievements: exp.achievements.filter(ach => 
            !ach.toLowerCase().includes('salary') && 
            !ach.toLowerCase().includes('compensation')
          )
        }));
      }

      // Add student-specific interaction metadata
      filtered.studentInteractionData = {
        canMessage: privileges.canSendMessages,
        canViewFullProfile: privileges.canViewAlumniProfiles,
        canViewContactInfo: privileges.canViewContactInfo,
        messageLimit: privileges.dailyMessageLimit,
        restrictedFeatures: privileges.restrictedFeatures
      };

      return filtered;
    });
  }

  /**
   * Gamified privilege progression system
   */
  async getPrivilegeProgress(studentId: string): Promise<any> {
    const student = await this.getStudentProfile(studentId);
    const currentPrivileges = await this.calculatePrivileges(student);
    
    const progressData = {
      currentLevel: this.calculatePrivilegeLevel(currentPrivileges),
      nextLevel: this.getNextPrivilegeLevel(currentPrivileges),
      progress: [],
      achievements: [],
      recommendations: []
    };

    // Academic progress
    progressData.progress.push({
      category: 'Academic Excellence',
      current: student.gpa || 0,
      target: 3.5,
      percentage: Math.min(((student.gpa || 0) / 3.5) * 100, 100),
      benefits: ['Salary insights', 'Increased messaging', 'Academic badge']
    });

    // Project portfolio progress
    progressData.progress.push({
      category: 'Project Portfolio',
      current: student.projects.length,
      target: 3,
      percentage: Math.min((student.projects.length / 3) * 100, 100),
      benefits: ['Premium features', 'Enhanced networking', 'Portfolio badge']
    });

    // Engagement progress (would be calculated from activity data)
    const engagementScore = await this.calculateEngagementScore(studentId);
    progressData.progress.push({
      category: 'Platform Engagement',
      current: engagementScore,
      target: 80,
      percentage: Math.min((engagementScore / 80) * 100, 100),
      benefits: ['Contact info access', 'Premium messaging', 'Engagement badge']
    });

    return progressData;
  }

  // Private helper methods
  private calculatePrivilegeLevel(privileges: StudentPrivileges): number {
    let level = 1;
    
    if (privileges.canViewContactInfo) level++;
    if (privileges.canViewSalaryInfo) level++;
    if (privileges.dailyMessageLimit > 10) level++;
    if (privileges.restrictedFeatures.length < 3) level++;
    
    return Math.min(level, 5);
  }

  private getNextPrivilegeLevel(privileges: StudentPrivileges): any {
    const currentLevel = this.calculatePrivilegeLevel(privileges);
    
    const levelBenefits = {
      2: 'Contact information access',
      3: 'Salary insights and increased messaging',
      4: 'Premium event access',
      5: 'Full networking privileges'
    };
    
    return {
      level: currentLevel + 1,
      benefits: levelBenefits[currentLevel + 1] || 'Maximum level reached'
    };
  }

  private async calculateEngagementScore(studentId: string): Promise<number> {
    // This would calculate based on actual user activity data
    // For now, return a mock score
    return Math.random() * 100;
  }

  private async getStudentProfile(studentId: string): Promise<StudentProfile> {
    // Mock implementation - would fetch from database
    return {
      id: 'student_1',
      userId: studentId,
      user: {} as User,
      currentYear: 3,
      department: 'Computer Science',
      degreeType: 'Bachelor',
      expectedGraduation: 2024,
      gpa: 3.7,
      bio: 'Computer Science student passionate about AI',
      skills: [],
      projects: [
        { id: '1', title: 'AI Chatbot', description: 'Built using Python and NLP', technologies: ['Python', 'NLP'], startDate: new Date(), isOngoing: false },
        { id: '2', title: 'Web Application', description: 'Full-stack web app', technologies: ['React', 'Node.js'], startDate: new Date(), isOngoing: true }
      ],
      careerInterests: ['Artificial Intelligence', 'Software Development'],
      isSeekingInternship: true,
      isSeekingMentorship: true,
      canViewAlumniProfiles: true,
      canMessageAlumni: true,
      messageLimit: 5,
      canViewContactInfo: false,
      canAttendEvents: true
    };
  }

  private async getTodayMessageCount(studentId: string): Promise<number> {
    // Would query database for today's message count
    return Math.floor(Math.random() * 3); // Mock implementation
  }

  private async getApprovedRequests(studentId: string): Promise<PrivilegeRequest[]> {
    // Would fetch approved requests from database
    return [];
  }

  private applyApprovedRequests(
    privileges: StudentPrivileges, 
    requests: PrivilegeRequest[]
  ): StudentPrivileges {
    let updated = { ...privileges };
    
    requests.forEach(request => {
      switch (request.requestType) {
        case 'message_increase':
          updated.dailyMessageLimit += 5;
          break;
        case 'contact_access':
          updated.canViewContactInfo = true;
          break;
        case 'event_access':
          updated.restrictedFeatures = updated.restrictedFeatures.filter(f => f !== 'premium_events');
          break;
      }
    });
    
    return updated;
  }

  private async savePrivilegeRequest(request: PrivilegeRequest): Promise<void> {
    // Would save to database
    console.log('Saving privilege request:', request);
  }

  private async notifyAdministrators(request: PrivilegeRequest): Promise<void> {
    // Would send notifications to admins
    console.log('Notifying administrators about request:', request.id);
  }

  private async shouldAutoApprove(request: PrivilegeRequest): Promise<boolean> {
    // Auto-approve logic based on student performance and request type
    const student = request.student;
    
    if (request.requestType === 'message_increase' && (student.gpa || 0) >= 3.5) {
      return true;
    }
    
    if (request.requestType === 'contact_access' && student.projects.length >= 2) {
      return true;
    }
    
    return false;
  }

  private async approveRequest(requestId: string, reviewerId: string): Promise<PrivilegeRequest> {
    // Would update request in database
    const request = {
      id: requestId,
      status: 'approved' as const,
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    };
    
    return request as PrivilegeRequest;
  }

  private async trackPrivilegeUpgrade(
    userId: string, 
    tierName: string, 
    badge: string
  ): Promise<void> {
    // Analytics tracking
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'privilege_upgrade',
        userId,
        properties: { tierName, badge, timestamp: new Date().toISOString() }
      })
    }).catch(console.error);
  }
}

// Singleton instance
export const studentPrivilegeManager = new StudentPrivilegeManager();

// React hook for easy component integration
export function useStudentPrivileges(studentId?: string) {
  const [privileges, setPrivileges] = React.useState<StudentPrivileges | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!studentId) return;

    const loadPrivileges = async () => {
      setLoading(true);
      try {
        const studentProfile = await studentPrivilegeManager.getStudentProfile(studentId);
        const calculatedPrivileges = await studentPrivilegeManager.calculatePrivileges(studentProfile);
        const privilegeSuggestions = await studentPrivilegeManager.getPrivilegeSuggestions(studentId);
        
        setPrivileges(calculatedPrivileges);
        setSuggestions(privilegeSuggestions);
      } catch (error) {
        console.error('Error loading student privileges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPrivileges();
  }, [studentId]);

  const canPerform = React.useCallback(async (action: string, context?: any) => {
    if (!studentId) return { allowed: false, reason: 'No student ID' };
    return await studentPrivilegeManager.canPerformAction(studentId, action, context);
  }, [studentId]);

  const requestUpgrade = React.useCallback(async (
    requestType: PrivilegeRequest['requestType'],
    reason: string
  ) => {
    if (!studentId) return null;
    return await studentPrivilegeManager.requestPrivilegeUpgrade(studentId, requestType, reason);
  }, [studentId]);

  return {
    privileges,
    loading,
    suggestions,
    canPerform,
    requestUpgrade,
    refresh: () => {
      if (studentId) {
        // Reload privileges
        setLoading(true);
        // Re-run effect
      }
    }
  };
}