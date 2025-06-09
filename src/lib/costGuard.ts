import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  private usageCollection = collection(db, 'openai_usage');

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
    const usageRef = doc(this.usageCollection, `${userId}_${today}`);
    
    try {
      const usageDoc = await getDoc(usageRef);
      const currentUsage = usageDoc.exists() ? usageDoc.data() as UsageRecord : {
        userId,
        date: today,
        tokensUsed: 0,
        cost: 0
      };

      const estimatedCost = (estimatedTokens / 1000) * TOKEN_COST_PER_1K;
      const totalCost = currentUsage.cost + estimatedCost;

      if (totalCost > DAILY_BUDGET_CAP) {
        return false;
      }

      // Update usage
      await setDoc(usageRef, {
        ...currentUsage,
        tokensUsed: increment(estimatedTokens),
        cost: increment(estimatedCost)
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      throw new Error('Failed to check usage limit');
    }
  }

  async getCurrentUsage(userId: string): Promise<UsageRecord> {
    const today = this.getTodayKey();
    const usageRef = doc(this.usageCollection, `${userId}_${today}`);
    
    try {
      const usageDoc = await getDoc(usageRef);
      if (!usageDoc.exists()) {
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