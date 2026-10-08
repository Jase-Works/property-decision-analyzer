# 圖表與卡片累積報酬一致性修正

移除 `generateYearlyProjections()` 中對 `initialInvestment` 的重複加總，並修正 `ComparisonChart` 的年份映射邏輯，確保圖表顯示的數值與卡片語意一致。

**Watch for:** 無阻斷性問題。修正後的計算邏輯正確符合語意定義，build 與 test 證據充足（confirmed）。

**Verdict**: APPROVED

---

## High-level view

`calculator.ts` 的 `generateYearlyProjections()` 過去將 `holdAndRent.totalReturn + initialInvestment` 寫入 `holdAndRentCumulative`，這是語意錯誤——`totalReturn` 已經扣除初始投入，再加回去會讓圖表顯示「總資產」而非「純報酬」。這個 commit 把該行改為 `holdResult.totalReturn`，與卡片顯示的 `holdAndRent.totalReturn` 一致。

`ComparisonChart.tsx` 的 `generateChartData()` 過去用 `index + 1` 做年份映射，導致 `yearlyProjections[0]`（year 0）被塞進圖表的 year 1，而圖表 year 0 則用硬編碼的 `sellNow.netProceeds`。修正後直接用 `proj.year` 作為 key，year 0 的值來自 `yearlyProjections[0]`，與卡片使用相同資料源。

型別定義（`src/types/index.ts`）已完整，`YearlyProjection.holdAndRentCumulative` 對應圖表的 holdAndRent 線，`SellNowResult.totalReturn` 和 `HoldAndRentResult.totalReturn` 對應卡片的「總報酬」，語意清晰。

---

<details>
<summary>Issues (0)</summary>

無阻斷性問題。

</details>

---

<details>
<summary>Details</summary>

## 檢查點一：generateYearlyProjections() 的 holdAndRentCumulative 是否已改為 holdResult.totalReturn

**確認（confirmed）**：diff 顯示 `calculator.ts` 第 386 行從

```diff
-        holdAndRentCumulative: holdResult.totalReturn + initialInvestment,
+        holdAndRentCumulative: holdResult.totalReturn, // 純報酬（已扣初始投入）
```

同時移除了 `const initialInvestment = property.purchasePrice - financial.loanAmount;` 這行（第 359 行），因為不再需要。語意正確：`calculateHoldAndRent()` 的 `totalReturn` 公式已經在第 299-302 行做了 `- (property.purchasePrice - financial.loanAmount)`，即扣除初始投入。圖表現在顯示的是「純報酬」，與卡片 `holdAndRent.totalReturn` 一致。

---

## 檢查點二：卡片第 0 年 / 第 N 年的值是否與圖表對應年份一致

**確認（confirmed）**：

- **卡片「現在出售」總報酬**：`ResultsPanel.tsx` 第 99 行顯示 `sellNow.totalReturn`。`calculateSellNow()` 的 `totalReturn = pureProfit`（第 215 行），而 `pureProfit = netProceeds - initialInvestment`（第 209 行）。
- **圖表第 0 年 sellNow**：`yearlyProjections[0].sellNowCumulative = sellNowBase.pureProfit`（第 369 行），與卡片使用相同計算結果。
- **卡片「持有 N 年後出售」總報酬**：`ResultsPanel.tsx` 第 155 行顯示 `holdAndRent.totalReturn`。
- **圖表第 N 年 holdAndRent**：`yearlyProjections[N].holdAndRentCumulative = holdResult.totalReturn`（修正後的第 386 行），與卡片一致。

Commit message 中的手動驗證記錄與程式碼邏輯吻合。

---

## 檢查點三：變數命名是否清楚（totalReturn=純報酬, netProceeds=淨收入），有無混用純報酬與總資產

**確認（confirmed）**：

- `SellNowResult.netProceeds`：型別定義註解為「淨收入（萬元）= 賣房後拿到的現金」，正確。
- `SellNowResult.pureProfit`：型別定義註解為「純獲利（萬元）= 淨收入 - 初始投入」，正確。
- `SellNowResult.totalReturn`：型別定義註解為「總報酬（萬元）= 純獲利 + 再投資報酬」，正確。
- `HoldAndRentResult.totalReturn`：型別定義註解為「總報酬（萬元）」，公式已扣除初始投入，正確。
- `YearlyProjection.holdAndRentCumulative`：型別定義註解為「持有出租累積報酬」，修正後數值為純報酬，語意正確。

圖表註解已更新（第 131-135 行），明確說明「圖表顯示純報酬」，避免混淆。

---

## 檢查點四：業務邏輯是否被意外改變（任務要求只確保呈現一致）

**確認（confirmed）**：

- `calculateSellNow()` 未修改。
- `calculateHoldAndRent()` 未修改。
- `calculateBreakEvenYears()` 未修改。
- `generateYearlyProjections()` 的核心計算邏輯（租金、持有成本、房價成長、再投資報酬）未改變，只移除了對 `initialInvestment` 的加總，這正是導致圖表與卡片不一致的錯誤。

業務邏輯完整保留，只修正了呈現層的計算。

---

## 檢查點五：型別定義 (src/types/index.ts) 是否完整對應

**確認（confirmed）**：

- `SellNowResult` 包含 `netProceeds`, `initialInvestment`, `pureProfit`, `reinvestmentReturn`, `totalReturn`，完整。
- `HoldAndRentResult` 包含 `totalReturn`，完整。
- `YearlyProjection` 包含 `sellNowCumulative`, `holdAndRentCumulative`，完整。

型別定義與計算邏輯、UI 呈現完全對應。

---

## Build 與 Test 證據

Commit message 記錄：

- `npm run build`: Success (0 TypeScript errors)
- `npx playwright test`: 3 passed

證據類型為 Execution Log（最強），由 coder 在 commit 前執行並記錄於 commit message。符合審查規範「閱讀 diff 加上那些證據即可」。

</details>

---

<details>
<summary>File map</summary>

| File | Description |
|------|-------------|
| `src/utils/calculator.ts` | 移除 `generateYearlyProjections()` 中對 `initialInvestment` 的重複加總 |
| `src/components/charts/ComparisonChart.tsx` | 修正 `generateChartData()` 的年份映射邏輯，直接使用 `proj.year`；更新註解說明圖表語意 |
| `playwright-report/index.html` | 測試報告更新（base64 blob 變更，無審查意義） |

**Full diff**: `git diff HEAD~1`

</details>
