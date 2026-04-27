# 元器件购买

本文档用于解答关于元件购买的常见问题。

## BOM 清单

<BomTable />

::: tip 导出功能
点击「导出 CSV」可下载完整的 BOM 表格，点击「购物清单」可生成按供应商分组的采购清单。
:::

::: info 其他格式
如需 HTML 格式的 BOM 文件，请从 [Release](https://github.com/rhodesepass/docs/releases) 下载：
- `electric_pass_baseboard_V#.#.#_.BOM.html`
:::

## 常见问题

### 按钮

规格：**2 × 4 × 3.5** 小贝贝

> 指 BOM 表链接，若在别处购买请按照实际尺寸

![按钮规格](/images/2_1.png)

### 肖特基二极管

型号：**1N5819WS SS14**

封装：**SOD-323**

::: danger 务必注意
封装是 **SOD-323**（非常重要，已有N人买错）
:::

![肖特基二极管](/images/2_2.png)

## 购买建议

1. **优先使用 BOM 表中的链接** - 确保规格一致
2. **注意封装尺寸** - 特别是二极管、电容等
3. **适当备货** - 小元件容易丢失，建议多买一些

## 下一步

购买完元器件后，请先阅读 [贴装须知](./assembly-notes.md)！

---

## 开发者指南：维护 BOM 数据

::: details 点击展开开发者文档

### 文件结构

```
docs/
├── .vitepress/theme/
│   ├── components/          # Vue 组件
│   │   ├── BomTable.vue           # 主表格组件
│   │   ├── BomVersionSelector.vue # 版本选择器
│   │   ├── BomCategoryFilter.vue  # 分类筛选
│   │   ├── BomSearchBar.vue       # 搜索框
│   │   ├── BomSummary.vue         # 价格汇总
│   │   └── BomExport.vue          # 导出功能
│   └── styles/
│       └── bom-table.css    # BOM 表格样式
├── public/bom/              # BOM 数据文件
│   ├── index.json           # 版本索引
│   ├── v0.3.1.json
│   ├── v0.4.json
│   ├── v0.5.1.json
│   └── v0.6.json
scripts/
└── excel-to-json.js         # Excel 转换脚本
```

::: info 更新 BOM 数据的两种方法

- 如果只是改少量价格、链接或描述，直接编辑 `docs/public/bom/*.json` 更省事。
- 如果要从 KiCad / 立创 EDA 重新导出一整版采购数据，再使用 Excel 转换脚本更合适。
- Excel 模板中的 **位号列现在是可选项**，不再是必填字段。
:::

### 方法一：使用 Excel 转换脚本

适用于从 KiCad/立创EDA 等工具导出的 Excel BOM 文件。

**1. 安装依赖（仅首次）**

```bash
npm install
```

**2. 准备 Excel 文件**

建议 Excel 文件包含以下列（支持中英文表头）：

| 英文表头 | 中文表头 | 说明 |
|---------|---------|------|
| Designator / Reference | 位号 | 可选，如 U1, C1, R1 |
| Value / Comment | 值 | 如 F1C200S, 100nF |
| Footprint | 封装 | 如 QFN-88, 0402 |
| Quantity | 数量 | 数字 |
| Description | 描述 | 元件描述 |
| Supplier | 供应商 | 如 立创商城 |
| SupplierURL | 链接 | 购买链接 |
| UnitPrice / Price | 单价 | 数字，单位：元 |

**3. 运行转换脚本**

```bash
node scripts/excel-to-json.js 你的BOM文件.xlsx v0.7
```

脚本会自动：
- 生成 `docs/public/bom/v0.7.json`
- 更新 `docs/public/bom/index.json` 版本索引
- 根据元件值、封装、描述和位号（如有）自动识别分类

::: warning 自动分类的边界
去掉位号后，分类更多依赖值、封装和描述字段，因此：

- `Value` 和 `Description` 最好写清楚，不要只保留过于简短的代号
- 若自动分类不准确，生成后请手动修正 JSON 中的 `category`
:::

### 方法二：手动编辑 JSON 文件

**1. 复制现有版本文件**

```bash
cp docs/public/bom/v0.6.json docs/public/bom/v0.7.json
```

**2. 编辑 JSON 文件**

```json
{
  "version": "v0.7",
  "metadata": {
    "totalComponents": 25,
    "generatedAt": "2024-01-20T00:00:00.000Z"
  },
  "categories": [
    { "id": "power", "name": "电源部分", "color": "#4CAF50" },
    { "id": "core", "name": "核心部分", "color": "#2196F3" },
    { "id": "display", "name": "屏幕部分", "color": "#F44336" },
    { "id": "expansion", "name": "扩展部分", "color": "#3F51B5" },
    { "id": "connector", "name": "接插件", "color": "#FF9800" },
    { "id": "passive", "name": "无源器件", "color": "#9C27B0" }
  ],
  "components": [
    {
      "id": "1",
      "reference": "U1",
      "value": "F1C200S",
      "footprint": "QFN-88",
      "quantity": 1,
      "description": "全志 F1C200S 主控芯片",
      "category": "core",
      "supplier": {
        "name": "立创商城",
        "url": "https://item.szlcsc.com/310292.html",
        "unitPrice": 16.8
      }
    }
    // ... 更多元件
  ]
}
```

**3. 更新版本索引**

编辑 `docs/public/bom/index.json`：

```json
{
  "versions": ["v0.7", "v0.6", "v0.5.1", "v0.4", "v0.3.1"],
  "defaultVersion": "v0.7"
}
```

### 分类 ID 说明

| ID | 名称 | 颜色 | 适用元件 |
|----|------|------|---------|
| `power` | 电源部分 | 绿色 | LDO、二极管、电池接口、电源开关 |
| `core` | 核心部分 | 蓝色 | MCU、Flash、SDRAM、晶振 |
| `display` | 屏幕部分 | 红色 | LCD、FPC 连接器 |
| `expansion` | 扩展部分 | 靛蓝 | SD 卡座、按钮、USB |
| `connector` | 接插件 | 橙色 | 各类连接器 |
| `passive` | 无源器件 | 紫色 | 电阻、电容、电感 |

### 验证更改

```bash
npm run docs:dev
npm run docs:build
```

:::
