import { GoogleGenerativeAI } from "@google/generative-ai";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface GeminiCredential {
  key: string;
  group: string;
}

function getCredentials(): GeminiCredential[] {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
  ];
  
  const groupsStr = process.env.GEMINI_KEY_GROUPS || "";
  const configuredGroups = groupsStr.split(",").map(g => g.trim());

  const credentials: GeminiCredential[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key && key.trim() !== "" && key !== "your_second_gemini_key_here" && key !== "your_third_gemini_key_here" && key !== "your_fourth_gemini_key_here") {
      // If groups are not configured, assign them all to "unknown-group" to safely prevent 
      // retrying multiple keys in the same exhausted project, as per conservative instructions.
      const group = configuredGroups[i] || (groupsStr ? `default-group-${i}` : "unknown-group");
      credentials.push({ key: key.trim(), group });
    }
  }
  return credentials;
}

async function attemptGeminiWithKey(prompt: string, key: string, modelName: string, retries = 1): Promise<string> {
  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({ model: modelName });
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await model.generateContent(prompt);
      return res.response.text();
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const message = err?.message || "";
      
      const is5xx = status >= 500 && status < 600;
      
      if (is5xx && i < retries - 1) {
        await delay(1000 * (i + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Gemini attempts exhausted");
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const credentials = getCredentials();
  if (credentials.length === 0) throw new Error("No Gemini keys configured");

  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const exhaustedGroups = new Set<string>();
  let lastError: any = null;

  for (const cred of credentials) {
    if (exhaustedGroups.has(cred.group)) {
      continue; // Skip keys in a group that hit a 429 quota exhaustion
    }

    try {
      return await attemptGeminiWithKey(prompt, cred.key, modelName, 2);
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      const message = err?.message || "";
      
      const isAuthError = status === 401 || status === 403 || message.includes("API key not valid");
      const is429 = status === 429 || message.includes("429") || message.includes("Quota Exhausted");

      if (is429) {
        exhaustedGroups.add(cred.group);
        continue;
      }

      if (isAuthError) {
        continue; // Try next key
      }
      
      // For any other unknown error, throw and let fallback provider handle it
      throw err;
    }
  }

  // If we get here, all keys were either exhausted or auth-failed
  throw new Error(`All Gemini credentials failed. Last error: ${lastError?.message}`);
}

export async function generateChatWithGemini(
  message: string, 
  systemPrompt: string, 
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const credentials = getCredentials();
  if (credentials.length === 0) throw new Error("No Gemini keys configured");

  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const exhaustedGroups = new Set<string>();
  let lastError: any = null;

  for (const cred of credentials) {
    if (exhaustedGroups.has(cred.group)) continue;
    
    try {
      const client = new GoogleGenerativeAI(cred.key);
      const model = client.getGenerativeModel({ model: modelName });

      const chatHistory: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I'm FraudWatch AI, ready to help analyze fraud patterns and provide expert insights." }] },
        ...history.map((m) => ({
          role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
          parts: [{ text: m.content }] as [{ text: string }],
        })),
      ];

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      const message = err?.message || "";
      const isAuthError = status === 401 || status === 403 || message.includes("API key not valid");
      const is429 = status === 429 || message.includes("429") || message.includes("Quota Exhausted");

      if (is429) {
        exhaustedGroups.add(cred.group);
        continue;
      }
      if (isAuthError) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`All Gemini credentials failed in chat. Last error: ${lastError?.message}`);
}
