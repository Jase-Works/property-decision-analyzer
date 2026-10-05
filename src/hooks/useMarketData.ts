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
  fetchData: (property: PropertyData, mcpConfigId: string, address?: string) => Promise<void>;
  setManualData: (data: MarketData) => void;
  clearData: () => void;
}

interface StreetData {
  avgPrice: number;      // 萬/坪
  medianPrice: number;   // 萬/坪
  minPrice: number;      // 萬/坪
  maxPrice: number;      // 萬/坪
  count: number;         // 成交筆數
}

interface CachedDistrictData {
  transactionCount: number;
  avgPrice: number;
  medianPrice: number;
  pricePerPing: number;
  avgRent: number;
  rentPerPing: number;
  grossYield: number;
  streets?: {            // 路段資料（如有）
    [street: string]: StreetData;
  };
}

interface CacheStructure {
  generatedAt: string;
  dataSource: string;
  transactionYear: number;
  version?: string;
  features?: string[];
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
 * 從地址中提取路段名稱
 */
function extractStreetFromAddress(address: string, district: string): string | null {
  if (!address || !address.includes(district)) return null;
  
  // 移除縣市區前綴
  const prefixPattern = new RegExp(`.*${district}`);
  const afterDistrict = address.replace(prefixPattern, '');
  
  // 匹配路段名（支援「路N段」「街」「大道N段」格式）
  const match = afterDistrict.match(/^([^\d巷弄號]+(?:路|街|大道)(?:[一二三四五六七八九十]+段)?)/);
  return match ? match[1] : null;
}

/**
 * 從快取中取得市場資料
 * 如果有地址且該路段有資料，優先使用路段行情
 */
function getMarketDataFromCache(
  city: string, 
  district: string, 
  area: number,
  address?: string
): MarketData | null {
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

  // 嘗試取得路段資料
  let streetData: StreetData | null = null;
  let streetName: string | null = null;
  
  if (address && districtData.streets) {
    streetName = extractStreetFromAddress(address, district);
    if (streetName && districtData.streets[streetName]) {
      streetData = districtData.streets[streetName];
    }
  }

  // 決定使用路段或區域均價
  const pricePerPing = streetData ? streetData.avgPrice : districtData.pricePerPing;
  const priceSource = streetData 
    ? `${streetName} 路段行情（${streetData.count} 筆成交）`
    : `${district} 區域均價`;

  // 計算該物件的預估租金（基於坪數和每坪租金）
  const estimatedRent = Math.round(districtData.rentPerPing * area);

  // 計算價格範圍（如有路段資料）
  const priceRange = streetData 
    ? { min: streetData.minPrice, max: streetData.maxPrice }
    : undefined;

  return {
    city: normalizedCity,
    district: district,
    averagePrice: pricePerPing,
    priceYoYChange: 2.5, // 預設年增率（可從歷史資料計算）
    averageRent: estimatedRent,
    rentYoYChange: 1.5, // 預設年增率
    transactionVolume: districtData.transactionCount,
    volumeYoYChange: 5.0,
    grossYield: districtData.grossYield,
    lastUpdated: cache.generatedAt,
    dataSource: `${cache.dataSource}（民國 ${cache.transactionYear} 年）- ${priceSource}`,
    // 擴展欄位
    streetName: streetName || undefined,
    priceRange,
    dataLevel: streetData ? 'street' : 'district',
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

  const fetchData = useCallback(async (property: PropertyData, _mcpConfigId: string, address?: string) => {
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

      // 優先從快取取得資料（包含路段資料）
      const cachedData = getMarketDataFromCache(
        property.city,
        property.district,
        property.area || 30, // 預設 30 坪
        address
      );

      if (cachedData) {
        setMarketData(cachedData);
        // 如果有路段資料，顯示提示
        if (cachedData.dataLevel === 'street' && cachedData.streetName) {
          setError(null);
        } else if (address && cachedData.dataLevel === 'district') {
          // 有地址但沒有路段資料
          setError(`${cachedData.district} 尚無「${extractStreetFromAddress(address, property.district) || '該路段'}」的詳細行情，使用區域均價。`);
        } else {
          setError(null);
        }
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
