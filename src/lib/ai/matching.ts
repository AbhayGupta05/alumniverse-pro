// AI-Powered Alumni Matching System
import OpenAI from 'openai';
import { AlumniProfile, StudentProfile, User, AIRecommendation, CareerPrediction } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchingContext {
  userProfile: AlumniProfile | StudentProfile;
  context: 'networking' | 'mentorship' | 'career_guidance' | 'collaboration';
  preferences?: string[];
  location?: string;
  industryFocus?: string[];
}

interface MatchScore {
  userId: string;
  score: number;
  reasons: string[];
  confidence: number;
  matchType: 'career_similarity' | 'skill_complement' | 'geographic' | 'interest_based' | 'mentorship_fit';
}

export class IntelligentMatchingEngine {
  private vectorCache = new Map<string, number[]>();
  
  /**
   * Find the best alumni matches for a given user
   */
  async findBestMatches(
    context: MatchingContext, 
    candidates: AlumniProfile[], 
    limit: number = 10
  ): Promise<MatchScore[]> {
    try {
      const userVector = await this.generateProfileVector(context.userProfile);
      const matches: MatchScore[] = [];

      for (const candidate of candidates) {
        const candidateVector = await this.generateProfileVector(candidate);
        const score = await this.calculateMatchScore(
          context, 
          userVector, 
          candidateVector, 
          candidate
        );
        
        if (score.score > 0.3) { // Minimum threshold
          matches.push(score);
        }
      }

      // Sort by score and return top matches
      return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error in findBestMatches:', error);
      return [];
    }
  }

  /**
   * Generate semantic vector representation of a profile using OpenAI embeddings
   */
  private async generateProfileVector(profile: AlumniProfile | StudentProfile): Promise<number[]> {
    const cacheKey = `${profile.id}_${profile.lastActive || Date.now()}`;
    
    if (this.vectorCache.has(cacheKey)) {
      return this.vectorCache.get(cacheKey)!;
    }

    try {
      // Create a comprehensive text representation of the profile
      const profileText = this.createProfileText(profile);
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: profileText,
      });

      const vector = response.data[0].embedding;
      this.vectorCache.set(cacheKey, vector);
      
