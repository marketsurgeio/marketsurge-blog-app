import { costGuard } from '../costGuard';
import { getFirestore } from 'firebase-admin/firestore';

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn(),
}));

// Define mocks before jest.mock
const mockDoc = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockCollection = {
  doc: jest.fn(() => mockDoc),
};

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
  })),
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

    mockDoc.get.mockResolvedValue({
      exists: true,
      data: () => mockUsage,
    });

    mockDoc.set.mockResolvedValue(undefined);

    const result = await costGuard.checkUsageLimit(mockUserId, 1000);
    expect(result).toBe(true);
  }, 10000);

  it('should deny usage when over daily limit', async () => {
    // Mock existing usage near the limit
    const mockUsage = {
      userId: mockUserId,
      date: mockDate,
      tokensUsed: 700000, // ~$7 worth of tokens
      cost: 7,
    };

    mockDoc.get.mockResolvedValue({
      exists: true,
      data: () => mockUsage,
    });

    mockDoc.set.mockResolvedValue(undefined);

    const result = await costGuard.checkUsageLimit(mockUserId, 200000); // Would add ~$2
    expect(result).toBe(false);
  }, 10000);

  it('should create new usage record for first request of the day', async () => {
    mockDoc.get.mockResolvedValue({
      exists: false,
      data: () => null,
    });

    mockDoc.set.mockResolvedValue(undefined);

    const result = await costGuard.checkUsageLimit(mockUserId, 1000);
    expect(result).toBe(true);
    expect(mockDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        date: mockDate,
        tokensUsed: 1000,
        cost: expect.any(Number),
      }),
      { merge: true }
    );
  }, 10000);

  it('should get current usage correctly', async () => {
    const mockUsage = {
      userId: mockUserId,
      date: mockDate,
      tokensUsed: 1000,
      cost: 0.01,
    };

    mockDoc.get.mockResolvedValue({
      exists: true,
      data: () => mockUsage,
    });

    const usage = await costGuard.getCurrentUsage(mockUserId);
    expect(usage).toEqual(mockUsage);
  }, 10000);

  it('should return zero usage for new users', async () => {
    mockDoc.get.mockResolvedValue({
      exists: false,
      data: () => null,
    });

    const usage = await costGuard.getCurrentUsage(mockUserId);
    expect(usage).toEqual({
      userId: mockUserId,
      date: mockDate,
      tokensUsed: 0,
      cost: 0,
    });
  }, 10000);
}); 