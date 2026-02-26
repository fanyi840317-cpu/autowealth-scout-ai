import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import Groq from 'groq-sdk';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'configure-server',
          configureServer(server) {
            server.middlewares.use('/api/gemini', async (req, res, next) => {
               if (req.method !== 'POST') {
                   res.statusCode = 405;
                   res.end('Method Not Allowed');
                   return;
               }

               const chunks = [];
               req.on('data', chunk => chunks.push(chunk));
               req.on('end', async () => {
                   try {
                       const body = JSON.parse(Buffer.concat(chunks).toString());
                       const apiKey = env.GROQ_API_KEY;
                       
                       if (!apiKey) {
                           res.statusCode = 500;
                           res.setHeader('Content-Type', 'application/json');
                           res.end(JSON.stringify({ error: 'Server configuration error: API Key missing in .env' }));
                           return;
                       }

                       const groq = new Groq({ apiKey });
                       const { prompt, schema, systemInstruction, messages: providedMessages } = body;
                       
                       let messages: any[] = [];
                       
                       if (providedMessages && Array.isArray(providedMessages)) {
                           messages = providedMessages;
                           // If schema is present, inject it into system message
                           if (schema) {
                               const schemaInstr = "\n\nYou must respond with a valid JSON object adhering strictly to this schema:\n" + JSON.stringify(schema, null, 2);
                               const sysIndex = messages.findIndex((m: any) => m.role === 'system');
                               if (sysIndex >= 0) {
                                   messages[sysIndex].content += schemaInstr;
                               } else {
                                   messages.unshift({ role: 'system', content: "You are a helpful assistant." + schemaInstr });
                               }
                           }
                       } else {
                           // Construct system message with schema instruction if present
                           let systemContent = systemInstruction || "You are a helpful assistant.";
                           if (schema) {
                               systemContent += "\n\nYou must respond with a valid JSON object adhering strictly to this schema:\n" + JSON.stringify(schema, null, 2);
                           }
                           messages.push({ role: 'system', content: systemContent });
                           
                           // Add user prompt
                           messages.push({ role: 'user', content: prompt || " " });
                       }

                       const timeoutMs = 45000;
                       let timeoutId: ReturnType<typeof setTimeout> | undefined;
                       const completion = await Promise.race([
                            groq.chat.completions.create({
                                messages: messages,
                                model: "llama-3.3-70b-versatile",
                                response_format: schema ? { type: "json_object" } : undefined,
                                temperature: 0.7,
                            }),
                            new Promise((_, reject) => {
                                timeoutId = setTimeout(() => reject(new Error('上游请求超时 (timeout)')), timeoutMs);
                            })
                        ]) as any;
                       if (timeoutId) clearTimeout(timeoutId);

                       let text = completion.choices[0]?.message?.content || "";
                       
                       if (schema) {
                           // Clean Markdown code blocks and extract JSON only if schema is expected
                           const jsonMatch = text.match(/\{[\s\S]*\}/);
                           if (jsonMatch) {
                               text = jsonMatch[0];
                           } else {
                               text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
                           }
                       } else {
                           // For chat/text response, just wrap in JSON object
                           text = JSON.stringify({ content: text });
                       }

                       console.log("Groq Response:", text.substring(0, 200) + "..."); // Log for debugging

                       res.statusCode = 200;
                       res.setHeader('Content-Type', 'application/json');
                       res.end(text);
                   } catch (error: any) {
                       console.error("API Proxy Error:", error);
                       res.statusCode = 500;
                       res.setHeader('Content-Type', 'application/json');
                       res.end(JSON.stringify({ error: error.message || "Internal Server Error" }));
                   }
               });
            });
          }
        }
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
