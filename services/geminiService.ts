import { GoogleGenAI, Type, Schema, Chat, GenerateContentParameters } from "@google/genai";
import { ScanResult, Opportunity, Difficulty, Language, AutomationResult, DiscoveryNode } from "../types";

// Models optimized for task type
const DISCOVERY_MODEL = "gemini-3-flash-preview"; 
const ANALYSIS_MODEL = "gemini-3-pro-preview";   

/**
 * Utility to handle retries for transient API errors
 */
async function callWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || (error?.message?.includes('429') ? 429 : 500);
      if (status === 429 || status === 503) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const discoverySchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      label: { type: Type.STRING },
      description: { type: Type.STRING }
    },
    required: ["id", "label", "description"]
  }
};

const opportunitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          estimatedMonthlyRevenue: { type: Type.STRING },
          automationScore: { type: Type.NUMBER },
          difficulty: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
          trendingRegion: { type: Type.STRING }
        },
        required: ["title", "description", "estimatedMonthlyRevenue", "automationScore", "difficulty", "tags", "actionPlan"]
      }
    },
    marketOverview: { type: Type.STRING }
  },
  required: ["opportunities", "marketOverview"]
};

const automationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    code: { type: Type.STRING },
    language: { type: Type.STRING },
    instructions: { type: Type.STRING },
    dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["code", "language", "instructions", "dependencies"]
};

const formatContext = (filters?: string[], excludeList?: string[]) => {
  let context = "";
  if (filters && filters.length > 0) {
    context += `CONSTRAINTS: Targeted for ${filters.join(", ")}. `;
  }
  if (excludeList && excludeList.length > 0) {
    context += `IMPORTANT: Do NOT include any of the following already discovered items: ${excludeList.join(", ")}. Find NEW unique ones. `;
  }
  return context;
};

export const fetchTopSectors = async (lang: Language, seed?: number, filters?: string[], excludeList?: string[]): Promise<DiscoveryNode[]> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = formatContext(filters, excludeList);
    
    const prompt = lang === 'zh' 
      ? `找出 10 个顶级自动化赚钱商业领域。${context} 使用简体中文。`
      : `Identify 10 unique business sectors for automated income. ${context} Output in Simplified Chinese.`;

    const response = await ai.models.generateContent({
      model: DISCOVERY_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: discoverySchema,
        seed: seed ?? Math.floor(Math.random() * 1000),
      },
    });

    return (JSON.parse(response.text)).map((node: any) => ({ ...node, type: 'sector', id: `node-${Date.now()}-${Math.random()}` }));
  });
};

export const fetchSubNiches = async (sector: string, lang: Language, seed?: number, filters?: string[], excludeList?: string[]): Promise<DiscoveryNode[]> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = formatContext(filters, excludeList);

    const prompt = lang === 'zh'
      ? `在"${sector}"领域内，找出 10 个蓝海细分领域。${context} 使用简体中文。`
      : `Within "${sector}", identify 10 low-competition sub-niches. ${context}`;

    const response = await ai.models.generateContent({
      model: DISCOVERY_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: discoverySchema,
        seed: seed ?? Math.floor(Math.random() * 1000),
      },
    });

    return (JSON.parse(response.text)).map((node: any) => ({ ...node, type: 'niche', id: `node-${Date.now()}-${Math.random()}` }));
  });
};

export const scanForOpportunities = async (niche: string, lang: Language, seed?: number, filters?: string[], excludeList?: string[]): Promise<ScanResult> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = formatContext(filters, excludeList);
    const langInstruction = lang === 'zh' ? "Use Simplified Chinese." : "Use English.";
    
    const prompt = `Find 10 concrete business opportunities in: "${niche}". ${context} ${langInstruction}`;

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: opportunitySchema,
        seed: seed ?? Math.floor(Math.random() * 1000),
      },
    });

    const parsed = JSON.parse(response.text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web).filter((w: any) => w)
      .map((w: any) => ({ title: w.title, uri: w.uri })) || [];

    return {
      opportunities: parsed.opportunities.map((o: any, i: number) => ({ ...o, id: `opp-${Date.now()}-${i}-${Math.random()}` })),
      marketOverview: parsed.marketOverview,
      sources
    };
  });
};

export const generateAutomationCode = async (opportunity: Opportunity, lang: Language): Promise<AutomationResult> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Write a complete automation script for: ${opportunity.title}. ${lang === 'zh' ? "Chinese instructions." : ""}`;
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: automationSchema },
    });
    return JSON.parse(response.text);
  });
};

export const createOpportunityChat = (opportunity: Opportunity, lang: Language): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = lang === 'zh' 
    ? `你是一位商业顾问，正在讨论"${opportunity.title}"这个机会。请使用简体中文回复。`
    : `You are a consultant for "${opportunity.title}".`;
  return ai.chats.create({ model: ANALYSIS_MODEL, config: { systemInstruction } });
};