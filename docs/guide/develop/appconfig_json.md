# appconfig.json 配置文件说明

`appconfig.json` 是第三方应用的配置文件，用于定义应用的基本信息和可执行文件位置。系统会扫描应用目录，解析此配置文件来加载应用。

## 文件位置

| 来源 | 目录路径 |
|------|----------|
| NAND闪存 | `/app/<应用目录>/appconfig.json` |
| SD卡 | `/sd/app/<应用目录>/appconfig.json` |

::: warning 配置版本
当前配置版本为 **1**，必须在配置文件中指定 `"version": 1`，否则应用无法加载。
:::

## 字段说明

### 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | int | 配置版本号，**必须为 1** |
| `name` | string | 应用名称，不能为空，最大 64 字符 |
| `executable` | string / object | 可执行文件路径（相对于应用目录） |

### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `description` | string | `""` | 应用描述，最大 256 字符 |
| `author` | string | `"Unknown"` | 作者名称，最大 64 字符 |
| `app_version` | string | `"1.0.0"` | 应用版本号，最大 32 字符 |
| `screen` | string | - | 屏幕分辨率（如 `"360x640"`），用于兼容性检查 |
| `icon` | string | 默认图标 | 图标文件路径（相对于应用目录） |

### executable 字段格式

`executable` 字段支持两种格式：

**格式1：对象格式（推荐）**
```json
"executable": {
    "file": "myapp"
}
```

**格式2：简单字符串格式**
```json
"executable": "myapp"
```

两种格式功能相同，对象格式预留了将来扩展其他属性的空间。

## 配置示例

### 最小配置

```json
{
    "version": 1,
    "name": "My Application",
    "executable": "myapp"
}
```

### 完整配置

```json
{
    "version": 1,
    "name": "示例应用",
    "description": "这是一个功能完整的示例应用",
    "author": "开发者",
    "app_version": "1.0.0",
    "screen": "360x640",
    "icon": "icon.png",
    "executable": {
        "file": "myapp"
    }
}
```

## 解析日志

应用扫描和解析的日志记录在：`/root/apps.log`

### 常见错误信息

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `appconfig.json not found or unreadable` | 配置文件不存在或无法读取 | 检查文件是否存在且有读取权限 |
| `appconfig.json parse failed` | JSON格式错误 | 使用JSON验证工具检查语法 |
| `Version mismatch` | version字段不是1 | 设置 `"version": 1` |
| `Missing app name` | name字段为空或不存在 | 添加有效的name字段 |
| `Missing executable file` | executable字段为空或不存在 | 添加有效的executable字段 |
| `Executable not found: xxx` | 可执行文件不存在 | 检查文件路径和名称 |
| `Icon file not found, using default` | 图标文件不存在（警告） | 检查图标路径或留空使用默认图标 |
| `Screen resolution mismatch` | 屏幕分辨率不匹配（警告） | 修改screen字段或忽略此警告 |

## 注意事项

### 屏幕分辨率检查

`screen` 字段用于兼容性检查：
- 当前系统默认分辨率为 **360x640**
- 如果指定的分辨率与系统不匹配，会记录警告日志
- **警告不会阻止应用加载**，应用仍可正常运行

### 图标要求

| 属性 | 要求 |
|------|------|
| 推荐尺寸 | 48x48 像素 |
| 显示尺寸 | 64x64 像素（UI自动缩放） |
| 推荐格式 | PNG（支持透明度） |
| 路径格式 | 相对于应用目录的路径 |

::: tip 图标提示
如果未指定图标或图标文件不存在，系统将使用默认图标，不影响应用运行。
:::

### 字符长度限制

| 字段 | 最大长度 |
|------|---------|
| name | 64 字符 |
| description | 256 字符 |
| author | 64 字符 |
| app_version | 32 字符 |
| 路径字段 | 256 字符 |

超出长度限制的内容会被截断。

### 最大应用数量

系统最多支持 **64** 个应用。超出此限制后，扫描会停止并记录警告。

