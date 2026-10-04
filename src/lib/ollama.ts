export type OllamaResponse = {
  verdict: 'red' | 'yellow' | 'green';
  why: string;
  what_to_do: string;
};

export async function checkMessageWithOllama(message: string): Promise<OllamaResponse> {
  const schema = {
    type: "object",
    properties: {
      verdict: {
        type: "string",
        enum: ["red", "yellow", "green"],
        description: "The severity of the message. red means definitely a scam/dangerous. yellow means suspicious. green means safe."
      },
      why: {
        type: "string",
        description: "A very short, one-line explanation of why this verdict was given, written in a simple, easy-to-understand tone."
      },
      what_to_do: {
        type: "string",
        description: "A one-line instruction on what the person should do next, e.g., 'Delete the message', 'Do not click the link'."
      }
    },
    required: ["verdict", "why", "what_to_do"]
  };

  const systemPrompt = `You are an expert at identifying SMS scams in India targeting the elderly. 
Your goal is to protect them from phishing, fake KYC links, lotteries, and account block threats.
Keep your answers extremely brief and simple. The user is a senior citizen.
Provide output strictly in the requested JSON format.

Here are some examples of local scam patterns:
1. "Dear customer, your HDFC bank account will be blocked today. Click here to update Pan: http://bit.ly/fake" -> Red (Fake urgency, malicious link)
2. "Congratulations! You have won Rs 50,000 in Jio Lucky Draw. Call this number: 9876543210" -> Red (Fake lottery)
3. "Your electricity bill for last month is pending. Power will be cut at 9:30 PM. Call officer 98765XXXXX" -> Red (Fake urgency, common tactic)
4. "OTP for your transaction of Rs 5,000 at Amazon is 123456. Do not share with anyone." -> Green (Legitimate OTP, but they shouldn't share it)
`;

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma4:e2b",
        stream: false,
        format: schema,
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this message: "${message}"` }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.message.content) as OllamaResponse;
    
    return result;
  } catch (error) {
    console.error("Error communicating with Ollama:", error);
    // Fallback if Ollama is down or errors out
    return {
      verdict: "yellow",
      why: "We couldn't reach the AI assistant to check this completely.",
      what_to_do: "Ask your grandson or call your bank directly using the number on your card.",
    };
  }
}
