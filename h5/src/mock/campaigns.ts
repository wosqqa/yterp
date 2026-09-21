import type { CampaignConfig } from '../api/types'

const demo: CampaignConfig = {
  slug: 'demo',
  title: '示例活动：组合上新',
  theme: 'light',
  blocks: [
    {
      type: 'hero',
      data: {
        badge: 'NEW DROP',
        title: '夏日组合上新',
        subtitle: '一个活动页一个 slug，数据驱动区块渲染，接口未上线也能先用 mock。',
        primaryText: '立即参与',
        primaryUrl: '#cta',
      },
    },
    {
      type: 'richText',
      data: {
        title: '活动说明',
        paragraphs: [
          '1) 这是基础框架示例页，不依赖任何 UI 库。',
          '2) 你可以在后端实现 /api/h5/campaignConfig，返回 blocks 即可驱动页面。',
          '3) 运营页面可以按活动风格覆写主题变量与区块组件。',
        ],
      },
    },
    {
      type: 'cta',
      data: {
        id: 'cta',
        title: '准备好了就开始',
        subtitle: '把接口地址写到 .env.production 里，然后 build 发布即可。',
        buttonText: '回到首页',
        buttonUrl: '/',
      },
    },
  ],
}

const map: Record<string, CampaignConfig> = {
  [demo.slug]: demo,
}

export function getMockCampaignConfig(slug: string): CampaignConfig | null {
  const key = String(slug || '').trim()
  return map[key] || null
}
