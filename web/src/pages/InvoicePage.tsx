import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type InvoiceApplication, type InvoiceItem } from '../store/useAppStore'
import { formatMoney } from '../utils/format'

const applicationStatusLabel: Record<InvoiceApplication['status'], string> = {
  'pending-review': '待审核',
  approved: '已通过',
  rejected: '已驳回',
  invoiced: '已开票',
}

const applicationStatusType: Record<
  InvoiceApplication['status'],
  'pending' | 'success' | 'danger' | 'processing'
> = {
  'pending-review': 'pending',
  approved: 'processing',
  rejected: 'danger',
  invoiced: 'success',
}

const extractStatementPeriod = (statementNo: string) => {
  const matched = statementNo.match(/RC-(\d{4})(\d{2})-/)
  if (!matched) {
    return '未知周期'
  }

  return `${matched[1]}-${matched[2]}`
}

function InvoicePage() {
  const role = useAppStore((state) => state.currentRole)
  const statements = useAppStore((state) => state.reconciliations)
  const invoices = useAppStore((state) => state.invoices)
  const invoiceApplications = useAppStore((state) => state.invoiceApplications)
  const createInvoiceApplication = useAppStore((state) => state.createInvoiceApplication)
  const reviewInvoiceApplication = useAppStore((state) => state.reviewInvoiceApplication)
  const issueInvoice = useAppStore((state) => state.issueInvoice)

  const [statementId, setStatementId] = useState<string>()
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [invoiceTitle, setInvoiceTitle] = useState('华东能源科技有限公司')
  const [taxNo, setTaxNo] = useState('91320000MA1234567X')
  const [applyNote, setApplyNote] = useState('')

  const [applicationKeyword, setApplicationKeyword] = useState('')
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<
    'all' | InvoiceApplication['status']
  >('all')
  const [reviewNoteMap, setReviewNoteMap] = useState<Record<string, string>>({})
  const [applicationDetailId, setApplicationDetailId] = useState<string>()

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'issued'>('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [selectedDownloadIds, setSelectedDownloadIds] = useState<string[]>([])

  const [issueTargetId, setIssueTargetId] = useState<string>()
  const [issueInvoiceNo, setIssueInvoiceNo] = useState('')
  const [issueDate, setIssueDate] = useState(dayjs())
  const [issueTaxRate, setIssueTaxRate] = useState<number | undefined>(13)
  const [issueAttachmentName, setIssueAttachmentName] = useState('')
  const [issueAttachmentKey, setIssueAttachmentKey] = useState(0)

  const availableStatements = useMemo(
    () =>
      statements.filter((item) =>
        ['double-confirmed', 'offline-confirmed'].includes(item.status),
      ),
    [statements],
  )

  const selectedStatement = useMemo(
    () => availableStatements.find((item) => item.id === statementId),
    [availableStatements, statementId],
  )

  const applicationDetail = useMemo(
    () => invoiceApplications.find((item) => item.id === applicationDetailId),
    [applicationDetailId, invoiceApplications],
  )

  const originalAmount = selectedStatement?.totalAmount ?? 0
  const requestedAmount = Math.max(
    0,
    originalAmount - (discountEnabled ? discountAmount : 0),
  )

  const filteredApplications = useMemo(
    () =>
      invoiceApplications.filter((item) => {
        const keywordText = applicationKeyword.trim().toLowerCase()
        const matchKeyword =
          keywordText.length === 0 ||
          item.number.toLowerCase().includes(keywordText) ||
          item.statementNo.toLowerCase().includes(keywordText) ||
          item.customerName.toLowerCase().includes(keywordText)
        const matchStatus =
          applicationStatusFilter === 'all' || item.status === applicationStatusFilter

        return matchKeyword && matchStatus
      }),
    [applicationKeyword, applicationStatusFilter, invoiceApplications],
  )

  const invoicePeriodOptions = useMemo(
    () => ['all', ...new Set(invoices.map((item) => extractStatementPeriod(item.statementNo)))],
    [invoices],
  )

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((item) => {
        const matchKeyword =
          item.number.includes(keyword) ||
          item.customerName.includes(keyword) ||
          item.statementNo.includes(keyword)
        const matchStatus = statusFilter === 'all' || item.status === statusFilter
        const matchPeriod =
          periodFilter === 'all' || extractStatementPeriod(item.statementNo) === periodFilter

        return matchKeyword && matchStatus && matchPeriod
      }),
    [invoices, keyword, statusFilter, periodFilter],
  )

  const issueTarget = useMemo(
    () => invoices.find((item) => item.id === issueTargetId),
    [invoices, issueTargetId],
  )

  const submitApplication = () => {
    if (!statementId) {
      message.error('请选择已确认的对账单')
      return
    }

    const result = createInvoiceApplication({
      statementId,
      discountEnabled,
      discountAmount,
      invoiceTitle,
      taxNo,
      applicant: role === 'market' ? '市场部-王经理' : '市场部-代理提交',
      note: applyNote,
    })

    if (!result.success) {
      message.error(result.errors.join('；'))
      return
    }

    message.success('开票申请已提交，待财务审核')
    setApplyNote('')
    setDiscountAmount(0)
    setDiscountEnabled(false)
    setStatementId(undefined)
  }

  const openIssueModal = (record: InvoiceItem) => {
    setIssueTargetId(record.id)
    setIssueInvoiceNo(record.number)
    setIssueDate(dayjs())
    setIssueTaxRate(record.taxRate ?? 13)
    setIssueAttachmentName(record.attachmentName ?? '')
    setIssueAttachmentKey((value) => value + 1)
  }

  const closeIssueModal = () => {
    setIssueTargetId(undefined)
    setIssueAttachmentName('')
    setIssueInvoiceNo('')
  }

  const submitIssueInvoice = () => {
    if (!issueTarget) {
      return
    }

    if (!issueInvoiceNo.trim()) {
      message.error('请填写发票号码')
      return
    }

    if (!issueAttachmentName.trim()) {
      message.error('请上传电子发票文件')
      return
    }

    issueInvoice({
      invoiceId: issueTarget.id,
      issuer: '财务-陈会计',
      invoiceNo: issueInvoiceNo,
      issueDate: issueDate.format('YYYY-MM-DD'),
      taxRate: issueTaxRate,
      attachmentName: issueAttachmentName,
    })

    message.success('已完成开票并归档')
    closeIssueModal()
  }

  const downloadInvoice = (record: InvoiceItem) => {
    if (record.status !== 'issued') {
      message.warning('待开票记录暂无电子发票可下载')
      return
    }

    message.success(`${record.attachmentName ?? `${record.number}.pdf`} 已生成下载（Mock）`)
  }

  const downloadBatch = () => {
    const selected = invoices.filter(
      (item) => selectedDownloadIds.includes(item.id) && item.status === 'issued',
    )

    if (selected.length === 0) {
      message.warning('请选择已开票记录')
      return
    }

    const packageName = `invoice-batch-${dayjs().format('YYYYMMDD-HHmm')}.zip`
    message.success(`${packageName} 已生成（Mock），共 ${selected.length} 张发票`)
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        发票中心
      </Typography.Title>
      <Tabs
        items={[
          {
            key: 'apply',
            label: '开票申请细分流程',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={9}>
                  <Card title="市场部发起开票申请">
                    <Steps
                      size="small"
                      style={{ marginBottom: 14 }}
                      current={1}
                      items={[
                        { title: '发起申请' },
                        { title: '财务审核' },
                        { title: '财务开票' },
                        { title: '客户下载' },
                      ]}
                    />
                    <Form layout="vertical">
                      <Form.Item label="对账单（仅已确认）" required>
                        <Select
                          value={statementId}
                          placeholder="请选择对账单"
                          options={availableStatements.map((item) => ({
                            label: `${item.number} / ${item.period}`,
                            value: item.id,
                          }))}
                          onChange={setStatementId}
                        />
                      </Form.Item>
                      <Form.Item label="开票抬头" required>
                        <Input
                          value={invoiceTitle}
                          onChange={(event) => setInvoiceTitle(event.target.value)}
                        />
                      </Form.Item>
                      <Form.Item label="税号" required>
                        <Input value={taxNo} onChange={(event) => setTaxNo(event.target.value)} />
                      </Form.Item>
                      <Form.Item label="周期优惠处理">
                        <Select
                          value={discountEnabled ? 'enabled' : 'disabled'}
                          options={[
                            { label: '无优惠', value: 'disabled' },
                            { label: '存在优惠', value: 'enabled' },
                          ]}
                          onChange={(value) => setDiscountEnabled(value === 'enabled')}
                        />
                      </Form.Item>
                      {discountEnabled ? (
                        <Form.Item label="优惠金额（元）" required>
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            value={discountAmount}
                            onChange={(value) => setDiscountAmount(Number(value ?? 0))}
                          />
                        </Form.Item>
                      ) : null}
                      <Form.Item label="申请备注">
                        <Input.TextArea
                          rows={3}
                          value={applyNote}
                          onChange={(event) => setApplyNote(event.target.value)}
                        />
                      </Form.Item>
                    </Form>

                    <Alert
                      type="info"
                      showIcon
                      title="金额预览"
                      description={
                        <div>
                          对账金额：{formatMoney(originalAmount)}
                          <br />
                          申请开票：{formatMoney(requestedAmount)}
                        </div>
                      }
                    />

                    {role !== 'market' ? (
                      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 10 }}>
                        当前角色仅演示查看申请信息，发起动作建议由市场部执行。
                      </Typography.Text>
                    ) : null}

                    <Button
                      type="primary"
                      style={{ marginTop: 12 }}
                      onClick={submitApplication}
                      disabled={role !== 'market'}
                    >
                      提交开票申请
                    </Button>
                  </Card>
                </Col>

                <Col xs={24} xl={15}>
                  <Card style={{ marginBottom: 12 }}>
                    <Space wrap>
                      <Input
                        allowClear
                        style={{ width: 240 }}
                        placeholder="搜索申请单/对账单/客户"
                        value={applicationKeyword}
                        onChange={(event) => setApplicationKeyword(event.target.value)}
                      />
                      <Select
                        style={{ width: 150 }}
                        value={applicationStatusFilter}
                        onChange={setApplicationStatusFilter}
                        options={[
                          { label: '全部状态', value: 'all' },
                          { label: '待审核', value: 'pending-review' },
                          { label: '已通过', value: 'approved' },
                          { label: '已驳回', value: 'rejected' },
                          { label: '已开票', value: 'invoiced' },
                        ]}
                      />
                      <Button
                        onClick={() => {
                          setApplicationKeyword('')
                          setApplicationStatusFilter('all')
                        }}
                      >
                        重置筛选
                      </Button>
                    </Space>
                  </Card>

                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    title="财务审核规则"
                    description="申请来源需为已确认对账单；审核通过自动生成待开票任务，审核驳回记录原因。"
                  />
                  <Table
                    rowKey="id"
                    dataSource={filteredApplications}
                    pagination={{ pageSize: 6 }}
                    columns={[
                      {
                        title: '申请单号',
                        dataIndex: 'number',
                        render: (value: string, record: InvoiceApplication) => (
                          <Button type="link" style={{ padding: 0 }} onClick={() => setApplicationDetailId(record.id)}>
                            {value}
                          </Button>
                        ),
                      },
                      { title: '对账单', dataIndex: 'statementNo' },
                      {
                        title: '申请金额',
                        dataIndex: 'requestedAmount',
                        align: 'right',
                        render: (value: number) => formatMoney(value),
                      },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        render: (value: InvoiceApplication['status']) => (
                          <StatusBadge
                            text={applicationStatusLabel[value]}
                            type={applicationStatusType[value]}
                          />
                        ),
                      },
                      {
                        title: '审核说明',
                        key: 'review-note',
                        render: (_, record: InvoiceApplication) => {
                          if (role === 'finance' && record.status === 'pending-review') {
                            return (
                              <Input
                                size="small"
                                placeholder="驳回原因/审批说明"
                                value={reviewNoteMap[record.id]}
                                onChange={(event) =>
                                  setReviewNoteMap((prev) => ({
                                    ...prev,
                                    [record.id]: event.target.value,
                                  }))
                                }
                              />
                            )
                          }

                          if (record.status === 'rejected') {
                            return (
                              <Typography.Text type="danger">
                                {record.rejectReason ?? '--'}
                              </Typography.Text>
                            )
                          }

                          return <Typography.Text type="secondary">{record.reviewer ?? '--'}</Typography.Text>
                        },
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_, record: InvoiceApplication) => {
                          if (role !== 'finance' || record.status !== 'pending-review') {
                            return (
                              <Button
                                type="link"
                                style={{ padding: 0 }}
                                onClick={() => setApplicationDetailId(record.id)}
                              >
                                详情
                              </Button>
                            )
                          }

                          return (
                            <Space>
                              <Button
                                size="small"
                                onClick={() => setApplicationDetailId(record.id)}
                              >
                                详情
                              </Button>
                              <Button
                                size="small"
                                type="primary"
                                onClick={() => {
                                  reviewInvoiceApplication({
                                    applicationId: record.id,
                                    action: 'approve',
                                    reviewer: '财务-陈会计',
                                  })
                                  message.success('审核通过，已生成待开票任务')
                                }}
                              >
                                通过
                              </Button>
                              <Button
                                size="small"
                                danger
                                onClick={() => {
                                  const reason = reviewNoteMap[record.id]?.trim()
                                  if (!reason) {
                                    message.error('请先填写驳回原因')
                                    return
                                  }

                                  reviewInvoiceApplication({
                                    applicationId: record.id,
                                    action: 'reject',
                                    reviewer: '财务-陈会计',
                                    reason,
                                  })
                                  message.warning('开票申请已驳回')
                                }}
                              >
                                驳回
                              </Button>
                            </Space>
                          )
                        },
                      },
                    ]}
                  />
                </Col>
              </Row>
            ),
          },
          {
            key: 'process',
            label: '开票处理与下载',
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Steps
                    size="small"
                    current={2}
                    items={[
                      { title: '申请提交' },
                      { title: '财务审核' },
                      { title: '财务开票' },
                      { title: '客户下载' },
                    ]}
                  />
                </Card>

                <Card style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Input
                      allowClear
                      style={{ width: 250 }}
                      placeholder="搜索发票号/客户/对账单"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                    />
                    <Select
                      style={{ width: 140 }}
                      value={statusFilter}
                      onChange={(value: 'all' | 'pending' | 'issued') => setStatusFilter(value)}
                      options={[
                        { label: '全部状态', value: 'all' },
                        { label: '待开票', value: 'pending' },
                        { label: '已开票', value: 'issued' },
                      ]}
                    />
                    <Select
                      style={{ width: 160 }}
                      value={periodFilter}
                      onChange={setPeriodFilter}
                      options={invoicePeriodOptions.map((period) => ({
                        value: period,
                        label: period === 'all' ? '全部周期' : period,
                      }))}
                    />
                    <Button onClick={() => message.info('演示环境：默认导出当前筛选结果')}>
                      导出清单
                    </Button>
                    <Button onClick={downloadBatch} disabled={selectedDownloadIds.length === 0}>
                      批量下载 ZIP（Mock）
                    </Button>
                  </Space>
                </Card>

                <Alert
                  showIcon
                  type="info"
                  style={{ marginBottom: 16 }}
                  title="开票处理说明"
                  description="审核通过的申请会生成待开票任务；财务完成开票并上传电子附件后，终端用户可下载。"
                />

                <Table
                  rowKey="id"
                  dataSource={filteredInvoices}
                  pagination={false}
                  rowSelection={{
                    selectedRowKeys: selectedDownloadIds,
                    onChange: (keys) => setSelectedDownloadIds(keys as string[]),
                    getCheckboxProps: (record: InvoiceItem) => ({
                      disabled: record.status !== 'issued',
                    }),
                  }}
                  columns={[
                    { title: '发票号', dataIndex: 'number' },
                    { title: '客户', dataIndex: 'customerName' },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      align: 'right',
                      render: (value: number) => formatMoney(value),
                    },
                    {
                      title: '开票日期',
                      dataIndex: 'issueDate',
                      render: (value: string, record: InvoiceItem) =>
                        record.status === 'pending' ? '--' : value,
                    },
                    {
                      title: '税率',
                      dataIndex: 'taxRate',
                      render: (value?: number) => (typeof value === 'number' ? `${value}%` : '--'),
                    },
                    {
                      title: '电子发票',
                      dataIndex: 'attachmentName',
                      render: (value?: string) => value ?? '--',
                    },
                    { title: '关联对账单', dataIndex: 'statementNo' },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (value: 'pending' | 'issued') => (
                        <StatusBadge
                          text={value === 'pending' ? '待开票' : '已开票'}
                          type={value === 'pending' ? 'pending' : 'success'}
                        />
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: InvoiceItem) => (
                        <Space>
                          {role === 'finance' && record.status === 'pending' ? (
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => openIssueModal(record)}
                            >
                              处理开票
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            disabled={record.status !== 'issued'}
                            onClick={() => downloadInvoice(record)}
                          >
                            下载
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title={`财务开票处理${issueTarget ? ` - ${issueTarget.statementNo}` : ''}`}
        open={Boolean(issueTarget)}
        onCancel={closeIssueModal}
        onOk={submitIssueInvoice}
        okText="确认开票并归档"
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label="发票号码" required>
            <Input
              value={issueInvoiceNo}
              placeholder="例如：INV-20260210-168"
              onChange={(event) => setIssueInvoiceNo(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="开票日期" required>
            <DatePicker
              style={{ width: '100%' }}
              value={issueDate}
              onChange={(value) => setIssueDate(value ?? dayjs())}
            />
          </Form.Item>
          <Form.Item label="开票金额">
            <InputNumber style={{ width: '100%' }} value={issueTarget?.amount ?? 0} disabled />
          </Form.Item>
          <Form.Item label="税率（可选）">
            <Select
              allowClear
              value={issueTaxRate}
              options={[
                { label: '13%', value: 13 },
                { label: '9%', value: 9 },
                { label: '6%', value: 6 },
                { label: '0%', value: 0 },
              ]}
              onChange={setIssueTaxRate}
            />
          </Form.Item>
          <Form.Item label="电子发票附件" required>
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              <input
                key={issueAttachmentKey}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  setIssueAttachmentName(file?.name ?? '')
                }}
              />
              <Typography.Text type="secondary">
                {issueAttachmentName
                  ? `已选择文件：${issueAttachmentName}`
                  : '支持 PDF/JPG/PNG，演示环境仅记录文件名'}
              </Typography.Text>
            </Space>
          </Form.Item>
          <Typography.Text type="secondary">
            说明：此处模拟“线下开票后回传电子发票并归档”的操作。
          </Typography.Text>
        </Form>
      </Modal>

      <Modal
        title={applicationDetail ? `申请详情 - ${applicationDetail.number}` : '申请详情'}
        open={Boolean(applicationDetail)}
        onCancel={() => setApplicationDetailId(undefined)}
        footer={
          <Button type="primary" onClick={() => setApplicationDetailId(undefined)}>
            关闭
          </Button>
        }
      >
        {applicationDetail ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="申请单号">
              {applicationDetail.number}
            </Descriptions.Item>
            <Descriptions.Item label="对账单">{applicationDetail.statementNo}</Descriptions.Item>
            <Descriptions.Item label="客户">{applicationDetail.customerName}</Descriptions.Item>
            <Descriptions.Item label="原始金额">
              {formatMoney(applicationDetail.originalAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="优惠金额">
              {applicationDetail.discountEnabled
                ? formatMoney(applicationDetail.discountAmount)
                : '无优惠'}
            </Descriptions.Item>
            <Descriptions.Item label="申请金额">
              {formatMoney(applicationDetail.requestedAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="抬头">{applicationDetail.invoiceTitle}</Descriptions.Item>
            <Descriptions.Item label="税号">{applicationDetail.taxNo}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {applicationStatusLabel[applicationDetail.status]}
            </Descriptions.Item>
            <Descriptions.Item label="申请备注">{applicationDetail.note ?? '--'}</Descriptions.Item>
            <Descriptions.Item label="驳回原因">
              {applicationDetail.rejectReason ?? '--'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  )
}

export default InvoicePage
