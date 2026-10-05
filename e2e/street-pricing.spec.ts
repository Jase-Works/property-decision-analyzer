import { test, expect } from '@playwright/test';

test.describe('Street-level pricing feature', () => {
  test('should display street-level pricing for Banqiao addresses', async ({ page }) => {
    await page.goto('/');
    
    // 輸入板橋區文化路一段的地址（該路段在快取中）
    const addressInput = page.getByPlaceholder('例如：台北市信義區信義路五段7號');
    await addressInput.fill('新北市板橋區文化路一段100號');
    await addressInput.blur();
    
    // 等待自動解析
    await expect(page.getByText('已自動填入：新北市 板橋區')).toBeVisible({ timeout: 3000 });
    
    // 點擊更新市場資料
    await page.click('button:has-text("更新")');
    
    // 等待載入完成
    await page.waitForSelector('text=路段均價', { timeout: 5000 });
    
    // 驗證顯示路段行情 - 使用 getByText + exact
    await expect(page.getByText('使用', { exact: false }).filter({ hasText: '文化路一段' })).toBeVisible();
    await expect(page.getByText('路段均價', { exact: true })).toBeVisible();
    
    // 驗證價格範圍顯示（在路段提示框內）
    await expect(page.locator('.bg-green-50')).toBeVisible();
  });

  test('should fallback to district pricing for unknown streets', async ({ page }) => {
    await page.goto('/');
    
    // 輸入板橋區未知路段的地址
    const addressInput = page.getByPlaceholder('例如：台北市信義區信義路五段7號');
    await addressInput.fill('新北市板橋區測試路一段1號');
    await addressInput.blur();
    
    // 等待自動解析
    await expect(page.getByText('已自動填入：新北市 板橋區')).toBeVisible({ timeout: 3000 });
    
    // 點擊更新市場資料
    await page.click('button:has-text("更新")');
    
    // 等待載入完成
    await page.waitForSelector('text=區域均價', { timeout: 5000 });
    
    // 驗證顯示區域均價標籤
    await expect(page.getByText('區域均價', { exact: true })).toBeVisible();
    
    // 應該顯示提示訊息（在黃色警告框中）
    await expect(page.getByText('尚無「測試路一段」的詳細行情')).toBeVisible();
  });

  test('should show known streets in cache for Banqiao', async ({ page }) => {
    await page.goto('/');
    
    // 測試幾個已知路段
    const testStreets = [
      { address: '新北市板橋區華江一路50號', street: '華江一路' },
      { address: '新北市板橋區民生路三段88號', street: '民生路三段' },
      { address: '新北市板橋區新府路100號', street: '新府路' },
    ];
    
    for (const { address, street } of testStreets) {
      // 清空並重新輸入
      const addressInput = page.getByPlaceholder('例如：台北市信義區信義路五段7號');
      await addressInput.clear();
      await addressInput.fill(address);
      await addressInput.blur();
      
      // 點擊更新
      await page.click('button:has-text("更新")');
      
      // 驗證路段名顯示（在綠色提示框的 strong 標籤內）
      await expect(page.locator(`.bg-green-50 strong:has-text("${street}")`)).toBeVisible({ timeout: 5000 });
    }
  });
});
