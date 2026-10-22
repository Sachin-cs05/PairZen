import { SYSTEM_ASSISTANT_BASE } from "./prompts";
import { CodeReviewResult, ComplexityResult } from "./types";

export interface IAIAdapter {
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateStructured<T>(prompt: string, systemPrompt?: string): Promise<T>;
  isAvailable(): Promise<boolean>;
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) from model output.
 */
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Google Gemini REST API Adapter
 * Uses server-side API keys and standard REST endpoints without external SDK bloat.
 */
export class GeminiAIAdapter implements IAIAdapter {
  private apiKey: string;
  private model: string;
  private timeoutMs: number;

  constructor(options: { apiKey?: string; model?: string; timeoutMs?: number } = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "";
    this.model = options.model || process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-1.5-flash";
    this.timeoutMs = options.timeoutMs || Number(process.env.AI_TIMEOUT_MS) || 12000;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async generateText(prompt: string, systemPrompt: string = SYSTEM_ASSISTANT_BASE): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key is not configured on the server.");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`[GeminiAIAdapter] API error (${res.status}):`, errorText);
        throw new Error(`AI Service returned status ${res.status}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const reply = candidate?.content?.parts?.[0]?.text;

      if (!reply) {
        throw new Error("AI provider returned an empty response.");
      }

      return reply.trim();
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("AI request timed out. Please try again.");
      }
      throw err;
    }
  }

  public async generateStructured<T>(prompt: string, systemPrompt: string = SYSTEM_ASSISTANT_BASE): Promise<T> {
    const rawText = await this.generateText(prompt, systemPrompt);
    const cleaned = cleanJsonOutput(rawText);
    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error("[GeminiAIAdapter] Failed to parse structured output:", cleaned, err);
      throw new Error("Model returned malformed structured output. Please retry.");
    }
  }
}

/**
 * OpenAI / OpenAI-compatible REST API Adapter
 */
export class OpenAIAdapter implements IAIAdapter {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options: { apiKey?: string; model?: string; baseUrl?: string; timeoutMs?: number } = {}) {
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
    this.model = options.model || process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini";
    this.baseUrl = (options.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs || Number(process.env.AI_TIMEOUT_MS) || 12000;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async generateText(prompt: string, systemPrompt: string = SYSTEM_ASSISTANT_BASE): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured on the server.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`[OpenAIAdapter] API error (${res.status}):`, errorText);
        throw new Error(`AI Service returned status ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (!reply) {
        throw new Error("AI provider returned an empty response.");
      }
      return reply.trim();
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("AI request timed out. Please try again.");
      }
      throw err;
    }
  }

  public async generateStructured<T>(prompt: string, systemPrompt: string = SYSTEM_ASSISTANT_BASE): Promise<T> {
    const rawText = await this.generateText(prompt, systemPrompt);
    const cleaned = cleanJsonOutput(rawText);
    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error("[OpenAIAdapter] Failed to parse structured output:", cleaned, err);
      throw new Error("Model returned malformed structured output. Please retry.");
    }
  }
}

/**
 * Deterministic Mock AI Adapter for unit tests, offline development, and CI environments.
 * Provides rich, context-aware responses without requiring external API keys.
 */
export class MockAIAdapter implements IAIAdapter {
  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async generateText(prompt: string): Promise<string> {
    // 1. Progressive Hint Generation
    if (prompt.includes("LEVEL 1 (Conceptual Hint)")) {
      return "Notice that for each number x, the complement you are looking for is target - x. Instead of scanning the remaining array again, consider how you can check if this complement was already observed in constant time.";
    }
    if (prompt.includes("LEVEL 2 (Strategic Hint)")) {
      return "Use a hash map (or dictionary) where keys represent the numbers observed so far, and values represent their respective array indices. In a single linear pass, check if target - current exists in your map.";
    }
    if (prompt.includes("LEVEL 3 (Detailed Guidance)")) {
      return "Iterate through the array with index i: calculate complement = target - nums[i]. If map contains complement, return [map.get(complement), i]. Otherwise, record map.set(nums[i], i). This achieves optimal O(N) time and O(N) space.";
    }

    // 2. Chat / Code Explanation
    if (prompt.includes("Explain my current code") || prompt.includes("explain")) {
      return "Your code implements a solution for the problem. It initializes data structures, processes the input sequence, and identifies target conditions. The current approach exhibits linear time characteristics. To enhance readability, ensure descriptive variable naming and handle empty input edge cases.";
    }

    if (prompt.includes("edge case") || prompt.includes("Edge cases")) {
      return "Key edge cases to test for this problem:\n1. An array with minimum length (e.g. exactly 2 elements).\n2. Negative numbers or zero included in inputs.\n3. Large target values approaching maximum integer bounds.\n4. Identical elements summing up to the target (e.g. [3, 3] with target = 6).";
    }

    // Default friendly assistant response
    return "I've reviewed your current workspace state. Your approach is making solid progress. Feel free to request progressive hints, run an automated code review, or check complexity analysis whenever you're ready.";
  }

