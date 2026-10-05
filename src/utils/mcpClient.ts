/**
 * FUNRAISE MCP 客戶端
 * 封裝與 FUNRAISE MCP 的通訊，取得實價登錄和租金行情資料
 * 
 * 注意：在瀏覽器環境中，直接呼叫 MCP 會遇到 CORS 限制，
 * 因此會透過 /api/mcp-proxy 進行代理。
 */

import type { MarketData } from '../types';

// MCP 回應格式
interface McpResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// FUNRAISE 實價登錄查詢結果
interface ActualSalesResult {
  averagePrice: number;      // 平均單價（萬/坪）
  medianPrice: number;       // 中位數單價
  transactionCount: number;  // 成交筆數
  priceRange: {
    min: number;
    max: number;
  };
  recentTransactions: Array<{
    date: string;
    price: number;
    area: number;
    unitPrice: number;
  }>;
}

// FUNRAISE 租金行情查詢結果
interface ActualRentalsResult {
  averageRent: number;       // 平均月租金
  medianRent: number;        // 中位數月租金
  rentPerPing: number;       // 每坪租金
  listingCount: number;      // 物件數量
  rentRange: {
    min: number;
    max: number;
  };
}

/**
 * 判斷是否在瀏覽器環境
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 取得 API base URL
 * - 開發環境：使用本地 dev-proxy server (port 3001)
 * - 生產環境：使用 Vercel Edge Function proxy
 */
function getApiBaseUrl(): string {
  if (isBrowser()) {
    // 開發環境用本地 proxy，生產環境用相對路徑
    if (import.meta.env.DEV) {
      return 'http://localhost:3001/api/mcp-proxy';
    }
    return '/api/mcp-proxy';
  }
  // Server 環境：可以直接呼叫
  return '';
}

/**
 * MCP 客戶端類別
 */
export class McpClient {
  private configId: string;

  constructor(configId: string) {
    this.configId = configId;
  }

  /**
   * 發送 MCP 請求（透過 proxy）
   */
  private async sendRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const apiUrl = getApiBaseUrl();
    
    if (apiUrl) {
      // 使用 proxy
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId: this.configId,
          method,
          params,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: McpResponse<T> = await response.json();

      if (data.error) {
        throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
      }

      if (!data.result) {
        throw new Error('Empty result from MCP');
      }

      return data.result;
    } else {
      // 直接呼叫（Server 環境）
      const mcpUrl = `https://connector.mcp.funraise.ai/c/${this.configId}/mcp`;
      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: McpResponse<T> = await response.json();

      if (data.error) {
        throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
      }

      if (!data.result) {
        throw new Error('Empty result from MCP');
      }

      return data.result;
    }
  }

  /**
   * 列出可用的工具
   */
  async listTools(): Promise<string[]> {
    const result = await this.sendRequest<{ tools: Array<{ name: string }> }>('tools/list', {});
    return result.tools.map((t) => t.name);
  }

  /**
   * 呼叫工具
   */
  async callTool<T>(toolName: string, args: Record<string, unknown>): Promise<T> {
    return this.sendRequest<T>('tools/call', {
      name: toolName,
      arguments: args,
    });
  }

  /**
   * 查詢實價登錄資料
   */
  async searchActualSales(
    city: string,
    district: string,
    options?: {
      propertyType?: string;
      minArea?: number;
      maxArea?: number;
      months?: number;
    }
  ): Promise<ActualSalesResult> {
    return this.callTool<ActualSalesResult>('search_actual_sales', {
      city,
      district,
      property_type: options?.propertyType || '住宅',
      min_area: options?.minArea,
      max_area: options?.maxArea,
      months: options?.months || 12,
    });
  }

  /**
   * 查詢租金行情
   */
  async searchActualRentals(
    city: string,
    district: string,
    options?: {
      propertyType?: string;
      minArea?: number;
      maxArea?: number;
    }
  ): Promise<ActualRentalsResult> {
    return this.callTool<ActualRentalsResult>('search_actual_rentals', {
      city,
      district,
      property_type: options?.propertyType || '住宅',
      min_area: options?.minArea,
      max_area: options?.maxArea,
    });
  }
}

/**
 * 從 FUNRAISE MCP 取得市場資料
 */
export async function fetchMarketData(
  configId: string,
  city: string,
  district: string,
  area?: number
): Promise<MarketData> {
  const client = new McpClient(configId);

  // 根據面積設定查詢範圍
  const areaOptions = area
    ? {
        minArea: Math.max(1, area - 10),
        maxArea: area + 10,
      }
    : undefined;

  // 並行查詢實價登錄和租金行情
  const [salesData, rentalData] = await Promise.all([
    client.searchActualSales(city, district, areaOptions).catch(() => null),
    client.searchActualRentals(city, district, areaOptions).catch(() => null),
  ]);

  // 如果兩者都失敗，拋出錯誤
  if (!salesData && !rentalData) {
    throw new Error('無法取得市場資料，請確認 MCP 設定是否正確');
  }

  // 計算年增率（需要歷史資料比較，這裡使用估算值）
  // TODO: 實際應該查詢去年同期資料來計算
  const estimatedPriceYoY = 2.5; // 假設年增率 2.5%
  const estimatedRentYoY = 1.5;  // 假設年增率 1.5%

  // 計算毛租金報酬率
  const averagePrice = salesData?.averagePrice || 0;
  const averageRent = rentalData?.averageRent || 0;
  const grossYield = averagePrice > 0 && averageRent > 0
    ? (averageRent * 12) / (averagePrice * (area || 30) * 10000) * 100
    : 2.5; // 預設 2.5%

  return {
    city,
    district,
    averagePrice: salesData?.averagePrice || 0,
    priceYoYChange: estimatedPriceYoY,
    averageRent: rentalData?.averageRent || 0,
    rentYoYChange: estimatedRentYoY,
    transactionVolume: salesData?.transactionCount || 0,
    volumeYoYChange: 0,
    grossYield,
    lastUpdated: new Date().toISOString(),
    dataSource: 'FUNRAISE MCP',
  };
}

/**
 * 測試 MCP 連線
 */
export async function testMcpConnection(configId: string): Promise<boolean> {
  try {
    const client = new McpClient(configId);
    const tools = await client.listTools();
    return tools.length > 0;
  } catch {
    return false;
  }
}
