import { Alert, Button, Segmented, Space, Table, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type Order } from '../store/useAppStore'
import { formatWeight, orderStatusLabel } from '../utils/format'

type ViewMode = 'all' | 'archivable' | 'archived'

const badgeType = (status: Order['status']) => {
  if (status === 'archived') {
    return 'neutral' as const
  }

  if (['accepted', 'settled'].includes(status)) {
    return 'success' as const
  }

  if (status === 'settling') {
    return 'warning' as const
  }

  return 'processing' as const
}

function ArchivePage() {
  const orders = useAppStore((state) => state.orders)
  const archiveOrder = useAppStore((state) => state.archiveOrder)
  const unarchiveOrder = useAppStore((state) => state.unarchiveOrder)
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  const tableData = useMemo(() => {
    if (viewMode === 'archived') {
      return orders.filter((item) => item.status === 'archived')
    }

    if (viewMode === 'archivable') {
      return orders.filter((item) => ['accepted', 'settled', 'archived'].includes(item.status))
    }

    return orders
  }, [orders, viewMode])

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        归档管理
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="归档规则"
        description="仅已验收或已结算订单支持归档。归档后核心字段只读，但可按权限取消归档。"
      />

      <Segmented<ViewMode>
        options={[
          { label: '全部订单', value: 'all' },
          { label: '可归档', value: 'archivable' },
          { label: '已归档', value: 'archived' },
        ]}
        value={viewMode}
        onChange={(value) => setViewMode(value)}
        style={{ marginBottom: 16 }}
      />

      <Table
        rowKey="id"
        dataSource={tableData}
        pagination={false}
        columns={[
          { title: '订单号', dataIndex: 'number' },
          { title: '客户', dataIndex: 'customerName' },
          { title: '站点', dataIndex: 'siteName' },
          {
            title: '结算量',
            dataIndex: 'settlementWeight',
            align: 'right',
            render: formatWeight,
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: Order['status']) => (
              <StatusBadge text={orderStatusLabel[value]} type={badgeType(value)} />
            ),
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record: Order) => (
              <Space>
                {record.status === 'archived' ? (
                  <Button
                    size="small"
                    onClick={() => {
                      const result = unarchiveOrder(record.id, '调度-刘工')
                      if (!result.success) {
                        message.error(result.error)
                        return
                      }
                      message.success('已取消归档')
                    }}
                  >
                    取消归档
                  </Button>
                ) : (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      const result = archiveOrder(record.id, '调度-刘工')
                      if (!result.success) {
                        message.warning(result.error)
                        return
                      }
                      message.success('订单已归档')
                    }}
                  >
                    手动归档
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}

export default ArchivePage