  public async generateStructured<T>(prompt: string): Promise<T> {
    // 1. Code Review Generation
    if (prompt.includes("automated code review")) {
      const review: CodeReviewResult = {
        summary: "Solid algorithmic foundation with clean logic and good separation of concerns.",
        strengths: [
          "Linear scan avoids costly quadratic brute-force comparisons",
          "Consistent indentation and idiomatic language construct usage",
        ],
        issues: [
          {
            line: 2,
            severity: "info",
            description: "Hash map lookup can be optimized by caching array length.",
            suggestion: "Store array length in a local variable if iterating frequently.",
          },
        ],
        improvements: [
          "Add input validation to check for null or undersized arrays early",
          "Include concise documentation comments explaining loop invariants",
        ],
        edgeCases: [
          "Arrays with negative numbers or duplicate complements",
          "Inputs where the target sum involves zero",
        ],
        complexity: {
          time: "O(N)",
          space: "O(N)",
        },
        confidenceNotes: "High confidence based on standard single-pass hash table implementation pattern.",
      };
      return review as unknown as T;
    }

    // 2. Complexity Analysis Generation
    if (prompt.includes("algorithmic complexity expert")) {
      const complexity: ComplexityResult = {
        timeComplexity: {
          best: "O(1)",
          average: "O(N)",
          worst: "O(N)",
          explanation: "Single pass over the array with N elements. Hash table lookups and insertions operate in O(1) amortized time.",
        },
        spaceComplexity: {
          auxiliary: "O(N)",
          total: "O(N)",
          explanation: "In the worst case, the hash map stores up to N - 1 distinct elements before the matching pair is identified.",
        },
        loopAndRecursionBreakdown: [
          "Single for-loop runs at most N iterations where N is the number of elements in nums.",
        ],
        dataStructureImpact: [
          "Hash map / Map provides O(1) average lookup and insertion time.",
        ],
        assumptions: [
          "Assumes standard hash function distributes keys uniformly without catastrophic hash collisions.",
        ],
        uncertaintyNote: undefined,
      };
      return complexity as unknown as T;
    }

    // 3. Post-Interview Feedback Generation
    if (prompt.includes("evidence-grounded post-interview feedback report")) {
      const feedback = {
        summary: "The candidate demonstrated strong algorithmic proficiency and effective problem-solving skills, implementing an optimal single-pass solution that passed all authoritative test cases.",
        approachEvaluation: {
          strengths: [
            "Quickly recognized the trade-off between time and space complexity",
            "Implemented an optimal single-pass hash map solution over brute force",
            "Maintained clean naming conventions and idiomatic code structure",
          ],
          weaknesses: [
            "Could proactively verbalize edge-case handling before writing code",
          ],
          summary: "Demonstrated clear algorithmic reasoning and transitioned directly to an optimal O(N) strategy.",
        },
        codeCorrectness: {
          notes: "Solution executed with 100% pass rate across visible and hidden evaluation test suites.",
        },
        algorithmicReasoning: "Strong conceptual understanding of associative data structures and complement lookup invariants.",
        codeQuality: {
          readabilityScore: 9,
          maintainabilityScore: 8,
          observations: [
            "Consistent naming conventions matching problem terminology",
            "Clear and uncluttered logic flow",
          ],
        },
        edgeCaseAwareness: "Handled standard and boundary conditions properly. Addressed negative integers and duplicate candidate elements.",
        complexityAnalysis: {
          timeComplexity: "O(N)",
          spaceComplexity: "O(N)",
          notes: "Optimal linear time solution with linear auxiliary memory.",
        },
        recommendations: [
          "Continue practicing boundary edge case vocalization before implementing",
          "Explore space-constrained variations (such as sorted array two-pointer approach)",
        ],
      };
      return feedback as unknown as T;
    }

    throw new Error("MockAIAdapter: Unknown structured prompt type.");
  }
}

let activeAIAdapter: IAIAdapter | null = null;

export function getAIAdapter(): IAIAdapter {
  if (activeAIAdapter) return activeAIAdapter;

  const isTest = process.env.NODE_ENV === "test";
  const forceMock = process.env.USE_MOCK_AI === "true";
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();

  if (isTest || forceMock || (!geminiKey && !openAiKey)) {
    activeAIAdapter = new MockAIAdapter();
  } else if (provider === "openai" && openAiKey) {
    activeAIAdapter = new OpenAIAdapter();
  } else if (geminiKey) {
    activeAIAdapter = new GeminiAIAdapter();
  } else {
    activeAIAdapter = new MockAIAdapter();
  }

  return activeAIAdapter;
}

export function setAIAdapter(adapter: IAIAdapter | null) {
  activeAIAdapter = adapter;
}
