# 常见问题

本文档整理了 V0.3 版本的疑难解答。

> 文档整理 @白银
>
> 特别感谢 粉色妖精小姐 爱莉希雅

感谢您的复刻！如果您也踩到了坑，欢迎来一起共享经验！

## 1. 三路供电没有全部出完或电压不对

**现象**：没有短路，但供电电压异常

**原因分析**：
- 电压变高：一般是反馈脚没接好
- 没有电压：可能是虚焊

### 解决方案

1. **补焊 EA3036 全部引脚**，尤其是对应侧

![EA3036引脚](/images/2_3.png)

2. 如果补焊无效，**更换 EA3036**

## 2. 连上电脑提示 42/43 Device failed to start

**现象**：不短路，供电全出，但 USB 识别失败

### 解决方案：检查 DP-DN 信号

#### 检查 USB Type-C 是否虚焊/连锡

![USB Type-C检查](/images/2_4.png)

> **如何检查短路**：找一根不用的 C 口数据线剪掉头，测量里面的两根信号线之间有没有短路

#### 检查主控 USB 引脚是否虚焊

![主控USB引脚](/images/2_5.png)

## 3. 上电直接大电流，电源灯不亮

**现象**：三路供电对地不导通，两两不导通，但上电直接大电流

### 解决方案

#### 方案一：检查屏幕背光区域

拆焊屏幕背光芯片，再次上电。若正常则检查屏幕背光区域是否焊接错误。

![屏幕背光芯片](/images/2_6.png)

#### 方案二：检查二极管方向

检查二极管是否焊反：
- 有横线的一端为负极
- 电压高的一端为正极
- 正极对应 PCB 丝印开口（没画横线）的一端

![二极管方向](/images/2_7.png)

## 4. 烧录中断无法重新进入下载模式

**现象**：烧录过程中中断，但芯片已有底层数据，导致无法进入下载模式重新烧录

### 解决方案

按住FEL按钮开机。（从上往下第五个按钮）

