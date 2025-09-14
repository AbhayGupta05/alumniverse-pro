import OpenAI from 'openai';
import { AlumniProfile, StudentProfile, AIRecommendation, User } from '@/types';

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'demo-key',
});

interface MatchCriteria {
  type: 'career_similarity' | 'skill_complement' | 'geographic_proximity' | 'mentorship_fit';
  weight: number;
}

interface AlumniMatch {
  alumni: AlumniProfile;
  score: number;
  reasons: string[];
  matchTypes: MatchCriteria[];
  aiInsights: string;
}

export class AlumniMatchingEngine {
  private embeddings: Map<string, number[]> = new Map();
  private matchCache: Map<string, AlumniMatch[]> = new Map();

  constructor() {
    // Initialize with mock data for hackathon demo
    this.loadMockEmbeddings();
  }

  /**
   * Find best alumni matches for a student or job seeker
   */
  async findMatches(
    profile: StudentProfile | AlumniProfile,
    availableAlumni: AlumniProfile[],
    criteria: MatchCriteria[] = this.getDefaultCriteria(),
    limit: number = 10
  ): Promise<AlumniMatch[]> {
    try {
      // Generate semantic embedding for the seeker's profile
      const profileEmbedding = await this.generateProfileEmbedding(profile);
      
      // Calculate matches for all alumni
      const matches: AlumniMatch[] = [];
      
      for (const alumni of availableAlumni) {
        const match = await this.calculateMatch(profile, alumni, criteria, profileEmbedding);
        if (match.score > 0.3) { // Minimum threshold
          matches.push(match);
        }
      }
      
      // Sort by score and return top matches
      matches.sort((a, b) => b.score - a.score);
      return matches.slice(0, limit);
      
    } catch (error) {
      console.error('Error in alumni matching:', error);
      return this.getFallbackMatches(availableAlumni, limit);
    }
  }

  /**
   * Generate semantic embedding for a profile using AI
   */
  private async generateProfileEmbedding(profile: StudentProfile | AlumniProfile): Promise<number[]> {
    try {
      // Create a comprehensive profile description
      const profileText = this.createProfileText(profile);
      
      // For hackathon demo, use mock embeddings
      if (process.env.NEXT_PUBLIC_OPENAI_API_KEY === 'demo-key') {
        return this.getMockEmbedding(profileText);
      }
      
      // Generate embedding using OpenAI
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: profileText,
      });
      
