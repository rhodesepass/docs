# 开发概述

本章节介绍电子通行证的软件开发相关内容，包括开发环境搭建、`drm_arch_app` 运行时维护、第三方应用接入和底层实现说明。

本项目采用“全集成 Buildroot”工作流。工具链、内核、U-Boot、根文件系统和目标库都由同一套 Buildroot 环境产出，因此无论你是修改固件、维护 `drm_arch_app`，还是开发新的用户态程序，通常都需要先准备上层 Buildroot。

## 开发相关链接

- **当前 Arch 运行时仓库**：[GitHub - rhodesepass/drm_arch_app](https://github.com/rhodesepass/drm_arch_app)
- **播放器程序 neo 版本**：[GitHub - rhodesepass/drm_app_neo](https://github.com/rhodesepass/drm_app_neo)
- **完整 Buildroot 固件树**：[GitHub - rhodesepass/buildroot](https://github.com/rhodesepass/buildroot)

## 开发环境

作者当前使用的开发系统为 Ubuntu 24.04，文档中的命令也默认以该系统为准。

## 章节导航

开发相关内容分为两类：

- **开发指引**：面向运行时维护、第三方应用开发和常用接入流程。
- **说明文档**：面向底层约定、私有 ioctl 和设备树开关等专题内容。

如果你需要先理解当前 `drm_arch_app` 仓库的代码结构、构建链路、启动流程、共享数据挂载和第三方应用接入方式，建议先阅读 [drm_arch_app 开发详解](./drm_arch_app.md)。

### 开发指引

| 章节 | 说明 |
| --- | --- |
| [drm_arch_app 开发详解](./drm_arch_app.md) | 当前 Arch 运行时的源码架构、构建链路、systemd 启动流程和第三方应用接入总览 |
| [开发环境搭建](./env_setup.md) | 如何准备 Buildroot、工具链和基础开发环境 |
| [第一个应用程序](./your_first_app.md) | 介绍交叉编译工具链、CMake 的使用方法 |
| [第三方应用开发指南](./new_app_guide.md) | 如何打包、部署并运行自己的应用程序 |
| [appconfig.json 配置说明](./appconfig_json.md) | 第三方应用配置文件格式说明 |
| [扩展能力](./extension.md) | 输入、显示、外设和接口能力总览 |
| [接入通行证 Shell](./shell_access.md) | 如何通过串口、USB Shell 或 RNDIS/SSH 访问设备 |

### 说明文档

| 章节 | 说明 |
| --- | --- |
| [定制ioctl文档](./custom_ioctl.md) | DRM 私有 ioctl 和显示提交流程说明 |
| [设备树中的功能开关](./dt_switch.md) | 与显示、USB 和屏幕初始化相关的设备树开关 |

## 下一步

- 如果你要维护当前运行时，先阅读 [drm_arch_app 开发详解](./drm_arch_app.md)。
- 如果你要编写自己的应用，建议按 [开发环境搭建](./env_setup.md) → [第三方应用开发指南](./new_app_guide.md) 的顺序阅读。
