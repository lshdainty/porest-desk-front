const NAMED: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  middot: '·',
  hellip: '…',
  rarr: '→',
  larr: '←',
  uarr: '↑',
  darr: '↓',
  times: '×',
  divide: '÷',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  reg: '®',
  trade: '™',
  bull: '•',
  deg: '°',
}

export function decodeHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (m, name) => NAMED[name] ?? m)
}
