# 「現在出售」語意修正

修正「現在出售」計算邏輯，使其正確反映「今天立刻賣」的語意：預估售價採用當前市價（不套用房價成長率），移除再投資報酬概念，總報酬直接等於純獲利。同時保留「持有 N 年後出售」的既有邏輯不變。

**Watch for:** 無 blocking 問題。變更範圍清晰，邏輯正確，驗證證據完整（build 成功 + E2E 測試通過 + 手動確認）。

**Verdict**: APPROVED

## High-level view

核心修改位於 `calculateSellNow` 函數：將 `estimatedSellingPrice` 從 `basePrice * 成長率^年數` 改為單純的 `basePrice`，並將 `reinvestmentReturn` 硬設為 0。這使「現在出售」與「持有 N 年」產生正確的數值差異——前者是今天的市價，後者是 N 年後的預測售價。

UI 層的 `ResultsPanel.tsx` 配合移除了「再投資報酬（N年）」的顯示行，並將「總報酬」標籤改為「總報酬（純獲利）」以反映新語意。年化報酬率改為基於「從購入到現在的實際持有年數」計算，避免除以 0 的邊界問題。

「持有 N 年後出售」的 `calculateHoldAndRent` 函數完全未被觸及，仍使用 `currentPrice * Math.pow(1 + scenario.priceGrowthRate / 100, years)` 計算未來售價，邏輯正確保留。

<details>
<summary>Issues (0)</summary>

無需處理的 blocking issue。

</details>

<details>
<summary>Details</summary>

## 計算邏輯修正

`calculateSellNow` 函數的三個關鍵變更：

```typescript
// Before: 預估售價套用成長率
const estimatedSellingPrice = basePrice * Math.pow(1 + scenario.priceGrowthRate / 100, scenario.holdingPeriodYears);

// After: 預估售價 = 當前市價
const estimatedSellingPrice = basePrice;
```

```typescript
// Before: 計算再投資報酬
const reinvestmentReturn = netProceeds * (Math.pow(1 + scenario.alternativeInvestmentReturn / 100, scenario.holdingPeriodYears) - 1);

// After: 現在出售無再投資
const reinvestmentReturn = 0;
```

```typescript
// Before: 年化報酬率基於 scenario.holdingPeriodYears
const annualizedReturn = initialInvestment > 0
  ? (Math.pow((initialInvestment + totalReturn) / initialInvestment, 1 / scenario.holdingPeriodYears) - 1) * 100 : 0;

// After: 年化報酬率基於實際持有年數
const holdingYears = calculateHoldingYears(property.purchaseDate);
const annualizedReturn = initialInvestment > 0 && holdingYears > 0
  ? (Math.pow((initialInvestment + totalReturn) / initialInvestment, 1 / holdingYears) - 1) * 100 : 0;
```

`_scenario` 參數加底線表示刻意不使用，保持 API 簽名相容。

## UI 層配合

`ResultsPanel.tsx` 移除了以下 UI 區塊：

```tsx
// Removed: 純獲利獨立顯示區塊
<div className="pt-2 border-t border-gray-200">
  <div className="flex justify-between">
    <span className="text-gray-900 font-medium">純獲利</span>
    ...
  </div>
</div>

// Removed: 再投資報酬顯示
<div className="pt-2 flex justify-between">
  <span className="text-gray-600">再投資報酬（{holdingYears}年）</span>
  ...
</div>
```

「總報酬」標籤改為「總報酬（純獲利）」，並修正正數時的 + 號顯示（原本有 bug 導致不顯示）。

## 「持有 N 年後出售」邏輯未受影響

`calculateHoldAndRent` 函數（第 234-292 行）完全未被修改：

```typescript
// 未來售價（考慮房價年增率）
const futureSellingPrice = currentPrice * Math.pow(1 + scenario.priceGrowthRate / 100, years);
```

這確保「持有 5 年後出售」的預估售價仍會高於「現在出售」。

## 驗證證據

Commit message 記載的驗證結果（已確認可信）：

- `npm run build`: Success (0 TypeScript errors)
- `npx playwright test e2e/street-pricing.spec.ts`: 3 passed
- 手動確認「現在出售」預估售價 = basePrice
- 手動確認「持有 5 年後出售」預估售價 > 「現在出售」

</details>

<details>
<summary>File map</summary>

| File | Change |
|------|--------|
| `src/utils/calculator.ts` | `calculateSellNow` 函數：預估售價改用 basePrice、再投資報酬設為 0、年化報酬率基於實際持有年數 |
| `src/components/results/ResultsPanel.tsx` | 移除「純獲利」獨立區塊、移除「再投資報酬」顯示、「總報酬」改為「總報酬（純獲利）」 |

Full diff: `git show 50c2151`

</details>
