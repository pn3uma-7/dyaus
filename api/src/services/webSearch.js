// DuckDuckGo search + Jina Reader page extraction

const JINA_CHAR_LIMIT = 3000;
const TOP_RESULTS_FOR_FULL_TEXT = 2;

async function getVqd(query) {
  const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DyausBot/1.0)' },
  });
  const html = await res.text();
  const match = html.match(/vqd=['"]([^'"]+)['"]/);
  if (!match) throw new Error('Could not extract vqd token from DuckDuckGo');
  return match[1];
}

async function ddgSearch(query, vqd) {
  const url =
    `https://links.duckduckgo.com/d.js?q=${encodeURIComponent(query)}` +
    `&kl=wt-wt&dl=en&ct=US&ss_mkt=us&vqd=${encodeURIComponent(vqd)}&p=1&ex=-1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DyausBot/1.0)' },
  });
  const text = await res.text();

  // Response is JS: DDG.pageLayout.load('d', [...])
  const match = text.match(/DDG\.pageLayout\.load\('d',(\[.+\])\)/s);
  if (!match) return [];

  const items = JSON.parse(match[1]);
  return items
    .filter((item) => item.u && item.t && !item.n) // n is present on news/special sections
    .slice(0, 5)
    .map((item) => ({ url: item.u, title: item.t, snippet: item.a || '' }));
}

async function fetchPageText(url) {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'User-Agent': 'Mozilla/5.0 (compatible; DyausBot/1.0)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, JINA_CHAR_LIMIT);
  } catch {
    return null;
  }
}

/**
 * Search the web and return a compact string suitable for injection into an LLM prompt.
 * @param {string} query
 * @returns {Promise<string>}
 */
async function webSearch(query) {
  let results = [];
  try {
    const vqd = await getVqd(query);
    results = await ddgSearch(query, vqd);
  } catch (err) {
    return `Web search failed: ${err.message}`;
  }

  if (results.length === 0) return 'No results found.';

  // Fetch full text for top N results, snippets for the rest
  const enriched = await Promise.all(
    results.map(async (r, i) => {
      if (i < TOP_RESULTS_FOR_FULL_TEXT) {
        const text = await fetchPageText(r.url);
        return { ...r, fullText: text };
      }
      return r;
    })
  );

  const parts = enriched.map((r, i) => {
    const header = `[${i + 1}] ${r.title}\n${r.url}`;
    if (r.fullText) return `${header}\n${r.fullText}`;
    return `${header}\n${r.snippet}`;
  });

  return parts.join('\n\n---\n\n');
}

module.exports = { webSearch };
