import { NextRequest, NextResponse } from 'next/server';
import Web3 from 'web3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// NFT Contract ABI (simplified for demo)
const NFT_ABI = [
  {
    "inputs": [
      {"name": "recipient", "type": "address"},
      {"name": "tokenURI", "type": "string"}
    ],
    "name": "mintAchievement",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "tokenURI", 
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface MintRequest {
  title: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: string;
  recipientAddress: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

// Mock IPFS upload function (replace with actual IPFS service)
async function uploadToIPFS(metadata: NFTMetadata): Promise<string> {
  // In production, upload to IPFS via Pinata or similar service
  // For demo, return a mock IPFS URL
  const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
  
  console.log('Mock IPFS upload:', metadata);
  
  // In production, you would do something like:
  // const pinataResponse = await pinata.pinJSONToIPFS(metadata);
  // return `ipfs://${pinataResponse.IpfsHash}`;
  
  return `ipfs://${mockHash}`;
}

function getRarityMultiplier(rarity: string): number {
  switch (rarity) {
    case 'COMMON': return 1;
    case 'RARE': return 2;
    case 'EPIC': return 5;
    case 'LEGENDARY': return 10;
    default: return 1;
  }
}

function generateNFTImage(title: string, rarity: string): string {
  // In production, generate or retrieve actual NFT artwork
  // For demo, return placeholder image
  const colors = {
    COMMON: '94a3b8',
    RARE: '3b82f6', 
    EPIC: '8b5cf6',
    LEGENDARY: 'f59e0b'
  };
  
  const color = colors[rarity as keyof typeof colors] || '94a3b8';
  return `https://via.placeholder.com/512x512/${color}/ffffff?text=${encodeURIComponent(title)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: MintRequest = await request.json();
    const { title, description, rarity, category, recipientAddress } = body;

    // Validate required fields
    if (!title || !description || !rarity || !recipientAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has permission to mint NFTs
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { alumniProfile: true, studentProfile: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // For demo purposes, allow any user to mint. In production, add proper authorization
    
    // Create NFT metadata
    const metadata: NFTMetadata = {
      name: title,
      description: description,
      image: generateNFTImage(title, rarity),
      attributes: [
        { trait_type: 'Rarity', value: rarity },
        { trait_type: 'Category', value: category },
        { trait_type: 'Issuer', value: 'AlumniVerse Pro' },
        { trait_type: 'Minted By', value: `${user.firstName} ${user.lastName}` },
        { trait_type: 'Mint Date', value: new Date().toISOString() }
      ]
    };

    // Upload metadata to IPFS
    const tokenURI = await uploadToIPFS(metadata);

    // Initialize Web3 connection
    let web3: Web3;
    let tokenId: string;
    let transactionHash: string;

    if (process.env.DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_WEB3_INFURA_ID) {
      // Demo mode - simulate blockchain interaction
      console.log('Demo mode: Simulating NFT mint');
      tokenId = Math.floor(Math.random() * 1000000).toString();
      transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // Real blockchain interaction
      const infuraUrl = `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_WEB3_INFURA_ID}`;
      web3 = new Web3(infuraUrl);
      
      const contractAddress = process.env.NEXT_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      const contract = new web3.eth.Contract(NFT_ABI as any, contractAddress);
      
      // In production, use proper wallet management for minting
      // This is a simplified example
      const privateKey = process.env.MINTER_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('Minter private key not configured');
      }

      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(account);

      // Estimate gas
      const gasEstimate = await contract.methods
        .mintAchievement(recipientAddress, tokenURI)
        .estimateGas({ from: account.address });

      // Send transaction
      const gasPrice = await web3.eth.getGasPrice();
      const receipt = await contract.methods
        .mintAchievement(recipientAddress, tokenURI)
        .send({
          from: account.address,
          gas: gasEstimate.toString(),
          gasPrice: gasPrice.toString(),
        });

      transactionHash = receipt.transactionHash;
      
      // Extract token ID from transaction logs
      const logs = receipt.logs;
      if (logs && logs.length > 0) {
        // Parse the Transfer event to get token ID
        tokenId = web3.utils.hexToNumber(logs[0].topics?.[3] || '0').toString();
      } else {
        tokenId = Math.floor(Math.random() * 1000000).toString();
      }
    }

    // Save NFT achievement to database
    const nftAchievement = await prisma.nFTAchievement.create({
      data: {
        tokenId,
        contractAddress: process.env.NEXT_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS || 'demo-contract',
        title,
        description,
        imageUrl: metadata.image,
        metadata: metadata as any,
        rarity: rarity as any,
        userId: session.user.id,
      }
    });

    // Award points based on rarity
    const points = 50 * getRarityMultiplier(rarity);
    
    // Update user's gamification profile
    await prisma.gamificationProfile.upsert({
      where: { userId: session.user.id },
      update: {
        totalPoints: { increment: points },
        level: { increment: Math.floor(points / 100) }
      },
      create: {
        userId: session.user.id,
        totalPoints: points,
        level: Math.max(1, Math.floor(points / 100))
      }
    });

    // Create achievement record
    await prisma.achievement.create({
      data: {
        userId: session.user.id,
        title: `NFT Achievement: ${title}`,
        description: `Minted ${rarity.toLowerCase()} NFT achievement`,
        type: 'PLATFORM',
        points,
        verified: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        nftAchievement: {
          id: nftAchievement.id,
          tokenId,
          contractAddress: nftAchievement.contractAddress,
          title,
          description,
          rarity,
          imageUrl: metadata.image,
          transactionHash,
          tokenURI,
          pointsEarned: points
        },
        transaction: {
          hash: transactionHash,
          network: 'Mumbai Testnet',
          explorer: `https://mumbai.polygonscan.com/tx/${transactionHash}`
        }
      }
    });

  } catch (error) {
    console.error('NFT Mint API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mint NFT achievement',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's NFTs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const nftAchievements = await prisma.nFTAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        achievements: nftAchievements,
        totalCount: nftAchievements.length,
        rarityBreakdown: {
          common: nftAchievements.filter((n: { rarity: string }) => n.rarity === 'COMMON').length,
          rare: nftAchievements.filter((n: { rarity: string }) => n.rarity === 'RARE').length,
          epic: nftAchievements.filter((n: { rarity: string }) => n.rarity === 'EPIC').length,
          legendary: nftAchievements.filter((n: { rarity: string }) => n.rarity === 'LEGENDARY').length,
        }
      }
    });

  } catch (error) {
    console.error('NFT Get API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve NFT achievements',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}