// Browser-side trigger for automatic retraining (see autoTrainer.ts).
// Retraining runs as its own request so verifying, saving or deleting stays fast; the server skips it
// when the verified dataset has not changed. `keepalive` lets it finish even if the page reloads.

import type { AutoRetrainResult } from './autoTrainer'

export async function requestAutoRetrain(
  options: { trigger?: 'AUTO' | 'MANUAL'; force?: boolean } = {}
): Promise<AutoRetrainResult | null> {
  try {
    const res = await fetch('/api/ml/models/auto-retrain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: options.trigger || 'AUTO', force: options.force === true }),
      keepalive: true,
    })
    return (await res.json()) as AutoRetrainResult
  } catch {
    return null
  }
}

/** Short admin-facing summary of a retraining result. */
export function describeRetrain(r: AutoRetrainResult | null): { text: string; type: 'success' | 'info' | 'error' } {
  if (!r) return { text: 'Could not reach the server to retrain the model.', type: 'error' }
  const pct = (x?: number) => (typeof x === 'number' ? `${(x * 100).toFixed(1)}%` : 'n/a')
  switch (r.status) {
    case 'ACTIVATED':
      return {
        text: `Model retrained automatically: ${r.version} is now active (${r.trainedSamples} verified entries, LOOCV accuracy ${pct(r.combinedAccuracy ?? r.accuracy)}).`,
        type: 'success',
      }
    case 'SKIPPED_UNCHANGED':
      return { text: 'Model is already up to date with the verified entries.', type: 'info' }
    default:
      return { text: r.message, type: r.status === 'FAILED' ? 'error' : 'info' }
  }
}
