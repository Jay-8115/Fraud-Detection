

async function testGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.log("No GROQ_API_KEY found");
    return;
  }
  
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { "Authorization": `Bearer ${key}` }
  });
  
  if (!res.ok) {
    console.log("Failed to fetch groq models:", res.status, res.statusText);
    return;
  }
  
  const data = await res.json();
  console.log("Groq models:", data.data.map((m: any) => m.id));
}

testGroq();
