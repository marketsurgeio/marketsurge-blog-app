// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key';
process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-firebase-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GHL_API_KEY = 'test-ghl-key';
process.env.GHL_BLOG_ID = 'test-blog-id';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
process.env.S3_BUCKET = 'test-bucket';
process.env.DAILY_BUDGET_CAP = '8';
process.env.MARKETSURGE_LOGO_URL = 'https://example.com/logo.png';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3004';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock @clerk/nextjs
jest.mock('@clerk/nextjs', () => ({
  auth: () => Promise.resolve({ userId: 'test-user-123' }),
  currentUser: () => Promise.resolve({ id: 'test-user-123' }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
})); 