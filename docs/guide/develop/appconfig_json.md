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
| `uuid` | string | 应用唯一标识符，标准 UUID 格式，使用 `uuidgen` 命令生成 |
| `type` | string | 应用类型：`bg`/`fg`/`fg_ext`（必须指定） |
| `executable` | string / object | 可执行文件路径（相对于应用目录） |

### 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `description` | string | `""` | 应用描述，最大 256 字符 |
| `icon` | string | 默认图标 | 图标文件路径（相对于应用目录） |
| `extensions` | array | `[]` | 关联的文件扩展名列表，如 `[".txt", ".log"]` |

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

### 应用类型 (type)

| 值 | 菜单显示 | 说明 |
|------|------|------|
| `bg` | 显示 | 后台运行，不显示 UI |
| `fg` | 显示 | 前台运行，可从菜单启动 |
| `fg_ext` | 不显示 | 前台运行，仅可通过文件关联启动 |

### 文件关联 (extensions)

`extensions` 字段定义应用可以打开的文件类型：
- 值为扩展名数组，如 `[".txt", ".log", ".md"]`
- 用户在文件管理器中选择关联文件时，系统会启动对应的应用
- 应用启动时，文件的绝对路径会作为命令行参数传入
- 如果同一扩展名被多个应用关联，使用第一个注册的应用

## 配置示例

### 最小配置

```json
{
    "version": 1,
    "name": "My Application",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "type": "fg",
    "executable": "myapp"
}
```

### 完整配置（含文件关联）

```json
{
    "version": 1,
    "name": "文本阅读器",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "description": "这是一个功能完整的示例应用",
    "icon": "icon.png",
    "type": "fg_ext",
    "extensions": [".txt", ".log"],
    "executable": {
        "file": "textreader"
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
| `Missing uuid` | uuid字段为空或不存在 | 使用 `uuidgen` 命令生成 UUID |
| `Invalid uuid format` | uuid格式不正确 | 使用标准 UUID 格式（xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx） |
| `Missing type` | type字段为空或不存在 | 添加 type 字段（bg/fg/fg_ext） |
| `Invalid type` | type字段值不正确 | 使用有效值：bg、fg 或 fg_ext |
| `Missing executable file` | executable字段为空或不存在 | 添加有效的executable字段 |
| `Executable not found: xxx` | 可执行文件不存在 | 检查文件路径和名称 |
| `Icon file not found, using default` | 图标文件不存在（警告） | 检查图标路径或留空使用默认图标 |

## 注意事项

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
| 路径字段 | 256 字符 |

超出长度限制的内容会被截断。

### 最大应用数量

系统最多支持 **64** 个应用。超出此限制后，扫描会停止并记录警告。

