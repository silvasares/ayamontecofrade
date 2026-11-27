export interface AssistantResponse {
  text: string;
  sources: { uri: string; title: string }[];
}

const CLIENT_TIMEOUT_MS = 45000;

const FALLBACK_ERROR =
  'La conexión con el archivo de la Agrupación de Cofradías ha fallado. Revisa tu conexión a internet e inténtalo de nuevo.';

export const askCofradeAssistant = async (
  query: string,
  context?: string
): Promise<AssistantResponse> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context }),
      signal: controller.signal,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        text:
          (data && typeof data.error === 'string' && data.error) ||
          'La IA no ha respondido. Inténtalo de nuevo en unos segundos.',
        sources: [],
      };
    }

    if (!data || typeof data.text !== 'string') {
      return { text: FALLBACK_ERROR, sources: [] };
    }

    return { text: data.text, sources: [] };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return {
        text: 'La IA está tardando demasiado en responder. Vuelve a intentarlo.',
        sources: [],
      };
    }
    console.error('Asistente: error de red', error);
    return { text: FALLBACK_ERROR, sources: [] };
  } finally {
    clearTimeout(timer);
  }
};
