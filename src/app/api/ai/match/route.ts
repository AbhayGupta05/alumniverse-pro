import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Demo data for matching (in production, this would come from database)
const mockAlumni = [
  {
    id: '1',
    name: 'Sarah Chen',
    currentPosition: 'Senior Software Engineer',
    currentCompany: 'Google',
    industry: 'Technology',
    graduationYear: 2018,
    skills: ['JavaScript', 'Python', 'Machine Learning', 'Cloud Architecture'],
    location: 'San Francisco, CA',
    bio: 'Passionate about AI and full-stack development. Love mentoring new graduates.',
    isAvailableForMentoring: true,
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    currentPosition: 'Product Manager',
    currentCompany: 'Meta',
    industry: 'Technology',
    graduationYear: 2019,
    skills: ['Product Strategy', 'Data Analysis', 'User Research', 'Agile'],
    location: 'Seattle, WA',
    bio: 'Product leader with experience in social platforms and AR/VR.',
    isAvailableForMentoring: true,
  },
  {
    id: '3',
    name: 'Dr. Emily Johnson',
    currentPosition: 'Research Scientist',
    currentCompany: 'Stanford Research Institute',
    industry: 'Healthcare',
    graduationYear: 2016,
    skills: ['Biomedical Engineering', 'Data Science', 'Research', 'Publications'],
    location: 'Palo Alto, CA',
    bio: 'Researching AI applications in healthcare and medical devices.',
    isAvailableForMentoring: true,
  },
  {
    id: '4',
    name: 'David Park',
    currentPosition: 'Startup Founder',
    currentCompany: 'TechFlow Solutions',
    industry: 'Entrepreneurship',
    graduationYear: 2017,
    skills: ['Leadership', 'Business Strategy', 'Fundraising', 'Product Development'],
    location: 'Austin, TX',
    bio: 'Serial entrepreneur focused on B2B SaaS solutions.',
    isAvailableForMentoring: true,
  },
  {
    id: '5',
    name: 'Jessica Wong',
    currentPosition: 'UX Design Lead',
    currentCompany: 'Apple',
    industry: 'Technology',
    graduationYear: 2020,
    skills: ['User Experience', 'Design Systems', 'Prototyping', 'User Research'],
    location: 'Cupertino, CA',
    bio: 'Creating intuitive user experiences for consumer products.',
    isAvailableForMentoring: true,
  }
];

interface MatchingCriteria {
  type: 'career_similarity' | 'skill_complement' | 'mentorship_fit' | 'geographic_proximity';
  weight: number;
}

interface MatchRequest {
  profileId: string;
  studentProfile: {
    name: string;
    major: string;
    careerInterests: string[];
    skills: string[];
    location: string;
    isSeekingMentorship: boolean;
    bio?: string;
  };
  criteria?: MatchingCriteria[];
  limit?: number;
}

async function calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
  try {
    // Create embeddings for both texts
    const embedding1Response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text1,
    });
    
    const embedding2Response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text2,
    });

    const embedding1 = embedding1Response.data[0].embedding;
    const embedding2 = embedding2Response.data[0].embedding;

    // Calculate cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  } catch (error) {
    console.error('Error calculating semantic similarity:', error);
    // Fallback to simple text matching
    return calculateSimpleTextSimilarity(text1, text2);
  }
}

function calculateSimpleTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalWords;
}

function calculateSkillsMatch(studentSkills: string[], alumniSkills: string[]): number {
  const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
  const alumniSkillsLower = alumniSkills.map(s => s.toLowerCase());
  
  const matchingSkills = studentSkillsLower.filter(skill => 
    alumniSkillsLower.some(alumniSkill => 
      alumniSkill.includes(skill) || skill.includes(alumniSkill)
    )
  );
  
  const complementarySkills = alumniSkillsLower.filter(skill => 
    !studentSkillsLower.some(studentSkill => 
      studentSkill.includes(skill) || skill.includes(studentSkill)
    )
  );
  
  // Balance between matching and complementary skills
  const matchScore = matchingSkills.length / Math.max(studentSkills.length, 1);
  const complementScore = Math.min(complementarySkills.length / 5, 1); // Cap at 5 new skills
  
  return (matchScore * 0.4) + (complementScore * 0.6);
}

function calculateGeographicProximity(location1: string, location2: string): number {
  const loc1 = location1.toLowerCase();
  const loc2 = location2.toLowerCase();
  
  if (loc1 === loc2) return 1.0;
  
  // Extract states/regions
  const getState = (loc: string) => {
    const parts = loc.split(',').map(p => p.trim());
    return parts[parts.length - 1];
  };
  
  const state1 = getState(loc1);
  const state2 = getState(loc2);
  
  if (state1 === state2) return 0.7;
  
  // Basic region matching (West Coast, East Coast, etc.)
  const westCoast = ['ca', 'california', 'wa', 'washington', 'or', 'oregon'];
  const eastCoast = ['ny', 'new york', 'ma', 'massachusetts', 'ct', 'connecticut'];
  const texas = ['tx', 'texas'];
  
  const isWestCoast = (state: string) => westCoast.some(w => state.includes(w));
  const isEastCoast = (state: string) => eastCoast.some(e => state.includes(e));
  const isTexas = (state: string) => texas.some(t => state.includes(t));
  
  if ((isWestCoast(state1) && isWestCoast(state2)) ||
      (isEastCoast(state1) && isEastCoast(state2)) ||
      (isTexas(state1) && isTexas(state2))) {
    return 0.5;
  }
  
  return 0.2;
}

