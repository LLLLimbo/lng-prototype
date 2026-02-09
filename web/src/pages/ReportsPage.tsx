import { BarChartOutlined, DownloadOutlined, PieChartOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatMoney } from '../utils/format'

function ReportsPage() {
  const plans = useAppStore((state) => state.plans)
  const orders = useAppStore((state) => state.orders)
  const exceptions = useAppStore((state) => state.exceptions)
  const invoices = useAppStore((state) => state.invoices)
  const deposits = useAppStore((state) => state.deposits)

  const reportData = useMemo(() => {
    const submittedPlans = plans.filter((item) => item.status === 'submitted').length
    const approvedPlans = plans.filter((item) => item.status === 'approved').length
    const totalPlans = plans.length || 1
    const approvalRate = Math.round((approvedPlans / totalPlans) * 100)

    const transportingOrders = orders.filter((item) => item.status === 'transporting').length
    const acceptanceOrders = orders.filter((item) => item.status === 'accepted').length
    const archivedOrders = orders.filter((item) => item.status === 'archived').length

    const pendingExceptions = exceptions.filter((item) => item.status === 'pending').length
    const approvedExceptions = exceptions.filter((item) => item.status === 'approved').length

    const issuedInvoiceAmount = invoices
      .filter((item) => item.status === 'issued')
      .reduce((sum, item) => sum + item.amount, 0)
    const pendingInvoiceAmount = invoices
      .filter((item) => item.status === 'pending')
      .reduce((sum, item) => sum + item.amount, 0)

    const confirmedDeposits = deposits
      .filter((item) => item.status === 'confirmed')
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      submittedPlans,
      approvedPlans,
      approvalRate,
      transportingOrders,
      acceptanceOrders,
      archivedOrders,
      pendingExceptions,
      approvedExceptions,
      issuedInvoiceAmount,
      pendingInvoiceAmount,
      confirmedDeposits,
    }
  }, [deposits, exceptions, invoices, orders, plans])

  return (
    <div className="page-section">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            报表分析
          </Typography.Title>
        </Col>
        <Col>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => message.success('已导出当前筛选报表（Mock）')}
          >
            导出报表
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card>
            <Statistic title="计划通过率" value={reportData.approvalRate} suffix="%" />
            <Progress percent={reportData.approvalRate} showInfo={false} strokeColor="#36B37E" />
            <Typography.Text type="secondary">
              待审批 {reportData.submittedPlans} / 已批准 {reportData.approvedPlans}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card>
            <Statistic title="履约进度" value={reportData.transportingOrders} suffix="单运输中" />
            <Space size={12} style={{ marginTop: 8 }}>
              <Tag color="blue">待验收 {reportData.acceptanceOrders}</Tag>
              <Tag color="default">已归档 {reportData.archivedOrders}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card>
            <Statistic
              title="异常审批"
              value={reportData.pendingExceptions}
              suffix="单待处理"
            />
            <Typography.Text type="secondary">
              已通过 {reportData.approvedExceptions} 单
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} xl={12}>
          <Card title={<><PieChartOutlined /> 资金与开票概览</>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Row justify="space-between">
                <Typography.Text>已开票金额</Typography.Text>
                <Typography.Text strong>{formatMoney(reportData.issuedInvoiceAmount)}</Typography.Text>
              </Row>
              <Row justify="space-between">
                <Typography.Text>待开票金额</Typography.Text>
                <Typography.Text strong>{formatMoney(reportData.pendingInvoiceAmount)}</Typography.Text>
              </Row>
              <Row justify="space-between">
                <Typography.Text>已确认预存金额</Typography.Text>
                <Typography.Text strong>{formatMoney(reportData.confirmedDeposits)}</Typography.Text>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title={<><BarChartOutlined /> 异常分布</>}>
            <Table
              size="small"
              rowKey="type"
              pagination={false}
              dataSource={Object.entries(
                exceptions.reduce<Record<string, number>>((acc, item) => {
                  const key = item.type
                  acc[key] = (acc[key] ?? 0) + 1
                  return acc
                }, {}),
              ).map(([type, count]) => ({ type, count }))}
              columns={[
                {
                  title: '类型',
                  dataIndex: 'type',
                  render: (value: string) => value,
                },
                {
                  title: '数量',
                  dataIndex: 'count',
                  align: 'right',
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ReportsPage
