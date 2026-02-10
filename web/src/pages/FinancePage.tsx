import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import FundWaterLevel from '../components/FundWaterLevel'
import MoneyDisplay from '../components/MoneyDisplay'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type ExceptionCase, type ExceptionType, type Order } from '../store/useAppStore'
import { formatDateTime, formatMoney, orderStatusLabel } from '../utils/format'

const exceptionTypeLabelMap: Record<ExceptionType, string> = {
  'plan-terminate': '计划终止',
  'order-terminate': '订单终止',
  'plan-change': '计划变更',
  'order-change': '订单变更',
  'delta-adjustment': '多退少补',
}

const exceptionStatusLabelMap: Record<ExceptionCase['status'], string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
}

const exceptionStatusBadgeMap: Record<ExceptionCase['status'], 'pending' | 'success' | 'danger'> = {
  pending: 'pending',
  approved: 'success',
  rejected: 'danger',
}

const orderStatusBadgeMap: Record<
  Order['status'],
  'pending' | 'processing' | 'warning' | 'success' | 'neutral'
> = {
  'pending-supplement': 'pending',
  ordered: 'pending',
  stocking: 'processing',
  loaded: 'processing',
  transporting: 'processing',
  arrived: 'processing',
  'pending-acceptance': 'warning',
  accepted: 'success',
  settling: 'warning',
  settled: 'success',
  archived: 'neutral',
}

interface ReceivableOrderRow {
  id: string
  number: string
  planNumber: string
  customerName: string
  siteName: string
  paymentMethodLabel: '预付' | '后付'
  orderStatus: Order['status']
  paymentStatus: Order['paymentStatus']
  receivableAmount: number
  receivedAmount: number
  outstandingAmount: number
  relatedExceptionCount: number
  pendingExceptionCount: number
  followUpStatus: '待收款' | '异常待处理' | '待核销'
}

const receivableStatusBadgeMap: Record<
  ReceivableOrderRow['followUpStatus'],
  'pending' | 'danger' | 'processing'
> = {
  待收款: 'pending',
  异常待处理: 'danger',
  待核销: 'processing',
}

const paymentStatusLabelMap: Record<Order['paymentStatus'], string> = {
  pending: '待收款',
  partial: '部分到款',
  paid: '已全额到款',
}

const paymentStatusBadgeMap: Record<Order['paymentStatus'], 'pending' | 'warning' | 'success'> = {
  pending: 'pending',
  partial: 'warning',
  paid: 'success',
}

