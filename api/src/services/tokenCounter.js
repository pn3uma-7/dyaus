function extractUsage(inferenceResponse) {
  const usage = inferenceResponse.usage;
  if (usage && usage.prompt_tokens != null && usage.completion_tokens != null) {
    return {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
    };
  }
  return { inputTokens: 0, outputTokens: 0 };
}

module.exports = { extractUsage };
