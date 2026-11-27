import type { IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MAX_QUERY_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 12000;
const TIMEOUT_MS = 30000;

type AskErrorCode = "NO_KEY" | "BAD_REQUEST" | "RATE_LIMIT" | "UPSTREAM" | "TIMEOUT" | "NETWORK";

class AskError extends Error {
  code: AskErrorCode;
  status: number;
  detail?: string;

  constructor(code: AskErrorCode, message: string, status: number, detail?: string) {
    super(message);
    this.name = "AskError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

const buildSystemPrompt = (context?: string) =>
  `Eres el 'Asistente Cofrade Supremo de Ayamonte'. Tu conocimiento es enciclopédico sobre la Semana Santa de Ayamonte (Huelva).

    ${context ? `AQUÍ TIENES LA INFORMACIÓN ACTUALIZADA DE LA APP (DÁLE PRIORIDAD):
    ${context}
    -----------------------------------` : ''}

    Responde con pasión cofrade, usando términos locales como 'cargadores' y mencionando los barrios (Barrio Alto, Ribera, San Francisco).
    Si te preguntan por horarios o itinerarios, consulta SIEMPRE los datos proporcionados arriba si existen.`;

const askCofrade = async (query: string, context?: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.trim() === "undefined") {
    throw new AskError(
      "NO_KEY",
      "El asistente no está configurado: falta la variable GROQ_API_KEY en el servidor.",
      503
    );
  }

  const userQuery = (query || "").trim();
  if (!userQuery) {
    throw new AskError("BAD_REQUEST", "La pregunta está vacía.", 400);
  }
  if (userQuery.length > MAX_QUERY_LENGTH) {
    throw new AskError(
      "BAD_REQUEST",
      `La pregunta es demasiado larga (máximo ${MAX_QUERY_LENGTH} caracteres).`,
      400
    );
  }

  const model = (process.env.GROQ_MODEL || DEFAULT_MODEL).trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: buildSystemPrompt(context?.slice(0, MAX_CONTEXT_LENGTH)) },
          { role: "user", content: userQuery },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new AskError("TIMEOUT", "La IA tardó demasiado en responder. Inténtalo de nuevo.", 504);
    }
    throw new AskError("NETWORK", "No se ha podido conectar con la IA. Revisa tu conexión.", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let detail = raw.slice(0, 300);
    try {
      const parsed = JSON.parse(raw);
      detail = parsed?.error?.message || detail;
    } catch {
      /* mantenemos el cuerpo en crudo */
    }

    if (response.status === 429) {
      throw new AskError(
        "RATE_LIMIT",
        "Se ha agotado el límite de peticiones de la IA. Prueba dentro de un minuto.",
        429,
        detail
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new AskError("NO_KEY", "La clave de la IA no es válida o ha sido revocada.", 502, detail);
    }
    if (response.status === 404) {
      throw new AskError("UPSTREAM", "El modelo de IA configurado no existe. Revisa GROQ_MODEL.", 502, detail);
    }
    throw new AskError("UPSTREAM", "La IA ha devuelto un error. Inténtalo más tarde.", 502, detail);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new AskError("UPSTREAM", "Respuesta ilegible de la IA.", 502);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.trim() === "") {
    throw new AskError("UPSTREAM", "La IA no ha devuelto contenido.", 502);
  }

  return text.trim();
};

type ApiRequest = IncomingMessage & { body?: unknown };

const readBody = async (req: ApiRequest): Promise<{ query?: string; context?: string }> => {
  if (req.body && typeof req.body === "object") {
    return req.body as { query?: string; context?: string };
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    size += buf.length;
    if (size > 64 * 1024) break;
    chunks.push(buf);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return {};
  }
};

const send = (res: ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    send(res, 405, { error: "Método no permitido." });
    return;
  }

  try {
    const { query, context } = await readBody(req);
    const text = await askCofrade(
      typeof query === "string" ? query : "",
      typeof context === "string" ? context : undefined
    );
    send(res, 200, { text });
  } catch (error) {
    if (error instanceof AskError) {
      if (error.detail) console.error(`[ask] ${error.code}: ${error.detail}`);
      send(res, error.status, { error: error.message, code: error.code });
      return;
    }
    console.error("[ask] error inesperado:", error);
    send(res, 500, { error: "Error interno del servidor." });
  }
}
