# MarketSurge Blog Generation App

A Next.js application for generating blog content using OpenAI's GPT-4.

## Features

- Generate blog post ideas based on topic and industry
- Create full blog posts with HTML formatting
- Toggle between rendered preview and raw HTML code
- Regenerate content with a single click
- YouTube video integration
- SEO-optimized content generation

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3004](http://localhost:3004) in your browser

## Usage

1. Enter a topic and industry in the form
2. Click "Generate Ideas" to get three blog title suggestions
3. Click on a title to generate the full blog post
4. Use the "Preview" and "Raw HTML" buttons to toggle between:
   - Rendered preview: See how the blog post will look
   - Raw HTML: View and copy the HTML code
5. Use "Regenerate" to create a new version of the post
6. Click "Publish" when ready (coming soon)

## HTML Preview Features

The blog post preview includes:
- Toggle between rendered preview and raw HTML code
- Syntax-highlighted HTML display
- Responsive design
- Easy copy functionality for the HTML code
- Real-time preview of the rendered content

## Article Length Control

The app implements a robust system to ensure consistent article lengths of 2,000 ± 5% words:

1. **Token Calculation**
   - Uses a precise token-to-word ratio (1.33 tokens per word)
   - Includes buffer space for HTML tags and formatting
   - Automatically calculates required tokens (≈2,815 for 2,000 words)

2. **Length Verification**
   - Model appends a word count to each generation
   - System verifies length is within target range (1,900-2,100 words)
   - Automatically continues generation if too short

3. **Quality Controls**
   - Temperature: 0.7 for consistent but creative output
   - Top-p: 0.9 to maintain coherence
   - Maintains conversation context between continuations

4. **Structure**
   - Introduction (300-400 words)
   - Main content (1,200-1,400 words)
   - Case studies (300-400 words)
   - Conclusion (200-300 words)
   - FAQ section included

## Technologies Used

- Next.js 14
- React
- OpenAI GPT-4
- Tailwind CSS
- TypeScript 