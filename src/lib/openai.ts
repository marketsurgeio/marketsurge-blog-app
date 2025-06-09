import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Helper function for exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle retries
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      // If it's not a rate limit error, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

interface IdeaResponse {
  titles: string[];
}

export async function getIdeas(topic: string, industry: string): Promise<IdeaResponse> {
  return withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are an elite SaaS content strategist for marketing agencies."
        },
        {
          role: "user",
          content: `Give me exactly three catchy, keyword-rich blog titles about "${topic}" for the ${industry} industry. Titles ≤ 60 characters, active voice, include at least one high-intent keyword. Return JSON array.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{"titles": []}');
    return response as IdeaResponse;
  });
}

interface ArticleResponse {
  html: string;
}

export async function getArticle(title: string, keywords: string[]): Promise<ArticleResponse> {
  return withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a senior copywriter."
        },
        {
          role: "user",
          content: `Write a 2,000-word HTML blog post titled "${title}" aimed at marketing agencies. Use H2/H3s, bullet lists, and include the following CTA block near the end:

<section class="cta">
  <p>Ready to grow faster?</p>
  <a class="ms-cta" href="https://marketsurge.io/KEY">
     See how MarketSurge helps →
  </a>
</section>

Naturally weave in these keywords: ${keywords.join(', ')}. Wrap code samples in <pre><code>. End with FAQ section.`
        }
      ]
    });

    return {
      html: completion.choices[0].message.content || ''
    };
  });
} 