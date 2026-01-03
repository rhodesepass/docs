import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '明日方舟电子通行证',
  description: '基于F1C200S的开源Linux手持开发板文档',
  lang: 'zh-CN',
  base: '/docs/', // GitHub 仓库名，部署到 rhodesepass/hardware-docs-2.0

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
      {
        text: '相关链接',
        items: [
          { text: '文档GitHub', link: 'https://github.com/rhodesepass/docs' },
          { text: '软件仓库', link: 'https://github.com/inapp123/epass_drm_app' }
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
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/rhodesepass/docs' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2025-present'
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
      pattern: 'https://github.com/rhodesepass/docs/edit/master/docs/:path',
      text: '在 GitHub 上编辑此页面'
    }
  }
})
