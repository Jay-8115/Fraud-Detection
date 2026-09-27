import { GoogleGenAI } from "@google/genai";

async function testGenai() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("No GEMINI_API_KEY");
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: "hello",
    });
    console.log("SUCCESS:", res.text);
  } catch(e) {
    console.log("ERROR:", e);
  }
}

testGenai();
