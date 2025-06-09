# MarketSurge Blog Generation App

A Next.js application for generating and managing blog content using OpenAI's GPT-4.

## Features

- AI-powered blog post idea generation
- Article generation with customizable prompts
- Real-time article preview
- Usage tracking and cost management
- Secure authentication with Clerk
- Firestore database integration

## Tech Stack

- Next.js 14
- TypeScript
- OpenAI GPT-4
- Firebase Admin SDK
- Clerk Authentication
- Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. Set up Firebase:
   - Create a Firebase project
   - Enable Firestore
   - Set up Application Default Credentials:
     ```bash
     gcloud auth application-default login
     gcloud config set project your-project-id
     ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Article Generation Workflow

1. **Idea Generation**
   - Enter a topic and industry
   - The system generates blog post ideas using GPT-4
   - Ideas are stored in Firestore for persistence
   - Input validation ensures required fields are filled
   - Error handling with user-friendly toast notifications

2. **Article Generation**
   - Select an idea to expand into a full article
   - The system generates a complete article using GPT-4
   - Articles are stored in Firestore with metadata (title, industry, keywords, etc.)
   - Real-time feedback during generation process

3. **Preview and Editing**
   - View the generated article in real-time
   - Toggle between rendered preview and raw HTML code
   - Make edits as needed
   - Preview changes before publishing

## Frontend Features

### Input Handling
- Form validation for required fields
- Real-time input sanitization
- Loading states during API calls
- Error handling with toast notifications
- Retry mechanism for failed API calls
- Responsive design for all screen sizes

### Error Management
- User-friendly error messages
- Detailed error logging
- Automatic retry for transient errors
- Graceful fallbacks for failed operations
- Clear feedback on API response status

## Usage Tracking

The app includes a cost management system that:
- Tracks token usage per user
- Enforces daily budget limits
- Stores usage data in Firestore
- Provides real-time usage statistics

## Security

- Authentication handled by Clerk
- Server-side API routes for secure operations
- Firebase Admin SDK for secure database access
- Environment variables for sensitive configuration

## Development

- Port: 3004
- Hot reloading enabled
- TypeScript for type safety
- ESLint for code quality

## Troubleshooting

If you encounter a "port in use" error:
```bash
pkill -f node
npm run dev
```

For Firebase issues:
1. Ensure Firestore is enabled
2. Verify Application Default Credentials are set up
3. Check Firebase security rules

## License

MIT 