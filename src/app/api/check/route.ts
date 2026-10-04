import { NextResponse } from "next/server";
import { evaluateRules } from "@/lib/rules";
import { checkMessageWithOllama, type OllamaResponse } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Run local rules engine first
    const ruleVerdict = evaluateRules(message);

    // 2. Call the Ollama model
    let finalVerdict: OllamaResponse = await checkMessageWithOllama(message);

    // 3. Merge Logic safely:
    // If the rules engine flags it as RED, the LLM cannot downgrade it to yellow or green.
    if (ruleVerdict.isRedFlag) {
      if (finalVerdict.verdict !== "red") {
        // The LLM thought it was fine, but our hard rules caught something.
        // We override the verdict to red and prepend our hard rule reason.
        finalVerdict.verdict = "red";
        finalVerdict.why = `${ruleVerdict.reason} ${finalVerdict.why}`.trim();
        finalVerdict.what_to_do = "Do not interact. Delete the message or confirm with your family.";
      } else {
        // Both agreed it's red. Prepend our specific hard rule reason for clarity.
        finalVerdict.why = `${ruleVerdict.reason} ${finalVerdict.why}`.trim();
      }
    }

    return NextResponse.json(finalVerdict);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
