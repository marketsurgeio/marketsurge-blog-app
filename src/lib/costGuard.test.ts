import { checkAndUpdateUsage, getDailyUsage } from './costGuard';
import { getDoc, setDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn((value) => value),
}));

describe('Cost Guard', () => {
  const mockUserId = 'test-user';
  const mockDate = '2024-03-14';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.toISOString to return a consistent date
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${mockDate}T00:00:00.000Z`);
  });

  describe('checkAndUpdateUsage', () => {
    it('should allow usage when under budget', async () => {
      const mockUsage = {
        userId: mockUserId,
        date: mockDate,
        tokens: 1000,
        cost: 0.03,
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockUsage,
      });

      const result = await checkAndUpdateUsage(mockUserId, 1000);

      expect(result.allowed).toBe(true);
      expect(result.remainingBudget).toBeGreaterThan(0);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should create new usage record if none exists', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      const result = await checkAndUpdateUsage(mockUserId, 1000);

      expect(result.allowed).toBe(true);
      expect(result.remainingBudget).toBeGreaterThan(0);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should deny usage when over budget', async () => {
      const mockUsage = {
        userId: mockUserId,
        date: mockDate,
        tokens: 1000000,
        cost: 29.99, // Almost at the $8 limit
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockUsage,
      });

      const result = await checkAndUpdateUsage(mockUserId, 1000);

      expect(result.allowed).toBe(false);
      expect(result.remainingBudget).toBe(0);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      const result = await checkAndUpdateUsage(mockUserId, 1000);

      expect(result.allowed).toBe(true);
      expect(result.remainingBudget).toBe(8); // Default budget
    });
  });

  describe('getDailyUsage', () => {
    it('should return usage record if exists', async () => {
      const mockUsage = {
        userId: mockUserId,
        date: mockDate,
        tokens: 1000,
        cost: 0.03,
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockUsage,
      });

      const result = await getDailyUsage(mockUserId);

      expect(result).toEqual(mockUsage);
    });

    it('should return null if no usage record exists', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      const result = await getDailyUsage(mockUserId);

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      const result = await getDailyUsage(mockUserId);

      expect(result).toBeNull();
    });
  });
}); 