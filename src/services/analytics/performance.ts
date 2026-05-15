export function startAiTimer() {
  const t0 = performance.now();
  return {
    stop: () => Math.round(performance.now() - t0),
  };
}
