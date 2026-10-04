import { LlmInference, FilesetResolver } from '@mediapipe/tasks-genai';

let llmInferenceInstance: LlmInference | null = null;

export type LocalOllamaResponse = {
  verdict: 'red' | 'yellow' | 'green';
  why: string;
  what_to_do: string;
};

export async function initModel(modelUrl: string, onProgress?: (progress: number) => void) {
  if (llmInferenceInstance) return llmInferenceInstance;

  try {
    const genai = await FilesetResolver.forGenAiTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm"
    );

    llmInferenceInstance = await LlmInference.createFromOptions(genai, {
      baseOptions: {
        modelAssetPath: modelUrl,
      },
      maxTokens: 500,
      temperature: 0.1,
    });
    
    return llmInferenceInstance;
  } catch (error) {
    console.error("Failed to initialize model", error);
    throw error;
  }
}

export async function checkMessageLocal(message: string, language: string): Promise<LocalOllamaResponse> {
  if (!llmInferenceInstance) {
    throw new Error("Model not initialized");
  }

  const prompt = `You are a scam detection assistant.
Respond ONLY with a JSON object. No markdown, no intro. 
Format: {"verdict": "red/yellow/green", "why": "reason in ${language}", "what_to_do": "action in ${language}"}

Message to check: "${message}"`;

  try {
    const responseStr = await llmInferenceInstance.generateResponse(prompt);
    
    // Extract JSON if model wrapped it in markdown or something
    let cleanStr = responseStr.trim();
    if (cleanStr.startsWith('```json')) {
      cleanStr = cleanStr.substring(7);
      if (cleanStr.endsWith('```')) cleanStr = cleanStr.substring(0, cleanStr.length - 3);
    } else if (cleanStr.startsWith('```')) {
      cleanStr = cleanStr.substring(3);
      if (cleanStr.endsWith('```')) cleanStr = cleanStr.substring(0, cleanStr.length - 3);
    }
    
    const parsed = JSON.parse(cleanStr) as LocalOllamaResponse;
    if (!['red', 'yellow', 'green'].includes(parsed.verdict)) {
      parsed.verdict = 'yellow';
    }
    return parsed;
  } catch (error) {
    console.error("Inference failed", error);
    return {
      verdict: "yellow",
      why: "Inference error / AI unable to process.",
      what_to_do: "Ask your family."
    };
  }
}
