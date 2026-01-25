# 第三方应用开发指南

本文档介绍如何为电子通行证开发和部署第三方应用。如果你想在通行证上运行自己写的程序，这篇文档会帮到你。

## 概述

### 应用管理系统

电子通行证支持加载和运行第三方应用。应用可以部署在：
- **NAND闪存**：`/app/` 目录
- **SD卡**：`/sd/app/` 目录

系统会扫描这些目录，解析每个应用的 `appconfig.json` 配置文件，并在应用列表中显示。

### 启动机制：退出-重启方案

由于嵌入式资源限制，第三方应用采用**退出-重启方案**启动：

```
┌─────────────────┐
│   主程序运行     │
└────────┬────────┘
         │ 用户选择应用
         ▼
┌─────────────────┐
│ 写入启动脚本     │  /tmp/appstart
│ 设置退出码=2     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   主程序退出     │
└────────┬────────┘
         │ 外部脚本检测退出码
         ▼
┌─────────────────┐
│ 执行用户应用     │  sh /tmp/appstart
└────────┬────────┘
         │ 应用退出
         ▼
┌─────────────────┐
│ 重启主程序       │
└─────────────────┘
```

::: tip 这种方案的好处
- 完全释放显示资源，应用可独占 DRM 设备
- 应用与主程序内存隔离
- 简化资源管理
:::

启动脚本格式（由系统自动生成）：
```sh
#!/bin/sh
cd "/app/myapp"
exec "/app/myapp/myapp"
```

### 文件关联启动

当应用配置了 `extensions` 字段后，用户可以在文件管理器中选择关联文件来启动应用：

启动命令格式：
```sh
cd "/app/myapp"
exec "/app/myapp/myapp" "/path/to/selected/file.txt"
```

在代码中处理文件参数：
```c
int main(int argc, char *argv[]) {
    if (argc > 1) {
        // 通过文件关联启动，argv[1] 是文件的绝对路径
        const char *file_path = argv[1];
        printf("Opening file: %s\n", file_path);
        // 处理文件...
    } else {
        // 正常启动，无关联文件
        printf("Normal startup\n");
    }
    return 0;
}
```

## 硬件信息

### 按键定义

设备有四个物理按键：

| 按键 | 功能 |
|------|------|
| `KEY_1` | 上翻/增加 |
| `KEY_2` | 下翻/减少 |
| `KEY_3` | 进入/确定 |
| `KEY_4` | 退出/取消 |

使用 `keyinput_get_key()` 获取按键状态，返回 `-1` 表示无按键。

### 硬件图层限制

- 支持 4 个硬件图层 (ID: 0-3)
- 图层 ID 越大，显示优先级越高
- 图层 0 通常被终端控制台占用，建议从图层 1 开始使用
- **重要**：全系统同时只能有一个图层支持透明度

### 扩展接口

设备提供以下扩展接口：

| 接口 | 设备路径 |
|------|----------|
| I2C | `/dev/i2c-0` |
| SPI | `/dev/spidev1.0` |
| UART (第一组) | `/dev/ttyS1` |
| UART (第二组) | `/dev/ttyS2` |
| GPIO | `gpiochip0`，具体引脚见 `lib/epass_define.h` |

## 应用目录结构

```
/app/myapp/                    # 应用目录
├── appconfig.json             # 配置文件（必需）
├── myapp                      # 可执行文件（必需）
├── icon.png                   # 应用图标（可选，推荐48x48 PNG）
└── data/                      # 应用数据目录（可选）
    └── ...
```

## 开发环境设置

### 交叉编译工具链

使用 Buildroot 提供的交叉编译工具链：

```bash
# 进入 Buildroot 输出目录
cd /path/to/buildroot

# 加载环境变量
source ./output/host/environment-setup

# 验证工具链
arm-linux-gnueabihf-gcc --version
```

::: info 还没搭建环境？
如果你还没有搭建 Buildroot 环境，请先参考 [开发环境搭建](./env_setup.md)。
:::

