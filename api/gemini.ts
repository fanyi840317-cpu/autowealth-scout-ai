import Groq from "groq-sdk";

export const config = {
  runtime: 'edge',
};

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: apiKey || '' });

const MODEL_NAME = "llama-3.3-70b-versatile"; 

export default async function handler(req: Request) {
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error: API Key missing" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { prompt, schema, systemInstruction, messages: providedMessages } = body;

    let messages: any[] = [];
    
    // 1. If 'messages' array is provided (Chat Mode with History), use it directly
    if (providedMessages && Array.isArray(providedMessages)) {
        messages = providedMessages;
        
        // Inject system instruction if provided separately, or ensure the first message is system
        if (systemInstruction) {
             const sysIndex = messages.findIndex(m => m.role === 'system');
             if (sysIndex >= 0) {
                 // Prepend or Append? Usually system instruction is static. 
                 // If we want to override, we replace. If we want to add, we append.
                 // Let's assume the client constructs the full history correctly, 
                 // but if systemInstruction is sent, it's meant to be the system prompt.
                 messages[sysIndex].content = systemInstruction;
             } else {
                 messages.unshift({ role: 'system', content: systemInstruction });
             }
        }

        // If schema is present, enforce it via system prompt injection
        if (schema) {
            const schemaInstr = "\n\nYou must respond with a valid JSON object adhering strictly to this schema:\n" + JSON.stringify(schema, null, 2);
            const sysIndex = messages.findIndex(m => m.role === 'system');
            if (sysIndex >= 0) {
                messages[sysIndex].content += schemaInstr;
            } else {
                messages.unshift({ role: 'system', content: "You are a helpful assistant." + schemaInstr });
            }
        }

    } else {
        // 2. Legacy Mode: Construct from prompt + systemInstruction
        let systemContent = systemInstruction || "You are a helpful assistant.";
        if (schema) {
            systemContent += "\n\nYou must respond with a valid JSON object adhering strictly to this schema:\n" + JSON.stringify(schema, null, 2);
        }
        messages.push({ role: 'system', content: systemContent });
        messages.push({ role: 'user', content: prompt });
    }

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: MODEL_NAME,
      response_format: schema ? { type: "json_object" } : undefined,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || "";

    // If schema is provided, we expect valid JSON. If not (chat), we wrap the text in JSON.
    const responseBody = schema ? text : JSON.stringify({ content: text });

    return new Response(responseBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
