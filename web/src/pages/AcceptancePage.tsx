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
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { type Order, useAppStore } from '../store/useAppStore'
import { formatDateTime, formatWeight, orderStatusLabel } from '../utils/format'

type QueueScope = 'all' | 'overtime'
type AcceptanceResult = 'pass' | 'reject'

interface QueueRecord extends Order {
  arrivalAt: string
  overtime: boolean
}

interface AcceptanceFormValue {
  result: AcceptanceResult
  acceptanceWeight: number
  gasificationAttachment: string
  supplementAttachments?: string[]
  remark?: string
  rejectReason?: string
}

interface AcceptanceLocalRecord {
  orderId: string
  orderNo: string
  result: AcceptanceResult
  acceptanceWeight: number
  gasificationAttachment: string
  supplementAttachments: string[]
  remark: string
  rejectReason?: string
  submittedAt: string
}

const strictAcceptanceStatuses: Order['status'][] = ['pending-acceptance', 'settling', 'arrived']
const demoAcceptanceStatuses: Order['status'][] = ['transporting', 'loaded', 'ordered']

const mockSupplementTemplates = [
  '{orderNo}-交接记录.jpg',
  '{orderNo}-现场照片-1.png',
  '{orderNo}-补充说明.pdf',
]

const statusType = (status: Order['status']) => {
  if (status === 'pending-acceptance') {
    return 'pending' as const
  }

  if (status === 'settling') {
    return 'warning' as const
  }

  if (['accepted', 'settled', 'archived'].includes(status)) {
    return 'success' as const
  }

  if (['transporting', 'arrived', 'loaded', 'ordered'].includes(status)) {
    return 'processing' as const
  }

  return 'neutral' as const
}

const resultBadge = (result: AcceptanceResult) => (
  <StatusBadge text={result === 'pass' ? '验收通过' : '验收不通过'} type={result === 'pass' ? 'success' : 'danger'} />
)

function resolveOrderDate(orderNo: string): Date | undefined {
  const matched = /^OD-(\d{4})(\d{2})(\d{2})-\d+$/.exec(orderNo)

  if (!matched) {
    return undefined
  }

  return new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
    9,
    0,
    0,
  )
}

function resolveArrivalAt(order: Order) {
  if (order.estimatedLoadAt) {
    const asDate = new Date(order.estimatedLoadAt)

    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString()
    }
  }

  const byOrderNo = resolveOrderDate(order.number)
  return byOrderNo ? byOrderNo.toISOString() : new Date().toISOString()
}

function resolveDefaultWeight(order: Order) {
  return Number((order.settlementWeight ?? order.unloadWeight ?? order.loadWeight ?? 0).toFixed(3))
}

function isOver24Hours(arrivalAt: string) {
  return Date.now() - new Date(arrivalAt).getTime() > 24 * 60 * 60 * 1000
}