### 可用的库

应用可以使用以下系统库：

| 库 | 用途 | 头文件 |
|----|------|--------|
| libc | 标准C库 | `<stdio.h>` 等 |
| libdrm | DRM显示 | `<drm.h>`, `<xf86drm.h>` |
| libevdev | 输入设备 | `<libevdev/libevdev.h>` |
| libpng | PNG图像 | `<png.h>` |
| libjpeg | JPEG图像 | `<jpeglib.h>` |

::: warning 关于 LVGL
如需使用 LVGL，需要自行编译链接，系统默认不包含。
:::

### 使用模板开发

推荐使用 `examples/template` 作为起点：

1. 复制模板：`cp -r examples/template examples/my_program`
2. 修改 `appconfig.json`：填写应用信息
3. 修改 `main.c`：实现应用逻辑
4. 修改 `CMakeLists.txt`：添加依赖库
5. 添加到 `examples/CMakeLists.txt` 进行编译

### 参考例程

| 例程 | 功能 |
|------|------|
| `examples/epniccc` | 按键输入 + 画图 + RREFont 字体渲染 |
| `examples/textreader` | 双缓冲 + TTF 渲染 |
| `examples/i2c_test` | I2C 读写 |
| `examples/spi_test` | SPI 读写 |
| `examples/uart_test` | UART 读写 |
| `examples/libgpio_test` | GPIO 读写 |

## 应用模板代码

### 最小C程序

```c
/* myapp.c - 最小应用示例 */
#include <stdio.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
    printf("Hello from my app!\n");

    // 应用主逻辑
    printf("Working directory: %s\n", getcwd(NULL, 0));

    // 模拟工作
    sleep(3);

    printf("App finished.\n");
    return 0;
}
```

编译：
```bash
arm-linux-gnueabihf-gcc -o myapp myapp.c
```

### 带输入处理的应用

```c
/* myapp_input.c - 带输入处理的应用示例 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <linux/input.h>

#define INPUT_DEVICE "/dev/input/event0"

int main(int argc, char *argv[]) {
    printf("Input demo app starting...\n");

    int fd = open(INPUT_DEVICE, O_RDONLY);
    if (fd < 0) {
        perror("Failed to open input device");
        return 1;
    }

    printf("Waiting for input events (press Ctrl+C to exit)...\n");

    struct input_event ev;
    while (read(fd, &ev, sizeof(ev)) == sizeof(ev)) {
        if (ev.type == EV_KEY) {
            printf("Key event: code=%d, value=%d\n", ev.code, ev.value);

            // 按 ESC 键退出
            if (ev.code == KEY_ESC && ev.value == 1) {
                printf("ESC pressed, exiting...\n");
                break;
            }
        }
    }

    close(fd);
    return 0;
}
```

### DRM显示应用框架

如需使用 DRM 显示，参考以下框架：

```c
/* myapp_drm.c - DRM显示应用框架 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>
#include <xf86drm.h>
#include <xf86drmMode.h>

#define DRM_DEVICE "/dev/dri/card0"

int main(int argc, char *argv[]) {
    printf("DRM app starting...\n");

    // 打开DRM设备
    int fd = open(DRM_DEVICE, O_RDWR | O_CLOEXEC);
    if (fd < 0) {
        perror("Failed to open DRM device");
        return 1;
    }

    // 获取DRM资源
    drmModeRes *res = drmModeGetResources(fd);
    if (!res) {
        perror("Failed to get DRM resources");
        close(fd);
        return 1;
    }

    printf("DRM resources:\n");
    printf("  Connectors: %d\n", res->count_connectors);
    printf("  CRTCs: %d\n", res->count_crtcs);
    printf("  Encoders: %d\n", res->count_encoders);

    // TODO: 实现DRM显示逻辑
    // 1. 查找连接的显示器
    // 2. 创建帧缓冲
    // 3. 设置显示模式
    // 4. 渲染内容

    // 清理
    drmModeFreeResources(res);
    close(fd);

    printf("DRM app finished.\n");
    return 0;
}
```

