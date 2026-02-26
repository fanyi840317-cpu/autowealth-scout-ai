import { DiscoveryNode, ScanResult, Opportunity, UserProfile, AutomationResult, Language, ExplorationResult } from "../types";

/**
 * Utility to call the backend API (Serverless Function)
 */
async function callBackendApi(endpoint: string, body: any): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const parseResponseJson = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`API返回非JSON (non-JSON) 响应: ${text.slice(0, 200)}`);
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const data = await parseResponseJson(response);

    if (!response.ok) {
      throw new Error(data?.error || `API请求失败 (request failed)，状态码: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时 (timeout)，请稍后重试。');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const discoverySchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          description: { type: "string" },
          isLeaf: { type: "boolean" }
        },
        required: ["id", "label", "description", "isLeaf"]
      }
    }
  },
  required: ["items"]
};

const opportunitySchema = {
  type: "object",
  properties: {
    opportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          estimatedMonthlyRevenue: { type: "string" },
          automationScore: { type: "number" },
          difficulty: { type: "string", enum: ["Low", "Medium", "High"] },
          tags: { type: "array", items: { type: "string" } },
          actionPlan: { type: "array", items: { type: "string" } },
          firstStep: { type: "string" },
          competitors: { type: "array", items: { type: "string" } },
          validationEvidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ['search_trend', 'competitor_count', 'market_size', 'other'] },
                content: { type: "string" },
                sourceUrl: { type: "string" }
              },
              required: ["type", "content"]
            }
          },
          trendingRegion: { type: "string" },
          targetPlatforms: { type: "array", items: { type: "string" } },
          monetizationStrategy: { type: "array", items: { type: "string" } },
          technicalImplementation: {
            type: "object",
            properties: {
              dataSources: { type: "array", items: { type: "string" } },
              scriptFunction: { type: "string" },
              stepByStepGuide: { type: "array", items: { type: "string" } }
            },
            required: ["dataSources", "scriptFunction", "stepByStepGuide"]
          },
          prerequisites: {
            type: "object",
            properties: {
              budget: { type: "string" },
              timeCommitment: { type: "string" },
              technicalRequirements: { type: "array", items: { type: "string" } },
              accountsNeeded: { type: "array", items: { type: "string" } }
            },
            required: ["budget", "timeCommitment", "technicalRequirements", "accountsNeeded"]
          }
        },
        required: ["title", "description", "estimatedMonthlyRevenue", "automationScore", "difficulty", "tags", "actionPlan", "firstStep", "competitors", "validationEvidence", "targetPlatforms", "monetizationStrategy", "technicalImplementation", "prerequisites"]
      }
    },
    marketOverview: { type: "string" }
  },
  required: ["opportunities", "marketOverview"]
};

const explorationSchema = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["expand", "finalize"] },
    // Only present if decision is "expand"
    children: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          description: { type: "string" },
          isLeaf: { type: "boolean" }
        },
        required: ["id", "label", "description", "isLeaf"]
      }
    },
    // Only present if decision is "finalize"
    scanResult: {
      type: "object",
      properties: {
        opportunities: {
          type: "array",
          items: {
             type: "object",
             properties: {
                title: { type: "string" },
                description: { type: "string" },
                estimatedMonthlyRevenue: { type: "string" },
                automationScore: { type: "number" },
                difficulty: { type: "string", enum: ["Low", "Medium", "High"] },
                tags: { type: "array", items: { type: "string" } },
                actionPlan: { type: "array", items: { type: "string" } },
                firstStep: { type: "string" },
                competitors: { type: "array", items: { type: "string" } },
                validationEvidence: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ['search_trend', 'competitor_count', 'market_size', 'other'] },
                      content: { type: "string" },
                      sourceUrl: { type: "string" }
                    },
                    required: ["type", "content"]
                  }
                },
                trendingRegion: { type: "string" },
                targetPlatforms: { type: "array", items: { type: "string" } },
                monetizationStrategy: { type: "array", items: { type: "string" } },
                technicalImplementation: {
                  type: "object",
                  properties: {
                    dataSources: { type: "array", items: { type: "string" } },
                    scriptFunction: { type: "string" },
                    stepByStepGuide: { type: "array", items: { type: "string" } }
                  },
                  required: ["dataSources", "scriptFunction", "stepByStepGuide"]
                },
                prerequisites: {
                    type: "object",
                    properties: {
                        budget: { type: "string" },
                        timeCommitment: { type: "string" },
                        technicalRequirements: { type: "array", items: { type: "string" } },
                        accountsNeeded: { type: "array", items: { type: "string" } }
                    },
                    required: ["budget", "timeCommitment", "technicalRequirements", "accountsNeeded"]
                }
             },
             required: ["title", "description", "estimatedMonthlyRevenue", "automationScore", "difficulty", "tags", "actionPlan", "firstStep", "competitors", "validationEvidence", "targetPlatforms", "monetizationStrategy", "technicalImplementation", "prerequisites"]
          }
        },
        marketOverview: { type: "string" }
      },
      // scanResult is optional in the schema overall, but if present, these are required
    }
  },
  required: ["decision"]
};

const automationSchema = {
  type: "object",
  properties: {
    code: { type: "string" },
    language: { type: "string" },
    instructions: { type: "string" },
    dependencies: { type: "array", items: { type: "string" } },
    setupGuide: { type: "string" },
    humanTasks: { type: "array", items: { type: "string" } },
    automationScope: { type: "string" },
    targetUser: { type: "string" },
    valueProposition: { type: "string" },
    monetizationStrategy: { type: "string" },
    deliverable: { type: "string" }
  },
  required: ["code", "language", "instructions", "dependencies", "setupGuide", "humanTasks", "automationScope", "targetUser", "valueProposition", "monetizationStrategy", "deliverable"]
};

const formatContext = (profile?: UserProfile, excludeList?: string[]) => {
  let context = "";
  if (profile) {
    context += `USER CONTEXT:
    - Availability: ${profile.timeAvailable}
    - Skills: ${profile.skills.join(", ")}
    - Budget: ${profile.budget}
    - Interests: ${profile.interests.join(", ")}
    
    IMPORTANT: Tailor all results specifically to this user profile.
    `;
  }
  if (excludeList && excludeList.length > 0) {
    context += `IMPORTANT: Do NOT include any of the following already discovered items: ${excludeList.join(", ")}. Find NEW unique ones. `;
  }
  return context;
};

export const exploreDomain = async (
  currentLabel: string, 
  pathLabels: string[],
  lang: Language, 
  profile?: UserProfile, 
  excludeList?: string[]
): Promise<ExplorationResult> => {
  const context = formatContext(profile, excludeList);
  const pathContext = pathLabels.length > 0 ? `Path: ${pathLabels.join(" > ")}` : "Path: Root";
  const langInstruction = lang === 'zh' ? "Use Simplified Chinese." : "Use English.";

  const prompt = `
  You are an expert business consultant helping a user find a profitable, automated income opportunity.
  
  CURRENT CONTEXT: "${currentLabel}"
  ${pathContext}
  ${context}
  ${langInstruction}

  YOUR TASK:
  Analyze the specificity of the "CURRENT CONTEXT" relative to the "Path".
  
  CRITICAL RULES:
  1. NO LOOPS: Do NOT suggest any topic that is already in the "Path" or semantically identical to previous steps.
  2. PROGRESSION: Each step must be SIGNIFICANTLY more specific than the previous one.
  3. AVOID TRIVIAL STEPS: Do not create unnecessary intermediate steps (e.g., "Food Blog" -> "Western Food Blog" -> "French Food Blog" is okay, but "French Food Blog" -> "French Breakfast Blog" -> "French Breakfast Blog" is INVALID).
  4. FORCE FINALIZE: If "CURRENT CONTEXT" is already a specific, actionable business idea (e.g., "Selling French Breakfast Recipe E-books"), you MUST set decision="finalize". Do not try to break it down further if it creates redundancy.

  DECISION LOGIC:
  1. If the context is BROAD (e.g., "SaaS", "Content Creation", "E-commerce") AND you can provide distinctly different sub-categories:
     - Set decision="expand".
     - Provide 5-8 distinct, high-potential sub-niches.
     - Mark 'isLeaf': true ONLY if a sub-niche is immediately actionable.
  
  2. If the context is SPECIFIC (e.g., "Scraping medical tender data", "French Breakfast Recipe Blog"):
     - Set decision="finalize".
     - Generate 3 detailed execution variations/plans for this specific idea.
     - Include ALL technical details, validation evidence, and first steps.

  OUTPUT JSON matching the schema.
  `;

  const result = await callBackendApi('/api/gemini', {
    prompt,
    schema: explorationSchema,
    tools: [{ googleSearch: {} }]
  });

  if (result.decision === 'finalize') {
    return {
      decision: 'finalize',
      scanResult: {
        opportunities: result.scanResult?.opportunities?.map((o: any, i: number) => ({ ...o, id: `opp-${Date.now()}-${i}-${Math.random()}` })) || [],
        marketOverview: result.scanResult?.marketOverview || "Analysis Complete",
        sources: []
      }
    };
  } else {
    return {
      decision: 'expand',
      nodes: result.children?.map((node: any) => ({ 
        ...node, 
        type: 'niche', 
        id: `node-${Date.now()}-${Math.random()}`,
        isLeaf: node.isLeaf 
      })) || []
    };
  }
};

export const fetchTopSectors = async (lang: Language, seed?: number, profile?: UserProfile, excludeList?: string[]): Promise<DiscoveryNode[]> => {
  // We can reuse exploreDomain for the root, or keep this simple for the initial load.
  // For consistency, let's keep this simple but add isLeaf.
  const context = formatContext(profile, excludeList);
  
  const prompt = lang === 'zh' 
    ? `根据用户画像找出 10 个最适合的顶级自动化赚钱商业领域。${context} 使用简体中文。`
    : `Identify 10 unique business sectors for automated income tailored to the user profile. ${context} Output in Simplified Chinese.`;

  const result = await callBackendApi('/api/gemini', {
    prompt,
    schema: discoverySchema,
    tools: [{ googleSearch: {} }]
  });

  const list = result.items || (Array.isArray(result) ? result : []);
  return list.map((node: any) => ({ ...node, type: 'sector', id: `node-${Date.now()}-${Math.random()}`, isLeaf: false }));
};

// Deprecated but kept for compatibility if needed, though exploreDomain replaces it
export const fetchSubNiches = async (sector: string, lang: Language, seed?: number, profile?: UserProfile, excludeList?: string[]): Promise<DiscoveryNode[]> => {
  const result = await exploreDomain(sector, [], lang, profile, excludeList);
  if (result.decision === 'expand') return result.nodes || [];
  return []; // Fallback
};

export const scanForOpportunities = async (niche: string, lang: Language, seed?: number, profile?: UserProfile, excludeList?: string[]): Promise<ScanResult> => {
   // Force finalize
   const context = formatContext(profile, excludeList);
   const langInstruction = lang === 'zh' ? "Use Simplified Chinese." : "Use English.";
   
   const prompt = `Find 3 highly validated business opportunities in: "${niche}". 
   Focus on VERIFICATION and REALITY CHECK. 
   Ensure opportunities fit the USER CONTEXT (Skills: ${profile?.skills}, Budget: ${profile?.budget}).
   
   CRITICAL: BE OPINIONATED AND PRESCRIPTIVE.
   - DO NOT say "Choose a platform" or "Select a niche".
   - INSTEAD, SAY "Register on Shopify" or "Use Amazon KDP".
   - The user wants a specific plan, not a menu of options.
   - For 'First Step', give a direct command: "Go to [URL] and sign up for X".
   - For 'Action Plan', give specific, non-generic instructions.

   For each opportunity, provide EXTREMELY DETAILED and ACTIONABLE technical specifics:
   1. A specific "First Step" to start today.
   2. Real-world competitors (names/links).
   3. Validation evidence (search trends, market gaps).
   4. Target Platforms.
   5. Monetization Strategy.
   6. Technical Implementation (CRITICAL).
   7. Prerequisites (Mandatory):
      - Budget (e.g., "$50/mo for VPS")
      - Time Commitment (e.g., "2h setup, 0h daily")
      - Technical Requirements (e.g., "Python, OpenAI API Key")
      - Accounts Needed (e.g., "Twitter Dev Account, Stripe")
   
   ${context} ${langInstruction}`;
 
   const parsed = await callBackendApi('/api/gemini', {
     prompt,
     schema: opportunitySchema,
     tools: [{ googleSearch: {} }]
   });
 
   return {
     opportunities: parsed.opportunities.map((o: any, i: number) => ({ ...o, id: `opp-${Date.now()}-${i}-${Math.random()}` })),
     marketOverview: parsed.marketOverview,
     sources: []
   };
};

export const generateAutomationCode = async (opportunity: Opportunity, lang: Language): Promise<AutomationResult> => {
  const prompt = `
  You are an expert Automation Engineer & Business Architect.
  The user wants to build a "PASSIVE INCOME ENGINE" based on: "${opportunity.title}".
  
  CORE PHILOSOPHY: **"CODE DOES THE WORK, HUMAN DOES THE AUTH"**
  - The user is ONLY willing to provide: Identity, Authentication (Cookies/API Keys), Payment Gateways, and initial server setup.
  - The CODE must handle: Discovery, Content Creation, Data Processing, Posting, Messaging, and Delivery.
  - REJECT any plan that requires daily manual labor (e.g., "Manually join groups", "Write blog posts yourself").

  YOUR TASK:
  1. Design a **Business Blueprint** where the core value delivery is AUTOMATED.
  2. Write a **Robust Script** that executes the core business logic.
  3. Define the **Human-Machine Contract**: Clearly separate "Setup (One-time)" from "Runtime (Automated)".

  OUTPUT JSON FORMAT:
  {
    "targetUser": "Who pays? (e.g. 'Busy Realtors', 'Crypto Traders')",
    "valueProposition": "Why pay? (e.g. 'Get 50 leads/day on autopilot')",
    "monetizationStrategy": "How to charge? (e.g. 'SaaS Subscription', 'Sell Data API')",
    "deliverable": "What is the product? (e.g. 'JSON Feed', 'Auto-generated Video')",
    "automationScope": "What the script does (e.g. 'Scrapes X, Filters Y, Emails Z')",
    "code": "FULL PYTHON/NODEJS SCRIPT. Must be production-ready with error handling. IF scraping, include headers/delays.",
    "language": "python" or "javascript",
    "humanTasks": [
        "One-time: Create Account on X",
        "One-time: Get API Key from Y",
        "One-time: Set up VPS/Cron Job",
        "Maintenance: Refresh Auth Cookies monthly"
    ],
    "setupGuide": "Exact commands to install dependencies (e.g. 'pip install selenium pandas').",
    "dependencies": ["List of libraries"],
    "instructions": "Step-by-step run guide."
  }
  
  ${lang === 'zh' ? "Use Simplified Chinese for all descriptions/guides. Keep code comments in English." : ""}
  `;
  
  const result = await callBackendApi('/api/gemini', {
    prompt,
    schema: automationSchema
  });

  return result;
};

// Chat needs streaming, which is complex to implement via simple serverless JSON endpoint.
// For MVP, we can make it a simple request-response or disable chat temporarily if "Free Tier" doesn't support easy streaming via Vercel functions without edge streaming.
// However, we can use the same endpoint for single turn chat.
export const createOpportunityChat = (opportunity: Opportunity, lang: Language, profile?: UserProfile) => {
  const context = formatContext(profile);
  
  const systemInstruction = lang === 'zh' 
    ? `你是一位精通"${opportunity.title}"领域的商业顾问专家。
       
       **你的任务**：
       为用户提供关于这个商业机会的深度咨询。利用以下信息作为背景，但不要一次性全部罗列，而是根据用户的问题进行针对性回答。
       
       **机会详情**：
       - 标题：${opportunity.title}
       - 描述：${opportunity.description}
       - 预估月收入：${opportunity.estimatedMonthlyRevenue}
       - 难度：${opportunity.difficulty}
       - 自动化评分：${opportunity.automationScore}
       - 市场趋势区域：${opportunity.trendingRegion}
       - 第一步行动：${opportunity.firstStep}
       - 竞争对手：${opportunity.competitors.join(', ')}
       
       **用户背景**：
       ${context}
       
       **回答风格**：
       - 专业、客观、富有洞察力。
       - 鼓励用户行动，给出具体可执行的建议。
       - 必须使用简体中文回复。
       `
    : `You are an expert business consultant specializing in "${opportunity.title}". 
       
       **Task**: Provide deep consultation.
       
       **Opportunity Details**:
       - Title: ${opportunity.title}
       - Description: ${opportunity.description}
       - Revenue: ${opportunity.estimatedMonthlyRevenue}
       - Difficulty: ${opportunity.difficulty}
       - First Step: ${opportunity.firstStep}
       
       **User Context**:
       ${context}
       
       **Style**: Professional, actionable, insightful.`;

  // Maintain conversation history in closure
  const history: { role: 'user' | 'model' | 'system', content: string }[] = [
    { role: 'system', content: systemInstruction }
  ];

  return {
    sendMessageStream: async ({ message }: { message: string }) => {
       // Add user message to history
       history.push({ role: 'user', content: message });

       // Prepare messages for API (map 'model' to 'assistant')
       const apiMessages = history.map(h => ({
         role: h.role === 'model' ? 'assistant' : h.role,
         content: h.content || " " // Ensure content is never empty/undefined
       }));

       const result = await callBackendApi('/api/gemini', {
         messages: apiMessages
       });
       
       // Handle response
       const content = typeof result === 'object' && result.content ? result.content : result;
       const text = typeof content === 'string' ? content : JSON.stringify(content);

       // Add model response to history
       history.push({ role: 'model', content: text });

       // Return an async iterable to mimic stream
       return {
         [Symbol.asyncIterator]: async function* () {
           yield { text };
         }
       };
    }
  };
};
