import { Typography } from 'antd'
import { formatMoney } from '../utils/format'

interface MoneyDisplayProps {
  value: number
  danger?: boolean
  size?: 'small' | 'default' | 'large'
}

const fontSizeMap: Record<NonNullable<MoneyDisplayProps['size']>, number> = {
  small: 14,
  default: 16,
  large: 28,
}

function MoneyDisplay({ value, danger, size = 'default' }: MoneyDisplayProps) {
  return (
    <Typography.Text
      style={{
        fontFamily: '"Roboto", "DIN Alternate", "PingFang SC", sans-serif',
        fontWeight: 700,
        fontSize: fontSizeMap[size],
        color: danger ? '#FF5630' : '#172B4D',
      }}
    >
      {formatMoney(value)}
    </Typography.Text>
  )
}

export default MoneyDisplay
