import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Application Default Credentials
if (!getApps().length) {
  try {
    initializeApp();
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

const db = getFirestore();

const DAILY_BUDGET_CAP = Number(process.env.DAILY_BUDGET_CAP) || 8; // Default to $8 if not set
const TOKEN_COST_PER_1K = 0.01; // GPT-4 cost per 1K tokens

interface UsageRecord {
  userId: string;
  date: string;
  tokensUsed: number;
  cost: number;
}

export class CostGuard {
  private static instance: CostGuard;
  private usageCollection = db.collection('openai_usage');

  private constructor() {}

  static getInstance(): CostGuard {
    if (!CostGuard.instance) {
      CostGuard.instance = new CostGuard();
    }
    return CostGuard.instance;
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  async checkUsageLimit(userId: string, estimatedTokens: number): Promise<boolean> {
    const today = this.getTodayKey();
    const usageRef = this.usageCollection.doc(`${userId}_${today}`);
    
    try {
      console.log('Checking usage limit for:', { userId, today, estimatedTokens });
      const usageDoc = await usageRef.get();
      console.log('Usage document exists:', usageDoc.exists);
      
      const currentUsage = usageDoc.exists ? usageDoc.data() as UsageRecord : {
        userId,
        date: today,
        tokensUsed: 0,
        cost: 0
      };
      console.log('Current usage:', currentUsage);

      const estimatedCost = (estimatedTokens / 1000) * TOKEN_COST_PER_1K;
      const totalCost = currentUsage.cost + estimatedCost;
      console.log('Cost calculation:', { estimatedCost, totalCost, DAILY_BUDGET_CAP });

      if (totalCost > DAILY_BUDGET_CAP) {
        console.log('Usage limit exceeded');
        return false;
      }

      // Update usage
      await usageRef.set({
        ...currentUsage,
        tokensUsed: currentUsage.tokensUsed + estimatedTokens,
        cost: currentUsage.cost + estimatedCost
      }, { merge: true });
      console.log('Usage updated successfully');

      return true;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to check usage limit: ${error.message}`);
    }
  }

  async getCurrentUsage(userId: string): Promise<UsageRecord> {
    const today = this.getTodayKey();
    const usageRef = this.usageCollection.doc(`${userId}_${today}`);
    
    try {
      const usageDoc = await usageRef.get();
      if (!usageDoc.exists) {
        return {
          userId,
          date: today,
          tokensUsed: 0,
          cost: 0
        };
      }
      return usageDoc.data() as UsageRecord;
    } catch (error) {
      console.error('Error getting current usage:', error);
      throw new Error('Failed to get current usage');
    }
  }
}

export const costGuard = CostGuard.getInstance(); 