async function calculateMatchScore(
  studentProfile: MatchRequest['studentProfile'], 
  alumniProfile: typeof mockAlumni[0],
  criteria: MatchingCriteria[]
): Promise<number> {
  let totalScore = 0;
  
  for (const criterion of criteria) {
    let score = 0;
    
    switch (criterion.type) {
      case 'career_similarity':
        const careerText = `${studentProfile.major} ${studentProfile.careerInterests.join(' ')}`;
        const alumniCareerText = `${alumniProfile.currentPosition} ${alumniProfile.industry}`;
        score = await calculateSemanticSimilarity(careerText, alumniCareerText);
        break;
        
      case 'skill_complement':
        score = calculateSkillsMatch(studentProfile.skills, alumniProfile.skills);
        break;
        
      case 'mentorship_fit':
        if (!alumniProfile.isAvailableForMentoring || !studentProfile.isSeekingMentorship) {
          score = 0;
        } else {
          const studentBio = studentProfile.bio || '';
          const mentorshipScore = await calculateSemanticSimilarity(studentBio, alumniProfile.bio);
          score = mentorshipScore * 0.8 + 0.2; // Base score for availability
        }
        break;
        
      case 'geographic_proximity':
        score = calculateGeographicProximity(studentProfile.location, alumniProfile.location);
        break;
    }
    
    totalScore += score * criterion.weight;
  }
  
  return Math.min(totalScore, 1.0);
}

export async function POST(request: NextRequest) {
  try {
    const body: MatchRequest = await request.json();
    
    const {
      studentProfile,
      criteria = [
        { type: 'career_similarity', weight: 0.3 },
        { type: 'skill_complement', weight: 0.25 },
        { type: 'mentorship_fit', weight: 0.25 },
        { type: 'geographic_proximity', weight: 0.2 }
      ],
      limit = 10
    } = body;

    // Validate required fields
    if (!studentProfile || !studentProfile.name) {
      return NextResponse.json(
        { success: false, error: 'Student profile information is required' },
        { status: 400 }
      );
    }

    // Calculate match scores for all alumni
    const matches = await Promise.all(
      mockAlumni.map(async (alumni) => {
        const score = await calculateMatchScore(studentProfile, alumni, criteria);
        return {
          ...alumni,
          matchScore: score,
          matchReasons: generateMatchReasons(studentProfile, alumni, criteria, score)
        };
      })
    );

    // Sort by match score and limit results
    const topMatches = matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        matches: topMatches,
        totalCount: topMatches.length,
        criteria: criteria,
        searchMetadata: {
          studentProfile: {
            name: studentProfile.name,
            major: studentProfile.major,
            location: studentProfile.location
          },
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('AI Match API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate alumni matches',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateMatchReasons(
  studentProfile: MatchRequest['studentProfile'],
  alumniProfile: typeof mockAlumni[0], 
  criteria: MatchingCriteria[],
  totalScore: number
): string[] {
  const reasons: string[] = [];
  
  // Career similarity
  if (criteria.some(c => c.type === 'career_similarity')) {
    const hasCareerAlignment = studentProfile.careerInterests.some(interest =>
      alumniProfile.industry.toLowerCase().includes(interest.toLowerCase()) ||
      alumniProfile.currentPosition.toLowerCase().includes(interest.toLowerCase())
    );
    
    if (hasCareerAlignment) {
      reasons.push(`Works in ${alumniProfile.industry} which aligns with your career interests`);
    }
  }
  
  // Skills match
  if (criteria.some(c => c.type === 'skill_complement')) {
    const matchingSkills = studentProfile.skills.filter(skill =>
      alumniProfile.skills.some(alumniSkill => 
        alumniSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    if (matchingSkills.length > 0) {
      reasons.push(`Shares skills in ${matchingSkills.slice(0, 3).join(', ')}`);
    }
    
    const newSkills = alumniProfile.skills.filter(skill =>
      !studentProfile.skills.some(studentSkill => 
        studentSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    if (newSkills.length > 0) {
      reasons.push(`Can help you learn ${newSkills.slice(0, 2).join(' and ')}`);
    }
  }
  
  // Location proximity
  if (criteria.some(c => c.type === 'geographic_proximity')) {
    if (studentProfile.location.toLowerCase() === alumniProfile.location.toLowerCase()) {
      reasons.push('Located in the same city');
    } else if (calculateGeographicProximity(studentProfile.location, alumniProfile.location) > 0.5) {
      reasons.push('Located in the same region');
    }
  }
  
  // Mentorship
  if (alumniProfile.isAvailableForMentoring && studentProfile.isSeekingMentorship) {
    reasons.push('Available for mentorship');
  }
  
  // High match score
  if (totalScore > 0.8) {
    reasons.push('Excellent overall compatibility');
  } else if (totalScore > 0.6) {
    reasons.push('Strong professional alignment');
  }
  
  return reasons.slice(0, 4); // Limit to 4 reasons
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'AI Alumni Matching API is running',
    endpoints: {
      POST: '/api/ai/match - Generate alumni matches for a student profile',
    },
    sampleRequest: {
      profileId: 'student-123',
      studentProfile: {
        name: 'John Doe',
        major: 'Computer Science',
        careerInterests: ['Software Engineering', 'AI'],
        skills: ['JavaScript', 'Python'],
        location: 'San Francisco, CA',
        isSeekingMentorship: true
      },
      limit: 5
    }
  });
}