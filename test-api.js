
async function testApi() {
  console.log('Testing Actionable Opportunities Generation...');
  
  const opportunitySchema = {
    type: "OBJECT",
    properties: {
      opportunities: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            description: { type: "STRING" },
            estimatedMonthlyRevenue: { type: "STRING" },
            automationScore: { type: "NUMBER" },
            difficulty: { type: "STRING", enum: ["Low", "Medium", "High"] },
            tags: { type: "ARRAY", items: { type: "STRING" } },
            actionPlan: { type: "ARRAY", items: { type: "STRING" } },
            firstStep: { type: "STRING" },
            competitors: { type: "ARRAY", items: { type: "STRING" } },
            validationEvidence: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  type: { type: "STRING", enum: ['search_trend', 'competitor_count', 'market_size', 'other'] },
                  content: { type: "STRING" },
                  sourceUrl: { type: "STRING" }
                },
                required: ["type", "content"]
              }
            },
            trendingRegion: { type: "STRING" },
            targetPlatforms: { type: "ARRAY", items: { type: "STRING" } },
            monetizationStrategy: { type: "ARRAY", items: { type: "STRING" } },
            technicalImplementation: {
              type: "OBJECT",
              properties: {
                dataSources: { type: "ARRAY", items: { type: "STRING" } },
                scriptFunction: { type: "STRING" },
                stepByStepGuide: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["dataSources", "scriptFunction", "stepByStepGuide"]
            }
          },
          required: ["title", "description", "estimatedMonthlyRevenue", "automationScore", "difficulty", "tags", "actionPlan", "firstStep", "competitors", "validationEvidence", "targetPlatforms", "monetizationStrategy", "technicalImplementation"]
        }
      },
      marketOverview: { type: "STRING" }
    },
    required: ["opportunities", "marketOverview"]
  };

  const payload = {
    prompt: `Find 1 highly validated business opportunities in: "AI Automation". 
          Focus on VERIFICATION and REALITY CHECK. 
          For each opportunity, provide EXTREMELY DETAILED and ACTIONABLE technical specifics:
          1. A specific "First Step" to start today.
          2. Real-world competitors (names/links).
          3. Validation evidence (search trends, market gaps).
          4. Target Platforms: Where exactly to find customers or data (e.g., specific Upwork categories, subreddits, marketplaces).
          5. Monetization Strategy: Clear path to revenue (e.g., "Sell as Micro-SaaS", "Data API subscription", "Affiliate blog").
          6. Technical Implementation (CRITICAL):
             - Data Sources: Specific URLs or APIs to scrape/analyze (e.g., "Twitter V2 API", "Zillow.com listings", "Google Trends CSV").
             - Script Function: What exactly the automation script should do.
             - Step-by-Step Guide: Technical steps (e.g., "1. Use Python requests to fetch HTML", "2. Parse with BeautifulSoup", "3. Store in SQLite").
    `,
    schema: opportunitySchema
  };

  const ports = [3001, 3000];
  
  for (const port of ports) {
    try {
      console.log(`Trying port ${port}...`);
      const response = await fetch(`http://localhost:${port}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`API Error on port ${port}: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error('Response body:', text);
        continue;
      }

      const data = await response.json();
      console.log('API Success!');
      
      const opp = data.opportunities[0];
      if (opp) {
        console.log('Opportunity Title:', opp.title);
        console.log('Technical Implementation:', JSON.stringify(opp.technicalImplementation, null, 2));
        console.log('Target Platforms:', opp.targetPlatforms);
        console.log('Monetization Strategy:', opp.monetizationStrategy);
        
        if (opp.technicalImplementation && opp.targetPlatforms && opp.monetizationStrategy) {
            console.log("✅ SUCCESS: All actionable fields are present.");
        } else {
            console.log("❌ FAILURE: Missing actionable fields.");
        }
      } else {
          console.log("❌ FAILURE: No opportunities returned.");
      }
      
      return; // Success, exit
      
    } catch (error) {
      console.error(`Connection failed on port ${port}:`, error.message);
    }
  }
}

testApi();
