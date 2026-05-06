// Approximation: 1 token ≈ 4 characters. Ollama returns exact counts in usage field.
function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function extractUsage(ollamaResponse) {
  const usage = ollamaResponse.usage;
  if (usage && usage.prompt_tokens != null && usage.completion_tokens != null) {
    return {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
    };
  }
  // Fallback: estimate from message content if Ollama doesn't return usage
  const content = ollamaResponse.choices?.[0]?.message?.content || '';
  return {
    inputTokens: 0,
    outputTokens: estimateTokens(content),
  };
}

module.exports = { extractUsage };
