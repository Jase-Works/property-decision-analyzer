# Implementation Plan: Fix 4 Data Flow Issues

## Summary

This plan fixes 4 data flow inconsistencies in the Property Decision Analyzer where user inputs and API data are not flowing consistently to all components.

**Key Finding**: The analysis (calculator.ts) and prediction (predictor.ts) modules use different data sources:
- Analysis uses `financialData.expectedMonthlyRent` (user input) for rent calculations
- Prediction uses `marketData.averageRent` (API data) for rent calculations
- User's `scenarioData.priceGrowthRate/rentGrowthRate` are NOT passed to PredictionPanel
- Market YoY data (`priceYoYChange`, `rentYoYChange`) is returned by API but unused
- `purchasePrice` is passed to PredictionPanel but never used inside

---

## Implementation Plan

- [ ] 1. **Add scenarioData and financialData props to PredictionPanel** (ISSUE 1 & 2)
      Pass scenarioData, expectedMonthlyRent from App.tsx to PredictionPanel. This enables the prediction panel to use the same rent value (user input) and scenario assumptions as the analysis.
      Files: src/App.tsx (lines 192-198), src/components/prediction/PredictionPanel.tsx (interface + props)
      Verify: `npm run build` — 0 errors

- [ ] 2. **Use expectedMonthlyRent in PredictionPanel instead of marketData.averageRent** (ISSUE 1)
      In PredictionPanel, change currentMonthlyRent from `marketData?.averageRent || 0` to use the new `expectedMonthlyRent` prop. Add UI to show both values (user expected vs market average) for comparison.
      Files: src/components/prediction/PredictionPanel.tsx (line 33, add comparison display)
      Verify: `npm run build` — 0 errors; Manual test: enter different expected rent, verify prediction uses user value

- [ ] 3. **Sync scenarioData rates to usePrediction MacroAssumptions** (ISSUE 2)
      Pass scenarioData to usePrediction hook. Use scenarioData.priceGrowthRate as `priceGrowthRateOverride` and scenarioData.rentGrowthRate as `rentGrowthRateOverride` in MacroAssumptions. This ensures prediction uses the same growth rates as analysis.
      Files: src/components/prediction/PredictionPanel.tsx (pass to usePrediction), src/hooks/usePrediction.ts (accept scenarioData, apply overrides)
      Verify: `npm run build` — 0 errors; Manual test: change scenario rates, verify prediction chart updates

- [ ] 4. **Use market YoY data as scenario defaults** (ISSUE 3)
      In App.tsx, add useEffect to set scenarioData.priceGrowthRate = marketData.priceYoYChange and rentGrowthRate = marketData.rentYoYChange when available AND user hasn't manually modified. Track modification state.
      Files: src/App.tsx (add useEffect + state for tracking modification)
      Verify: `npm run build` — 0 errors; Manual test: select city/district, verify scenario fields auto-populate with YoY values

- [ ] 5. **Display market YoY reference in ScenarioForm** (ISSUE 3)
      Pass marketData to ScenarioForm. Show market historical YoY rates as reference text next to priceGrowthRate and rentGrowthRate inputs.
      Files: src/App.tsx (pass marketData to ScenarioForm), src/components/forms/ScenarioForm.tsx (accept marketData, display reference)
      Verify: `npm run build` — 0 errors; Manual test: verify market YoY shown next to inputs

- [ ] 6. **Use purchasePrice prop in PredictionPanel for comparison** (ISSUE 4)
      Add "Purchase vs Current Value" comparison section in PredictionPanel showing: purchasePrice (user input), current market estimate (marketData.averagePrice * propertyArea), and gain/loss percentage. Only show when both values are available.
      Files: src/components/prediction/PredictionPanel.tsx (add comparison section using purchasePrice prop)
      Verify: `npm run build` — 0 errors; Manual test: enter purchasePrice, verify comparison displayed

- [ ] 7. **Final consistency verification**
      Verify that cumulative income figures and curve charts are consistent across analysis and prediction by ensuring both use the same rent source and growth rates.
      Files: Manual verification across ResultsPanel, ComparisonChart, and PredictionPanel
      Verify: `npm run build` — 0 errors; Manual test: complete full analysis, verify prediction panel shows consistent data with analysis results

---

## Files Changed Summary

| File | Changes |
|------|---------|
| src/App.tsx | Add scenarioData, financialData.expectedMonthlyRent, marketData props to PredictionPanel; Add useEffect for YoY defaults; Pass marketData to ScenarioForm |
| src/components/prediction/PredictionPanel.tsx | Add scenarioData, expectedMonthlyRent props; Use expectedMonthlyRent; Add rent comparison; Add purchase vs current comparison; Sync scenario to usePrediction |
| src/hooks/usePrediction.ts | Accept scenarioData; Apply priceGrowthRateOverride and rentGrowthRateOverride from scenarioData |
| src/components/forms/ScenarioForm.tsx | Accept marketData prop; Display YoY reference |

---

## Consistency Requirement

The user's core concern is that cumulative-income figures and curve charts must be consistent across all presentations. After these fixes:

1. **Rent source**: Both analysis and prediction use `expectedMonthlyRent` (user input)
2. **Growth rates**: Both analysis and prediction use `scenarioData.priceGrowthRate` and `scenarioData.rentGrowthRate`
3. **Market data**: YoY rates are used as smart defaults, displayed as reference, and available in all relevant components

This ensures the same inputs produce consistent outputs across ResultsPanel, ComparisonChart, and PredictionPanel.
