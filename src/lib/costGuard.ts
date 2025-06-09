import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, increment } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface UsageRecord {
  userId: string;
  date: string;
  tokens: number;
  cost: number;
}

const DAILY_BUDGET_CAP = Number(process.env.DAILY_BUDGET_CAP) || 8; // Default to $8 if not set
const COST_PER_1K_TOKENS = 0.03; // GPT-4 cost per 1K tokens

export async function checkAndUpdateUsage(
  userId: string,
  tokenCount: number
): Promise<{ allowed: boolean; remainingBudget: number }> {
  const today = new Date().toISOString().split('T')[0];
  const usageRef = doc(db, 'openai_usage', `${userId}_${today}`);
  
  try {
    const usageDoc = await getDoc(usageRef);
    let currentUsage: UsageRecord;

    if (usageDoc.exists()) {
      currentUsage = usageDoc.data() as UsageRecord;
    } else {
      currentUsage = {
        userId,
        date: today,
        tokens: 0,
        cost: 0,
      };
    }

    const newCost = (tokenCount / 1000) * COST_PER_1K_TOKENS;
    const totalCost = currentUsage.cost + newCost;
    const remainingBudget = DAILY_BUDGET_CAP - totalCost;

    if (totalCost > DAILY_BUDGET_CAP) {
      return {
        allowed: false,
        remainingBudget: 0,
      };
    }

    // Update usage
    await setDoc(usageRef, {
      ...currentUsage,
      tokens: increment(tokenCount),
      cost: increment(newCost),
    }, { merge: true });

    return {
      allowed: true,
      remainingBudget,
    };
  } catch (error) {
    console.error('Error checking usage:', error);
    // In case of error, allow the request but log the error
    return {
      allowed: true,
      remainingBudget: DAILY_BUDGET_CAP,
    };
  }
}

export async function getDailyUsage(userId: string): Promise<UsageRecord | null> {
  const today = new Date().toISOString().split('T')[0];
  const usageRef = doc(db, 'openai_usage', `${userId}_${today}`);
  
  try {
    const usageDoc = await getDoc(usageRef);
    return usageDoc.exists() ? (usageDoc.data() as UsageRecord) : null;
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return null;
  }
} 