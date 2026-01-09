# 固件烧录

本指南介绍如何将固件烧录到设备。

## 准备工作

### 所需工具

- USB 数据线（Type-C）
- 烧录软件（待补充）

### 所需文件

从 [Release](https://github.com/inapp123/epass_hardware/releases) 下载固件文件。

## 烧录步骤

**ⓘ部分文件名可能略有不同**
1. 下载固件，你可以在[软件]([软件_刷机包 | 白银的文件存储](https://oplst.iccmc.cc/%E8%BD%AF%E4%BB%B6_%E5%88%B7%E6%9C%BA%E5%8C%85))中下载播放器文件
2. 解压后，启动USB tree view.exe。你会看到如下界面[treeview]()
3. 选择一条较短且可靠的数据线（一定是**数据线**，部分充电线是不能传输数据的!)，连接你的通行证与电脑
4. 按下FEL按键的同时打开电源开关（打开开关时按住FEL按钮），进入FEL模式。如果没有问题，你将会在USB tree view中看见一个新的设备。[devices]()
5. 如果设备名是和上图一样的"Allwinner Unknown Device",那么你可以直接进入下一步。如果不是(显示为"Allwinner EFE8")，请回到文件夹中。启动"zadig.exe“,选择你的通行证，点击"install driver"安装驱动并等待安装完成（安装完成后请重启通行证并再次按照第4步的方法进入FEL模式）。
6. 启动文件夹中的"epass_flasher.exe",并按照提示，选择你对应的版本。烧录完成后，请重启通行证。
7. 如果此前的所有步骤没有任何问题，你的通行证将会显示PRTS的logo并启动（第一次启动可能需要等候一段时间）由于没有任何素材，设备将会自动进入下载模式。
8. 此时文件资源管理器中将会出现名为"Electric Pass"的设备[usbdownload]()双击进入设备，你会看到三个分区。进入”assets“分区，将素材放入该分区中。
9. 传输完毕后，点击除FEL与电源键之外的任意一个按钮，设备将会自动重启并开始播放。

**至此，所有烧录工作均已完成**



## 烧录问题排查

### 无法进入下载模式

如果烧录过程中中断，导致无法进入下载模式：

参考刷新教程：[BiliBili 视频教程](https://www.bilibili.com/video/BV1Xu28BDEjL/)（1分钟处）

### Flash 不识别

如果提示 `The spi nand flash '0x00000000' is not yet supported`：

检查 NAND 区域引脚是否虚焊，详见 [常见问题](../faq.md#_5-提示-the-spi-nand-flash-0x00000000-is-not-yet-supported)

## 烧录完成后

烧录完成后，请检查：

1. 屏幕是否正常显示
2. 按钮是否正常工作
3. USB 是否正常识别

如果遇到问题，请查看 [常见问题](../faq.md)。
