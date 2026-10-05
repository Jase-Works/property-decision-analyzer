/**
 * McpConfigDialog - MCP 設定對話框
 * 讓使用者設定 FUNRAISE MCP 的連線資訊
 */

import { useState } from 'react';
import { X, HelpCircle, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface McpConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configId: string) => void;
  currentConfigId: string;
}

export function McpConfigDialog({ isOpen, onClose, onSave, currentConfigId }: McpConfigDialogProps) {
  const [configId, setConfigId] = useState(currentConfigId);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!configId.trim()) {
      setTestError('請輸入 Config ID');
      return;
    }

    setTestStatus('testing');
    setTestError(null);

    try {
      // 測試 MCP 連線
      const response = await fetch(`https://connector.mcp.funraise.ai/c/${configId}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        }),
      });

      if (response.ok) {
        setTestStatus('success');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestError(error instanceof Error ? error.message : '連線失敗');
    }
  };

  const handleSave = () => {
    if (configId.trim()) {
      onSave(configId.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            FUNRAISE MCP 設定
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">什麼是 FUNRAISE MCP？</p>
                <p className="text-blue-700">
                  FUNRAISE MCP 提供台灣不動產市場資料的 API 介接服務，包含實價登錄、租金行情等數據。
                  您需要先在 FUNRAISE 網站申請 Config ID 才能使用。
                </p>
                <a
                  href="https://mcp.funraise.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800"
                >
                  前往申請 <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Config ID 輸入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Config ID
            </label>
            <input
              type="text"
              value={configId}
              onChange={(e) => {
                setConfigId(e.target.value);
                setTestStatus('idle');
                setTestError(null);
              }}
              placeholder="例如：abc123def456"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL 格式：https://connector.mcp.funraise.ai/c/<strong>{configId || 'your-config-id'}</strong>/mcp
            </p>
          </div>

          {/* 測試狀態 */}
          {testStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">連線測試成功！</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">
                連線失敗：{testError || '未知錯誤'}
              </span>
            </div>
          )}

          {/* 無 Config ID 提示 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>沒有 Config ID？</strong> 您仍可使用本工具，系統將使用預設估算值進行分析。
              市場資料功能會被停用，但所有財務計算功能皆可正常使用。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={handleTest}
            disabled={!configId.trim() || testStatus === 'testing'}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testStatus === 'testing' ? '測試中...' : '測試連線'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
