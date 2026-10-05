/**
 * PropertyForm - 房產基本資料輸入表單
 * 讓使用者輸入房產的基本資訊：類型、地點、面積、購入價格等
 */

import type { PropertyData } from '../../types';
import { TAIWAN_CITIES, getDistrictsByCity } from '../../data/taiwan-cities';

interface PropertyFormProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}

export function PropertyForm({ data, onChange }: PropertyFormProps) {
  const districts = getDistrictsByCity(data.city);

  const handleChange = (field: keyof PropertyData, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
        房產基本資料
      </h2>
      
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
            onChange={(e) => {
              handleChange('city', e.target.value);
              handleChange('district', ''); // 清空區域
            }}
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
