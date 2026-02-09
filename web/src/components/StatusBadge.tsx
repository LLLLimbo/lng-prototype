import { Tag } from 'antd'

type BadgeType =
  | 'draft'
  | 'pending'
  | 'success'
  | 'danger'
  | 'warning'
  | 'processing'
  | 'neutral'

const colorByType: Record<BadgeType, string> = {
  draft: '#F4F5F7',
  pending: '#FFF0B3',
  success: '#E3FCEF',
  danger: '#FFEBE6',
  warning: '#FFF0B3',
  processing: '#DEEBFF',
  neutral: '#F4F5F7',
}

const textColorByType: Record<BadgeType, string> = {
  draft: '#42526E',
  pending: '#FF8B00',
  success: '#006644',
  danger: '#BF2600',
  warning: '#FF8B00',
  processing: '#0747A6',
  neutral: '#97A0AF',
}

export interface StatusBadgeProps {
  text: string
  type: BadgeType
}

function StatusBadge({ text, type }: StatusBadgeProps) {
  return (
    <Tag
      style={{
        borderRadius: 9999,
        border: 'none',
        backgroundColor: colorByType[type],
        color: textColorByType[type],
        fontWeight: 600,
        paddingInline: 10,
      }}
    >
      {text}
    </Tag>
  )
}

export default StatusBadge
