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
  Radio,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type Plan } from '../store/useAppStore'
import { formatDateTime, formatMoney, planStatusLabel } from '../utils/format'

const reasonTemplates = ['资质过期', '余额不足', '站点维护中', '信息不完整']

function PlanApprovalPage() {
  const plans = useAppStore((state) => state.plans)
  const reviewPlan = useAppStore((state) => state.reviewPlan)
  const pendingPlans = useMemo(
    () => plans.filter((item) => ['submitted', 'returned'].includes(item.status)),
    [plans],
  )
  const [activePlanId, setActivePlanId] = useState<string>()
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [reasonTemplate, setReasonTemplate] = useState<string>()
  const [customReason, setCustomReason] = useState('')

  const activePlan = pendingPlans.find((item) => item.id === activePlanId)

  const submitReview = () => {
    if (!activePlan) {
      return
    }

    const reason = [reasonTemplate, customReason].filter(Boolean).join('；')

    if (action === 'reject' && !reason) {
      message.error('退回必须填写原因')
      return
    }

    reviewPlan({
      planId: activePlan.id,
      action,
      reviewer: '市场部-审批员',
      reason,
    })

    message.success(action === 'approve' ? '审批通过并已成单' : '计划已退回')
    setActivePlanId(undefined)
    setCustomReason('')
    setReasonTemplate(undefined)
    setAction('approve')
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        计划审批工作台
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card>
            <Table
              rowKey="id"
              dataSource={pendingPlans}
              pagination={false}
              locale={{ emptyText: <Empty description="暂无待审批计划" /> }}
              columns={[
                {
                  title: '计划编号',
                  dataIndex: 'number',
                  render: (value: string, record: Plan) => (
                    <Button type="link" style={{ padding: 0 }} onClick={() => setActivePlanId(record.id)}>
                      {value}
                    </Button>
                  ),
                },
                { title: '客户', dataIndex: 'customerName' },
                { title: '站点', dataIndex: 'siteName' },
                {
                  title: '计划量(吨)',
                  dataIndex: 'plannedVolume',
                  align: 'right',
                  render: (value: number) => value.toFixed(3),
                },
                {
                  title: '预计货款',
                  dataIndex: 'estimatedAmount',
                  align: 'right',
                  render: (value: number) => formatMoney(value),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: Plan['status']) => (
                    <StatusBadge
                      text={planStatusLabel[value]}
                      type={value === 'submitted' ? 'pending' : 'danger'}
                    />
                  ),
                },
                {
                  title: '提交时间',
                  dataIndex: 'submittedAt',
                  render: (value: string) => formatDateTime(value),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title="审批详情"
        open={Boolean(activePlan)}
        width={560}
        onClose={() => setActivePlanId(undefined)}
      >
        {activePlan ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={`计划编号：${activePlan.number}`}
              description="左侧保持列表，右侧抽屉完成审批，符合分屏审批规范。"
            />
            <Card size="small" title="计划信息（只读）">
              <Space direction="vertical" size={6}>
                <Typography.Text>客户：{activePlan.customerName}</Typography.Text>
                <Typography.Text>站点：{activePlan.siteName}</Typography.Text>
                <Typography.Text>运输方式：{activePlan.transportMode}</Typography.Text>
                <Typography.Text>计划量：{activePlan.plannedVolume.toFixed(3)} 吨</Typography.Text>
                <Typography.Text>预计总金额：{formatMoney(activePlan.totalAmount)}</Typography.Text>
                <Typography.Text>
                  资金校验：
                  <StatusBadge text="通过" type="success" />
                </Typography.Text>
              </Space>
            </Card>

            <Divider style={{ margin: 0 }} />

            <Form layout="vertical">
              <Form.Item label="审批动作">
                <Radio.Group
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                >
                  <Radio value="approve">通过</Radio>
                  <Radio value="reject">退回</Radio>
                </Radio.Group>
              </Form.Item>
              {action === 'reject' ? (
                <>
                  <Form.Item label="退回原因模板" required>
                    <Select
                      placeholder="请选择常用原因"
                      value={reasonTemplate}
                      options={reasonTemplates.map((item) => ({ label: item, value: item }))}
                      onChange={(value) => setReasonTemplate(value)}
                    />
                  </Form.Item>
                  <Form.Item label="补充说明">
                    <Input.TextArea
                      rows={3}
                      placeholder="可补充具体说明"
                      value={customReason}
                      onChange={(event) => setCustomReason(event.target.value)}
                    />
                  </Form.Item>
                </>
              ) : (
                <Form.Item label="审批备注">
                  <Input.TextArea
                    rows={3}
                    placeholder="可填写补充说明"
                    value={customReason}
                    onChange={(event) => setCustomReason(event.target.value)}
                  />
                </Form.Item>
              )}
            </Form>

            <Space>
              <Button onClick={() => setActivePlanId(undefined)}>取消</Button>
              <Button type="primary" onClick={submitReview}>
                提交审批
              </Button>
            </Space>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default PlanApprovalPage
