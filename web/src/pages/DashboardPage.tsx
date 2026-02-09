import { Alert, Card, Col, Row, Space, Typography } from 'antd'
import { roleLabelMap } from '../config/navigation'
import { useAppStore } from '../store/useAppStore'

function DashboardPage() {
  const role = useAppStore((state) => state.currentRole)
  const metrics = useAppStore((state) => state.dashboardMetrics[state.currentRole])
  const notifications = useAppStore((state) => state.notifications)
  const latestNotifications = notifications.slice(0, 5)

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {roleLabelMap[role]}工作台
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="演示环境说明"
        description="当前页面所有业务数据来自本地 Mock，审批、履约、签章、资金动作会实时驱动页面状态变化。"
      />
      <Row gutter={[16, 16]}>
        {metrics.map((item) => (
          <Col key={item.id} xs={24} md={8}>
            <Card className="kpi-card" hoverable>
              <Typography.Text type="secondary">{item.title}</Typography.Text>
              <Typography.Title level={2} style={{ margin: '8px 0 0 0' }}>
                {item.value}
              </Typography.Title>
              {item.trend ? (
                <Typography.Text style={{ color: '#36B37E' }}>{item.trend}</Typography.Text>
              ) : null}
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="消息中心" style={{ marginTop: 16 }}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {latestNotifications.map((item) => (
            <Card key={item.id} size="small">
              <Typography.Text strong>{item.title}</Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 6 }}>
                {item.content}
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                {new Date(item.createdAt).toLocaleString('zh-CN')}
              </Typography.Text>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  )
}

export default DashboardPage
