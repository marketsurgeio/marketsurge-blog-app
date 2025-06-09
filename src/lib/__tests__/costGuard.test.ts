import { costGuard } from '../costGuard';
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore';

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn((value) => value),
}));

describe('CostGuard', () => {
  const mockUserId = 'test-user-123';
  const mockDate = '2024-03-14';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getTodayKey to return a consistent date
    jest.spyOn(costGuard as any, 'getTodayKey').mockReturnValue(mockDate);
  });

  it('should allow usage within daily limit', async () => {
    // Mock existing usage
    const mockUsage = {
      userId: mockUserId,
      date: mockDate,
      tokensUsed: 1000,
      cost: 0.01,
    };

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockUsage,
    });

    const result = await costGuard.checkUsageLimit(mockUserId, 1000);
    expect(result).toBe(true);
  });

  it('should deny usage when over daily limit', async () => {
    // Mock existing usage near the limit
    const mockUsage = {
      userId: mockUserId,
      date: mockDate,
      tokensUsed: 700000, // ~$7 worth of tokens
      cost: 7,
    };

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockUsage,
    });

    const result = await costGuard.checkUsageLimit(mockUserId, 200000); // Would add ~$2
    expect(result).toBe(false);
  });

  it('should create new usage record for first request of the day', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    const result = await costGuard.checkUsageLimit(mockUserId, 1000);
    expect(result).toBe(true);
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: mockUserId,
        date: mockDate,
        tokensUsed: 1000,
        cost: expect.any(Number),
      }),
      { merge: true }
    );
  });

  it('should get current usage correctly', async () => {
    const mockUsage = {
      userId: mockUserId,
      date: mockDate,
      tokensUsed: 1000,
      cost: 0.01,
    };

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockUsage,
    });

    const usage = await costGuard.getCurrentUsage(mockUserId);
    expect(usage).toEqual(mockUsage);
  });

  it('should return zero usage for new users', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    const usage = await costGuard.getCurrentUsage(mockUserId);
    expect(usage).toEqual({
      userId: mockUserId,
      date: mockDate,
      tokensUsed: 0,
      cost: 0,
    });
  });
}); 