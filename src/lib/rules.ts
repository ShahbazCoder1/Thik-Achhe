export type RuleVerdict = {
  isRedFlag: boolean;
  reasonKey?: "otp" | "urgency" | "link" | "lottery" | "kyc";
};

export function evaluateRules(message: string): RuleVerdict {
  const lowerMessage = message.toLowerCase();

  // 1. Ask for sensitive info
  if (/(otp|pin|cvv|password)\b/i.test(message)) {
    return {
      isRedFlag: true,
      reasonKey: "otp",
    };
  }

  // 2. Account blocked / urgent action
  const urgencyKeywords = [
    "blocked",
    "suspend",
    "expire",
    "within 24 hours",
    "immediately",
    "urgent",
    "today",
  ];
  const hasUrgency = urgencyKeywords.some((word) => lowerMessage.includes(word));
  const bankKeywords = ["kyc", "pan", "aadhar", "account", "bank"];
  const hasBankKeywords = bankKeywords.some((word) => lowerMessage.includes(word));
  
  if (hasUrgency && hasBankKeywords) {
    return {
      isRedFlag: true,
      reasonKey: "urgency",
    };
  }

  // 3. Suspicious links (shorteners)
  if (/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|tiny\.cc)/i.test(message)) {
    return {
      isRedFlag: true,
      reasonKey: "link",
    };
  }

  // 4. Lottery / Prize
  if (/(lottery|prize|won|reward|cashback|lucky draw)\b/i.test(message)) {
    return {
      isRedFlag: true,
      reasonKey: "lottery",
    };
  }

  // 5. General KYC panic
  if (/\bkyc\b/i.test(message) && /(update|complete|pending|link)/i.test(message)) {
    return {
      isRedFlag: true,
      reasonKey: "kyc",
    };
  }

  return { isRedFlag: false };
}