编译（需链接 libdrm）：
```bash
arm-linux-gnueabihf-gcc -o myapp_drm myapp_drm.c -ldrm
```

### 内部开发库

如果你的应用需要使用与主程序相同的底层库，可以使用以下库：

| 库 | 头文件 | 用途 |
|----|--------|------|
| DRM 封装 | `lib/drm_warpper.h` | 显示驱动封装 |
| 绘图库 | `lib/fbdraw.h` | 基本图形绘制 |
| TTF 渲染 | `lib/fbdrawttf.h` | TrueType 字体渲染 |
| 日志 | `lib/log.h` | 日志输出（log_info/log_error/log_debug） |

注意：使用 STB 库时，需要在单独的 .c 文件中定义 Implementation。

### DRM 编程模式

推荐使用以下模式进行图形绘制：

```c
// 阻塞等待空闲 buffer (自带 Vsync 效果)
drm_warpper_dequeue_free_item(&drm_warpper, layer_id, &curr_item);
uint32_t* vaddr = (uint32_t*)curr_item->mount.arg0;

// 使用 fbdraw 进行绘制
fbdraw_fb_t fb = { .vaddr = vaddr, .width = 360, .height = 640 };
fbdraw_fill_rect(&fb, &(fbdraw_rect_t){0, 0, 360, 640}, 0xFF000000); // 清屏

// 提交显示
drm_warpper_enqueue_display_item(&drm_warpper, layer_id, curr_item);
```

**注意事项：**
- `buffer_object_t` 和 `drm_warpper_queue_item_t` 必须是 `static` 或生命周期覆盖整个运行期
- 严禁使用局部栈变量
- 如果不希望图层透明，需要把每个像素的 alpha 设置为 0xFF（如 0xFF000000 为黑色）

### STB 库使用

使用 stb_truetype 或 stb_image 时，需要在单独的 .c 文件中定义 Implementation：

**stb_impl.c:**
```c
#define STB_TRUETYPE_IMPLEMENTATION
#include "stb_truetype.h"

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
```

**用途说明：**
- `stb_truetype`：用于 TTF 字体渲染（中文显示）
- `stb_image`：用于图片加载和显示

## 配置文件编写

### 最小配置

创建 `appconfig.json`：

```json
{
    "version": 1,
    "name": "My App",
    "uuid": "使用 uuidgen 生成",
    "type": "fg",
    "executable": "myapp"
}
```

### 完整配置

```json
{
    "version": 1,
    "name": "我的应用",
    "uuid": "使用 uuidgen 生成",
    "description": "这是一个示例应用，展示基本功能",
    "icon": "icon.png",
    "type": "fg",
    "extensions": [".txt"],
    "executable": {
        "file": "myapp"
    }
}
```

### 应用类型

通过 `type` 字段控制应用的启动方式（必须指定）：

| 类型 | 菜单显示 | 说明 | 使用场景 |
|------|------|------|----------|
| `fg` | 显示 | 前台应用 | 普通应用 |
| `fg_ext` | 不显示 | 前台应用，仅文件关联启动 | 文件查看器、编辑器 |
| `bg` | 显示 | 后台应用，不显示 UI | 服务程序 |

示例：文本阅读器（仅通过文件打开）
```json
{
    "version": 1,
    "name": "文本阅读器",
    "uuid": "生成的UUID",
    "type": "fg_ext",
    "extensions": [".txt", ".log", ".md"],
    "executable": "textreader"
}
```

详细字段说明请参考：[appconfig.json 配置文件说明](./appconfig_json.md)

## 打包与部署

### 目录准备

```bash
# 创建应用目录
mkdir -p myapp

# 复制文件
cp myapp myapp/
cp appconfig.json myapp/
cp icon.png myapp/  # 如果有图标
```

