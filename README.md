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
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

   # Firebase Admin
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_PRIVATE_KEY=your_firebase_private_key

   # GoHighLevel Configuration
   GHL_API_KEY=your_ghl_api_key
   GHL_BLOG_ID=your_ghl_blog_id
   GHL_LOCATION_ID=your_ghl_location_id
   GHL_CLIENT_ID=your_ghl_client_id
   GHL_CLIENT_SECRET=your_ghl_client_secret

   # Optional Configuration
   DAILY_BUDGET_CAP=8  # Default daily budget in USD
   MARKETSURGE_LOGO_URL=https://example.com/logo.png
   GHL_API_BASE_URL=https://link.marketsurge.io
   GHL_PRIVATE_INTEGRATION_TOKEN=your_private_integration_token
   GHL_COMPANY_ID=your_company_id
   ```

   ⚠️ **IMPORTANT: Environment File Location**
   The `.env.local` file must be located at:
   ```
   /Users/reedhansen/MarketSurge Blog Generation App/.env.local
   ```

   This is a critical configuration requirement:
   - The application expects the `.env.local` file at this exact path
   - If the application is moved to a different location, this path must be updated
   - The application will check for the `.env.local` file at this location during startup
   - If the file is not found at this location, the application will fail to start

   To ensure the app can find the environment variables:
   1. The `.env.local` file must be at the specified absolute path
   2. The file must have the correct permissions (readable by the application)
   3. Restart the development server after making changes to environment variables
   4. If using production deployment, set these variables in your hosting platform's environment configuration

   Required variables for basic functionality:
   - `OPENAI_API_KEY`: Required for generating ideas and articles
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Required for authentication
   - Firebase configuration variables: Required for database operations
   - GoHighLevel configuration: Required for blog publishing functionality

   Optional variables:
   - `DAILY_BUDGET_CAP`: Sets the daily budget limit (defaults to $8)
   - `MARKETSURGE_LOGO_URL`: URL for the logo used in generated thumbnails
   - `GHL_API_BASE_URL`: Base URL for Private Integration
   - `GHL_PRIVATE_INTEGRATION_TOKEN`: Private Integration token
   - `GHL_COMPANY_ID`: Company ID for Private Integration

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

## GoHighLevel Private Integration

This application uses a Private Integration with GoHighLevel, which is different from OAuth or public integrations. Private Integrations are designed for whitelabel instances and provide direct API access without the OAuth flow.

### Private Integration Setup

1. Configure your whitelabel domain in `.env.local`:
   ```
   GHL_API_BASE_URL=https://link.marketsurge.io
   GHL_PRIVATE_INTEGRATION_TOKEN=your_private_integration_token
   GHL_LOCATION_ID=your_location_id  # e.g., KETTmZjuFLOZ0tk2lm0b
   ```

2. Required Headers for API Calls:
   - `Authorization: Bearer your_private_integration_token`
   - `Version: 2021-07-28`
   - `Accept: application/json`
   - `Content-Type: application/json`

### Private Integration vs OAuth

Private Integrations:
- Use a single Private Integration token instead of OAuth tokens
- Don't require client credentials or authorization flows
- Are specifically designed for whitelabel instances
- Provide direct API access without OAuth scopes
- Require the whitelabel domain (e.g., `link.marketsurge.io`)
- Use location-specific endpoints with the location ID

### API Endpoints

For Private Integrations, use these base endpoints with your location ID:

1. Business Endpoints:
   - Get Business: `https://link.marketsurge.io/v2/businesses/{businessId}`
   - Get Businesses by Location: `https://link.marketsurge.io/v2/businesses/location/{locationId}`

2. Blog Endpoints:
   - Blog Posts: `https://link.marketsurge.io/v2/businesses/{businessId}/blogs/{blogId}/posts`
   - Categories: `https://link.marketsurge.io/v2/businesses/{businessId}/blogs/{blogId}/categories`
   - Authors: `https://link.marketsurge.io/v2/businesses/{businessId}/blogs/{blogId}/authors`

