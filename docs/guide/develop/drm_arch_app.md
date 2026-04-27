# drm_arch_app 开发详解

本文分析 GitHub 仓库 [`rhodesepass/drm_arch_app`](https://github.com/rhodesepass/drm_arch_app) 的当前结构和实现方式，并把它放回电子通行证整套软件栈里解释清楚。

本文面向两类读者：

- 维护当前 Arch 运行时的人
- 为电子通行证编写第三方应用的人

如果你只想开发自己的应用，也建议先读完本页的“仓库定位”“运行时数据约定”和“第三方应用接入”三节，再继续阅读 [第三方应用开发指南](./new_app_guide.md) 和 [appconfig.json 配置说明](./appconfig_json.md)。

::: tip 仓库名与项目名
GitHub 仓库地址是 `rhodesepass/drm_arch_app`，但仓库根 README 把整个目录命名为 `epass-arch`。本文中：

- `epass-arch` 指整个 Arch 运行时子树
- `drm_arch_app` 指其中的 GUI 可执行程序与源码目录
:::

## 仓库定位

这个仓库不是“完整固件树”，也不是“只包含播放器源码的演示工程”，而是 **当前 Arch Linux ARM 运行时的维护仓库**。它位于两类仓库之间：

| 仓库 | 关注范围 | 适合做什么 | 不适合做什么 |
| --- | --- | --- | --- |
| [`rhodesepass/buildroot`](https://github.com/rhodesepass/buildroot) | 完整固件树 | 内核、U-Boot、rootfs、包集成、镜像生成 | 直接作为 GUI 代码入口，阅读成本较高 |
| [`rhodesepass/drm_app_neo`](https://github.com/rhodesepass/drm_app_neo) | 偏播放器/GUI 源码 | 单独研究 DRM/LVGL/播放器逻辑 | 不能代表当前 Arch 运行时的 systemd、USB、共享数据挂载行为 |
| [`rhodesepass/drm_arch_app`](https://github.com/rhodesepass/drm_arch_app) | 当前 Arch 运行时子树 | 维护 `drm_arch_app`、部署脚本、共享数据、USB 模式、首次开机流程和 Arch SD 镜像 | 不能替代完整 Buildroot 树 |

换句话说：

- 你要改 **内核、驱动、板级配置**，主要看 `buildroot`
- 你要改 **当前实际运行时的 GUI 和启动链**，主要看本仓库
- 你要快速学习 **播放器/DRM/LVGL 应用本体**，`drm_app_neo` 往往更轻量

## 仓库结构

仓库顶层的关键目录和脚本如下：

| 路径 | 作用 |
| --- | --- |
| `drm_arch_app/` | 设备侧 GUI 主程序源码，包含 DRM、LVGL、PRTS、第三方应用加载和 IPC |
| `deploy/` | 运行时部署文件，包含 systemd service、runner、shared-data 挂载、USB gadget 控制、首次开机和故障回退脚本 |
| `third_party/` | 第三方依赖，当前最重要的是 vendored `lvgl/` |
| `ui_design/` | EEZ Studio UI 工程和辅助生成工具，是真正的 UI 源文件 |
| `build_drm_arch_app.sh` | 通过上层 Buildroot 重新构建 `drm_arch_app`，并检查 ABI 依赖 |
| `build-sdcard-arch.sh` | 组装 Arch Linux ARM SD 镜像 |
| `build_python311.sh` | 为 Arch 镜像准备 Python 运行时相关内容 |

### 你应该从哪里开始

根据任务不同，建议的入口不同：

| 任务 | 优先阅读位置 |
| --- | --- |
| 改 GUI 交互、主界面行为、设置页 | `drm_arch_app/src/ui/`、`drm_arch_app/generated_ui/`、`ui_design/epass_eez/` |
| 改显示链路、视频播放、DRM 提交 | `drm_arch_app/src/driver/`、`drm_arch_app/src/render/`、`drm_arch_app/src/overlay/` |
| 改轮播逻辑、资源调度、运营商素材 | `drm_arch_app/src/prts/` |
| 改第三方应用加载、前后台启动、IPC | `drm_arch_app/src/apps/` |
| 改开机流程、共享数据、USB 模式、systemd | `deploy/` |

## GUI 程序架构

`drm_arch_app` 是当前设备上的主 GUI 运行时。它不仅负责显示首页，还同时承担：

- DRM + LVGL 图形显示
- CedarX 视频解码播放
- 运营商素材轮播和切换
- 转场动画、信息叠层和主题资源
- 第三方应用扫描、启动和 IPC 服务
- 设置项读写、亮度、USB 模式请求等运行时控制

### 显示栈概览

当前实现使用三层显示平面：

| Plane | 像素格式 | 主要职责 |
| --- | --- | --- |
| Layer 0 | `MB32 NV12` | 视频层，承接 CedarX 解码后的 YUV 输出 |
| Layer 1 | `ARGB8888` | Overlay 层，承接转场、运营商信息叠层和透明效果 |
| Layer 2 | `RGB565` | UI 层，承接 LVGL 输出 |

从视觉叠加顺序看，实际是 **UI 在最上层，Overlay 在中间，Video 在最底层**。

### 模块分层

`drm_arch_app/src/` 的主要模块如下：

| 模块 | 关键目录 | 主要职责 |
| --- | --- | --- |
| 驱动层 | `src/driver/` | DRM 初始化、buffer 管理、vblank 等待、自定义 atomic commit ioctl、输入设备读取 |
| 渲染层 | `src/render/` | CedarX 播放器、LVGL 到 DRM 的桥接、动画驱动、帧缓冲绘制 |
| Overlay 层 | `src/overlay/` | 转场、运营商信息绘制、叠层动画 |
| PRTS | `src/prts/` | 素材解析、轮播调度、切换策略 |
| 第三方应用层 | `src/apps/` | `/app` 扫描、`appconfig.json` 解析、前后台应用管理、IPC server |
| UI 行为层 | `src/ui/` | 各个 screen 的业务回调、列表操作、设置页面、确认框、Shell/网络入口 |
| 通用工具 | `src/utils/` | 设置读写、日志、缓存、JSON、UUID、定时器、队列 |

仓库内已经附带了两份值得一读的英文技术说明：

- `drm_arch_app/docs/application_structure.md`
- `drm_arch_app/docs/overlay_dev_note.md`

如果你要继续深入显示和动画实现，建议把这两份文档与源码一起看。

### 初始化顺序

`src/main.c` 明确写出了组件依赖和初始化顺序，当前顺序大致是：

1. `drm_warpper`
2. `prts_timer`
3. `animation_driver`
4. `settings`
5. `layer_animation`
6. `mediaplayer`
7. `cacheassets`
8. `overlay`
9. `prts`
10. `apps`
11. `lvgl_drm_warp`

这个顺序不能随意调整。比如：

- `overlay` 依赖 `layer_animation`
- `prts` 依赖 `overlay`
- `apps` 依赖 `prts`
- `lvgl_drm_warp` 依赖 `drm_warpper`、`prts`、`apps`

## 构建与迭代流程

本仓库默认假设你已经有一棵上层 Buildroot，并且本仓库位于 Buildroot 根目录下的 `epass-arch/`。

### 1. 先准备上层 Buildroot

在 Buildroot 根目录执行：

```bash
make rhodesisland_epass_defconfig
make -j$(nproc)
```

这一步会生成：

- 交叉编译工具链
- 内核、U-Boot
- 目标系统 rootfs
- `drm_arch_app` 依赖的目标库

### 2. 日常修改 GUI 时的推荐构建方式

如果你主要改的是：

- `drm_arch_app/src/*`
- `drm_arch_app/generated_ui/*`
- 部署脚本以外的 app 运行时代码

优先使用：

```bash
./epass-arch/build_drm_arch_app.sh
```

这个脚本会通过 Buildroot 重新配置并编译 `drm_arch_app`，然后用 `readelf` 检查最终二进制是否仍然链接到了当前运行时依赖的关键库，例如：

- `libevdev.so.2`
- `libdrm.so.2`
- `libpng16.so.16`
- CedarX 相关库
- `libssl.so.1.1`
- `libcrypto.so.1.1`

这一步很适合作为日常回归检查。

### 3. 独立交叉编译 `drm_arch_app`

如果你只想快速验证 app 本体，可以在 Buildroot 根目录加载工具链环境后，用 CMake 单独构建：

```bash
source output/host/environment-setup
cmake -S epass-arch/drm_arch_app -B epass-arch/drm_arch_app/build -DCMAKE_BUILD_TYPE=Debug
cmake --build epass-arch/drm_arch_app/build -j$(nproc)
```

`drm_arch_app/CMakeLists.txt` 当前有几个关键点：

- 默认 `CMAKE_BUILD_TYPE=Release`
- `ENABLE_CEDARX` 默认开启，可通过 `-DENABLE_CEDARX=OFF` 关闭
- `generated_ui/` 必须存在，否则构建直接失败
- LVGL 会优先从 `../third_party/lvgl` 读取，找不到时再尝试 `drm_arch_app/third_party/lvgl`

### 4. 组装 Arch SD 镜像

如果你不是只改 app，而是要验证完整运行时，就需要回到根目录执行：

```bash
sudo ./epass-arch/build-sdcard-arch.sh
```

这个脚本负责把下面这些部分组装成最终 `sdcard-arch.img`：

- 上层 Buildroot 产物
- Arch Linux ARM rootfs tarball
- `deploy/` 中的运行时策略文件
- `drm_arch_app`
- 资源和辅助二进制

## 启动链路与 systemd 边界

`drm_arch_app` 不是直接开机自启动的裸程序，它运行在一套明确的 systemd 启动链中。

### 关键服务和脚本

| 路径 | 作用 |
| --- | --- |
| `deploy/etc/systemd/system/drm-arch-app.service` | GUI 主服务定义 |
| `deploy/usr/local/bin/drm-arch-app-runner.sh` | 解释退出码并决定后续动作 |
| `deploy/usr/local/bin/epass-gui-preflight.sh` | 启动前检查目录、DRM 设备、首次开机状态 |
| `deploy/etc/systemd/system/epass-gui-ready.path` | 监听 `/run/epass/gui-alive` |
| `deploy/etc/systemd/system/epass-stop-boot-animation.service` | GUI 就绪后停止开机动画 |
| `deploy/etc/systemd/system/epass-data-mount.service` | 挂载并绑定 shared-data 分区 |
| `deploy/etc/systemd/system/epass-usb-mode.service` | 恢复持久化 USB gadget 模式 |

### GUI 启动流程

当前运行时的大致顺序是：

1. 首次开机流程和屏幕检测先完成
2. `drm-arch-app.service` 启动
3. `epass-gui-preflight.sh` 检查关键目录、DRM 设备、首次开机状态
4. `drm-arch-app-runner.sh` 拉起 `/usr/local/bin/drm_arch_app`
5. GUI 进入可用状态后创建 `/run/epass/gui-alive`
6. `epass-gui-ready.path` 触发，停止开机动画
7. `epass-data-mount.service` 和 `epass-usb-mode.service` 在 GUI 起来之后继续补齐 shared-data 和 USB 模式

这一点很重要：**当前运行时并不会等待 shared-data 挂载和 USB 模式恢复完全完成后再启动 GUI**。GUI 会先基于 rootfs 中的基础目录启动，后续再由 systemd 服务把 shared-data 的 bind mount 和 USB gadget 状态补上。

### runner 退出码契约

`drm-arch-app-runner.sh` 当前实际处理的退出码如下：

| 退出码 | 含义 |
| --- | --- |
| `0` | 正常退出 |
| `1` | 请求重启 GUI |
| `2` | 请求启动前台第三方应用，runner 会执行 `/tmp/appstart` |
| `3` | 请求关机 |
| `5` | 请求启动 `srgn_config`，结束后回到设置页 |

虽然源码常量里还保留了 `EXITCODE_FORMAT_SD_CARD = 4`，但当前 runner **没有** 为 `4` 定义专门分支。不要假设未处理的退出码在现行运行时里有稳定行为。

### 启动前检查会做什么

`epass-gui-preflight.sh` 至少会检查这些条件：

- `/usr/local/bin/drm_arch_app` 存在且可执行
- `/usr/local/bin/drm-arch-app-runner.sh` 存在且可执行
- `/etc/epass-firstboot/configured` 已存在
- 当前内核命令行不处于 `epass.firstboot=1` 或 `epass.resize=1`
- `/assets`、`/app`、`/dispimg`、`/root/res` 等目录可读
- `/dev/dri/card0` 已出现

启动失败时，通常优先看：

- `/run/epass/drm_arch_app.log`
- `/run/epass/gui-failure-reason`

## 运行时数据约定

`drm_arch_app` 和周边脚本依赖一组固定路径。维护运行时或接入第三方应用时，这些路径需要优先记住。

### 关键路径

| 路径 | 作用 |
| --- | --- |
| `/assets/` | 运营商素材目录，存放 `epconfig.json` 和媒体资源 |
| `/dispimg/` | 静态展示图片目录 |
| `/app/` | 已安装的第三方应用目录 |
| `/root/res/` | 内置 UI 资源和回退素材 |
| `/root/themes/` | 主题包目录 |
| `/root/epass_cfg.bin` | 持久化设置文件 |
| `/tmp/drm_arch_app.sock` | 本地 IPC socket |
| `/run/epass/drm_arch_app.log` | 当前开机周期内的持久化应用日志 |
| `/run/epass/gui-failure-reason` | GUI 启动失败摘要 |
| `/run/epass/gui-alive` | GUI 就绪标记 |

### shared-data 分区与 bind mount

`epass-data-mount.sh` 当前按照如下方式工作：

- 通过卷标 `EPASSDATA` 找分区
- 挂载到 `/mnt/epass-data`
- 如果 shared-data 目录为空，则用 rootfs 中的默认内容做一次 seed
- 再把 shared-data 内容 bind mount 到运行时路径

当前映射关系如下：

| shared-data 路径 | 运行时路径 |
| --- | --- |
| `/mnt/epass-data/assets` | `/assets` |
| `/mnt/epass-data/display-images` | `/dispimg` |
| `/mnt/epass-data/themes` | `/root/themes` |

::: warning `/app` 的行为不同
`/app` 不是 shared-data 的直接 bind mount。

当前模型是：

- `/app` 是 rootfs 上的“已安装应用目录”
- `/mnt/epass-data/apps-inbox` 是共享分区上的“导入收件箱”
- `epass-app-import.sh` 负责把收件箱里的目录或 `.tar.gz`/`.tgz` 包复制、解包并安装到 `/app`

不要把 shared-data 上的应用目录当作可直接执行目录来设计。
:::

### 日志与导入状态

与导入和素材有关的几个日志位置：

| 路径 | 作用 |
| --- | --- |
| `/mnt/epass-data/import-log/app-import.log` | 应用导入日志 |
| `/mnt/epass-data/import-log/apps-parse.log` | 第三方应用解析日志 |
| `/root/asset.log` | 运营商素材解析日志 |

## 第三方应用接入

本仓库中的第三方应用机制比“把一个可执行文件拷到设备上”要严格一些。当前运行时至少包含下面几个部分：

- `/app` 下的应用扫描器
- `appconfig.json` 解析器
- 前后台应用启动模型
- 扩展名关联映射
- `drm_arch_app` 提供的本地 IPC 接口

### 目录与导入流程

现行运行时推荐的导入路径是：

1. 把应用目录或压缩包放进 `/mnt/epass-data/apps-inbox`
2. 由 `epass-app-import.sh` 导入到 `/app/<app-name>`
3. GUI 扫描 `/app` 并解析每个应用目录中的 `appconfig.json`

导入器当前支持两种输入：

- 直接放一个目录
- 放一个 `.tar.gz` 或 `.tgz` 压缩包

### `appconfig.json` 当前实际要求

根据 `src/apps/apps_cfg_parse.c` 的当前实现，应用配置至少需要这些字段：

| 字段 | 是否必须 | 说明 |
| --- | --- | --- |
| `version` | 必须 | 当前要求值为 `1` |
| `uuid` | 必须 | 应用唯一标识 |
| `type` | 必须 | `bg`、`fg` 或 `fg_ext` |
| `screens` | 必须 | 当前构建要求能匹配 `360x640` |
| `executable` | 必须 | 可执行文件，相对路径 |
| `name` | 可选 | 为空时回退到目录名 |
| `description` | 可选 | 未填时显示默认描述 |
| `icon` | 可选 | 缺失时回退到内置默认图标 |
| `extensions` | 可选 | 文件关联扩展名列表 |

最小示例：

```json
{
  "version": 1,
  "name": "Example App",
  "uuid": "12345678-1234-1234-1234-123456789abc",
  "type": "fg",
  "screens": ["360x640"],
  "executable": {
    "file": "run.sh"
  },
  "description": "Example foreground app",
  "icon": "icon.png"
}
```

`executable` 目前兼容两种写法：

```json
"executable": {
  "file": "run.sh"
}
```

或：

```json
"executable": "run.sh"
```

::: warning 以当前实现为准
站内较早的部分文档更偏旧版约定，而当前源码已经明确要求 `screens` 字段，并且当前构建只接受 `360x640`。如果出现文档与现行代码不一致的情况，请优先以当前实现和本页说明为准。
:::

### `type` 的含义

| 类型 | 行为 |
| --- | --- |
| `bg` | 后台应用，由应用管理器 fork 并跟踪 |
| `fg` | 前台应用，可从 GUI 中直接启动 |
| `fg_ext` | 仅通过文件关联启动，不在普通应用列表中显示 |

### 前台应用启动模型

前台应用不是由 GUI 进程内部直接 `exec` 叠加的，而是采用“主程序退出，runner 接管，再拉起前台应用”的模型：

1. `drm_arch_app` 根据选中的应用生成 `/tmp/appstart`
2. `drm_arch_app` 以退出码 `2` 退出
3. `drm-arch-app-runner.sh` 发现退出码为 `2`
4. runner 执行 `/bin/sh /tmp/appstart`
5. 前台应用退出后，runner 再把 `drm_arch_app` 拉起来

这个模型的好处是：

- 主程序可以彻底释放 DRM/显示资源
- 第三方应用和主 GUI 进程内存隔离
- 切换逻辑集中在 runner 中实现

### IPC 能做什么

`drm_arch_app` 当前在 `/tmp/drm_arch_app.sock` 暴露本地 IPC。根据 `src/apps/ipc_common.h`，现有请求大致覆盖：

- 弹出 UI warning
- 获取或设置当前 screen
- 强制显示某张 `dispimg`
- 查询 PRTS 状态和当前运营商
- 切换运营商
- 获取或设置设置项
- 获取或设置当前视频路径
- 安排 overlay 转场
- 请求应用按指定退出码退出

如果你要做一个和主 GUI 配合的工具型应用，这个 IPC 通道通常比自己直接改配置文件更稳妥。

更细的接入步骤请继续阅读：

- [第三方应用开发指南](./new_app_guide.md)
- [appconfig.json 配置说明](./appconfig_json.md)
- [扩展能力](./extension.md)

## 运营商素材与 PRTS

除了第三方应用，`drm_arch_app` 还负责轮播运营商素材。当前约定是：

- 每个运营商素材目录位于 `/assets/<package>/`
- 目录里至少包含 `epconfig.json`
- 配置中会引用 loop 视频、intro 视频、转场和 overlay 资源

最关键的限制是：**当前构建只接受面向 `360x640` 屏幕的内容包**。

如果你要改的是：

- 播放顺序
- 自动切换
- 切换时机
- 转场和运营商信息叠层

优先阅读：

- `drm_arch_app/src/prts/prts.c`
- `drm_arch_app/src/prts/operators.c`
- `drm_arch_app/src/overlay/`

## UI 设计工作流

当前仓库中，真正的 UI 源文件不在 `generated_ui/`，而在 `ui_design/epass_eez/`。

推荐流程固定为：

1. 在 `ui_design/epass_eez/` 修改 EEZ Studio 工程
2. 导出代码到 `drm_arch_app/generated_ui/`
3. 重新构建 `drm_arch_app`

::: warning 不要直接手改 `generated_ui/*`
`generated_ui/` 是导出产物，不是源文件。直接修改这些 `.c`/`.h` 文件，下一次重新导出时很容易被覆盖，或者把生成代码和手写逻辑搅在一起，后续难以维护。

手写逻辑应放在：

- `src/ui/actions_*.c`
- `src/ui/scr_transition.c`
- `src/ui/filemanager.c`
- 其他 `src/ui/` 业务文件
:::

## 常见调试入口

维护运行时时，建议优先掌握下面这些入口：

### 查看 GUI 和运行时日志

```sh
cat /run/epass/drm_arch_app.log
cat /run/epass/gui-failure-reason
journalctl -u drm-arch-app.service -b
journalctl -u epass-data-mount.service -b
journalctl -u epass-usb-mode.service -b
```

### 查看应用导入和解析结果

```sh
cat /mnt/epass-data/import-log/app-import.log
cat /mnt/epass-data/import-log/apps-parse.log
ls -la /app
```

### 查看 shared-data 是否已经挂载

```sh
findmnt /mnt/epass-data /assets /dispimg /root/themes
```

### 查看 USB 模式是否切换成功

```sh
/usr/local/bin/epass-usb-report.sh
ip a
```

### 直接查看版本和启动模式

```sh
drm_arch_app version
drm_arch_app sd
```

其中：

- `version` 会输出版本和编译时间
- `sd` 不是“程序安装在 SD 卡上”的意思，而是一个额外目录扫描开关
- 默认启动时程序会扫描 `/assets/` 和 `/app/`
- 传入 `sd` 后，程序会在默认扫描之外，再额外扫描 `/sd/assets/` 和 `/sd/app/`
- 如果当前系统本身就是从 SD 卡启动，`/assets` 和 `/app` 仍然是运行时根文件系统路径；这里的 `/sd/...` 是源码里单独定义的挂载点兼容路径，不代表 `drm_arch_app` 本体安装位置

## 常见坑

- 当前源码把屏幕配置固定在 `360x640`，第三方应用和运营商素材都要匹配这个分辨率。
- `generated_ui/` 不能当手写代码目录用。
- `drm_arch_app` 启动时不会等待 shared-data 和 USB 模式全部完成，调试时要注意启动先后顺序。
- `/app` 不是 shared-data 的 bind mount，而是导入后的安装目录。
- 前台应用启动依赖 `/tmp/appstart` 和 runner 的退出码解释，不要在理解旧版文档后假设它是“同进程切屏”。
- 当前 runner 只对 `0/1/2/3/5` 有明确行为。
- 如果 `ENABLE_CEDARX=ON`，目标系统必须提供 CedarX 相关库，否则构建或运行都会失败。

## 建议阅读路径

按任务选择下一步：

- 想维护当前运行时：继续看 `deploy/`、`drm_arch_app/src/` 和 [定制ioctl文档](./custom_ioctl.md)
- 想开发第三方应用：继续看 [第三方应用开发指南](./new_app_guide.md) 和 [appconfig.json 配置说明](./appconfig_json.md)
- 想调设备和连 Shell：继续看 [接入通行证 Shell](./shell_access.md)
