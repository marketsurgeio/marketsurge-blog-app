// In-memory storage for demo purposes
// In production, this should be replaced with a proper database
const promptTemplates = new Map<string, string>([
  ['tech', `Write a comprehensive article about {title} in the technology industry. 
    The article should be informative, engaging, and provide valuable insights for readers.
    Include relevant examples, statistics, and expert opinions where appropriate.
    Structure the article with clear headings and subheadings.
    Aim for a professional yet accessible tone.`],
  ['finance', `Write a detailed article about {title} in the financial industry.
    The article should provide valuable insights and analysis for readers.
    Include relevant market data, trends, and expert perspectives.
    Structure the article with clear headings and subheadings.
    Maintain a professional and authoritative tone.`],
  ['marketing', `Write an engaging article about {title} in the marketing industry.
    The article should provide practical insights and strategies for readers.
    Include relevant case studies, best practices, and expert tips.
    Structure the article with clear headings and subheadings.
    Use a conversational yet professional tone.`]
]);

export async function getPromptTemplate(industry: string): Promise<string | null> {
  return promptTemplates.get(industry.toLowerCase()) || null;
} 