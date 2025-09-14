import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'unknown';
    let dbLatency = 0;
    
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      console.error('Database health check failed:', error);
    }
    
    // Check OpenAI API availability
    let aiStatus = 'unknown';
    const hasOpenAIKey = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (hasOpenAIKey) {
      aiStatus = 'configured';
    } else {
      aiStatus = 'not_configured';
    }
    
    // Check Web3 configuration
    let blockchainStatus = 'unknown';
    const hasWeb3Config = !!(
      process.env.NEXT_PUBLIC_WEB3_INFURA_ID &&
      process.env.NEXT_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS
    );
    
    if (hasWeb3Config) {
      blockchainStatus = 'configured';
    } else {
      blockchainStatus = 'not_configured';
    }
    
    // Overall system status
    const isHealthy = dbStatus === 'connected' && aiStatus !== 'unknown';
    const responseTime = Date.now() - startTime;
    
    // Environment info
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      appEnv: process.env.NEXT_PUBLIC_APP_ENV,
      region: process.env.VERCEL_REGION || 'local',
      deployment: process.env.VERCEL_DEPLOYMENT_ID || 'local',
    };
    
    // Feature flags
    const features = {
      aiMatching: hasOpenAIKey,
      blockchain: hasWeb3Config,
      realTimeFeatures: !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ),
      analytics: !!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
      emailServices: !!process.env.SENDGRID_API_KEY,
    };
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      version: '1.0.0',
      environment,
      services: {
        database: {
          status: dbStatus,
          latency: dbLatency,
          provider: 'PostgreSQL'
        },
        ai: {
          status: aiStatus,
          provider: 'OpenAI'
        },
        blockchain: {
          status: blockchainStatus,
          network: 'Polygon Mumbai',
          provider: 'Infura'
        }
      },
      features,
      endpoints: {
        api: `${request.nextUrl.origin}/api`,
        auth: `${request.nextUrl.origin}/api/auth`,
        aiMatch: `${request.nextUrl.origin}/api/ai/match`,
        analytics: `${request.nextUrl.origin}/api/analytics/dashboard`,
        blockchain: `${request.nextUrl.origin}/api/blockchain/nft/mint`
      },
      documentation: {
        deployment: `${request.nextUrl.origin}/DEPLOYMENT.md`,
        readme: `${request.nextUrl.origin}/README.md`
      }
    };
    
    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Simple HEAD request for uptime monitoring
export async function HEAD(request: NextRequest) {
  try {
    // Quick database ping
    await prisma.$queryRaw`SELECT 1`;
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Health-Status': 'healthy'
      }
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy'
      }
    });
  }
}