function FinancePage() {
  const role = useAppStore((state) => state.currentRole)
  const account = useAppStore((state) => state.account)
  const plans = useAppStore((state) => state.plans)
  const orders = useAppStore((state) => state.orders)
  const ledgers = useAppStore((state) => state.ledgers)
  const deposits = useAppStore((state) => state.deposits)
  const exceptions = useAppStore((state) => state.exceptions)
  const activeCustomerName = useAppStore((state) => state.activeCustomerName)
  const registerDeposit = useAppStore((state) => state.registerDeposit)
  const reviewDeposit = useAppStore((state) => state.reviewDeposit)
  const confirmOrderReceipt = useAppStore((state) => state.confirmOrderReceipt)

  const [modalOpen, setModalOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [depositDate, setDepositDate] = useState(dayjs())
  const [receiptName, setReceiptName] = useState('')
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({})
  const [receiptTarget, setReceiptTarget] = useState<ReceivableOrderRow>()
  const [receivedAmountInput, setReceivedAmountInput] = useState<number>(0)
  const [receivedDate, setReceivedDate] = useState(dayjs())
  const [receivedNote, setReceivedNote] = useState('')

  const pendingDeposits = useMemo(
    () => deposits.filter((item) => item.status === 'pending'),
    [deposits],
  )

  const pendingDepositAmount = useMemo(
    () => pendingDeposits.reduce((sum, item) => sum + item.amount, 0),
    [pendingDeposits],
  )

  const planMap = useMemo(() => new Map(plans.map((item) => [item.id, item])), [plans])

  const exceptionMap = useMemo(() => {
    const map = new Map<string, ExceptionCase[]>()
    exceptions.forEach((item) => {
      const existing = map.get(item.targetNo)
      if (existing) {
        existing.push(item)
      } else {
        map.set(item.targetNo, [item])
      }
    })
    return map
  }, [exceptions])

  const receivableOrders = useMemo<ReceivableOrderRow[]>(
    () =>
      orders
        .map((order) => {
          const relatedPlan = planMap.get(order.planId)
          const paymentMethodLabel: ReceivableOrderRow['paymentMethodLabel'] =
            relatedPlan?.paymentMethod === 'postpaid' ? '后付' : '预付'

          const baseAmount = relatedPlan?.totalAmount ?? 0
          const settlementRatio =
            typeof order.settlementWeight === 'number' &&
            typeof relatedPlan?.plannedVolume === 'number' &&
            relatedPlan.plannedVolume > 0
              ? order.settlementWeight / relatedPlan.plannedVolume
              : 1

          const relatedExceptions = exceptionMap.get(order.number) ?? []
          const pendingExceptionCount = relatedExceptions.filter(
            (item) => item.status === 'pending',
          ).length

          const followUpStatus: ReceivableOrderRow['followUpStatus'] =
            pendingExceptionCount > 0
              ? '异常待处理'
              : order.paymentStatus === 'paid'
                ? '待核销'
                : '待收款'
          const receivableAmount = Number((baseAmount * settlementRatio).toFixed(2))
          const receivedAmount = order.receivedAmount ?? 0

          return {
            id: order.id,
            number: order.number,
            planNumber: relatedPlan?.number ?? '--',
            customerName: order.customerName,
            siteName: order.siteName,
            paymentMethodLabel,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus,
            receivableAmount,
            receivedAmount,
            outstandingAmount: Number(Math.max(0, receivableAmount - receivedAmount).toFixed(2)),
            relatedExceptionCount: relatedExceptions.length,
            pendingExceptionCount,
            followUpStatus,
          }
        })
        .filter((item) => item.paymentMethodLabel === '后付' || item.relatedExceptionCount > 0),
    [orders, planMap, exceptionMap],
  )

  const receivableAmount = useMemo(
    () => receivableOrders.reduce((sum, item) => sum + item.receivableAmount, 0),
    [receivableOrders],
  )
  const outstandingAmount = useMemo(
    () => receivableOrders.reduce((sum, item) => sum + item.outstandingAmount, 0),
    [receivableOrders],
  )

  const sortedExceptions = useMemo(
    () =>
      [...exceptions].sort((a, b) => {
        if (a.status === b.status) {
          return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        }
        return a.status === 'pending' ? -1 : b.status === 'pending' ? 1 : 0
      }),
    [exceptions],
  )

  const pendingExceptionCount = useMemo(
    () => exceptions.filter((item) => item.status === 'pending').length,
    [exceptions],
  )

  const metricCards = [
    { key: 'total', label: '账户总余额', value: account.total },
    { key: 'available', label: '可用余额', value: account.available },
    { key: 'occupied', label: '已占用', value: account.occupied },
    { key: 'frozen', label: '已冻结', value: account.frozen },
  ]

  const submitDeposit = () => {
    if (depositAmount <= 0 || !receiptName) {
      message.error('请填写打款金额和回单附件名')
      return
    }

    registerDeposit({
      customerName: activeCustomerName,
      amount: depositAmount,
      paidAt: depositDate.format('YYYY-MM-DD'),
      receiptName,
    })

    setModalOpen(false)
    setDepositAmount(0)
    setReceiptName('')
    message.success('预存登记已提交，待财务确认')
  }

  const submitOrderReceipt = () => {
    if (!receiptTarget) {
      return
    }

    if (receivedAmountInput <= 0) {
      message.error('请输入本次到账金额')
      return
    }

    if (receivedAmountInput > receiptTarget.outstandingAmount + 0.01) {
      message.error('本次到账金额不能超过剩余应收')
      return
    }

    const result = confirmOrderReceipt({
      orderId: receiptTarget.id,
      amount: receivedAmountInput,
      receivedAt: receivedDate.format('YYYY-MM-DD'),
      receiver: '财务-陈会计',
      note: receivedNote,
    })

    if (!result.success) {
      message.error(result.error ?? '到款确认失败')
      return
    }

    message.success('订单到款已确认')
    setReceiptTarget(undefined)
    setReceivedAmountInput(0)
    setReceivedNote('')
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        资金管理
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {metricCards.map((item) => (
          <Col key={item.key} xs={24} md={12} xl={6}>
            <Card className="kpi-card">
              <Typography.Text type="secondary">{item.label}</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <MoneyDisplay value={item.value} size="large" />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 16 }}>
        <FundWaterLevel account={account} />
      </Card>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'deposits',
            label:
              role === 'finance' ? `预存待确认 (${pendingDeposits.length})` : '预存登记',
            children:
              role === 'finance' ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message="预存待确认"
                    description={`当前待确认 ${pendingDeposits.length} 笔，金额合计 ${formatMoney(pendingDepositAmount)}。`}
                  />
                  <Table
                    rowKey="id"
                    dataSource={pendingDeposits}
                    pagination={false}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="暂无待确认预存"
                        />
                      ),
                    }}
                    columns={[
                      { title: '客户', dataIndex: 'customerName' },
                      {
                        title: '金额',
                        dataIndex: 'amount',
                        align: 'right',
                        render: (value: number) => formatMoney(value),
                      },
                      { title: '打款日期', dataIndex: 'paidAt' },
                      { title: '回单附件', dataIndex: 'receiptName' },
                      {
                        title: '驳回原因',
                        key: 'reason',
                        render: (_, record) => (
                          <Input
                            size="small"
                            placeholder="驳回时填写"
                            value={rejectReasonMap[record.id]}
                            onChange={(event) =>
                              setRejectReasonMap((prev) => ({
                                ...prev,
                                [record.id]: event.target.value,
                              }))
                            }
                          />
                        ),
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_, record) => (
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => {
                                reviewDeposit(record.id, 'confirm', '财务-陈会计')
                                message.success('已确认到账，可用余额已更新')
                              }}
                            >
                              确认到账
                            </Button>
                            <Button
                              danger
                              size="small"
                              onClick={() => {
                                reviewDeposit(
                                  record.id,
                                  'reject',
                                  '财务-陈会计',
                                  rejectReasonMap[record.id] || '回单信息不完整',
                                )
                                message.warning('已驳回预存登记')
                              }}
                            >
                              驳回
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Space>
              ) : (
                <Card>
                  <Space direction="vertical" size={12}>
                    <Alert
                      type="info"
                      showIcon
                      message="预存流程"
                      description="终端用户登记打款信息后，由财务确认到账，系统再更新可用余额。"
                    />
                    <Button type="primary" onClick={() => setModalOpen(true)}>
                      新增预存登记
                    </Button>
                  </Space>
                </Card>
              ),
          },
          {
            key: 'receivables',
            label: `订单待收款 (${receivableOrders.length})`,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Alert
                  type={role === 'finance' ? 'info' : 'warning'}
                  showIcon
                  message="订单待收款列表"
                  description={
                    role === 'finance'
                      ? `当前待跟进 ${receivableOrders.length} 单，应收金额合计 ${formatMoney(receivableAmount)}，剩余待收 ${formatMoney(outstandingAmount)}。`
                      : `当前待跟进 ${receivableOrders.length} 单，应收金额合计 ${formatMoney(receivableAmount)}，剩余待收 ${formatMoney(outstandingAmount)}（仅财务可执行到款确认）。`
                  }
                />
                <Alert
                  type="info"
                  showIcon
                  message="付款信息说明"
                  description="收款账户：气源发展有限公司 6214 **** **** 9988；到款确认后自动更新支付状态和资金流水。"
                />
                <Table
                  rowKey="id"
                  dataSource={receivableOrders}
                  pagination={{ pageSize: 6 }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无待跟进收款订单"
                      />
                    ),
                  }}
                  columns={[
                    { title: '订单号', dataIndex: 'number' },
                    { title: '关联计划', dataIndex: 'planNumber' },
                    { title: '客户', dataIndex: 'customerName' },
                    { title: '卸气点', dataIndex: 'siteName' },
                    { title: '付款方式', dataIndex: 'paymentMethodLabel' },
                    {
                      title: '订单状态',
                      dataIndex: 'orderStatus',
                      render: (value: Order['status']) => (
                        <StatusBadge text={orderStatusLabel[value]} type={orderStatusBadgeMap[value]} />
                      ),
                    },
                    {
                      title: '应收金额',
                      dataIndex: 'receivableAmount',
                      align: 'right',
                      render: (value: number) => formatMoney(value),
                    },
                    {
                      title: '已收金额',
                      dataIndex: 'receivedAmount',
                      align: 'right',
                      render: (value: number) => formatMoney(value),
                    },
                    {
                      title: '剩余应收',
                      dataIndex: 'outstandingAmount',
                      align: 'right',
                      render: (value: number) => formatMoney(value),
                    },
                    {
                      title: '支付状态',
                      dataIndex: 'paymentStatus',
                      render: (value: Order['paymentStatus']) => (
                        <StatusBadge text={paymentStatusLabelMap[value]} type={paymentStatusBadgeMap[value]} />
                      ),
                    },
                    {
                      title: '关联异常',
                      key: 'exception',
                      render: (_, record: ReceivableOrderRow) => {
                        if (record.relatedExceptionCount === 0) {
                          return <Typography.Text type="secondary">无</Typography.Text>
                        }
                        if (record.pendingExceptionCount > 0) {
                          return (
                            <StatusBadge
                              text={`${record.pendingExceptionCount} 条待处理`}
                              type="warning"
                            />
                          )
                        }
                        return (
                          <StatusBadge
                            text={`${record.relatedExceptionCount} 条已处理`}
                            type="neutral"
                          />
                        )
                      },
                    },
                    {
                      title: '收款跟进',
                      dataIndex: 'followUpStatus',
                      render: (value: ReceivableOrderRow['followUpStatus']) => (
                        <StatusBadge text={value} type={receivableStatusBadgeMap[value]} />
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: ReceivableOrderRow) => {
                        if (role !== 'finance') {
                          return <Typography.Text type="secondary">--</Typography.Text>
                        }

                        const canConfirm =
                          record.followUpStatus !== '异常待处理' &&
                          record.paymentStatus !== 'paid' &&
                          record.outstandingAmount > 0

                        return canConfirm ? (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => {
                              setReceiptTarget(record)
                              setReceivedDate(dayjs())
                              setReceivedNote('')
                              setReceivedAmountInput(record.outstandingAmount)
                            }}
                          >
                            确认到款
                          </Button>
                        ) : (
                          <Typography.Text type="secondary">--</Typography.Text>
                        )
                      },
                    },
                  ]}
                />
              </Space>
            ),
          },
          {
            key: 'exceptions',
            label: `异常列表 (${sortedExceptions.length})`,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Alert
                  type="warning"
                  showIcon
                  message="收款异常跟踪"
                  description={`当前异常 ${sortedExceptions.length} 条，其中待处理 ${pendingExceptionCount} 条。`}
                />
                <Table
                  rowKey="id"
                  dataSource={sortedExceptions}
                  pagination={{ pageSize: 6 }}
                  locale={{
                    emptyText: (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无异常记录" />
                    ),
                  }}
                  columns={[
                    { title: '异常单号', dataIndex: 'number' },
                    {
                      title: '异常类型',
                      dataIndex: 'type',
                      render: (value: ExceptionType) => exceptionTypeLabelMap[value],
                    },
                    { title: '目标单据', dataIndex: 'targetNo' },
                    { title: '责任方', dataIndex: 'responsibilityParty' },
                    {
                      title: '涉及金额',
                      dataIndex: 'amount',
                      align: 'right',
                      render: (value: number) => formatMoney(value),
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (value: ExceptionCase['status']) => (
                        <StatusBadge
                          text={exceptionStatusLabelMap[value]}
                          type={exceptionStatusBadgeMap[value]}
                        />
                      ),
                    },
                    {
                      title: '创建时间',
                      dataIndex: 'createdAt',
                      render: (value: string) => formatDateTime(value),
                    },
                    {
                      title: '异常原因',
                      dataIndex: 'reason',
                      ellipsis: true,
                    },
                  ]}
                />
              </Space>
            ),
          },
          {
            key: 'ledger',
            label: '资金流水',
            children: (
              <Table
                rowKey="id"
                dataSource={ledgers}
                pagination={{ pageSize: 6 }}
                columns={[
                  { title: '时间', dataIndex: 'createdAt', render: formatDateTime },
                  { title: '类型', dataIndex: 'type' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    align: 'right',
                    render: (value: number, record) => (
                      <Typography.Text
                        style={{ color: ['release', 'deposit', 'refund'].includes(record.type) ? '#006644' : '#172B4D' }}
                      >
                        {formatMoney(value)}
                      </Typography.Text>
                    ),
                  },
                  { title: '关联单据', dataIndex: 'relatedNo' },
                  { title: '备注', dataIndex: 'note' },
                ]}
              />
            ),
          },
        ]}
      />

      <Modal
        title="预存登记"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitDeposit}
        okText="提交"
      >
        <Form layout="vertical">
          <Form.Item label="打款金额（元）" required>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={depositAmount}
              onChange={(value) => setDepositAmount(Number(value ?? 0))}
            />
          </Form.Item>
          <Form.Item label="打款日期" required>
            <DatePicker
              style={{ width: '100%' }}
              value={depositDate}
              onChange={(value) => setDepositDate(value ?? dayjs())}
            />
          </Form.Item>
          <Form.Item label="回单附件名称" required>
            <Input
              value={receiptName}
              onChange={(event) => setReceiptName(event.target.value)}
              placeholder="例如：回单-20260209.pdf"
            />
          </Form.Item>
          <Alert
            type="warning"
            showIcon
            message="收款账户"
            description="气源发展有限公司 6214 **** **** 9988（演示）"
          />
        </Form>
      </Modal>

      <Modal
        title="订单到款确认"
        open={Boolean(receiptTarget)}
        onCancel={() => setReceiptTarget(undefined)}
        onOk={submitOrderReceipt}
        okText="确认到账"
      >
        {receiptTarget ? (
          <Form layout="vertical">
            <Form.Item label="订单号">
              <Input value={receiptTarget.number} disabled />
            </Form.Item>
            <Form.Item label="应收金额">
              <Input value={formatMoney(receiptTarget.receivableAmount)} disabled />
            </Form.Item>
            <Form.Item label="已收金额">
              <Input value={formatMoney(receiptTarget.receivedAmount)} disabled />
            </Form.Item>
            <Form.Item label="剩余应收">
              <Input value={formatMoney(receiptTarget.outstandingAmount)} disabled />
            </Form.Item>
            <Form.Item label="本次到账金额（元）" required>
              <InputNumber
                min={0}
                max={receiptTarget.outstandingAmount}
                style={{ width: '100%' }}
                value={receivedAmountInput}
                onChange={(value) => setReceivedAmountInput(Number(value ?? 0))}
              />
            </Form.Item>
            <Form.Item label="到账日期" required>
              <DatePicker
                style={{ width: '100%' }}
                value={receivedDate}
                onChange={(value) => setReceivedDate(value ?? dayjs())}
              />
            </Form.Item>
            <Form.Item label="备注">
              <Input.TextArea
                rows={3}
                value={receivedNote}
                onChange={(event) => setReceivedNote(event.target.value)}
              />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </div>
  )
}

export default FinancePage
