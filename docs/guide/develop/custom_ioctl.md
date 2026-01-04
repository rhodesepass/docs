# 定制ioctl文档

电子通信证播放程序[drm_app_neo](https://github.com/rhodesepass/drm_app_neo)中使用了定制的ioctl，本章节将介绍这个ioctl的用法。

ioctl是在sun4i-drm上添加的，源代码见[buildroot中的这个patch](https://github.com/rhodesepass/buildroot/blob/master/board/rhodesisland/epass/patch/linux/0007-srgn-drm-atomic-ioctl.patch)

添加本ioctl的目的是：
* 现有的Drm Atomic API在每次调用时都需要重新进行modeset，读写大量寄存器，很慢。而我们只需要更改CRTC_X CRTC_Y alpha等少数寄存器，完全可以一个regmap_write搞定。
* Cedarc的解码无法手动给出buffer。只能去问cedarc要他在ion里申请的buffer。如果不使用一些非常规手段直接设置寄存器地址的话，就需要CPU每帧进行画面复制，效率很低。

## 注意：
IOCTL不会等待vblank，他会尽快写入寄存器并退回。你可以考虑使用drmWaitVblank完成等待。

IOCTL没有实现Modeset API！你需要先用drm申请图层、申请buffer（或者想办法获得一块1024byte对其的连续的buffer），进行一次Modeset以后，再开始调用ioctl。

## ioctl定义

ioctl的结构如下：
```c
#define DRM_SRGN_ATOMIC_COMMIT 0x00
#define DRM_SRGN_RESET_FB_CACHE 0x01


+// arg0: fb address(in userspace)
#define DRM_SRGN_ATOMIC_COMMIT_MOUNT_FB_NORMAL 0x00
// arg0: fb Y address(in userspace)
// arg1: fb UV address(in userspace)
#define DRM_SRGN_ATOMIC_COMMIT_MOUNT_FB_YUV 0x01
// arg0: y<<16 | x, y,x is in two's complement form,pixel
#define DRM_SRGN_ATOMIC_COMMIT_MOUNT_SET_COORD 0x02
// arg0: alpha, 255 = no alpha.
// set alpha = 255 before use pixel-wise alpha.
#define DRM_SRGN_ATOMIC_COMMIT_MOUNT_SET_ALPHA 0x03

struct drm_srgn_atomic_commit_data {
    __u32 layer_id;
    __u32 type;
    __u32 arg0;
    __u32 arg1;
    __u32 arg2;
};
+
struct drm_srgn_atomic_commit {
    __u32 size;
    __u32 data;
};
```

### DRM_SRGN_ATOMIC_COMMIT 说明

本ioctl类似于drm的atomic commit ioctl，但功能更简单，只支持挂载buffer、设置图层和透明度。

一次提交可执行多个操作。每个操作的结构是drm_srgn_atomic_commit_data，包含以下字段：

* layer_id: 图层ID，用于标识图层。sun4i-drm中一共从下到上分为图层0~3四个图层。
* type: 操作类型，目前支持以下几种类型：
  * DRM_SRGN_ATOMIC_COMMIT_MOUNT_FB_NORMAL: 挂载普通RGB buffer
  * DRM_SRGN_ATOMIC_COMMIT_MOUNT_FB_YUV: 挂载YUV buffer
  * DRM_SRGN_ATOMIC_COMMIT_MOUNT_SET_COORD: 设置图层坐标
  * DRM_SRGN_ATOMIC_COMMIT_MOUNT_SET_ALPHA: 设置图层透明度
* arg0/1/2: 操作参数0/1/2，根据type不同有不同含义。

提交请求所需要提交的结构是drm_srgn_atomic_commit。其中size是操作的个数，data是指向drm_srgn_atomic_commit_data的指针。

目前设置内核一次最多处理16项操作。

#### MOUNT_FB_NORMAL

* type: DRM_SRGN_ATOMIC_COMMIT_MOUNT_FB_NORMAL
* arg0: buffer地址(用户态地址)

挂载普通RGB buffer。

> 注：
> buffer地址是用户态的虚拟地址。要能被ioctl调用方访问的地址区域，由ioctl做虚拟地址到物理地址的转换，下同

#### MOUNT_FB_YUV

type: DRM_SRGN_ATOMIC_COMMIT_MOUNT_FB_YUV
arg0: buffer Y地址(用户态地址)
arg1: buffer UV地址(用户态地址)
挂载YUV buffer。

#### SET_COORD

* type: DRM_SRGN_ATOMIC_COMMIT_MOUNT_SET_COORD
* arg0: (y<<16 | x), y,x是像素坐标，两个数都以补码形式给出

设置图层坐标。

#### SET_ALPHA

* type: DRM_SRGN_ATOMIC_COMMIT_MOUNT_SET_ALPHA
* arg0: alpha, 0~255.0 全透明，255 不透明。

设置图层透明度。

若设置设置alpha为255，同时会关闭图层的alpha使能寄存器。
否则，会自动开启图层的alpha使能寄存器。

## 示例代码
（咕咕咕，可以先参考一下：https://github.com/rhodesepass/drm_app_neo/blob/master/src/driver/drm_warpper.c