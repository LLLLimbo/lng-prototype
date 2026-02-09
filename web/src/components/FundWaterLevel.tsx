import { Flex, Typography } from 'antd'
import type { Account } from '../store/useAppStore'
import { formatMoney } from '../utils/format'

interface FundWaterLevelProps {
  account: Account
}

const sectionStyle = (color: string, width: string) => ({
  width,
  height: 14,
  backgroundColor: color,
})

function FundWaterLevel({ account }: FundWaterLevelProps) {
  const total = account.total || 1
  const availablePct = Math.max(0, (account.available / total) * 100)
  const occupiedPct = Math.max(0, (account.occupied / total) * 100)
  const frozenPct = Math.max(0, (account.frozen / total) * 100)
  const availableColor = account.available > 0 ? '#36B37E' : '#FF5630'

  return (
    <Flex vertical gap={8}>
      <Flex justify="space-between" align="center">
        <Typography.Text style={{ fontWeight: 600 }}>资金水位条</Typography.Text>
        <Typography.Text type="secondary">
          总额 {formatMoney(account.total)}
        </Typography.Text>
      </Flex>
      <Flex style={{ borderRadius: 9999, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px #E3E8EF' }}>
        <div style={sectionStyle('#FFAB00', `${occupiedPct}%`)} />
        <div style={sectionStyle('#0052CC', `${frozenPct}%`)} />
        <div style={sectionStyle(availableColor, `${availablePct}%`)} />
      </Flex>
      <Flex gap={12} wrap>
        <Typography.Text>已占用：{formatMoney(account.occupied)}</Typography.Text>
        <Typography.Text>已冻结：{formatMoney(account.frozen)}</Typography.Text>
        <Typography.Text style={{ color: account.available > 0 ? '#006644' : '#BF2600' }}>
          可用：{formatMoney(account.available)}
        </Typography.Text>
      </Flex>
    </Flex>
  )
}

export default FundWaterLevel
