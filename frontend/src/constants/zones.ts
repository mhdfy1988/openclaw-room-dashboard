import type { ZoneMeta } from '../types/room'

export const zones: ZoneMeta[] = [
  {
    key: 'center-console',
    title: '中控台',
    icon: '🕹️',
    subtitle: '主控与调度',
    accentLabel: '指挥链路',
  },
  {
    key: 'work-desk',
    title: '工作台',
    icon: '💼',
    subtitle: '执行工位',
    accentLabel: '专注席位',
  },
  {
    key: 'study-desk',
    title: '学习桌',
    icon: '📚',
    subtitle: '研究与阅读工位',
    accentLabel: '阅读席位',
  },
  {
    key: 'sofa',
    title: '沙发区',
    icon: '🛋️',
    subtitle: '休息与讨论区',
  },
  {
    key: 'bed',
    title: '卧室',
    icon: '🛏️',
    subtitle: '睡眠与离线区',
  },
]
