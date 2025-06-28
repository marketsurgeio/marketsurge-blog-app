import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const EXPECTED_ENV_PATH = '/Users/reedhansen/MarketSurge Blog Generation App/.env.local';

export function checkEnvFile() {
  try {
    if (!fs.existsSync(EXPECTED_ENV_PATH)) {
      const error = new Error(`Environment file not found at expected path: ${EXPECTED_ENV_PATH}`);
      logger.error('Environment file check failed', { error });
      throw error;
    }

    // Check if file is readable
    try {
      fs.accessSync(EXPECTED_ENV_PATH, fs.constants.R_OK);
    } catch (error) {
      logger.error('Environment file is not readable', { error });
      throw new Error(`Environment file is not readable: ${EXPECTED_ENV_PATH}`);
    }

    // Check for required environment variables
    const requiredVars = [
      'OPENAI_API_KEY',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'GHL_API_KEY',
      'GHL_BLOG_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      logger.error('Missing environment variables', { missingVars });
      throw error;
    }

    logger.info('Environment file check passed', { path: EXPECTED_ENV_PATH });
  } catch (error) {
    logger.error('Environment check failed', { error });
    throw error;
  }
} 