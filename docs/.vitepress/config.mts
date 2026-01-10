import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '明日方舟电子通行证',
  description: '基于F1C200S的开源Linux手持开发板文档',
  lang: 'zh-CN',
  base: '/', // 部署到 ep.iccmc.cc

  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: '硬件', link: '/guide/hardware/' },
      { text: '固件', link: '/guide/firmware/' },
      { text: '调试', link: '/guide/debug/' },
      { text: '开发', link: '/guide/develop/' },
      { text: '使用说明', link: '/guide/docs-usage/' },
      { text: '贡献者', link: '/guide/contributors' },
      {
        text: '相关链接',
        items: [
          { text: '文档GitHub', link: 'https://github.com/rhodesepass/docs' },
          { text: '软件仓库', link: 'https://github.com/inapp123/epass_drm_app' },
          { text: '文件归集', link: 'https://oplst.iccmc.cc' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '准备工作', link: '/guide/preparation' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        },
        {
          text: '硬件部分',
          collapsed: false,
          items: [
            { text: '硬件概述', link: '/guide/hardware/' },
            { text: 'PCB下单指南', link: '/guide/hardware/pcb-order' },
            { text: '元器件购买', link: '/guide/hardware/components' },
            { text: '贴装须知', link: '/guide/hardware/assembly-notes' },
            { text: '贴装过程', link: '/guide/hardware/assembly' }
          ]
        },
        {
          text: '固件部分',
          collapsed: false,
          items: [
            { text: '固件概述', link: '/guide/firmware/' },
            { text: '固件烧录', link: '/guide/firmware/flash' }
          ]
        },
        {
          text: '调试排障',
          collapsed: false,
          items: [
            { text: '调试概述', link: '/guide/debug/' },
            { text: '常见故障', link: '/guide/debug/troubleshooting' }
          ]
        },
        {
          text: '使用说明',
          collapsed: false,
          items: [
            { text: '说明书目录', link: '/guide/docs-usage/' },
            { text: '通行证使用说明书', link: '/guide/docs-usage/user-manual' },
          ]
        },
        {
          text: '开发指引',
          collapsed: false,
          items: [
            { text: '开发概述', link: '/guide/develop/' },
            { text: '开发环境搭建', link: '/guide/develop/env_setup' },
            { text: '第一个应用程序', link: '/guide/develop/your_first_app' },
            { text: '定制ioctl文档', link: '/guide/develop/custom_ioctl' },
            { text: '设备树中的功能开关', link: '/guide/develop/dt_switch' },
          ]
        },
        {
          text: '贡献者',
          collapsed: false,
          items: [
            { text: '贡献者名单', link: '/guide/contributors' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/rhodesepass/docs' }
    ],

    footer: {
      message: '白银的工具箱 | <a href="https://beian.miit.gov.cn/">桂ICP备2021004005号-1 </a> <img src="https://iccmc.cc/ga_beian.png" width="12px" style="display:inline"> <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=45010202000531">桂公网安备 45010202000531号</a>',
      copyright: 'Copyright ©电子通行证Contributors 2025-present 基于CC-BY-SA 4.0许可发布'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于'
    },

    editLink: {
      pattern: 'https://github.com/rhodesepass/docs/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    }
  }
})
