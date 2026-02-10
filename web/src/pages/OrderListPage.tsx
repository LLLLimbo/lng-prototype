import { Alert, Button, Card, Drawer, Segmented, Space, Steps, Table, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type Order } from '../store/useAppStore'
import { formatMoney, formatWeight, orderStatusLabel } from '../utils/format'

type OrderFilter = 'all' | 'pending-load' | 'in-transit' | 'pending-acceptance' | 'completed'

const getProgressStep = (status: Order['status']) => {
  if (['pending-supplement', 'ordered', 'stocking'].includes(status)) {
    return 0
  }
  if (status === 'loaded') {
    return 1
  }
  if (['transporting', 'arrived'].includes(status)) {
    return 2
  }
  if (status === 'pending-acceptance') {
    return 3
  }
  return 4
}

function OrderListPage() {
  const orders = useAppStore((state) => state.orders)
  const account = useAppStore((state) => state.account)
  const plans = useAppStore((state) => state.plans)
  const [activeOrderId, setActiveOrderId] = useState<string>()
  const [filter, setFilter] = useState<OrderFilter>('all')

  const activeOrder = useMemo(
    () => orders.find((item) => item.id === activeOrderId),
    [activeOrderId, orders],
  )
  const activePlan = useMemo(
    () => plans.find((item) => item.id === activeOrder?.planId),
    [activeOrder?.planId, plans],
  )
  const filteredOrders = useMemo(() => {
    if (filter === 'all') {
      return orders
    }

    if (filter === 'pending-load') {
      return orders.filter((item) => ['pending-supplement', 'ordered', 'stocking', 'loaded'].includes(item.status))
    }

    if (filter === 'in-transit') {
      return orders.filter((item) => ['transporting', 'arrived'].includes(item.status))
    }

    if (filter === 'pending-acceptance') {
      return orders.filter((item) => item.status === 'pending-acceptance')
    }

    return orders.filter((item) => ['accepted', 'settling', 'settled', 'archived'].includes(item.status))
  }, [filter, orders])

  const downloadMock = (name: string) => {
    message.success(`${name} 下载已触发（Mock）`)
  }

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
        <Segmented<OrderFilter>
          style={{ marginBottom: 12 }}
          value={filter}
          onChange={setFilter}
          options={[
            { label: '全部', value: 'all' },
            { label: '待装/装车', value: 'pending-load' },
            { label: '运输中', value: 'in-transit' },
            { label: '待验收', value: 'pending-acceptance' },
            { label: '已完成', value: 'completed' },
          ]}
        />
        <Table
          rowKey="id"
          dataSource={filteredOrders}
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
            <Steps
              size="small"
              current={getProgressStep(activeOrder.status)}
              items={[
                { title: '下单/备货' },
                { title: '装车确认' },
                { title: '运输送达' },
                { title: '待验收' },
                { title: '结算归档' },
              ]}
            />
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

            <Card title="单据中心（Mock）" size="small">
              <Space wrap>
                <Button
                  size="small"
                  disabled={!activeOrder.supplementDocName}
                  onClick={() =>
                    downloadMock(activeOrder.supplementDocName ?? `${activeOrder.number}-supplement.pdf`)
                  }
                >
                  补录单据
                </Button>
                <Button
                  size="small"
                  disabled={typeof activeOrder.loadWeight !== 'number'}
                  onClick={() => downloadMock(`${activeOrder.number}-装车磅单.pdf`)}
                >
                  装车磅单
                </Button>
                <Button
                  size="small"
                  disabled={typeof activeOrder.unloadWeight !== 'number'}
                  onClick={() => downloadMock(`${activeOrder.number}-卸车磅单.pdf`)}
                >
                  卸车磅单
                </Button>
                <Button
                  size="small"
                  disabled={!['accepted', 'settling', 'settled', 'archived'].includes(activeOrder.status)}
                  onClick={() => downloadMock(`${activeOrder.number}-气化率单.pdf`)}
                >
                  气化率单
                </Button>
                <Button
                  size="small"
                  disabled={!['settling', 'settled', 'archived'].includes(activeOrder.status)}
                  onClick={() => downloadMock(`${activeOrder.number}-确认单.pdf`)}
                >
                  对账确认单
                </Button>
                <Button
                  size="small"
                  disabled={!['settled', 'archived'].includes(activeOrder.status)}
                  onClick={() => downloadMock(`${activeOrder.number}-发票.pdf`)}
                >
                  发票
                </Button>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default OrderListPage
