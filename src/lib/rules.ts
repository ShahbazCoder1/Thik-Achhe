export type RuleVerdict = {
  isRedFlag: boolean;
  reason?: string;
};

export function evaluateRules(message: string): RuleVerdict {
  const lowerMessage = message.toLowerCase();

  // 1. Ask for sensitive info
  if (/(otp|pin|cvv|password)\b/i.test(message)) {
    return {
      isRedFlag: true,
      reason: "Never share OTP, PIN, or CVV. Banks will never ask for this.",
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
      reason: "Creating fake urgency about blocked accounts is a common scam tactic.",
    };
  }

  // 3. Suspicious links (shorteners)
  if (/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|tiny\.cc)/i.test(message)) {
    return {
      isRedFlag: true,
      reason: "The message contains a shortened link, which is often used to hide dangerous websites.",
    };
  }

  // 4. Lottery / Prize
  if (/(lottery|prize|won|reward|cashback|lucky draw)\b/i.test(message)) {
    return {
      isRedFlag: true,
      reason: "Messages claiming you won a prize or lottery are almost always fake.",
    };
  }

  // 5. General KYC panic
  if (/\bkyc\b/i.test(message) && /(update|complete|pending|link)/i.test(message)) {
    return {
      isRedFlag: true,
      reason: "Banks don't send SMS links to complete KYC. Always go to the branch or official app.",
    };
  }

  return { isRedFlag: false };
}
