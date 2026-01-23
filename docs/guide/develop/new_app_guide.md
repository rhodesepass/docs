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

## 配置文件编写

### 最小配置

创建 `appconfig.json`：

```json
{
    "version": 1,
    "name": "My App",
    "executable": "myapp"
}
```

### 完整配置

```json
{
    "version": 1,
    "name": "我的应用",
    "description": "这是一个示例应用，展示基本功能",
    "author": "开发者",
    "app_version": "1.0.0",
    "screen": "360x640",
    "icon": "icon.png",
    "executable": {
        "file": "myapp"
    }
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
3. 确认 `name` 和 `executable` 字段不为空
4. 确认可执行文件存在
5. 查看 `/root/apps.log` 获取详细错误信息

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

