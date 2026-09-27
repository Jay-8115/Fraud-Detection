import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("No GEMINI_API_KEY");
    return;
  }
  
  try {
    const ai = new GoogleGenerativeAI(key);
    // There isn't a getModels() in standard SDK without auth/specific fetch usually, but we can try to generate content with 1.5-flash
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent("hello");
    console.log("1.5-flash SUCCESS:", res.response.text());
  } catch(e) {
    console.log("1.5-flash ERROR:", e);
  }

  try {
    const ai = new GoogleGenerativeAI(key);
    const model = ai.getGenerativeModel({ model: "gemini-3.8-flash" });
    const res = await model.generateContent("hello");
    console.log("3.8-flash SUCCESS:", res.response.text());
  } catch(e) {
    console.log("3.8-flash ERROR:", e);
  }
}

testGemini();