      return vector;
    } catch (error) {
      console.error('Error generating profile vector:', error);
      return Array(1536).fill(0); // Return zero vector as fallback
    }
  }

  /**
   * Create a text representation of a profile for embedding
   */
  private createProfileText(profile: AlumniProfile | StudentProfile): string {
    const parts: string[] = [];
    
    // Basic info
    parts.push(`Name: ${profile.user.firstName} ${profile.user.lastName}`);
    parts.push(`Department: ${profile.department}`);
    
    if ('graduationYear' in profile) {
      // Alumni profile
      parts.push(`Graduation Year: ${profile.graduationYear}`);
      parts.push(`Degree: ${profile.degreeType} in ${profile.major || profile.department}`);
      
      if (profile.currentPosition) parts.push(`Current Position: ${profile.currentPosition}`);
      if (profile.currentCompany) parts.push(`Company: ${profile.currentCompany}`);
      if (profile.industry) parts.push(`Industry: ${profile.industry}`);
      if (profile.workLocation) parts.push(`Work Location: ${profile.workLocation}`);
      
      if (profile.bio) parts.push(`Bio: ${profile.bio}`);
      
      // Skills
      if (profile.skills.length > 0) {
        parts.push(`Skills: ${profile.skills.map(s => `${s.name} (${s.level})`).join(', ')}`);
      }
      
      // Mentor categories
      if (profile.isMentor && profile.mentorCategories.length > 0) {
        parts.push(`Mentoring in: ${profile.mentorCategories.join(', ')}`);
      }
      
    } else {
      // Student profile
      parts.push(`Current Year: ${profile.currentYear}`);
      parts.push(`Expected Graduation: ${profile.expectedGraduation}`);
      parts.push(`Degree: ${profile.degreeType} in ${profile.major || profile.department}`);
      
      if (profile.bio) parts.push(`Bio: ${profile.bio}`);
      
      // Career interests
      if (profile.careerInterests.length > 0) {
        parts.push(`Career Interests: ${profile.careerInterests.join(', ')}`);
      }
      
      // Skills
      if (profile.skills.length > 0) {
        parts.push(`Skills: ${profile.skills.map(s => `${s.name} (${s.level})`).join(', ')}`);
      }
    }
    
    return parts.join('. ');
  }

  /**
   * Calculate comprehensive match score between two profiles
   */
  private async calculateMatchScore(
    context: MatchingContext,
    userVector: number[],
    candidateVector: number[],
    candidateProfile: AlumniProfile
  ): Promise<MatchScore> {
    
    // Calculate cosine similarity
    const cosineSimilarity = this.calculateCosineSimilarity(userVector, candidateVector);
    
    const reasons: string[] = [];
    let totalScore = 0;
    let matchType: MatchScore['matchType'] = 'career_similarity';
    
    // Career similarity (40% weight)
    const careerScore = await this.calculateCareerSimilarity(context.userProfile, candidateProfile);
    totalScore += careerScore * 0.4;
    if (careerScore > 0.7) {
      reasons.push('Strong career path alignment');
      matchType = 'career_similarity';
    }
    
    // Skill complementarity (25% weight)
    const skillScore = this.calculateSkillComplementarity(context.userProfile, candidateProfile);
    totalScore += skillScore * 0.25;
    if (skillScore > 0.6) {
      reasons.push('Complementary skill sets');
    }
    
    // Geographic proximity (15% weight)
    const geoScore = this.calculateGeographicScore(context.userProfile, candidateProfile);
    totalScore += geoScore * 0.15;
    if (geoScore > 0.8) {
      reasons.push('Same geographic area');
      matchType = 'geographic';
    }
    
    // Mentorship fit (20% weight)
    const mentorshipScore = this.calculateMentorshipFit(context, candidateProfile);
    totalScore += mentorshipScore * 0.2;
    if (mentorshipScore > 0.8) {
      reasons.push('Excellent mentorship match');
      matchType = 'mentorship_fit';
    }
    
    // Semantic similarity bonus
    totalScore += cosineSimilarity * 0.1;
    
    // Context-specific adjustments
    if (context.context === 'mentorship' && candidateProfile.isMentor) {
      totalScore += 0.2;
      reasons.push('Active mentor');
    }
    
    const confidence = Math.min(totalScore + (reasons.length * 0.1), 1.0);
    
    return {
      userId: candidateProfile.userId,
      score: Math.min(totalScore, 1.0),
      reasons,
      confidence,
      matchType
    };
  }

  /**
   * Calculate career similarity using AI analysis
   */
  private async calculateCareerSimilarity(
    userProfile: AlumniProfile | StudentProfile,
    candidateProfile: AlumniProfile
  ): Promise<number> {
    try {
      const prompt = `
        Compare these two career profiles and rate their similarity from 0.0 to 1.0:
        
        Profile 1: ${this.createCareerSummary(userProfile)}
        Profile 2: ${this.createCareerSummary(candidateProfile)}
        
        Consider: industry overlap, role progression, skills alignment, career trajectory.
        Respond only with a decimal number between 0.0 and 1.0.
      `;

      const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt,
        max_tokens: 10,
        temperature: 0.1,
      });

      const score = parseFloat(response.choices[0].text.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
      
    } catch (error) {
      console.error('Error calculating career similarity:', error);
      return 0.5; // Default fallback
    }
  }

  private createCareerSummary(profile: AlumniProfile | StudentProfile): string {
    if ('graduationYear' in profile) {
      return `${profile.degreeType} in ${profile.major || profile.department}, currently ${profile.currentPosition} at ${profile.currentCompany} in ${profile.industry}`;
    } else {
      return `Current ${profile.degreeType} student in ${profile.major || profile.department}, interested in ${profile.careerInterests.join(', ')}`;
    }
  }

  /**
   * Calculate skill complementarity score
   */
  private calculateSkillComplementarity(
    userProfile: AlumniProfile | StudentProfile,
    candidateProfile: AlumniProfile
  ): Promise<number> {
    const userSkills = new Set(userProfile.skills.map(s => s.name.toLowerCase()));
    const candidateSkills = new Set(candidateProfile.skills.map(s => s.name.toLowerCase()));
    
    // Calculate overlap and complementarity
    const overlap = new Set([...userSkills].filter(skill => candidateSkills.has(skill)));
    const totalSkills = new Set([...userSkills, ...candidateSkills]);
    
    const overlapScore = overlap.size / Math.max(userSkills.size, 1);
    const diversityScore = (totalSkills.size - overlap.size) / Math.max(totalSkills.size, 1);
    
    // Balance between overlap (shared expertise) and diversity (learning opportunity)
    return (overlapScore * 0.6) + (diversityScore * 0.4);
  }

  /**
   * Calculate geographic proximity score
   */
  private calculateGeographicScore(
    userProfile: AlumniProfile | StudentProfile,
    candidateProfile: AlumniProfile
  ): Promise<number> {
    // Simple location matching - in a real implementation, you'd use geocoding
    const userLocation = this.extractLocation(userProfile);
    const candidateLocation = candidateProfile.workLocation || candidateProfile.user.institution?.location;
    
    if (!userLocation || !candidateLocation) return 0.3;
    
    // Exact match
    if (userLocation.toLowerCase() === candidateLocation.toLowerCase()) return 1.0;
    
    // Same city/region matching
    const userParts = userLocation.toLowerCase().split(/[,\s]+/);
    const candidateParts = candidateLocation.toLowerCase().split(/[,\s]+/);
    
    const commonParts = userParts.filter(part => candidateParts.includes(part)).length;
    return Math.min(commonParts * 0.3, 0.8);
  }

  private extractLocation(profile: AlumniProfile | StudentProfile): string | undefined {
    if ('workLocation' in profile) {
      return profile.workLocation || profile.user.institution?.location;
    }
    return profile.user.institution?.location;
  }

  /**
   * Calculate mentorship fit score
   */
  private calculateMentorshipFit(
    context: MatchingContext,
    candidateProfile: AlumniProfile
  ): Promise<number> {
    if (context.context !== 'mentorship') return 0.5;
    if (!candidateProfile.isMentor) return 0.1;
    
    let score = 0.7; // Base score for being a mentor
    
    // Check mentor categories alignment
    if ('careerInterests' in context.userProfile) {
      const userInterests = context.userProfile.careerInterests.map(i => i.toLowerCase());
      const mentorCategories = candidateProfile.mentorCategories.map(c => c.toLowerCase());
      
      const alignment = userInterests.filter(interest => 
        mentorCategories.some(category => category.includes(interest) || interest.includes(category))
      ).length;
      
      score += (alignment / Math.max(userInterests.length, 1)) * 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] ** 2;
      normB += vectorB[i] ** 2;
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate AI recommendations based on user activity and preferences
   */
  async generateRecommendations(
    userProfile: AlumniProfile | StudentProfile,
    context: string = 'general'
  ): Promise<AIRecommendation[]> {
    try {
      const prompt = `
        Based on this user profile, suggest 5 specific networking recommendations:
        
        ${this.createProfileText(userProfile)}
        
        Context: ${context}
        
        Provide recommendations in the format:
        1. [Type]: [Specific suggestion] - [Reason]
        
        Types: alumni_match, event, job, skill, connection
      `;

      const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt,
        max_tokens: 500,
        temperature: 0.7,
      });

      return this.parseRecommendations(response.choices[0].text, userProfile.id);
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  private parseRecommendations(text: string, userId: string): AIRecommendation[] {
    const lines = text.split('\n').filter(line => line.trim());
    const recommendations: AIRecommendation[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/\[(.*?)\]:\s*(.*?)\s*-\s*(.*)/);
      if (match) {
        const [, type, suggestion, reason] = match;
        recommendations.push({
          id: `rec_${userId}_${index}`,
          type: type.toLowerCase().replace(' ', '_') as AIRecommendation['type'],
          targetId: `target_${index}`, // This would be actual IDs in real implementation
          confidence: 0.7 + Math.random() * 0.3,
          reason: reason.trim(),
          metadata: { suggestion: suggestion.trim() }
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Predict career trajectory using AI analysis
   */
  async predictCareerPath(
    userProfile: AlumniProfile | StudentProfile
  ): Promise<CareerPrediction> {
    try {
      const prompt = `
        Analyze this profile and predict career progression:
        
        ${this.createProfileText(userProfile)}
        
        Provide a JSON response with:
        {
          "suggestedRoles": ["role1", "role2", "role3"],
          "skillGaps": ["skill1", "skill2"],
          "recommendedCourses": ["course1", "course2"],
          "careerPathProbability": 0.8,
          "timeToGoal": 24
        }
      `;

      const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt,
        max_tokens: 300,
        temperature: 0.5,
      });

      try {
        return JSON.parse(response.choices[0].text.trim());
      } catch {
        // Fallback prediction
        return {
          suggestedRoles: ['Senior Developer', 'Tech Lead', 'Engineering Manager'],
          skillGaps: ['Leadership', 'System Design'],
          recommendedCourses: ['Advanced System Design', 'Leadership in Tech'],
          careerPathProbability: 0.7,
          timeToGoal: 18
        };
      }
      
    } catch (error) {
      console.error('Error predicting career path:', error);
      return {
        suggestedRoles: [],
        skillGaps: [],
        recommendedCourses: [],
        careerPathProbability: 0.5,
        timeToGoal: 12
      };
    }
  }
}

// Singleton instance
export const aiMatcher = new IntelligentMatchingEngine();