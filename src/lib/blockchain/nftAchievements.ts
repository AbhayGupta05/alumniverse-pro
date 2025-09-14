// Blockchain NFT Achievement System
import Web3 from 'web3';
import { NFTAchievement, Achievement, User } from '@/types';

// Smart Contract ABI (simplified for hackathon)
const ACHIEVEMENT_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "metadataURI", "type": "string"},
      {"internalType": "uint8", "name": "rarity", "type": "uint8"}
    ],
    "name": "mintAchievement",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getAchievement",
    "outputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint8", "name": "rarity", "type": "uint8"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Polygon testnet configuration
const POLYGON_TESTNET_CONFIG = {
  chainId: '0x13881', // 80001 in decimal
  chainName: 'Polygon Testnet',
  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
};

interface AchievementMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  achievement_data: {
    category: string;
    points: number;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    institution: string;
    date_earned: string;
    verification_hash: string;
  };
}

export class NFTAchievementSystem {
  private web3: Web3;
  private contract: any;
  private contractAddress: string;
  private initialized: boolean = false;

  constructor() {
    // Initialize with Polygon testnet
    this.contractAddress = process.env.NEXT_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS || '0x...'; // Deploy contract first
    this.initializeWeb3();
  }

  private async initializeWeb3() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        await this.switchToPolygon();
      } else {
        // Fallback to Infura/Alchemy for server-side operations
        this.web3 = new Web3(`https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_WEB3_INFURA_ID}`);
      }
      
      this.contract = new this.web3.eth.Contract(ACHIEVEMENT_CONTRACT_ABI, this.contractAddress);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
    }
  }

  private async switchToPolygon() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_TESTNET_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_TESTNET_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
        }
      }
    }
  }

  /**
   * Mint an achievement NFT for a user
   */
  async mintAchievement(
    achievement: Achievement,
    user: User,
    walletAddress: string
  ): Promise<NFTAchievement | null> {
    if (!this.initialized) {
      await this.initializeWeb3();
    }

    try {
      // Generate achievement metadata
      const metadata = await this.generateMetadata(achievement, user);
      
      // Upload metadata to IPFS (using Pinata or similar service)
      const metadataURI = await this.uploadToIPFS(metadata);
      
      // Determine rarity
      const rarity = this.calculateRarity(achievement);
      const rarityIndex = ['Common', 'Rare', 'Epic', 'Legendary'].indexOf(rarity);

      // Get the user's account
      const accounts = await this.web3.eth.getAccounts();
      const fromAddress = accounts[0] || walletAddress;

      // Mint the NFT
      const txHash = await this.contract.methods
        .mintAchievement(
          walletAddress,
          achievement.title,
          achievement.description,
          metadataURI,
          rarityIndex
        )
        .send({ from: fromAddress, gas: 300000 });

      // Get the token ID from the transaction receipt
      const receipt = await this.web3.eth.getTransactionReceipt(txHash.transactionHash);
      const tokenId = this.extractTokenIdFromReceipt(receipt);

      // Generate achievement image
      const imageUrl = await this.generateAchievementImage(achievement, rarity);

      const nftAchievement: NFTAchievement = {
        id: `nft_${tokenId}_${user.id}`,
        tokenId: tokenId.toString(),
        contractAddress: this.contractAddress,
        title: achievement.title,
        description: achievement.description,
        imageUrl,
        metadata,
        mintedAt: new Date(),
        rarity
      };

      // Store in database
      await this.saveNFTAchievement(nftAchievement, user.id);

      // Track minting analytics
      await this.trackNFTMint(user.id, achievement.type, rarity);

      return nftAchievement;

    } catch (error) {
      console.error('Failed to mint achievement NFT:', error);
      return null;
    }
  }

  /**
   * Get all NFT achievements for a user
   */
  async getUserNFTAchievements(userId: string): Promise<NFTAchievement[]> {
    try {
      // Fetch from database
      const response = await fetch(`/api/users/${userId}/nft-achievements`);
      const data = await response.json();
      
      if (!data.success) return [];

      // Verify each NFT on-chain
      const verifiedAchievements = await Promise.all(
        data.achievements.map(async (achievement: NFTAchievement) => {
          const verified = await this.verifyNFTOnChain(achievement.tokenId);
          return { ...achievement, verified };
        })
      );

      return verifiedAchievements;
    } catch (error) {
      console.error('Error fetching user NFT achievements:', error);
      return [];
    }
  }

  /**
   * Create achievement for specific milestones
   */
  async createMilestoneAchievement(
    userId: string,
    milestoneType: string,
    data: any
  ): Promise<NFTAchievement | null> {
    const user = await this.getUserProfile(userId);
    if (!user) return null;

    let achievement: Achievement;

    switch (milestoneType) {
      case 'graduation':
        achievement = {
          id: `grad_${userId}_${Date.now()}`,
          title: `${data.degreeType} Graduate`,
          description: `Graduated with ${data.degreeType} in ${data.major} from ${data.institution}`,
          type: 'academic',
          date: new Date(),
          verified: true,
          points: 100
        };
        break;

      case 'first_job':
        achievement = {
          id: `job_${userId}_${Date.now()}`,
          title: 'Career Launch',
          description: `Started career as ${data.position} at ${data.company}`,
          type: 'professional',
          date: new Date(),
          verified: true,
          points: 75
        };
        break;

      case 'mentorship_milestone':
        achievement = {
          id: `mentor_${userId}_${Date.now()}`,
          title: 'Mentor Champion',
          description: `Successfully mentored ${data.menteeCount} students`,
          type: 'platform',
          date: new Date(),
          verified: true,
          points: 150
        };
        break;

      case 'networking_milestone':
        achievement = {
          id: `network_${userId}_${Date.now()}`,
          title: 'Super Connector',
          description: `Built a network of ${data.connectionCount} professional connections`,
          type: 'platform',
          date: new Date(),
          verified: true,
          points: 120
        };
        break;

      case 'academic_excellence':
        achievement = {
          id: `excellence_${userId}_${Date.now()}`,
          title: 'Academic Excellence',
          description: `Maintained GPA of ${data.gpa} throughout academic career`,
          type: 'academic',
          date: new Date(),
          verified: true,
          points: 200
        };
        break;

      default:
        return null;
    }

    // Get user's wallet address
    const walletAddress = await this.getUserWalletAddress(userId);
    if (!walletAddress) {
      // Store as pending NFT until user connects wallet
      await this.storePendingNFT(userId, achievement);
      return null;
    }

    return await this.mintAchievement(achievement, user, walletAddress);
  }

  /**
   * Generate dynamic achievement image using AI
   */
  private async generateAchievementImage(
    achievement: Achievement,
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  ): Promise<string> {
    try {
      // For hackathon, we'll use a simple image generation service
      // In production, you'd use DALL-E, Midjourney API, or similar
      
      const colors = {
        Common: '#8B8B8B',
        Rare: '#4F94CD', 
        Epic: '#9932CC',
        Legendary: '#FFD700'
      };

      const imageData = {
        title: achievement.title,
        type: achievement.type,
        rarity,
        color: colors[rarity],
        points: achievement.points
      };

      // Generate with Canvas API or external service
      const response = await fetch('/api/generate-achievement-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      });

      const result = await response.json();
      return result.imageUrl || '/default-achievement.png';
      
    } catch (error) {
      console.error('Error generating achievement image:', error);
      return '/default-achievement.png';
    }
  }

  /**
   * Generate metadata for NFT
   */
  private async generateMetadata(
    achievement: Achievement,
    user: User
  ): Promise<AchievementMetadata> {
    const rarity = this.calculateRarity(achievement);
    const imageUrl = await this.generateAchievementImage(achievement, rarity);

    return {
      name: achievement.title,
      description: achievement.description,
      image: imageUrl,
      attributes: [
        { trait_type: 'Category', value: achievement.type },
        { trait_type: 'Points', value: achievement.points },
        { trait_type: 'Rarity', value: rarity },
        { trait_type: 'Institution', value: user.institution?.name || 'Unknown' },
        { trait_type: 'Year', value: new Date().getFullYear() },
        { trait_type: 'Verified', value: achievement.verified ? 'Yes' : 'No' }
      ],
      achievement_data: {
        category: achievement.type,
        points: achievement.points,
        rarity,
        institution: user.institution?.name || 'Unknown',
        date_earned: achievement.date.toISOString(),
        verification_hash: this.generateVerificationHash(achievement, user)
      }
    };
  }

  /**
   * Calculate achievement rarity based on criteria
   */
  private calculateRarity(achievement: Achievement): 'Common' | 'Rare' | 'Epic' | 'Legendary' {
    const points = achievement.points;
    
    if (points >= 200) return 'Legendary';
    if (points >= 150) return 'Epic';  
    if (points >= 100) return 'Rare';
    return 'Common';
  }

  /**
   * Upload metadata to IPFS
   */
  private async uploadToIPFS(metadata: AchievementMetadata): Promise<string> {
    try {
      // For hackathon, we'll use Pinata (free tier)
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata })
      });

      const result = await response.json();
      return result.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}` : '';
      
    } catch (error) {
      console.error('IPFS upload failed:', error);
      return '';
    }
  }

  /**
   * Verify NFT exists on blockchain
   */
  private async verifyNFTOnChain(tokenId: string): Promise<boolean> {
    try {
      const result = await this.contract.methods.getAchievement(tokenId).call();
      return result && result.title && result.title !== '';
    } catch (error) {
      console.error('NFT verification failed:', error);
      return false;
    }
  }

  /**
   * Extract token ID from transaction receipt
   */
  private extractTokenIdFromReceipt(receipt: any): number {
    // Look for Transfer event in logs
    for (const log of receipt.logs) {
      if (log.topics[0] === this.web3.utils.keccak256('Transfer(address,address,uint256)')) {
        return parseInt(log.topics[3], 16);
      }
    }
    return Date.now(); // Fallback
  }

  /**
   * Generate cryptographic verification hash
   */
  private generateVerificationHash(achievement: Achievement, user: User): string {
    const data = `${achievement.id}_${user.id}_${achievement.date.toISOString()}_${achievement.type}`;
    return this.web3.utils.keccak256(data);
  }

  // Database operations (mock implementations for hackathon)
  private async saveNFTAchievement(nftAchievement: NFTAchievement, userId: string): Promise<void> {
    try {
      await fetch('/api/nft-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nftAchievement, userId })
      });
    } catch (error) {
      console.error('Failed to save NFT achievement:', error);
    }
  }

  private async getUserProfile(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data.success ? data.user : null;
    } catch (error) {
      return null;
    }
  }

  private async getUserWalletAddress(userId: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/users/${userId}/wallet`);
      const data = await response.json();
      return data.success ? data.walletAddress : null;
    } catch (error) {
      return null;
    }
  }

  private async storePendingNFT(userId: string, achievement: Achievement): Promise<void> {
    try {
      await fetch('/api/pending-nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, achievement })
      });
    } catch (error) {
      console.error('Failed to store pending NFT:', error);
    }
  }

  private async trackNFTMint(userId: string, achievementType: string, rarity: string): Promise<void> {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'nft_achievement_minted',
          userId,
          properties: { achievementType, rarity, timestamp: new Date().toISOString() }
        })
      });
    } catch (error) {
      console.error('Failed to track NFT mint:', error);
    }
  }

  /**
   * Batch mint achievements for multiple users
   */
  async batchMintAchievements(
    achievements: Array<{ achievement: Achievement; user: User; walletAddress: string }>
  ): Promise<NFTAchievement[]> {
    const results = await Promise.allSettled(
      achievements.map(({ achievement, user, walletAddress }) =>
        this.mintAchievement(achievement, user, walletAddress)
      )
    );

    return results
      .filter((result): result is PromiseFulfilledResult<NFTAchievement> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  /**
   * Get achievement marketplace data
   */
  async getAchievementMarketplace(): Promise<any[]> {
    try {
      const response = await fetch('/api/nft-marketplace');
      const data = await response.json();
      return data.success ? data.marketplace : [];
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      return [];
    }
  }

  /**
   * Initialize wallet connection
   */
  async connectWallet(): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'MetaMask not installed' };
      }

      await this.switchToPolygon();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        return { success: false, error: 'No accounts found' };
      }

      return { success: true, address: accounts[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
export const nftAchievementSystem = new NFTAchievementSystem();

// React hook for NFT functionality
export function useNFTAchievements(userId?: string) {
  const [achievements, setAchievements] = React.useState<NFTAchievement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState<string>('');

  // Load user's NFT achievements
  React.useEffect(() => {
    if (!userId) return;

    const loadAchievements = async () => {
      setLoading(true);
      try {
        const userAchievements = await nftAchievementSystem.getUserNFTAchievements(userId);
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error loading NFT achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [userId]);

  const connectWallet = React.useCallback(async () => {
    const result = await nftAchievementSystem.connectWallet();
    if (result.success) {
      setWalletConnected(true);
      setWalletAddress(result.address || '');
    }
    return result;
  }, []);

  const mintAchievement = React.useCallback(async (achievement: Achievement, user: User) => {
    if (!walletConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }
    
    return await nftAchievementSystem.mintAchievement(achievement, user, walletAddress);
  }, [walletConnected, walletAddress]);

  return {
    achievements,
    loading,
    walletConnected,
    walletAddress,
    connectWallet,
    mintAchievement,
    refresh: () => {
      if (userId) {
        setLoading(true);
        // Re-run effect
      }
    }
  };
}