function AcceptancePage() {
  const orders = useAppStore((state) => state.orders)
  const acceptOrder = useAppStore((state) => state.acceptOrder)

  const [acceptanceForm] = Form.useForm<AcceptanceFormValue>()
  const [activeOrderId, setActiveOrderId] = useState<string>()
  const [scope, setScope] = useState<QueueScope>('all')
  const [keyword, setKeyword] = useState('')
  const [localRecords, setLocalRecords] = useState<Record<string, AcceptanceLocalRecord>>({})

  const queueResult = useMemo(() => {
    const strictQueue = orders.filter((item) => strictAcceptanceStatuses.includes(item.status))
    const usingDemoFallback = strictQueue.length === 0
    const source = usingDemoFallback
      ? orders.filter((item) => demoAcceptanceStatuses.includes(item.status))
      : strictQueue
    const rows = source
      .map<QueueRecord>((item) => {
        const arrivalAt = resolveArrivalAt(item)

        return {
          ...item,
          arrivalAt,
          overtime: isOver24Hours(arrivalAt),
        }
      })
      .sort((a, b) => new Date(a.arrivalAt).getTime() - new Date(b.arrivalAt).getTime())

    return {
      rows,
      usingDemoFallback: usingDemoFallback && source.length > 0,
    }
  }, [orders])

  const filteredQueue = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()

    return queueResult.rows.filter((item) => {
      const keywordMatched =
        !trimmedKeyword ||
        [item.number, item.customerName, item.siteName]
          .some((value) => value.toLowerCase().includes(trimmedKeyword))
      const scopeMatched = scope === 'all' || item.overtime
      return keywordMatched && scopeMatched
    })
  }, [keyword, queueResult.rows, scope])

  const activeOrder = useMemo(
    () => orders.find((item) => item.id === activeOrderId),
    [activeOrderId, orders],
  )

  const activeResult = Form.useWatch('result', acceptanceForm) as AcceptanceResult | undefined

  const acceptanceHistory = useMemo(
    () =>
      Object.values(localRecords).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [localRecords],
  )

  const summary = useMemo(
    () => ({
      pending: queueResult.rows.length,
      overtime: queueResult.rows.filter((item) => item.overtime).length,
      accepted: orders.filter((item) => item.status === 'accepted').length,
      failed: orders.filter((item) => item.status === 'settling').length,
    }),
    [orders, queueResult.rows],
  )

  const openDrawer = (order: Order) => {
    const history = localRecords[order.id]

    setActiveOrderId(order.id)
    acceptanceForm.setFieldsValue({
      result: history?.result ?? 'pass',
      acceptanceWeight: history?.acceptanceWeight ?? resolveDefaultWeight(order),
      gasificationAttachment: history?.gasificationAttachment ?? `${order.number}-气化率单.pdf`,
      supplementAttachments:
        history?.supplementAttachments ?? [`${order.number}-交接记录.jpg`],
      remark: history?.remark ?? '',
      rejectReason: history?.rejectReason ?? '',
    })
  }

  const closeDrawer = () => {
    setActiveOrderId(undefined)
    acceptanceForm.resetFields()
  }

  const mockGasificationUpload = () => {
    if (!activeOrder) {
      return
    }

    const fileName = `${activeOrder.number}-气化率单.pdf`
    acceptanceForm.setFieldValue('gasificationAttachment', fileName)
    message.success(`已选择附件：${fileName}`)
  }

  const mockSupplementUpload = () => {
    if (!activeOrder) {
      return
    }

    const currentValue = (acceptanceForm.getFieldValue('supplementAttachments') ?? []) as string[]
    const candidates = mockSupplementTemplates.map((item) =>
      item.replace('{orderNo}', activeOrder.number),
    )
    const nextFile =
      candidates.find((item) => !currentValue.includes(item)) ??
      `${activeOrder.number}-补充附件-${currentValue.length + 1}.pdf`

    acceptanceForm.setFieldValue('supplementAttachments', [...currentValue, nextFile])
    message.success(`已添加附件：${nextFile}`)
  }

  const submitAcceptance = async () => {
    if (!activeOrder) {
      return
    }

    try {
      const values = await acceptanceForm.validateFields()
      const rejectReason = values.rejectReason?.trim() ?? ''

      if (values.result === 'reject' && !rejectReason) {
        message.error('验收不通过时必须填写原因')
        return
      }

      const normalizedWeight = Number(values.acceptanceWeight.toFixed(3))
      const finalRemark = values.remark?.trim() ?? ''
      const mergedRemark =
        values.result === 'reject'
          ? [rejectReason, finalRemark].filter(Boolean).join('；')
          : finalRemark

      acceptOrder(activeOrder.id, values.result === 'pass', normalizedWeight)

      setLocalRecords((prev) => ({
        ...prev,
        [activeOrder.id]: {
          orderId: activeOrder.id,
          orderNo: activeOrder.number,
          result: values.result,
          acceptanceWeight: normalizedWeight,
          gasificationAttachment: values.gasificationAttachment.trim(),
          supplementAttachments: values.supplementAttachments ?? [],
          remark: mergedRemark,
          rejectReason: rejectReason || undefined,
          submittedAt: new Date().toISOString(),
        },
      }))

      message.success(values.result === 'pass' ? '验收通过，订单已更新为已验收' : '验收不通过，订单待处理')
      closeDrawer()
    } catch {
      message.error('请完善验收表单必填项')
    }
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        验收工作台
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        面向调度中心的独立验收页面，支持待验收任务处理、验收通过/不通过、验收量调整与附件/备注留痕（Mock）。
      </Typography.Paragraph>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="验收流程说明"
        description="验收通过将订单状态更新为“已验收”；验收不通过将回到“结算中”待处理。不通过时必须填写原因。"
      />

      {queueResult.usingDemoFallback ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="当前无“待验收”状态订单，已启用演示队列"
          description="为便于直接演示，列表临时展示了运输中订单，验收动作仍会调用 acceptOrder 并真实驱动状态流转。"
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic title="待验收任务" value={summary.pending} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic title="超时待验收（>24h）" value={summary.overtime} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic title="已验收" value={summary.accepted} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic title="不通过待处理" value={summary.failed} suffix="单" />
          </Card>
        </Col>
      </Row>

      <Card title="待验收任务列表" style={{ marginBottom: 16 }}>
        <Space wrap size={12} style={{ marginBottom: 12 }}>
          <Input
            allowClear
            style={{ width: 280 }}
            value={keyword}
            placeholder="搜索订单号/客户/站点"
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Segmented<QueueScope>
            value={scope}
            onChange={(value) => setScope(value)}
            options={[
              { label: '全部任务', value: 'all' },
              { label: '仅看超时', value: 'overtime' },
            ]}
          />
          <Button
            onClick={() => {
              setKeyword('')
              setScope('all')
            }}
          >
            重置筛选
          </Button>
        </Space>

        <Table
          rowKey="id"
          dataSource={filteredQueue}
          locale={{ emptyText: <Empty description="暂无待验收任务" /> }}
          pagination={{ pageSize: 6 }}
          columns={[
            {
              title: '订单编号',
              dataIndex: 'number',
              render: (value: string, record: QueueRecord) => (
                <Button type="link" style={{ padding: 0 }} onClick={() => openDrawer(record)}>
                  {value}
                </Button>
              ),
            },
            { title: '客户', dataIndex: 'customerName' },
            { title: '站点', dataIndex: 'siteName' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (value: Order['status']) => (
                <StatusBadge text={orderStatusLabel[value]} type={statusType(value)} />
              ),
            },
            {
              title: '送达时间',
              dataIndex: 'arrivalAt',
              render: (value: string) => formatDateTime(value),
            },
            {
              title: '时效',
              dataIndex: 'overtime',
              render: (value: boolean) =>
                value ? <StatusBadge text="超时 >24h" type="warning" /> : <StatusBadge text="正常" type="success" />,
            },
            {
              title: '验收量',
              dataIndex: 'settlementWeight',
              align: 'right',
              render: (value?: number) => formatWeight(value),
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record: QueueRecord) => (
                <Button type="primary" size="small" onClick={() => openDrawer(record)}>
                  去验收
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card title={`验收记录（本次会话 ${acceptanceHistory.length} 条）`}>
        {acceptanceHistory.length === 0 ? (
          <Empty description="暂无验收记录" />
        ) : (
          <Table
            rowKey={(item) => `${item.orderId}-${item.submittedAt}`}
            dataSource={acceptanceHistory}
            pagination={{ pageSize: 5 }}
            columns={[
              {
                title: '提交时间',
                dataIndex: 'submittedAt',
                render: (value: string) => formatDateTime(value),
              },
              { title: '订单编号', dataIndex: 'orderNo' },
              {
                title: '验收结果',
                dataIndex: 'result',
                render: (value: AcceptanceResult) => resultBadge(value),
              },
              {
                title: '验收量',
                dataIndex: 'acceptanceWeight',
                align: 'right',
                render: (value: number) => formatWeight(value),
              },
              {
                title: '气化率单附件',
                dataIndex: 'gasificationAttachment',
                render: (value: string) => value || '--',
              },
              {
                title: '补充附件',
                dataIndex: 'supplementAttachments',
                render: (value: string[]) => (value.length ? value.join('；') : '--'),
              },
              {
                title: '验收备注',
                dataIndex: 'remark',
                render: (value: string) => value || '--',
              },
            ]}
          />
        )}
      </Card>

      <Drawer
        title="验收详情"
        width={620}
        open={Boolean(activeOrder)}
        onClose={closeDrawer}
      >
        {activeOrder ? (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Card size="small" title="订单信息">
              <Space direction="vertical" size={6}>
                <Typography.Text>
                  <strong>订单编号：</strong>
                  {activeOrder.number}
                </Typography.Text>
                <Typography.Text>
                  <strong>当前状态：</strong>
                  {orderStatusLabel[activeOrder.status]}
                </Typography.Text>
                <Typography.Text>
                  <strong>客户：</strong>
                  {activeOrder.customerName}
                </Typography.Text>
                <Typography.Text>
                  <strong>站点：</strong>
                  {activeOrder.siteName}
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
                  <strong>当前结算量：</strong>
                  {formatWeight(activeOrder.settlementWeight)}
                </Typography.Text>
              </Space>
            </Card>

            <Divider style={{ margin: 0 }} />

            <Card size="small" title="验收表单">
              <Form<AcceptanceFormValue> form={acceptanceForm} layout="vertical">
                <Form.Item
                  label="验收结果"
                  name="result"
                  rules={[{ required: true, message: '请选择验收结果' }]}
                >
                  <Radio.Group optionType="button" buttonStyle="solid">
                    <Radio.Button value="pass">验收通过</Radio.Button>
                    <Radio.Button value="reject">验收不通过</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label="验收量（吨）"
                  name="acceptanceWeight"
                  rules={[{ required: true, message: '请填写验收量' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={3}
                    inputMode="decimal"
                  />
                </Form.Item>

                <Form.Item
                  label="气化率单附件（单文件）"
                  name="gasificationAttachment"
                  rules={[{ required: true, message: '请上传气化率单附件（Mock）' }]}
                >
                  <Input placeholder="例如：OD-20260210-001-气化率单.pdf" />
                </Form.Item>
                <Space style={{ marginBottom: 12 }} wrap>
                  <Button onClick={mockGasificationUpload}>模拟上传气化率单</Button>
                  <Typography.Text type="secondary">
                    演示环境仅记录文件名
                  </Typography.Text>
                </Space>

                <Form.Item
                  label="补充附件（可选）"
                  name="supplementAttachments"
                >
                  <Select
                    mode="tags"
                    allowClear
                    placeholder="输入或选择补充附件（Mock 文件名）"
                    options={
                      activeOrder
                        ? mockSupplementTemplates.map((item) => {
                            const value = item.replace('{orderNo}', activeOrder.number)
                            return { label: value, value }
                          })
                        : []
                    }
                  />
                </Form.Item>
                <Button style={{ marginBottom: 12 }} onClick={mockSupplementUpload}>
                  追加 Mock 补充附件
                </Button>

                {activeResult === 'reject' ? (
                  <Form.Item
                    label="不通过原因"
                    name="rejectReason"
                    rules={[{ required: true, message: '验收不通过时必须填写原因' }]}
                  >
                    <Input.TextArea rows={2} placeholder="请填写不通过原因" />
                  </Form.Item>
                ) : null}

                <Form.Item label="验收备注" name="remark">
                  <Input.TextArea rows={3} placeholder="可填写验收说明、现场情况等" />
                </Form.Item>
              </Form>

              <Space>
                <Button onClick={closeDrawer}>取消</Button>
                <Button type="primary" onClick={submitAcceptance}>
                  提交验收
                </Button>
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default AcceptancePage
