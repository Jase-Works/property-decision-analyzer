# 房產持有決策分析器 🏠

> 現在賣 vs 持有出租，哪個更划算？

幫助房產持有者分析「現在出售」與「持有 N 年後出售」兩種策略的投資報酬，做出更明智的決策。

## ✨ 功能特色

- 📊 **情境比較**：並列呈現「現在出售」vs「持有出租」的財務分析
- 💰 **完整成本計算**：包含交易成本、房地合一稅、貸款利息、持有成本
- 📈 **視覺化圖表**：Recharts 繪製的累積報酬比較圖
- 🎛️ **情境模擬**：調整房價年增率、租金年增率、持有年數等參數
- 🔗 **FUNRAISE MCP 整合**：接入台灣實價登錄和租金行情資料
- 📱 **響應式設計**：支援桌面和行動裝置

## 🚀 快速開始

### 安裝

```bash
# Clone repo
git clone https://github.com/Jase-Works/property-decision-analyzer.git
cd property-decision-analyzer

# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev
```

### 建置

```bash
npm run build
```

## 📖 使用說明

### 1. 輸入房產資料
- 選擇房產類型（預售屋/新成屋/中古屋/老屋）
- 選擇縣市和區域
- 輸入建坪、購入總價、購入日期

### 2. 輸入財務資料
- 貸款資訊：金額、利率、年限
- 持有成本：管理費、房屋稅、地價稅、保險
- 租金預估：月租金、空置率

### 3. 設定情境假設
- 持有年數
- 房價年增率
- 租金年增率
- 替代投資報酬率（現金改投 ETF 的預期報酬）

### 4. 取得市場資料
點擊「更新」按鈕取得市場行情：
- **有 FUNRAISE MCP**：使用真實的實價登錄和租金資料
- **無 MCP**：使用模擬資料（建議設定 MCP 取得更準確的分析）

### 5. 開始分析
點擊「開始分析」按鈕，系統會計算：
- 現在出售的淨收入和再投資報酬
- 持有 N 年的租金收入、持有成本、未來售價
- 兩種策略的總報酬和年化報酬率比較
- AI 建議：賣或持有

## 🔧 FUNRAISE MCP 設定

[FUNRAISE MCP](https://mcp.funraise.tw/) 是台灣不動產資料的 API 介接服務，提供：
- 實價登錄查詢
- 租金行情查詢
- 市場統計資料

### 設定步驟
1. 前往 [FUNRAISE MCP](https://mcp.funraise.tw/) 申請帳號
2. 取得你的 Config ID
3. 在本應用程式點擊右上角「MCP 設定」
4. 輸入 Config ID 並儲存

沒有 FUNRAISE 帳號也可以使用本工具，系統會使用模擬資料進行分析。

## 📐 計算邏輯

### 現在出售情境
```
淨收入 = 預估售價 - 交易成本 - 剩餘貸款 - 房地合一稅
再投資報酬 = 淨收入 × ((1 + 替代投資報酬率)^年數 - 1)
總報酬 = 淨收入 + 再投資報酬
```

### 持有出租情境
```
累計租金收入 = Σ(年租金 × (1 + 租金年增率)^年)
累計持有成本 = (管理費 + 稅金 + 保險) × 年數
累計房貸支出 = 月供 × 12 × 年數
未來售價 = 現價 × (1 + 房價年增率)^年數
總報酬 = 租金收入 - 持有成本 - 房貸支出 + (未來售價 - 交易成本 - 剩餘貸款 - 房地合一稅) - 初始投入
```

### 房地合一稅率
| 持有年限 | 稅率 |
|----------|------|
| 1 年內 | 45% |
| 2 年內 | 35% |
| 2-5 年 | 20% |
| 5-10 年 | 15% |
| 10 年以上 | 10% |

## 🛠️ 技術棧

- **框架**: React 19 + TypeScript
- **建置工具**: Vite 6
- **樣式**: Tailwind CSS v4
- **圖表**: Recharts
- **圖示**: Lucide Icons
- **API**: FUNRAISE MCP (Model Context Protocol)

## 📁 專案結構

```
src/
├── components/
│   ├── forms/           # 輸入表單元件
│   │   ├── PropertyForm.tsx
│   │   ├── FinancialForm.tsx
│   │   └── ScenarioForm.tsx
│   ├── results/         # 結果顯示元件
│   │   ├── MarketDataPanel.tsx
│   │   └── ResultsPanel.tsx
│   ├── charts/          # 圖表元件
│   │   └── ComparisonChart.tsx
│   └── McpConfigDialog.tsx
├── hooks/
│   └── useMarketData.ts # 市場資料 Hook
├── utils/
│   ├── calculator.ts    # 財務計算引擎
│   └── mcpClient.ts     # FUNRAISE MCP 客戶端
├── types/
│   └── index.ts         # TypeScript 類型定義
├── data/
│   └── taiwan-cities.ts # 台灣縣市行政區資料
└── App.tsx
```

## ⚠️ 免責聲明

本工具僅供參考，不構成投資建議。實際決策請諮詢專業人士。

- 計算結果基於使用者輸入的假設條件
- 市場資料可能存在時間延遲
- 稅務計算為簡化估算，實際稅負請諮詢稅務專家
- 房地產市場受多種因素影響，未來表現無法準確預測

## 📄 License

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

Made with ❤️ by [Jase Lin](https://github.com/jase-stack)
