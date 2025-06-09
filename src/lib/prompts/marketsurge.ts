export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'blog' | 'social' | 'email' | 'general';
}

export const MARKET_SURGE_PROMPTS: PromptTemplate[] = [
  {
    id: 'blog-ideas',
    name: 'Blog Post Ideas Generator',
    description: 'Generates sophisticated blog post ideas for MarketSurge.io',
    template: `You are an expert academic writer and industry thought leader specializing in {industry}. 
    Generate 3 sophisticated and intellectually stimulating blog post titles about {topic}.
    Each title should:
    - Be compelling and attention-grabbing
    - Demonstrate deep industry expertise
    - Appeal to an educated, professional audience
    - Be clear and concise
    - Hint at valuable insights without giving everything away
    
    Focus on titles that would engage MarketSurge.io's audience of sophisticated business leaders and industry professionals.
    Return ONLY the titles, one per line, without any descriptions or additional text.`,
    variables: ['industry', 'topic'],
    category: 'blog'
  },
  {
    id: 'blog-article',
    name: 'Blog Post Generator',
    description: 'Generates a full blog post for MarketSurge.io',
    template: `You are a professional blog writer specializing in {industry}.
    Write a comprehensive, well-structured blog post about "{title}".
    Include the following keywords naturally in the content: {keywords}.
    {youtubeUrl ? 'Incorporate insights from this YouTube video: ' + youtubeUrl : ''}
    The article should be engaging, informative, and provide value to MarketSurge.io's audience.
    Use proper HTML formatting for headings, paragraphs, and lists.
    
    Focus on practical advice and actionable insights that business owners can implement.
    Maintain a professional yet conversational tone.
    Include relevant examples and case studies where appropriate.`,
    variables: ['industry', 'title', 'keywords', 'youtubeUrl'],
    category: 'blog'
  },
  {
    id: 'social-post',
    name: 'Social Media Post Generator',
    description: 'Generates social media posts for MarketSurge.io',
    template: `Create an engaging social media post about {topic} for MarketSurge.io.
    The post should be informative, engaging, and encourage interaction.
    Include relevant hashtags and a call to action.
    Keep the tone professional yet conversational.
    Focus on providing value to business owners and marketers.`,
    variables: ['topic'],
    category: 'social'
  },
  {
    id: 'email-newsletter',
    name: 'Email Newsletter Generator',
    description: 'Generates email newsletter content for MarketSurge.io',
    template: `Create an engaging email newsletter about {topic} for MarketSurge.io subscribers.
    The newsletter should include:
    - A compelling subject line
    - An engaging introduction
    - Main content with valuable insights
    - A clear call to action
    - Professional sign-off
    
    Focus on providing actionable advice that business owners can implement.
    Keep the tone professional yet conversational.
    Include relevant statistics or examples where appropriate.`,
    variables: ['topic'],
    category: 'email'
  }
];

export function formatPrompt(template: string, variables: Record<string, string | undefined>): string {
  let formattedPrompt = template;
  for (const [key, value] of Object.entries(variables)) {
    if (value === undefined) {
      formattedPrompt = formattedPrompt.replace(new RegExp(`.*{${key}}.*\\n?`, 'g'), '');
    } else {
      formattedPrompt = formattedPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
    }
  }
  return formattedPrompt;
}

export function getPromptById(id: string): PromptTemplate | undefined {
  return MARKET_SURGE_PROMPTS.find(prompt => prompt.id === id);
}

export function getPromptsByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return MARKET_SURGE_PROMPTS.filter(prompt => prompt.category === category);
} 