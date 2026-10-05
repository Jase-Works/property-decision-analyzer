/**
 * useMarketData - 市場資料 Hook
 * 優先使用預先快取的 FUNRAISE MCP 真實資料
 */

import { useState, useCallback } from 'react';
import type { MarketData, PropertyData } from '../types';
import marketDataCache from '../data/market-data-cache.json';

interface UseMarketDataReturn {
  marketData: MarketData | null;
  isLoading: boolean;
  error: string | null;
  fetchData: (property: PropertyData, mcpConfigId: string) => Promise<void>;
  setManualData: (data: MarketData) => void;
  clearData: () => void;
}

interface CachedDistrictData {
  transactionCount: number;
  avgPrice: number;
  medianPrice: number;
  pricePerPing: number;
  avgRent: number;
  rentPerPing: number;
  grossYield: number;
}

interface CacheStructure {
  generatedAt: string;
  dataSource: string;
  transactionYear: number;
  cities: {
    [city: string]: {
      districts: {
        [district: string]: CachedDistrictData;
      };
    };
  };
}

const cache = marketDataCache as CacheStructure;

/**
 * 從快取中取得市場資料
 */
function getMarketDataFromCache(city: string, district: string, area: number): MarketData | null {
  // 處理台/臺轉換
  const normalizedCity = city.replace('臺', '台');
  
  const cityData = cache.cities[normalizedCity];
  if (!cityData) {
    return null;
  }

  const districtData = cityData.districts[district];
  if (!districtData) {
    return null;
  }

  // 計算該物件的預估租金（基於坪數和每坪租金）
  const estimatedRent = Math.round(districtData.rentPerPing * area);

  return {
    city: normalizedCity,
    district: district,
    averagePrice: districtData.pricePerPing,
    priceYoYChange: 2.5, // 預設年增率（可從歷史資料計算）
    averageRent: estimatedRent,
    rentYoYChange: 1.5, // 預設年增率
    transactionVolume: districtData.transactionCount,
    volumeYoYChange: 5.0,
    grossYield: districtData.grossYield,
    lastUpdated: cache.generatedAt,
    dataSource: `${cache.dataSource}（民國 ${cache.transactionYear} 年成交資料）`,
  };
}

/**
 * 生成模擬的市場資料（當快取中沒有該區域時使用）
 */
function generateFallbackMarketData(property: PropertyData): MarketData {
  // 根據縣市估算基準價格
  const cityPriceMultiplier: Record<string, number> = {
    '台北市': 1.0,
    '臺北市': 1.0,
    '新北市': 0.6,
    '桃園市': 0.45,
    '台中市': 0.5,
    '臺中市': 0.5,
    '台南市': 0.35,
    '臺南市': 0.35,
    '高雄市': 0.4,
  };
  
  const normalizedCity = property.city.replace('臺', '台');
  const multiplier = cityPriceMultiplier[normalizedCity] || 0.35;
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
    city: normalizedCity,
    district: property.district,
    averagePrice: Math.round(averagePrice * 10) / 10,
    priceYoYChange: Math.round((Math.random() * 6 - 1) * 10) / 10,
    averageRent: Math.round(averageRent),
    rentYoYChange: Math.round((Math.random() * 4 - 0.5) * 10) / 10,
    transactionVolume: Math.floor(Math.random() * 80 + 20),
    volumeYoYChange: Math.round((Math.random() * 30 - 10) * 10) / 10,
    grossYield: Math.round(grossYield * 100) / 100,
    lastUpdated: new Date().toISOString(),
    dataSource: '模擬資料（該區域尚無快取資料）',
  };
}

export function useMarketData(): UseMarketDataReturn {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (property: PropertyData, _mcpConfigId: string) => {
    // 驗證輸入
    if (!property.city || !property.district) {
      setError('請先選擇縣市和區域');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 模擬網路延遲，讓使用者知道有在處理
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 優先從快取取得資料
      const cachedData = getMarketDataFromCache(
        property.city,
        property.district,
        property.area || 30 // 預設 30 坪
      );

      if (cachedData) {
        setMarketData(cachedData);
        setError(null);
      } else {
        // 快取中沒有，使用推估資料
        const fallbackData = generateFallbackMarketData(property);
        setMarketData(fallbackData);
        setError(`${property.city}${property.district} 尚無快取資料，使用推估值。`);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      const fallbackData = generateFallbackMarketData(property);
      setMarketData(fallbackData);
      setError(`資料讀取錯誤，使用推估值。`);
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
