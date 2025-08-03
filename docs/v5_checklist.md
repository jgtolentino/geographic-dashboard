# Scout v5 — QA / Acceptance Checklist (Ship-Blockers)

- [ ] All page data paths call **only Gold RPCs** (no direct table reads)
- [ ] **RLS** policies block cross-scope reads (unit + canary)
- [ ] Global filters update URL and re-fetch with debounce (≤300ms)
- [ ] `get_master_filters` returns correct facet counts under active constraints
- [ ] **Sari-Sari** page: OOS table, promo heatmap, price bands, barangay drill
- [ ] Forecast charts render CI and write to `prediction_accuracy`
- [ ] p95 LCP ≤ 2.5 s on `/live`, `/brand`, `/market` in production traces
- [ ] p95 RPC latency ≤ 250 ms; error rate ≤ 0.5%