// In-memory storage for demo purposes
// In production, this should be replaced with a proper database
const userUsage = new Map<string, { count: number; lastReset: Date }>();

const DAILY_LIMIT = 5; // Maximum articles per day
const RESET_HOURS = 24; // Reset usage after 24 hours

export async function checkUsageLimit(userId: string) {
  const now = new Date();
  const userData = userUsage.get(userId);

  // If no usage data exists or it's been more than 24 hours, reset
  if (!userData || (now.getTime() - userData.lastReset.getTime()) > RESET_HOURS * 60 * 60 * 1000) {
    userUsage.set(userId, { count: 0, lastReset: now });
    return { canGenerate: true, remainingBudget: DAILY_LIMIT };
  }

  // Check if user has exceeded daily limit
  if (userData.count >= DAILY_LIMIT) {
    return { canGenerate: false, remainingBudget: 0 };
  }

  // Increment usage count
  userData.count++;
  userUsage.set(userId, userData);

  return { canGenerate: true, remainingBudget: DAILY_LIMIT - userData.count };
} 