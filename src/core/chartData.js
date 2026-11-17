export function classifyBarUpdate(previous = [], next = []) {
  if (!previous.length || !next.length) return 'reset';
  const sameStart = previous[0]?.time === next[0]?.time;
  const sameEnd = previous.at(-1)?.time === next.at(-1)?.time;
  if (previous.length === next.length && sameStart && sameEnd) return 'last';
  if (next.length === previous.length + 1 && sameStart && next.at(-2)?.time === previous.at(-1)?.time) return 'append';
  return 'reset';
}