### 部署到 NAND

```bash
# 通过 adb 或 SSH 复制到设备
adb push myapp/ /app/

# 或使用 scp
scp -r myapp/ root@192.168.137.2:/app/
```

### 部署到 SD 卡

```bash
# 挂载SD卡到本地
mount /dev/sdX1 /mnt/sd

# 创建应用目录并复制
mkdir -p /mnt/sd/app/
cp -r myapp/ /mnt/sd/app/

# 卸载SD卡
umount /mnt/sd
```

### 设置执行权限

系统会自动为可执行文件添加执行权限，但建议手动确认：

```bash
chmod +x /app/myapp/myapp
```

## 调试与日志

### 查看解析日志

应用扫描结果记录在 `/root/apps.log`：

```bash
cat /root/apps.log
```

输出示例：
```
[INFO] /app/myapp: Application loaded successfully
[ERROR] /app/badapp: appconfig.json not found or unreadable
[WARN] /app/testapp: Icon file not found, using default
```

### 串口调试

1. 连接串口（通常为 115200 8N1）
2. 应用的 `printf` 输出会显示在串口终端
3. 使用 `stderr` 输出调试信息：
   ```c
   fprintf(stderr, "Debug: value = %d\n", value);
   ```

::: tip 串口接入方式
如果还没接入串口，请参考 [接入通行证Shell](./shell_access.md)。
:::

### 应用退出码

应用可以通过返回不同的退出码来传递状态：

| 退出码 | 说明 |
|--------|------|
| 0 | 正常退出 |
| 非0 | 异常退出（可自定义含义） |

## 资源限制与注意事项

### 系统限制

| 限制项 | 值 |
|--------|-----|
| 最大应用数量 | 64 |
| 应用名称长度 | 64 字符 |
| 应用描述长度 | 256 字符 |
| 路径最大长度 | 256 字符 |

### 资源独占

应用运行期间**独占**以下资源：
- DRM 显示设备（`/dev/dri/card0`）
- 输入设备（`/dev/input/event*`）

主程序会在应用启动前完全释放这些资源。

### 工作目录

应用启动时，工作目录会自动切换到应用所在目录：
```c
// 应用启动后，getcwd() 返回 "/app/myapp"
char *cwd = getcwd(NULL, 0);
printf("Working directory: %s\n", cwd);  // 输出: /app/myapp
```

这意味着可以使用相对路径访问应用目录中的文件。

### SD 卡应用

- SD 卡应用在 UI 中会显示绿色 **"SD"** 标记
- SD 卡路径为 `/sd/app/`
- 需要先插入 SD 卡才能扫描到 SD 卡应用

## 常见问题

### 应用不在列表中显示？

检查以下几点：
1. 确认 `appconfig.json` 文件存在且格式正确
2. 确认 `version` 字段值为 `1`
3. 确认 `name`、`uuid`、`type` 和 `executable` 字段不为空
4. 确认 `type` 不是 `fg_ext`（该类型不在菜单中显示）
5. 确认可执行文件存在
6. 查看 `/root/apps.log` 获取详细错误信息

### 应用启动失败？

检查以下几点：
1. 确认可执行文件有执行权限
2. 确认是 ARM 架构的可执行文件（使用 `file` 命令检查）
3. 确认依赖库都已安装

### 如何使用 DRM 显示？

应用需要自行初始化 DRM。参考上面的"DRM显示应用框架"示例，或参考主程序中的 `drm_warpper.c` 实现。

### 如何获取按键输入？

使用 Linux 标准输入事件接口：
1. 打开 `/dev/input/event0`（或其他事件设备）
2. 读取 `struct input_event` 结构
3. 处理按键事件

参考上面的"带输入处理的应用"示例。

### 应用退出后如何返回主界面？

应用正常退出（`return 0` 或 `exit(0)`）后，外部脚本会自动重启主程序，用户会回到主界面。

