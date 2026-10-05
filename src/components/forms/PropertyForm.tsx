/**
 * PropertyForm - 房產基本資料輸入表單
 * 讓使用者輸入房產的基本資訊：類型、地點、面積、購入價格等
 * 支援地址輸入自動解析縣市區域
 */

import { useState, useCallback } from 'react';
import type { PropertyData } from '../../types';
import { TAIWAN_CITIES, getDistrictsByCity } from '../../data/taiwan-cities';

interface PropertyFormProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}

/**
 * 從地址解析縣市和區域
 */
function parseAddressLocation(address: string): {
  city: string | null;
  district: string | null;
} {
  // 縣市列表（依長度排序，避免「新北市」被「北市」誤匹配）
  const cities = [
    '台北市', '臺北市', '新北市', '桃園市', '台中市', '臺中市',
    '台南市', '臺南市', '高雄市', '基隆市', '新竹市', '嘉義市',
    '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
    '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '臺東縣', '澎湖縣',
    '金門縣', '連江縣',
  ].sort((a, b) => b.length - a.length);

  let city: string | null = null;
  let district: string | null = null;

  // 找縣市
  for (const c of cities) {
    if (address.includes(c)) {
      city = c.replace('臺', '台');
      break;
    }
  }

  // 找區域（縣市後面的「X區」「X鄉」「X鎮」「X市」）
  if (city) {
    const normalizedAddress = address.replace('臺', '台');
    const cityIndex = normalizedAddress.indexOf(city);
    const afterCity = normalizedAddress.slice(cityIndex + city.length);
    if (afterCity) {
      const districtMatch = afterCity.match(/^([^\d路街巷弄號]+[區鄉鎮市])/);
      if (districtMatch) {
        district = districtMatch[1];
      }
    }
  }

  return { city, district };
}

export function PropertyForm({ data, onChange }: PropertyFormProps) {
  const [addressInput, setAddressInput] = useState('');
  const [addressParsed, setAddressParsed] = useState(false);
  
  const districts = getDistrictsByCity(data.city);

  const handleChange = (field: keyof PropertyData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  const handleCityChange = (city: string) => {
    onChange({ ...data, city, district: '' });
    setAddressParsed(false);
  };

  const handleAddressInput = useCallback((address: string) => {
    setAddressInput(address);
    
    if (address.length >= 5) {
      const { city, district } = parseAddressLocation(address);
      if (city && district) {
        onChange({ ...data, city, district });
        setAddressParsed(true);
      } else if (city) {
        onChange({ ...data, city, district: '' });
        setAddressParsed(false);
      }
    }
  }, [data, onChange]);

  const handleAddressBlur = useCallback(() => {
    // 當失去焦點時，再次嘗試解析
    if (addressInput.length >= 5) {
      const { city, district } = parseAddressLocation(addressInput);
      if (city) {
        const newData = { ...data, city };
        if (district) {
          newData.district = district;
          setAddressParsed(true);
        }
        onChange(newData);
      }
    }
  }, [addressInput, data, onChange]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
        房產基本資料
      </h2>
      
      {/* 地址快速輸入 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <label className="block text-sm font-medium text-blue-700 mb-1">
          📍 快速輸入：貼上地址自動填入縣市區域
        </label>
        <input
          type="text"
          value={addressInput}
          onChange={(e) => handleAddressInput(e.target.value)}
          onBlur={handleAddressBlur}
          placeholder="例如：台北市信義區信義路五段7號"
          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        {addressParsed && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            ✓ 已自動填入：{data.city} {data.district}
          </p>
        )}
        {addressInput && !addressParsed && data.city && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠ 僅識別到縣市，請手動選擇區域
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 房產類型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            房產類型 <span className="text-red-500">*</span>
          </label>
          <select
            value={data.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="presale">預售屋</option>
            <option value="new">新成屋</option>
            <option value="existing">中古屋</option>
            <option value="old">老屋</option>
          </select>
        </div>

        {/* 縣市 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            縣市 <span className="text-red-500">*</span>
          </label>
          <select
            value={data.city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">請選擇縣市</option>
            {TAIWAN_CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* 區域 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            區域 <span className="text-red-500">*</span>
          </label>
          <select
            value={data.district}
            onChange={(e) => handleChange('district', e.target.value)}
            disabled={!data.city}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">請選擇區域</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* 建坪 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            建坪（坪） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.area || ''}
            onChange={(e) => handleChange('area', parseFloat(e.target.value) || 0)}
            placeholder="例如：30"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 購入總價 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            購入總價（萬元） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.purchasePrice || ''}
            onChange={(e) => handleChange('purchasePrice', parseFloat(e.target.value) || 0)}
            placeholder="例如：1500"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {data.purchasePrice > 0 && data.area > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              單價：{(data.purchasePrice / data.area).toFixed(1)} 萬/坪
            </p>
          )}
        </div>

        {/* 購入日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            購入日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={data.purchaseDate}
            onChange={(e) => handleChange('purchaseDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 預計交屋日期（僅預售屋顯示） */}
        {data.propertyType === 'presale' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              預計交屋日期
            </label>
            <input
              type="date"
              value={data.expectedDeliveryDate || ''}
              onChange={(e) => handleChange('expectedDeliveryDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* 屋齡（非預售屋顯示） */}
        {data.propertyType !== 'presale' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              屋齡（年）
            </label>
            <input
              type="number"
              value={data.buildingAge || ''}
              onChange={(e) => handleChange('buildingAge', parseInt(e.target.value) || 0)}
              placeholder="例如：5"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