      return response.data[0].embedding;
      
    } catch (error) {
      console.error('Error generating embedding:', error);
      return this.getMockEmbedding('fallback');
    }
  }

  /**
   * Calculate match score between seeker and alumni
   */
  private async calculateMatch(
    seeker: StudentProfile | AlumniProfile,
    alumni: AlumniProfile,
    criteria: MatchCriteria[],
    seekerEmbedding: number[]
  ): Promise<AlumniMatch> {
    let totalScore = 0;
    let totalWeight = 0;
    const reasons: string[] = [];
    const matchTypes: MatchCriteria[] = [];

    for (const criterion of criteria) {
      let score = 0;
      
      switch (criterion.type) {
        case 'career_similarity':
          score = this.calculateCareerSimilarity(seeker, alumni);
          if (score > 0.7) {
            reasons.push(`Strong career alignment in ${alumni.industry || alumni.department}`);
            matchTypes.push(criterion);
          }
          break;
          
        case 'skill_complement':
          score = this.calculateSkillComplement(seeker, alumni);
          if (score > 0.6) {
            reasons.push(`Complementary skills in ${this.getTopSkills(alumni.skills).join(', ')}`);
            matchTypes.push(criterion);
          }
          break;
          
        case 'geographic_proximity':
          score = this.calculateGeographicProximity(seeker, alumni);
          if (score > 0.8) {
            reasons.push(`Both located in ${alumni.workLocation || 'similar area'}`);
            matchTypes.push(criterion);
          }
          break;
          
        case 'mentorship_fit':
          score = this.calculateMentorshipFit(seeker, alumni);
          if (score > 0.7 && alumni.isMentor) {
            reasons.push(`Excellent mentorship match - ${alumni.yearsExperience}+ years experience`);
            matchTypes.push(criterion);
          }
          break;
      }
      
      totalScore += score * criterion.weight;
      totalWeight += criterion.weight;
    }

    // Calculate semantic similarity using embeddings
    const alumniEmbedding = await this.getAlumniEmbedding(alumni);
    const semanticSimilarity = this.calculateCosineSimilarity(seekerEmbedding, alumniEmbedding);
    
    // Combine scores
    const finalScore = totalWeight > 0 ? 
      (totalScore / totalWeight) * 0.7 + semanticSimilarity * 0.3 : 
      semanticSimilarity;

    // Generate AI insights
    const aiInsights = await this.generateMatchInsights(seeker, alumni, finalScore);

    return {
      alumni,
      score: finalScore,
      reasons,
      matchTypes,
      aiInsights
    };
  }

  /**
   * Calculate career similarity between profiles
   */
  private calculateCareerSimilarity(
    seeker: StudentProfile | AlumniProfile,
    alumni: AlumniProfile
  ): number {
    let score = 0;
    
    // Compare departments/majors
    const seekerDept = 'department' in seeker ? seeker.department : null;
    if (seekerDept === alumni.department) {
      score += 0.4;
    }
    
    // Compare career interests vs current role
    if ('careerInterests' in seeker) {
      const interests = seeker.careerInterests;
      const currentRole = alumni.currentPosition?.toLowerCase() || '';
      const industry = alumni.industry?.toLowerCase() || '';
      
      for (const interest of interests) {
        if (currentRole.includes(interest.toLowerCase()) || 
            industry.includes(interest.toLowerCase())) {
          score += 0.3;
        }
      }
    }
    
    // Experience level alignment for alumni-to-alumni matching
    if ('yearsExperience' in seeker) {
      const expDiff = Math.abs((seeker.yearsExperience || 0) - (alumni.yearsExperience || 0));
      score += Math.max(0, 0.3 - expDiff * 0.05);
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate skill complementarity
   */
  private calculateSkillComplement(
    seeker: StudentProfile | AlumniProfile,
    alumni: AlumniProfile
  ): number {
    const seekerSkills = seeker.skills.map(s => s.name.toLowerCase());
    const alumniSkills = alumni.skills.map(s => s.name.toLowerCase());
    
    // Find overlapping skills
    const overlap = seekerSkills.filter(skill => alumniSkills.includes(skill));
    const overlapRatio = overlap.length / Math.max(seekerSkills.length, 1);
    
    // Find complementary skills (alumni has skills seeker needs)
    const seekerNeeds = this.inferNeededSkills(seeker);
    const complement = alumniSkills.filter(skill => seekerNeeds.includes(skill));
    const complementRatio = complement.length / Math.max(seekerNeeds.length, 1);
    
    return overlapRatio * 0.4 + complementRatio * 0.6;
  }

  /**
   * Calculate geographic proximity
   */
  private calculateGeographicProximity(
    seeker: StudentProfile | AlumniProfile,
    alumni: AlumniProfile
  ): number {
    const seekerLocation = this.extractLocation(seeker);
    const alumniLocation = alumni.workLocation || '';
    
    if (!seekerLocation || !alumniLocation) return 0;
    
    // Simple string matching for demo
    if (seekerLocation.toLowerCase() === alumniLocation.toLowerCase()) {
      return 1.0;
    }
    
    // Check for same city/state
    const seekerParts = seekerLocation.split(',').map(p => p.trim().toLowerCase());
    const alumniParts = alumniLocation.split(',').map(p => p.trim().toLowerCase());
    
    const commonParts = seekerParts.filter(part => 
      alumniParts.some(ap => ap.includes(part) || part.includes(ap))
    );
    
    return commonParts.length > 0 ? 0.7 : 0.0;
  }

  /**
   * Calculate mentorship compatibility
   */
  private calculateMentorshipFit(
    seeker: StudentProfile | AlumniProfile,
    alumni: AlumniProfile
  ): number {
    if (!alumni.isMentor) return 0;
    
    let score = 0.5; // Base score for being a mentor
    
    // Check if seeker is seeking mentorship
    if ('isSeekingMentorship' in seeker && seeker.isSeekingMentorship) {
      score += 0.3;
    }
    
    // Experience gap (good for mentorship)
    const seekerExp = 'yearsExperience' in seeker ? seeker.yearsExperience || 0 : 0;
    const expGap = (alumni.yearsExperience || 0) - seekerExp;
    
    if (expGap >= 3 && expGap <= 15) { // Optimal mentorship gap
      score += 0.2;
    }
    
    // Check mentor categories alignment
    if (alumni.mentorCategories && alumni.mentorCategories.length > 0) {
      const seekerInterests = 'careerInterests' in seeker ? seeker.careerInterests : ('department' in seeker ? [seeker.department] : []);
      const alignment = alumni.mentorCategories.some(category =>
        seekerInterests.some(interest => 
          category.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(category.toLowerCase())
        )
      );
      
      if (alignment) score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Generate AI-powered insights about the match
   */
  private async generateMatchInsights(
    seeker: StudentProfile | AlumniProfile,
    alumni: AlumniProfile,
    score: number
  ): Promise<string> {
    try {
      if (process.env.NEXT_PUBLIC_OPENAI_API_KEY === 'demo-key') {
        return this.getMockInsights(seeker, alumni, score);
      }
      
      const prompt = `Analyze this professional match and provide insights:

Seeker Profile:
|- Department: ${'department' in seeker ? seeker.department : 'N/A'}
- Skills: ${seeker.skills.map(s => s.name).join(', ')}
- ${('careerInterests' in seeker) ? `Career Interests: ${seeker.careerInterests.join(', ')}` : ''}

Alumni Profile:
- Position: ${alumni.currentPosition || 'Not specified'}
- Company: ${alumni.currentCompany || 'Not specified'}
- Industry: ${alumni.industry || 'Not specified'}
- Experience: ${alumni.yearsExperience || 0} years
- Skills: ${alumni.skills.map(s => s.name).join(', ')}

Match Score: ${(score * 100).toFixed(1)}%

Provide a 2-3 sentence insight about why this is a good match and what value the alumni could provide. Focus on career guidance, skill development, or networking opportunities.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });
      
      return response.choices[0]?.message?.content || 'Great potential for career growth and networking.';
      
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getMockInsights(seeker, alumni, score);
    }
  }

  /**
   * Utility methods
   */
  private createProfileText(profile: StudentProfile | AlumniProfile): string {
    const parts = [
      'department' in profile ? profile.department : 'N/A',
      profile.skills.map(s => s.name).join(' '),
    ];
    
    if ('careerInterests' in profile) {
      parts.push(profile.careerInterests.join(' '));
    }
    
    if ('currentPosition' in profile) {
      parts.push(profile.currentPosition || '');
      parts.push(profile.industry || '');
    }
    
    return parts.filter(Boolean).join(' ');
  }

  private getDefaultCriteria(): MatchCriteria[] {
    return [
      { type: 'career_similarity', weight: 0.3 },
      { type: 'skill_complement', weight: 0.25 },
      { type: 'mentorship_fit', weight: 0.25 },
      { type: 'geographic_proximity', weight: 0.2 },
    ];
  }

  private inferNeededSkills(profile: StudentProfile | AlumniProfile): string[] {
    // Mock implementation - in production, use ML to infer needed skills
    const careerMap: { [key: string]: string[] } = {
      'computer science': ['react', 'python', 'aws', 'docker', 'kubernetes'],
      'business': ['excel', 'powerpoint', 'sql', 'tableau', 'salesforce'],
      'engineering': ['autocad', 'matlab', 'python', 'project management'],
      'marketing': ['google analytics', 'adobe creative suite', 'social media', 'seo'],
    };
    
    const dept = ('department' in profile ? profile.department : 'general').toLowerCase();
    return careerMap[dept] || ['communication', 'leadership', 'problem solving'];
  }

  private extractLocation(profile: StudentProfile | AlumniProfile): string {
    if ('workLocation' in profile) {
      return profile.workLocation || '';
    }
    // For students, could infer from institution location
    return profile.user?.institution?.location || '';
  }

  private getTopSkills(skills: any[]): string[] {
    return skills
      .sort((a, b) => b.level.localeCompare(a.level))
      .slice(0, 3)
      .map(s => s.name);
  }

  private async getAlumniEmbedding(alumni: AlumniProfile): Promise<number[]> {
    const key = `alumni_${alumni.id}`;
    if (this.embeddings.has(key)) {
      return this.embeddings.get(key)!;
    }
    
    const embedding = await this.generateProfileEmbedding(alumni);
    this.embeddings.set(key, embedding);
    return embedding;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private getMockEmbedding(text: string): number[] {
    // Generate consistent mock embedding based on text
    const hash = this.simpleHash(text);
    const embedding = [];
    
    for (let i = 0; i < 100; i++) { // Smaller embedding for demo
      embedding.push((hash + i) % 1000 / 1000 - 0.5);
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getMockInsights(
    seeker: StudentProfile | AlumniProfile,
    alumni: AlumniProfile,
    score: number
  ): string {
    const insights = [
      `${alumni.currentPosition || 'This professional'} at ${alumni.currentCompany || 'their company'} could provide valuable industry insights and career guidance.`,
      `Strong alignment in ${alumni.department} with ${alumni.yearsExperience || 'several'} years of experience to share.`,
      `Excellent networking opportunity with potential for skill development and mentorship.`,
      `Career trajectory suggests great potential for learning about ${alumni.industry || 'the industry'} landscape.`,
      `Geographic proximity could enable in-person meetings and local networking opportunities.`,
    ];
    
    // Select insights based on score
    if (score > 0.8) {
      return insights.slice(0, 2).join(' ');
    } else if (score > 0.6) {
      return insights[Math.floor(Math.random() * 3)];
    } else {
      return insights[Math.floor(Math.random() * insights.length)];
    }
  }

  private getFallbackMatches(alumni: AlumniProfile[], limit: number): AlumniMatch[] {
    return alumni.slice(0, limit).map(alumni => ({
      alumni,
      score: 0.5 + Math.random() * 0.3, // Random score between 0.5-0.8
      reasons: ['Profile compatibility', 'Shared academic background'],
      matchTypes: [{ type: 'career_similarity', weight: 1.0 }],
      aiInsights: 'Good potential for professional networking and career insights.'
    }));
  }

  private loadMockEmbeddings(): void {
    // Pre-load some mock embeddings for consistent demo experience
    const mockProfiles = [
      'computer science software engineer',
      'business marketing manager',
      'engineering project manager',
      'data science analyst',
    ];
    
    mockProfiles.forEach(profile => {
      this.embeddings.set(profile, this.getMockEmbedding(profile));
    });
  }
}

// Export singleton instance
export const alumniMatcher = new AlumniMatchingEngine();

// React hook for alumni matching
export function useAlumniMatching() {
  const findMatches = async (
    profile: StudentProfile | AlumniProfile,
    availableAlumni: AlumniProfile[],
    options?: {
      criteria?: MatchCriteria[];
      limit?: number;
    }
  ): Promise<AlumniMatch[]> => {
    return alumniMatcher.findMatches(
      profile,
      availableAlumni,
      options?.criteria,
      options?.limit
    );
  };

  return {
    findMatches,
    isLoading: false,
    error: null
  };
}