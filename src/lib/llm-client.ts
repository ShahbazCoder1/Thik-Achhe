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

const languageMap: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  ne: "Nepali"
};

export async function checkMessageLocal(message: string, language: string): Promise<LocalOllamaResponse> {
  if (!llmInferenceInstance) {
    throw new Error("Model not initialized");
  }

  const fullLangName = languageMap[language] || "English";

  const prompt = `You are a scam detection assistant.
Analyze the message and output your response strictly as a JSON object.
Do not use double quotes inside your explanation strings, use single quotes instead.
Do not include any markdown formatting or introductory text.

Example format:
{"verdict": "red", "why": "Your explanation here in ${fullLangName}.", "what_to_do": "Your action here in ${fullLangName}."}

Message to check: "${message}"`;

  try {
    const responseStr = await llmInferenceInstance.generateResponse(prompt);
    
    // Extract JSON block in case the model adds conversational padding
    let cleanStr = responseStr.trim();
    const startIdx = cleanStr.indexOf('{');
    const endIdx = cleanStr.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanStr = cleanStr.substring(startIdx, endIdx + 1);
    }
    
    // Try to fix common unescaped quote issues before parsing (basic fallback)
    cleanStr = cleanStr.replace(/\\"/g, "'"); 
    
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
