import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type ExceptionCase, type ExceptionType } from '../store/useAppStore'

const typeLabelMap: Record<ExceptionType, string> = {
  'plan-terminate': '计划终止',
  'order-terminate': '订单终止',
  'plan-change': '计划变更',
  'order-change': '订单变更',
  'delta-adjustment': '多退少补',
}

const statusLabelMap: Record<ExceptionCase['status'], string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
}

const statusBadgeMap: Record<ExceptionCase['status'], 'pending' | 'success' | 'danger'> = {
  pending: 'pending',
  approved: 'success',
  rejected: 'danger',
}

const typeOptions = Object.entries(typeLabelMap).map(([value, label]) => ({ value, label }))

const tabGroupMap: Record<string, ExceptionType[]> = {
  all: ['plan-terminate', 'order-terminate', 'plan-change', 'order-change', 'delta-adjustment'],
  terminate: ['plan-terminate', 'order-terminate'],
  change: ['plan-change', 'order-change'],
  delta: ['delta-adjustment'],
}

function ExceptionCenterPage() {
  const exceptions = useAppStore((state) => state.exceptions)
  const createException = useAppStore((state) => state.createException)
  const processException = useAppStore((state) => state.processException)

  const [tabKey, setTabKey] = useState('all')
  const [type, setType] = useState<ExceptionType>('plan-change')
  const [targetNo, setTargetNo] = useState('')
  const [reason, setReason] = useState('')
  const [responsibilityParty, setResponsibilityParty] = useState('终端用户')
  const [amount, setAmount] = useState<number>(0)
  const [reviewNoteMap, setReviewNoteMap] = useState<Record<string, string>>({})

  const visibleExceptions = useMemo(
    () => exceptions.filter((item) => tabGroupMap[tabKey].includes(item.type)),
    [exceptions, tabKey],
  )

  const submitCreate = () => {
    if (!targetNo.trim() || !reason.trim()) {
      message.error('目标单据与异常原因为必填项')
      return
    }

    createException({
      type,
      targetNo,
      reason,
      responsibilityParty,
      amount,
    })

    setTargetNo('')
    setReason('')
    setAmount(0)
    message.success('异常单已创建并进入待审批')
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        异常处理中心
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="新建异常单">
            <Form layout="vertical">
              <Form.Item label="异常类型" required>
                <Select
                  value={type}
                  options={typeOptions}
                  onChange={(value: ExceptionType) => setType(value)}
                />
              </Form.Item>
              <Form.Item label="目标单据号" required>
                <Input
                  value={targetNo}
                  placeholder="例如：PL-20260209-001"
                  onChange={(event) => setTargetNo(event.target.value)}
                />
              </Form.Item>
              <Form.Item label="责任方">
                <Select
                  value={responsibilityParty}
                  onChange={(value) => setResponsibilityParty(value)}
                  options={[
                    { label: '终端用户', value: '终端用户' },
                    { label: '承运商', value: '承运商' },
                    { label: '上游气源公司', value: '上游气源公司' },
                    { label: '平台内部', value: '平台内部' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="涉及金额（元）">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={amount}
                  onChange={(value) => setAmount(Number(value ?? 0))}
                />
              </Form.Item>
              <Form.Item label="异常原因" required>
                <Input.TextArea
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </Form.Item>
              <Button type="primary" onClick={submitCreate}>
                提交异常单
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="异常处理规则"
            description="终止、变更、多退少补均需审批。审批通过后会联动计划/订单状态并留下审计痕迹。"
          />

          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={[
              { key: 'all', label: '全部异常' },
              { key: 'terminate', label: '终止流程' },
              { key: 'change', label: '变更流程' },
              { key: 'delta', label: '多退少补' },
            ]}
          />

          <Table
            rowKey="id"
            dataSource={visibleExceptions}
            pagination={{ pageSize: 6 }}
            columns={[
              { title: '异常单号', dataIndex: 'number' },
              {
                title: '类型',
                dataIndex: 'type',
                render: (value: ExceptionType) => typeLabelMap[value],
              },
              { title: '目标单据', dataIndex: 'targetNo' },
              {
                title: '金额',
                dataIndex: 'amount',
                align: 'right',
                render: (value: number) => `¥${value.toLocaleString('zh-CN')}`,
              },
              {
                title: '状态',
                dataIndex: 'status',
                render: (value: ExceptionCase['status']) => (
                  <StatusBadge text={statusLabelMap[value]} type={statusBadgeMap[value]} />
                ),
              },
              {
                title: '审批备注',
                key: 'note',
                render: (_, record: ExceptionCase) => (
                  <Input
                    size="small"
                    placeholder="审批时填写"
                    value={reviewNoteMap[record.id]}
                    onChange={(event) =>
                      setReviewNoteMap((prev) => ({
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
                render: (_, record: ExceptionCase) => {
                  if (record.status !== 'pending') {
                    return <Typography.Text type="secondary">--</Typography.Text>
                  }

                  return (
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          processException({
                            exceptionId: record.id,
                            action: 'approve',
                            reviewer: '市场部-审批员',
                            note: reviewNoteMap[record.id] ?? '',
                          })
                          message.success('异常单已审批通过')
                        }}
                      >
                        通过
                      </Button>
                      <Button
                        danger
                        size="small"
                        onClick={() => {
                          processException({
                            exceptionId: record.id,
                            action: 'reject',
                            reviewer: '市场部-审批员',
                            note: reviewNoteMap[record.id] ?? '不符合处理规则',
                          })
                          message.warning('异常单已驳回')
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
    </div>
  )
}

export default ExceptionCenterPage
