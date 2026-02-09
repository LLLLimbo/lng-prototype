import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
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
import { useAppStore } from '../store/useAppStore'
import { formatDateTime, formatMoney } from '../utils/format'

function FinancePage() {
  const role = useAppStore((state) => state.currentRole)
  const account = useAppStore((state) => state.account)
  const ledgers = useAppStore((state) => state.ledgers)
  const deposits = useAppStore((state) => state.deposits)
  const activeCustomerName = useAppStore((state) => state.activeCustomerName)
  const registerDeposit = useAppStore((state) => state.registerDeposit)
  const reviewDeposit = useAppStore((state) => state.reviewDeposit)

  const [modalOpen, setModalOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [depositDate, setDepositDate] = useState(dayjs())
  const [receiptName, setReceiptName] = useState('')
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({})

  const pendingDeposits = useMemo(
    () => deposits.filter((item) => item.status === 'pending'),
    [deposits],
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
            label: role === 'finance' ? '预存待确认' : '预存登记',
            children:
              role === 'finance' ? (
                <Table
                  rowKey="id"
                  dataSource={pendingDeposits}
                  pagination={false}
                  locale={{ emptyText: '暂无待确认预存' }}
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
    </div>
  )
}

export default FinancePage
