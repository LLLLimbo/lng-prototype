import type { OrderStatus, PlanStatus } from '../store/useAppStore'

export const formatMoney = (amount: number) =>
  `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export const formatWeight = (weight: number | undefined) =>
  typeof weight === 'number' ? `${weight.toFixed(3)} 吨` : '--'

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('zh-CN', {
    hour12: false,
  })

export const planStatusLabel: Record<PlanStatus, string> = {
  draft: '草稿',
  submitted: '待审核',
  returned: '已退回',
  approved: '已批准',
  cancelled: '已取消',
  changed: '已变更',
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  'pending-supplement': '待补录',
  ordered: '已下单',
  stocking: '备货中',
  loaded: '已装车',
  transporting: '运输中',
  arrived: '已送达',
  'pending-acceptance': '待验收',
  accepted: '已验收',
  settling: '结算中',
  settled: '已结算',
  archived: '已归档',
}

export const reconciliationStatusLabel: Record<
  'draft' | 'platform-stamped' | 'double-confirmed' | 'offline-confirmed',
  string
> = {
  draft: '待签章',
  'platform-stamped': '待客户签章',
  'double-confirmed': '双方已确认',
  'offline-confirmed': '线下已确认',
}
