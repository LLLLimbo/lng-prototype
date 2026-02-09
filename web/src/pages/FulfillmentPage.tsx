import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type Order } from '../store/useAppStore'
import { formatWeight, orderStatusLabel } from '../utils/format'

interface BoardColumn {
  key: string
  title: string
  statuses: Order['status'][]
}

const boardColumns: BoardColumn[] = [
  {
    key: 'pending-load',
    title: '待装车',
    statuses: ['pending-supplement', 'ordered', 'stocking'],
  },
  {
    key: 'on-road',
    title: '运输中',
    statuses: ['loaded', 'transporting'],
  },
  {
    key: 'settling',
    title: '磅差处理中',
    statuses: ['settling'],
  },
  {
    key: 'acceptance',
    title: '待验收',
    statuses: ['pending-acceptance', 'accepted'],
  },
]

const statusColorType = (status: Order['status']) => {
  if (['settling'].includes(status)) {
    return 'danger' as const
  }

  if (['pending-acceptance', 'ordered', 'pending-supplement', 'stocking'].includes(status)) {
    return 'pending' as const
  }

  if (['accepted', 'settled', 'archived'].includes(status)) {
    return 'success' as const
  }

  return 'processing' as const
}

function FulfillmentPage() {
  const orders = useAppStore((state) => state.orders)
  const confirmLoad = useAppStore((state) => state.confirmLoad)
  const confirmUnload = useAppStore((state) => state.confirmUnload)
  const resolveDiffException = useAppStore((state) => state.resolveDiffException)
  const acceptOrder = useAppStore((state) => state.acceptOrder)
  const [activeOrderId, setActiveOrderId] = useState<string>()
  const [loadWeightInput, setLoadWeightInput] = useState<number>()
  const [unloadWeightInput, setUnloadWeightInput] = useState<number>()
  const [finalWeightInput, setFinalWeightInput] = useState<number>()
  const [exceptionNote, setExceptionNote] = useState('')

  const activeOrder = useMemo(
    () => orders.find((item) => item.id === activeOrderId),
    [activeOrderId, orders],
  )

  const boardData = useMemo(
    () =>
      boardColumns.map((column) => ({
        ...column,
        records: orders.filter((item) => column.statuses.includes(item.status)),
      })),
    [orders],
  )

  const submitLoad = () => {
    if (!activeOrder || typeof loadWeightInput !== 'number') {
      message.error('请填写装车量')
      return
    }

    confirmLoad({ orderId: activeOrder.id, weight: loadWeightInput })
    message.success('装车确认完成')
  }

  const submitUnload = () => {
    if (!activeOrder || typeof unloadWeightInput !== 'number') {
      message.error('请填写卸车量')
      return
    }

    confirmUnload({ orderId: activeOrder.id, weight: unloadWeightInput })
    message.success('卸车信息已提交')
  }

  const submitException = () => {
    if (!activeOrder || typeof finalWeightInput !== 'number') {
      message.error('请输入最终结算量')
      return
    }

    resolveDiffException(activeOrder.id, finalWeightInput, exceptionNote)
    message.success('磅差异常已处理并提交复核')
    setFinalWeightInput(undefined)
    setExceptionNote('')
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        履约看板
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        支持装车确认、卸车确认、磅差异常处理及验收，全部为 Mock 流程但状态会真实流转。
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        {boardData.map((column) => (
          <Col key={column.key} xs={24} lg={6}>
            <Card
              title={`${column.title} (${column.records.length})`}
              size="small"
              styles={{ body: { minHeight: 340 } }}
            >
              {column.records.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无订单" />
              ) : (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {column.records.map((order) => (
                    <Card
                      key={order.id}
                      size="small"
                      className={order.diffAbnormal ? 'kanban-card abnormal' : 'kanban-card'}
                      onClick={() => setActiveOrderId(order.id)}
                    >
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Typography.Text strong>{order.number}</Typography.Text>
                        <Typography.Text type="secondary">{order.customerName}</Typography.Text>
                        <Typography.Text type="secondary">{order.siteName}</Typography.Text>
                        <StatusBadge
                          text={orderStatusLabel[order.status]}
                          type={statusColorType(order.status)}
                        />
                      </Space>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Drawer
        title="订单履约详情"
        width={580}
        open={Boolean(activeOrder)}
        onClose={() => setActiveOrderId(undefined)}
      >
        {activeOrder ? (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Typography.Text>
              <strong>订单编号：</strong>
              {activeOrder.number}
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

            <Divider style={{ margin: 0 }} />

            <Card size="small" title="装/卸车确认">
              <Form layout="vertical">
                <Form.Item label="装车量（吨）">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={3}
                    value={loadWeightInput}
                    onChange={(value) => setLoadWeightInput(Number(value ?? 0))}
                  />
                </Form.Item>
                <Button onClick={submitLoad}>提交装车确认</Button>
                <Form.Item label="卸车量（吨）" style={{ marginTop: 12 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={3}
                    value={unloadWeightInput}
                    onChange={(value) => setUnloadWeightInput(Number(value ?? 0))}
                  />
                </Form.Item>
                <Button type="primary" onClick={submitUnload}>
                  提交卸车确认
                </Button>
              </Form>
            </Card>

            {activeOrder.diffAbnormal ? (
              <Card size="small" title="磅差异常处理">
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="检测到磅差异常，请处理结算量"
                  description={`阈值 ${activeOrder.threshold.toFixed(3)} 吨，当前差值 ${Math.abs(
                    (activeOrder.loadWeight ?? 0) - (activeOrder.unloadWeight ?? 0),
                  ).toFixed(3)} 吨`}
                />
                <Form layout="vertical">
                  <Form.Item label="最终结算量（吨）">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      precision={3}
                      value={finalWeightInput}
                      onChange={(value) => setFinalWeightInput(Number(value ?? 0))}
                    />
                  </Form.Item>
                  <Form.Item label="处理备注">
                    <Input.TextArea
                      rows={3}
                      value={exceptionNote}
                      onChange={(event) => setExceptionNote(event.target.value)}
                    />
                  </Form.Item>
                  <Button danger onClick={submitException}>
                    提交异常处理
                  </Button>
                </Form>
              </Card>
            ) : null}

            <Card size="small" title="验收操作">
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    const settlementWeight = activeOrder.settlementWeight ?? activeOrder.unloadWeight ?? 0
                    acceptOrder(activeOrder.id, true, settlementWeight)
                    message.success('验收通过')
                  }}
                >
                  验收通过
                </Button>
                <Button
                  danger
                  onClick={() => {
                    const settlementWeight = activeOrder.settlementWeight ?? activeOrder.unloadWeight ?? 0
                    acceptOrder(activeOrder.id, false, settlementWeight)
                    message.warning('已标记验收不通过')
                  }}
                >
                  验收不通过
                </Button>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default FulfillmentPage
