import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Row,
  Space,
  Table,
  Timeline,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore } from '../store/useAppStore'
import { formatMoney, reconciliationStatusLabel } from '../utils/format'

const statusTypeMap: Record<
  'draft' | 'platform-stamped' | 'double-confirmed' | 'offline-confirmed',
  'pending' | 'processing' | 'success'
> = {
  draft: 'pending',
  'platform-stamped': 'processing',
  'double-confirmed': 'success',
  'offline-confirmed': 'success',
}

function ReconciliationPage() {
  const role = useAppStore((state) => state.currentRole)
  const statements = useAppStore((state) => state.reconciliations)
  const applyStamp = useAppStore((state) => state.applyStamp)
  const [activeId, setActiveId] = useState<string>(statements[0]?.id ?? '')
  const [stampFx, setStampFx] = useState(false)

  const activeStatement = useMemo(
    () => statements.find((item) => item.id === activeId),
    [activeId, statements],
  )

  const triggerStampAnimation = () => {
    setStampFx(true)
    window.setTimeout(() => setStampFx(false), 450)
  }

  const onPlatformStamp = () => {
    if (!activeStatement) {
      return
    }

    applyStamp(activeStatement.id, 'platform', '市场部-王经理')
    triggerStampAnimation()
    message.success('已加盖平台公章')
  }

  const onCustomerStamp = () => {
    if (!activeStatement) {
      return
    }

    applyStamp(activeStatement.id, 'customer', '终端用户-张三')
    triggerStampAnimation()
    message.success('客户签章完成')
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        对账与签章
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={13}>
          <Card title="对账单列表">
            <Table
              rowKey="id"
              dataSource={statements}
              pagination={false}
              columns={[
                {
                  title: '编号',
                  dataIndex: 'number',
                  render: (value: string, record) => (
                    <Button type="link" style={{ padding: 0 }} onClick={() => setActiveId(record.id)}>
                      {value}
                    </Button>
                  ),
                },
                { title: '周期', dataIndex: 'period' },
                {
                  title: '金额',
                  dataIndex: 'totalAmount',
                  align: 'right',
                  render: (value: number) => formatMoney(value),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: 'draft' | 'platform-stamped' | 'double-confirmed' | 'offline-confirmed') => (
                    <StatusBadge
                      text={reconciliationStatusLabel[value]}
                      type={statusTypeMap[value]}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={11}>
          <Card title="签章面板" className="stamp-panel">
            {activeStatement ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Typography.Text>
                  <strong>对账单：</strong>
                  {activeStatement.number}
                </Typography.Text>
                <Typography.Text>
                  <strong>客户：</strong>
                  {activeStatement.customerName}
                </Typography.Text>
                <Typography.Text>
                  <strong>状态：</strong>
                  {reconciliationStatusLabel[activeStatement.status]}
                </Typography.Text>
                <Alert
                  type="info"
                  showIcon
                  message="Mock 在线签章"
                  description="点击按钮后将触发 0.4s 盖章动画并更新状态，签章日志同步记录。"
                />

                <div className="stamp-preview">
                  <div className={stampFx ? 'stamp-mark animate' : 'stamp-mark'}>已签章</div>
                  <Typography.Text type="secondary">PDF 预览占位（演示）</Typography.Text>
                </div>

                <Space>
                  <Button
                    type="primary"
                    disabled={activeStatement.status !== 'draft'}
                    onClick={onPlatformStamp}
                  >
                    加盖公章
                  </Button>
                  <Button
                    danger={role === 'terminal'}
                    disabled={activeStatement.status !== 'platform-stamped'}
                    onClick={onCustomerStamp}
                  >
                    客户确认签章
                  </Button>
                </Space>

                <Divider style={{ margin: '4px 0' }} />

                {activeStatement.stampLogs.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无签章记录" />
                ) : (
                  <Timeline
                    items={activeStatement.stampLogs.map((log) => ({
                      color: log.actorType === 'platform' ? '#0052CC' : '#36B37E',
                      children: `${
                        log.actorType === 'platform' ? '平台签章' : '客户签章'
                      } - ${log.actor} (${new Date(log.stampedAt).toLocaleString('zh-CN')})`,
                    }))}
                  />
                )}
              </Space>
            ) : (
              <Empty description="请选择对账单" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ReconciliationPage
