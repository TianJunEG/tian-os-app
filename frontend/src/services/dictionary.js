// Word definitions / example sentences.
//
// Uses the free Dictionary API (https://dictionaryapi.dev), which needs no key
// and supports CORS so it can be called directly from the browser. To use the
// Oxford Dictionaries API instead, replace `lookupWord` with a call to your
// backend proxy that holds the Oxford app_id / app_key.

const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en';

// Returns { word, phonetic, meanings: [{ partOfSpeech, definition, example }] }
// or throws if the word is not found / the request fails.
export async function lookupWord(word) {
  const term = String(word || '').trim();
  if (!term) throw new Error('No word provided');

  const res = await fetch(`${ENDPOINT}/${encodeURIComponent(term)}`);
  if (!res.ok) {
    throw new Error(res.status === 404 ? 'No definition found' : 'Lookup failed');
  }
  const data = await res.json();
  const entry = Array.isArray(data) ? data[0] : null;
  if (!entry) throw new Error('No definition found');

  const phonetic =
    entry.phonetic || (entry.phonetics || []).find((p) => p.text)?.text || '';

  const meanings = [];
  for (const m of entry.meanings || []) {
    for (const d of m.definitions || []) {
      meanings.push({
        partOfSpeech: m.partOfSpeech || '',
        definition: d.definition || '',
        example: d.example || ''
      });
    }
  }

  return { word: entry.word || term, phonetic, meanings };
}

// Convenience: the single best definition string for a word.
export function bestDefinition(result) {
  const m = result?.meanings?.[0];
  if (!m) return '';
  return m.partOfSpeech ? `(${m.partOfSpeech}) ${m.definition}` : m.definition;
}

// Convenience: the first example sentence, if any.
export function bestExample(result) {
  return (result?.meanings || []).find((m) => m.example)?.example || '';
}
