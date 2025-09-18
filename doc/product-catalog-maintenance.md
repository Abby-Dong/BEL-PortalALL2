# 產品目錄維護指南 (Product Catalog Maintenance Guide)

## 概述 (Overview)

產品目錄現在以 JSON 格式維護，位於 `data/productCatalog.json` 文件中。這使得產品資料的管理更加靈活且易於維護。

## 文件結構 (File Structure)

```
data/
├── productCatalog.json    # 產品目錄主文件
└── dataConfig.json       # 數據配置文件（已更新包含產品目錄）
```

## JSON 格式 (JSON Format)

### 產品目錄結構
```json
{
  "productCatalog": [
    {
      "name": "產品型號",
      "description": "產品描述",
      "category": "產品分類",
      "avgPrice": 價格數字,
      "levelFactor": {
        "Exploder": 0.0-2.0,
        "Leader": 0.0-2.0,
        "Enabler": 0.0-2.0,
        "Builder": 0.0-2.0
      }
    }
  ]
}
```

### 欄位說明 (Field Description)

| 欄位 | 類型 | 說明 |
|------|------|------|
| `name` | String | 產品型號/名稱 |
| `description` | String | 產品描述 |
| `category` | String | 產品分類 |
| `avgPrice` | Number | 平均價格（美元） |
| `levelFactor` | Object | BEL 等級乘數因子 |

### BEL 等級乘數因子 (Level Factor)

`levelFactor` 用於根據 BEL 的等級調整產品的銷售傾向：

- **Exploder**: 初級 BEL，通常偏好低價產品
- **Leader**: 領導級 BEL，通常偏好高價值產品
- **Enabler**: 賦能者 BEL，平衡型銷售模式
- **Builder**: 建構者 BEL，偏好基礎建設類產品

乘數範圍：
- `0.0-0.5`: 低傾向
- `0.6-1.0`: 中等傾向  
- `1.1-1.5`: 高傾向
- `1.6-2.0`: 極高傾向

## 產品分類 (Product Categories)

目前支援的產品分類：

1. **IoT Gateway & Edge Intelligence**
2. **Peripherals & Modules**
3. **Embedded Computers**
4. **Mobile Tablets & Devices**
5. **Industrial Computer Boards**
6. **Edge AI Solutions**
7. **Network Communications**
8. **Remote I/O Modules**
9. **Wireless Sensing & Solutions**
10. **AIoT Software & Solutions**
11. **Industrial Servers & IPC**
12. **Industrial IoT Gateways**

## 維護操作 (Maintenance Operations)

### 新增產品 (Adding Products)

1. 編輯 `data/productCatalog.json`
2. 在 `productCatalog` 陣列中新增產品物件
3. 確保所有必要欄位都已填寫
4. 測試應用程式以確認載入正常

### 修改產品 (Modifying Products)

1. 找到要修改的產品物件
2. 更新相應欄位
3. 保存文件
4. 重新載入應用程式

### 刪除產品 (Removing Products)

1. 從 `productCatalog` 陣列中移除對應的產品物件
2. 保存文件
3. 測試以確認沒有引用錯誤

## 驗證與測試 (Validation & Testing)

### JSON 語法驗證
使用線上 JSON 驗證工具或 IDE 確保語法正確。

### 應用程式測試
1. 啟動本地伺服器：`python3 -m http.server 8000`
2. 開啟瀏覽器訪問：`http://localhost:8000`
3. 檢查瀏覽器控制台是否有錯誤訊息
4. 測試 BEL 模態視窗中的客戶洞察功能

## 錯誤處理 (Error Handling)

如果 JSON 文件載入失敗，應用程式會自動使用內建的 fallback 產品數據，包含：
- ADAM-6017-D
- WISE-4050E  
- EKI-2711PSI-A

## 注意事項 (Important Notes)

1. **備份**：修改前請備份原始文件
2. **語法**：確保 JSON 語法正確（括號、引號、逗號）
3. **編碼**：使用 UTF-8 編碼保存文件
4. **測試**：每次修改後都要測試應用程式功能

## 範例 (Examples)

### 新增單一產品
```json
{
  "name": "ADAM-6052-D",
  "description": "8-ch Isolated Digital I/O, Modbus/TCP, WISE-PaaS",
  "category": "Remote I/O Modules",
  "avgPrice": 489,
  "levelFactor": {
    "Explorer": 1.2,
    "Leader": 1.2,
    "Enabler": 1.3,
    "Builder": 1.5
  }
}
```

### 修改價格
```json
// 修改前
"avgPrice": 489,

// 修改後
"avgPrice": 519,
```

---

最後更新：2025年9月6日  
維護者：Abby Dong
