/**
 * useMarketData - 市場資料 Hook
 * 管理從 FUNRAISE MCP 取得市場資料的狀態和邏輯
 */

import { useState, useCallback } from 'react';
import type { MarketData, PropertyData } from '../types';
import { fetchMarketData } from '../utils/mcpClient';

interface UseMarketDataReturn {
  marketData: MarketData | null;
  isLoading: boolean;
  error: string | null;
  fetchData: (property: PropertyData, mcpConfigId: string) => Promise<void>;
  setManualData: (data: MarketData) => void;
  clearData: () => void;
}

/**
 * 生成模擬的市場資料（當 MCP 不可用時使用）
 */
function generateMockMarketData(property: PropertyData): MarketData {
  // 根據縣市估算基準價格
  const cityPriceMultiplier: Record<string, number> = {
    '台北市': 1.0,
    '新北市': 0.6,
    '桃園市': 0.45,
    '台中市': 0.5,
    '台南市': 0.35,
    '高雄市': 0.4,
  };
  
  const multiplier = cityPriceMultiplier[property.city] || 0.35;
  const basePrice = 80 * multiplier; // 台北基準 80 萬/坪
  
  // 加入一些隨機變化
  const priceVariation = (Math.random() - 0.5) * 10;
  const averagePrice = basePrice + priceVariation;
  
  // 估算租金（每坪約 800-1500 元/月）
  const rentPerPing = 800 + multiplier * 700;
  const averageRent = rentPerPing * property.area;
  
  // 計算毛租金報酬率
  const grossYield = (averageRent * 12) / (averagePrice * property.area * 10000) * 100;
  
  return {
    city: property.city,
    district: property.district,
    averagePrice: Math.round(averagePrice * 10) / 10,
    priceYoYChange: Math.round((Math.random() * 6 - 1) * 10) / 10, // -1% ~ 5%
    averageRent: Math.round(averageRent),
    rentYoYChange: Math.round((Math.random() * 4 - 0.5) * 10) / 10, // -0.5% ~ 3.5%
    transactionVolume: Math.floor(Math.random() * 80 + 20),
    volumeYoYChange: Math.round((Math.random() * 30 - 10) * 10) / 10,
    grossYield: Math.round(grossYield * 100) / 100,
    lastUpdated: new Date().toISOString(),
    dataSource: '模擬資料（建議設定 FUNRAISE MCP 取得真實數據）',
  };
}

export function useMarketData(): UseMarketDataReturn {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (property: PropertyData, mcpConfigId: string) => {
    // 驗證輸入
    if (!property.city || !property.district) {
      setError('請先選擇縣市和區域');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mcpConfigId) {
        // 使用 FUNRAISE MCP 取得真實資料
        const data = await fetchMarketData(
          mcpConfigId,
          property.city,
          property.district,
          property.area
        );
        setMarketData(data);
      } else {
        // 沒有設定 MCP，使用模擬資料
        // 模擬網路延遲
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockData = generateMockMarketData(property);
        setMarketData(mockData);
        setError('未設定 FUNRAISE MCP，使用模擬資料。建議設定 MCP 取得真實數據。');
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      
      // MCP 失敗時 fallback 到模擬資料
      const mockData = generateMockMarketData(property);
      setMarketData(mockData);
      setError(
        `無法從 FUNRAISE MCP 取得資料（${err instanceof Error ? err.message : '未知錯誤'}），已使用模擬資料。`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setManualData = useCallback((data: MarketData) => {
    setMarketData(data);
    setError(null);
  }, []);

  const clearData = useCallback(() => {
    setMarketData(null);
    setError(null);
  }, []);

  return {
    marketData,
    isLoading,
    error,
    fetchData,
    setManualData,
    clearData,
  };
}
