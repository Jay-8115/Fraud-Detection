let verifiedModel: string | null = null;

async function verifyGroqModel(key: string, model: string): Promise<void> {
  if (verifiedModel === model) return;
  
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { "Authorization": `Bearer ${key}` }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to verify Groq models: ${res.statusText}`);
  }
  
  const data = await res.json();
  const models = data.data as Array<{ id: string }>;
  
  if (!models.some(m => m.id === model)) {
    throw new Error(`Configured Groq model '${model}' is invalid or unavailable for this account.`);
  }
  
  verifiedModel = model;
}

export async function generateWithGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No Groq key configured");
  
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  await verifyGroqModel(key, model);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }]
    })
  });
  
  if (!res.ok) {
    let errMessage = res.statusText;
    try {
      const data = await res.json();
      errMessage = data.error?.message || errMessage;
    } catch {}
    throw new Error(`Groq API error: ${errMessage}`);
  }
  
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function generateChatWithGroq(
  message: string, 
  systemPrompt: string, 
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No Groq key configured");

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  await verifyGroqModel(key, model);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role,
      content: m.content
    })),
    { role: "user", content: message }
  ];
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages
    })
  });
  
  if (!res.ok) {
    throw new Error(`Groq API error: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.choices[0].message.content;
}