Note: The location ID is different from the business ID. The location ID is used for location-specific endpoints, while the business ID is used for business-specific endpoints.

### Error Handling

The Private Integration implementation includes error handling for:
- Invalid tokens
- Invalid location IDs
- Invalid business IDs
- Rate limiting
- Network errors
- Whitelabel-specific errors

## GoHighLevel API Schema References

For detailed information on the structure of requests and responses, as well as error handling, refer to the official GoHighLevel API schema documentation:

- [Bad Request DTO](https://highlevel.stoplight.io/docs/integrations/b38b9a57f283a-bad-request-dto)
- [Unauthorized DTO](https://highlevel.stoplight.io/docs/integrations/b8bdeb569ff57-unauthorized-dto)
- [URL Slug Check Response DTO](https://highlevel.stoplight.io/docs/integrations/93f9ee9a0764d-url-slug-check-response-dto)
- [Unprocessable DTO](https://highlevel.stoplight.io/docs/integrations/fd9da62a5a36e-unprocessable-dto)
- [Update Blog Post Params](https://highlevel.stoplight.io/docs/integrations/93d25b42867ff-update-blog-post-params)
- [Create Blog Post Params](https://highlevel.stoplight.io/docs/integrations/f9c7136a60249-create-blog-post-params)
- [Blog Post Create Response Wrapper DTO](https://highlevel.stoplight.io/docs/integrations/e08f800afa293-blog-post-create-response-wrapper-dto)
- [Authors Response DTO](https://highlevel.stoplight.io/docs/integrations/fa17a5b36ac3a-authors-response-dto)
- [Author Response DTO](https://highlevel.stoplight.io/docs/integrations/e924f9b144e71-author-response-dto)
- [Categories Response DTO](https://highlevel.stoplight.io/docs/integrations/d5b40c34aff08-categories-response-dto)
- [Category Response DTO](https://highlevel.stoplight.io/docs/integrations/734e7252acac3-category-response-dto)
- [Blog Get Response Wrapper DTO](https://highlevel.stoplight.io/docs/integrations/df86d15e23d3b-blog-get-response-wrapper-dto)
- [Blog Response DTO](https://highlevel.stoplight.io/docs/integrations/a8ac0d0f5ed97-blog-response-dto)
- [Blog Post Get Response Wrapper DTO](https://highlevel.stoplight.io/docs/integrations/ab828b9d2bdeb-blog-post-get-response-wrapper-dto)
- [Blog Post Response DTO](https://highlevel.stoplight.io/docs/integrations/829e915cfe271-blog-post-response-dto)

These links provide up-to-date schema definitions for all major GHL blog and webhook endpoints, which are essential for integration and troubleshooting.

## GoHighLevel API Endpoints

The application integrates with the following GHL API endpoints for blog management:

### Blog Management
- **Get Blogs by Location ID**: `/v2/location/{locationId}/blogs`
  - Retrieves all blogs associated with a specific location
  - Used for initial blog setup and verification

- **Get Blog Posts by Blog ID**: `/v2/blogs/{blogId}/posts`
  - Fetches all posts for a specific blog
  - Supports pagination and filtering

### Blog Post Operations
- **Create Blog Post**: `/v2/blogs/{blogId}/posts`
  - Creates a new blog post with specified content
  - Supports HTML content, meta description, and SEO settings

- **Update Blog Post**: `/v2/blogs/{blogId}/posts/{postId}`
  - Modifies an existing blog post
  - Allows updating content, metadata, and publishing status

### Content Management
- **Get All Authors**: `/v2/blogs/{blogId}/authors`
  - Retrieves list of available authors
  - Used for post attribution

- **Get All Categories**: `/v2/blogs/{blogId}/categories`
  - Fetches available blog categories
  - Used for post categorization

### URL Management
- **Check URL Slug**: `/v2/blogs/{blogId}/posts/check-slug`
  - Verifies if a URL slug is available
  - Prevents duplicate URLs
  - Returns availability status and suggested alternatives if needed

For detailed API documentation and request/response schemas, refer to the [GoHighLevel API Documentation](https://highlevel.stoplight.io/docs/integrations).

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