参考刷新教程（1分钟处）：[BiliBili 视频教程](https://www.bilibili.com/video/BV1Xu28BDEjL/)

## 5. 烧录过程的相关问题

请打开USBTreeView，根据情况进行排查：

### 5.1 找不到FEL设备，且usbtreeview中显示"0x0000 0x0002"

**现象**：如图：

![usbtreeview_usb_fault](/images/usbtreeview_usb_fault.png)


同上，检查USB链路焊接[2. 连上电脑提示 42/43 Device failed to start](#_2-连上电脑提示-42-43-device-failed-to-start)


### 5.2 提示 "The spi nand flash '0x00000000' is not yet supported"

**现象**：提示 "The spi nand flash '0x00000000' is not yet supported"

![Flash不支持错误](/images/2_8.png)

**原因**：F1C 没认到 Flash 芯片

#### 解决方案

检查 NAND 区域引脚是否虚焊

![NAND区域引脚](/images/2_9.png)

### 5.3 卡在“等待设备重启进入DFU模式....”，且Usbtreeview中提示报错代码28

**现象**：卡在如图位置超过20秒：

![stuck_on_dfu.png](/images/stuck_on_dfu.png)

且USBTreeview中提示代码28：

![usbtreeview_dfu_driver_install_failed.png](/images/usbtreeview_dfu_driver_install_failed.png)

原因：DFU模式驱动安装失败。

#### 解决方案

按Windows+R（运行），输入

```
%appdata%\.epass-flasher\
```

按回车，删除其中的config.json文件，然后重启烧录程序。

确保务必选择“安装驱动”，并等驱动彻底安装好（提示“请按任意键继续”）后再进入下一步。

### 5.4 卡在“等待设备重启进入DFU模式....”，但USBTreeView中提示Allwinner FEL

**现象**：卡在如图位置超过20秒：

![stuck_on_dfu.png](/images/stuck_on_dfu.png)

但USBTreeview中提示Allwinner FEL：

![usbtreeview_fel.png](/images/usbtreeview_fel.png)

原因：FEL烧录Uboot后，设备无法从Uboot启动，无法进行第二阶段烧录

#### 解决方案

1. 确定你确实松开了“FEL”按钮
2. 检查NAND部分焊接，见[5.2 提示 "The spi nand flash '0x00000000' is not yet supported"](#_5-2-提示-the-spi-nand-flash-0x00000000-is-not-yet-supported)
3. 更换flash

### 5.4 卡在“等待设备重启进入DFU模式....”，但USBTreeView中啥都不显示

**现象**：卡在如图位置超过20秒：

![stuck_on_dfu.png](/images/stuck_on_dfu.png)

但USBTreeview中啥都不显示：

原因：FEL烧录Uboot后，设备读到了Uboot SPL，但是UBoot SPL 启动 UBoot Proper 失败

#### 解决方案

1. 检查供电是否正常，见[1. 三路供电没有全部出完或电压不对](#_1-三路供电没有全部出完或电压不对)
   * 检查2.5V有没有和别的供电短路
2. 检查主控芯片内存相关供电引脚是否虚焊，是否连锡
   * ![ddr_pins](/images/ddr_pins.png)
3. 更换主控。


## 6. 烧录完成后屏幕不显示

### 解决方案

#### 步骤一：检查背光

先看看背光有没有亮起来，有没有"闪一下"

参考视频（10分钟位置的表现）：[BiliBili 视频](https://www.bilibili.com/video/BV1QaSBBUE43)

#### 如果背光正常（和上述视频一样）

![屏幕信号点](/images/2_10.png)

**Ⅰ. 断电检查屏幕 6 个关键信号点两两没有短路**

**Ⅱ. 开机检查屏幕 6 个关键信号点电压**

| 信号点 | 电压 |
| :---: | :---: |
| SDA | 3.3V |
| SCL | 2V |
| CS | 3.3V |
| PCLK | 1.6V |
| HS | 3.3V |
| VS | 3.3V |

**哪一路没有就加焊那一路（F1C）**

::: warning 注意

SCL在新固件(2.x+)只有刚开机几秒钟有电压，可以多重启几次测量

:::

![F1C屏幕引脚1](/images/2_11.png)

![F1C屏幕引脚2](/images/2_12.png)

> 我是头部 此处正在施工 妖精正在完善板块

若背光没有亮起

**可能原因**：背光IC损坏、soc未给出控制信号、IC区域电感损坏（少见）

**检查方法**：不安装屏幕测量30v节点**注意！测量30V一定要小心！操作不当可能损坏soc！**

**测量方法：红笔测对应位置，黑笔找一个自己顺手的GND点位，观察表显数字，档位直流选择 ≥30V即可**

**0.3.1版本30v测量位置：**

**嘉立创版：*

![031嘉立创背光测量](/images/031嘉立创背光测量.png)

**白银原版：*

![031原版背光测量](/images/031原版背光测量.png)

**0.4版本30v测量位置：**

**嘉立创版：*

**白银原版：*

![04原版背光测量](/images/04原版背光测量.png)

**0.5.1版本30v测量位置：**

**嘉立创版：*

**白银原版：*

![051原版背光测量](/images/051原版背光测量.png)

**0.6版本30v测量位置：**

**嘉立创版：*

![06嘉立创背光测量](/images/06嘉立创背光测量.png)

**白银原版：*

![06原版背光测量](/images/06原版背光测量.png)

**解决方法**：依次更换零件，推荐顺序：

> 我是尾部 此处正在施工 妖精正在完善板块
## 7. 亮度调节不了，一直最亮

**现象**：亮度调节没有变化，一直是最亮状态

### 解决方案

检查 `SCREEN_BL_CTRL` 脚有没有虚焊

![亮度控制引脚](/images/2_13.png)

## 8. 屏幕显示颜色错误

**现象**：屏幕显示异常，包括但不限于颜色错误

**原因**：颜色线可能虚焊了

![颜色线引脚](/images/2_14.png)

---

## 奇奇怪怪的问题

### 天选6Pro AMD版 USB 报错 43

**现象**：天选6Pro AMD版右侧 USB 接口出现 USB 报错 43

**原因**：可能由于 USB 总线结构问题，即使焊接正常，USB 也会报错代码 43

### 解决方案

换到左边（电源侧）的 USB-A 接口。

> 其他 AMD 设备目前不知道会不会出现相同问题，AMD 用户可以尝试所有 USB 接口。
