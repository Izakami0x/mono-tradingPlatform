export function classifyBarUpdate(previous = [], next = []) {
  if (!previous.length || !next.length) return 'reset';
  if (previous.length === next.length) {
    if (previous[0]?.time !== next[0]?.time || previous.at(-1)?.time !== next.at(-1)?.time) return 'reset';
    // A live tick may only revise the final candle. If any earlier candle changed,
    // force a complete series refresh rather than silently leaving stale history.
    for (let index = 0; index < previous.length - 1; index += 1) {
      if (previous[index]?.time !== next[index]?.time ||
          previous[index]?.open !== next[index]?.open ||
          previous[index]?.high !== next[index]?.high ||
          previous[index]?.low !== next[index]?.low ||
          previous[index]?.close !== next[index]?.close ||
          previous[index]?.volume !== next[index]?.volume) return 'reset';
    }
    return 'last';
  }
  if (next.length === previous.length + 1 &&
      previous[0]?.time === next[0]?.time &&
      next.at(-2)?.time === previous.at(-1)?.time) {
    for (let index = 0; index < previous.length; index += 1) {
      if (previous[index]?.open !== next[index]?.open ||
          previous[index]?.high !== next[index]?.high ||
          previous[index]?.low !== next[index]?.low ||
          previous[index]?.close !== next[index]?.close ||
          previous[index]?.volume !== next[index]?.volume) return 'reset';
    }
    return 'append';
  }
  return 'reset';
}
