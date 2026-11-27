import { readFileSync, existsSync } from "node:fs";

if (!process.env.GROQ_API_KEY && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("Falta GROQ_API_KEY (definela en .env.local o en el entorno).");
  process.exit(1);
}

const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};

const listResponse = await fetch("https://api.groq.com/openai/v1/models", { headers });
if (!listResponse.ok) {
  console.error(`Fallo al listar modelos: HTTP ${listResponse.status}`);
  console.error(await listResponse.text());
  process.exit(1);
}
const models = (await listResponse.json()).data || [];
console.log(`Clave válida. Modelos disponibles: ${models.length}`);
if (!models.some((m) => m.id === model)) {
  console.warn(`AVISO: "${model}" no está en la lista. Modelos de texto:`);
  console.warn(models.filter((m) => m.id.includes("/") || m.id.includes("llama")).map((m) => "  - " + m.id).join("\n"));
}

const chatResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers,
  body: JSON.stringify({
    model,
    messages: [{ role: "user", content: "Responde exactamente: Paz y Bien" }],
    temperature: 0.7,
  }),
});

if (!chatResponse.ok) {
  console.error(`Fallo en la generación: HTTP ${chatResponse.status}`);
  console.error(await chatResponse.text());
  process.exit(1);
}

const chat = await chatResponse.json();
console.log(`Modelo "${model}" responde: ${chat.choices?.[0]?.message?.content}`);
console.log("OK: la IA de Groq funciona.");
