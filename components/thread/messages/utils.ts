import type { Message, AIMessage } from "@langchain/langgraph-sdk";
import { parsePartialJson } from "@langchain/core/output_parsers";
import type { MessageContentComplex } from "@langchain/core/messages";

/**
 * Checks if a value is a complex object or array
 */
export function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

/**
 * Parses Anthropic's streamed tool calls into a consistent format
 */
export function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[]
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && "id" in c);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
} 