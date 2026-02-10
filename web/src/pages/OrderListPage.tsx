import { Alert, Button, Card, Drawer, Space, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type Order } from '../store/useAppStore'
import { formatMoney, formatWeight, orderStatusLabel } from '../utils/format'

function OrderListPage() {
  const orders = useAppStore((state) => state.orders)
  const account = useAppStore((state) => state.account)
  const plans = useAppStore((state) => state.plans)
  const [activeOrderId, setActiveOrderId] = useState<string>()

  const activeOrder = useMemo(
    () => orders.find((item) => item.id === activeOrderId),
    [activeOrderId, orders],
  )
  const activePlan = useMemo(
    () => plans.find((item) => item.id === activeOrder?.planId),
    [activeOrder?.planId, plans],
  )

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        订单列表
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="订单跟踪"
        description="支持查看订单状态、装卸车量、结算量、补录信息与付款占用/冻结情况。"
      />

      <Card>
        <Table
          rowKey="id"
          dataSource={orders}
          pagination={false}
          columns={[
            {
              title: '订单编号',
              dataIndex: 'number',
              render: (value: string, record: Order) => (
                <Button type="link" style={{ padding: 0 }} onClick={() => setActiveOrderId(record.id)}>
                  {value}
                </Button>
              ),
            },
            { title: '站点', dataIndex: 'siteName' },
            {
              title: '运输方式',
              dataIndex: 'transportMode',
              render: (value: string) =>
                value === 'upstream' ? '上游配送' : value === 'self' ? '用户自提' : '承运商配送',
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (value: Order['status']) => (
                <StatusBadge text={orderStatusLabel[value]} type="processing" />
              ),
            },
            {
              title: '结算量',
              dataIndex: 'settlementWeight',
              align: 'right',
              render: (value?: number) => formatWeight(value),
            },
          ]}
        />
      </Card>

      <Drawer
        title="订单详情"
        width={600}
        open={Boolean(activeOrder)}
        onClose={() => setActiveOrderId(undefined)}
      >
        {activeOrder ? (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text>
              <strong>订单编号：</strong>
              {activeOrder.number}
            </Typography.Text>
            <Typography.Text>
              <strong>关联计划：</strong>
              {activePlan?.number ?? '--'}
            </Typography.Text>
            <Typography.Text>
              <strong>当前状态：</strong>
              {orderStatusLabel[activeOrder.status]}
            </Typography.Text>
            <Typography.Text>
              <strong>装车量：</strong>
              {formatWeight(activeOrder.loadWeight)}
            </Typography.Text>
            <Typography.Text>
              <strong>卸车量：</strong>
              {formatWeight(activeOrder.unloadWeight)}
            </Typography.Text>
            <Typography.Text>
              <strong>结算量：</strong>
              {formatWeight(activeOrder.settlementWeight)}
            </Typography.Text>
            <Typography.Text>
              <strong>补录单据：</strong>
              {activeOrder.supplementDocName ?? '--'}
            </Typography.Text>
            <Typography.Text>
              <strong>付款方式：</strong>
              {activePlan?.paymentMethod === 'postpaid' ? '后付' : '预付'}
            </Typography.Text>
            <Typography.Text>
              <strong>账户可用余额：</strong>
              {formatMoney(account.available)}
            </Typography.Text>
            <Typography.Text>
              <strong>已冻结金额：</strong>
              {formatMoney(account.frozen)}
            </Typography.Text>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default OrderListPage
