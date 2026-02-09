import { Card, Col, Row, Statistic, Table, Typography } from 'antd'
import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatMoney } from '../utils/format'

function SettlementPage() {
  const orders = useAppStore((state) => state.orders)
  const invoices = useAppStore((state) => state.invoices)

  const summary = useMemo(() => {
    const acceptedOrders = orders.filter((item) => ['accepted', 'settled', 'archived'].includes(item.status))
    const unsettledOrders = orders.filter((item) => !['settled', 'archived'].includes(item.status))

    return {
      totalOrders: orders.length,
      acceptedAmount: acceptedOrders.reduce(
        (sum, item) => sum + (item.settlementWeight ?? 0) * 3950,
        0,
      ),
      pendingOrders: unsettledOrders.length,
      issuedInvoiceAmount: invoices
        .filter((item) => item.status === 'issued')
        .reduce((sum, item) => sum + item.amount, 0),
    }
  }, [invoices, orders])

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        结算看板
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="订单总数" value={summary.totalOrders} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="已验收金额" value={summary.acceptedAmount} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="待处理订单" value={summary.pendingOrders} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic
              title="已开票金额"
              value={summary.issuedInvoiceAmount}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      <Card title="逐单结算视图" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          dataSource={orders}
          pagination={false}
          columns={[
            { title: '订单号', dataIndex: 'number' },
            { title: '站点', dataIndex: 'siteName' },
            {
              title: '结算量',
              dataIndex: 'settlementWeight',
              align: 'right',
              render: (value: number | undefined) =>
                typeof value === 'number' ? `${value.toFixed(3)} 吨` : '--',
            },
            {
              title: '结算金额',
              key: 'amount',
              align: 'right',
              render: (_, record) =>
                formatMoney((record.settlementWeight ?? 0) * 3950),
            },
            { title: '状态', dataIndex: 'status' },
          ]}
        />
      </Card>
    </div>
  )
}

export default SettlementPage
