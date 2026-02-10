import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import MoneyDisplay from '../components/MoneyDisplay'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type Plan } from '../store/useAppStore'
import { formatDateTime, planStatusLabel } from '../utils/format'

const statusTypeMap: Record<Plan['status'], 'draft' | 'pending' | 'success' | 'danger' | 'neutral'> = {
  draft: 'draft',
  submitted: 'pending',
  returned: 'danger',
  approved: 'success',
  cancelled: 'neutral',
  changed: 'pending',
}

function PlanListPage() {
  const plans = useAppStore((state) => state.plans)
  const cancelPlan = useAppStore((state) => state.cancelPlan)
  const createException = useAppStore((state) => state.createException)
  const [activePlanId, setActivePlanId] = useState<string>()
  const [cancelReason, setCancelReason] = useState('')
  const [changeTarget, setChangeTarget] = useState<Plan>()
  const [changeReason, setChangeReason] = useState('')
  const [changeAmount, setChangeAmount] = useState<number>(0)

  const activePlan = useMemo(
    () => plans.find((item) => item.id === activePlanId),
    [activePlanId, plans],
  )

  const submitChangeRequest = () => {
    if (!changeTarget) {
      return
    }

    if (!changeReason.trim()) {
      message.error('请填写变更原因')
      return
    }

    createException({
      type: 'plan-change',
      targetNo: changeTarget.number,
      reason: changeReason.trim(),
      responsibilityParty: '终端用户',
      amount: changeAmount,
    })

    message.success('变更申请已提交，待审批')
    setChangeTarget(undefined)
    setChangeReason('')
    setChangeAmount(0)
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        我的用气计划
      </Typography.Title>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message="支持规则"
        description="草稿、待审核、已退回状态可取消；待审核/已批准可发起变更申请，取消后会自动释放占用金额。"
      />

      <Table
        rowKey="id"
        dataSource={plans}
        pagination={false}
        columns={[
          {
            title: '计划编号',
            dataIndex: 'number',
            render: (value: string, record: Plan) => (
              <Button type="link" onClick={() => setActivePlanId(record.id)} style={{ padding: 0 }}>
                {value}
              </Button>
            ),
          },
          { title: '站点', dataIndex: 'siteName' },
          {
            title: '计划量(吨)',
            dataIndex: 'plannedVolume',
            align: 'right',
            render: (value: number) => value.toFixed(3),
          },
          {
            title: '预计金额',
            dataIndex: 'totalAmount',
            align: 'right',
            render: (value: number) => <MoneyDisplay value={value} />,
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: Plan['status']) => (
              <StatusBadge text={planStatusLabel[value]} type={statusTypeMap[value]} />
            ),
          },
          {
            title: '提交时间',
            dataIndex: 'submittedAt',
            render: (value: string) => formatDateTime(value),
          },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 260,
            render: (_, record: Plan) => {
              const canCancel = ['draft', 'submitted', 'returned'].includes(record.status)
              const canChange = ['submitted', 'approved', 'changed'].includes(record.status)

              if (!canCancel && !canChange) {
                return <Typography.Text type="secondary">--</Typography.Text>
              }

              return (
                <Space>
                  {canCancel ? (
                    <Popconfirm
                      title="确认取消该计划？"
                      description={
                        <Form layout="vertical">
                          <Form.Item label="取消原因" required style={{ marginBottom: 0 }}>
                            <Input.TextArea
                              value={cancelReason}
                              rows={2}
                              onChange={(event) => setCancelReason(event.target.value)}
                            />
                          </Form.Item>
                        </Form>
                      }
                      onConfirm={() => {
                        cancelPlan(record.id, cancelReason || '终端用户申请取消')
                        setCancelReason('')
                        message.success('计划已取消并释放占用金额')
                      }}
                    >
                      <Button danger size="small">
                        取消计划
                      </Button>
                    </Popconfirm>
                  ) : null}
                  {canChange ? (
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      onClick={() => {
                        setChangeTarget(record)
                        setChangeReason('')
                        setChangeAmount(0)
                      }}
                    >
                      变更申请
                    </Button>
                  ) : null}
                </Space>
              )
            },
          },
        ]}
      />

      <Drawer
        title="计划详情"
        open={Boolean(activePlan)}
        width={520}
        onClose={() => setActivePlanId(undefined)}
      >
        {activePlan ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text>
              <strong>计划编号：</strong>
              {activePlan.number}
            </Typography.Text>
            <Typography.Text>
              <strong>状态：</strong>
              {planStatusLabel[activePlan.status]}
            </Typography.Text>
            <Typography.Text>
              <strong>站点：</strong>
              {activePlan.siteName}
            </Typography.Text>
            <Typography.Text>
              <strong>计划日期：</strong>
              {activePlan.planDate ?? '--'}
            </Typography.Text>
            <Typography.Text>
              <strong>时间窗：</strong>
              {activePlan.timeWindow ?? '--'}
            </Typography.Text>
            <Typography.Text>
              <strong>运输方式：</strong>
              {activePlan.transportMode}
            </Typography.Text>
            <Typography.Text>
              <strong>计划量：</strong>
              {activePlan.plannedVolume.toFixed(3)} 吨
            </Typography.Text>
            <Typography.Text>
              <strong>预计货款：</strong>
              <MoneyDisplay value={activePlan.estimatedAmount} />
            </Typography.Text>
            <Typography.Text>
              <strong>承运费：</strong>
              <MoneyDisplay value={activePlan.freightFee} />
            </Typography.Text>
            <Typography.Text>
              <strong>预计总金额：</strong>
              <MoneyDisplay value={activePlan.totalAmount} />
            </Typography.Text>
            {activePlan.rejectReason ? (
              <Alert type="warning" message={`退回/取消原因：${activePlan.rejectReason}`} />
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="计划变更申请"
        open={Boolean(changeTarget)}
        onCancel={() => setChangeTarget(undefined)}
        onOk={submitChangeRequest}
        okText="提交申请"
      >
        {changeTarget ? (
          <Form layout="vertical">
            <Form.Item label="目标计划">
              <Input value={changeTarget.number} disabled />
            </Form.Item>
            <Form.Item label="变更原因" required>
              <Input.TextArea
                rows={4}
                value={changeReason}
                placeholder="例如：客户现场用气需求上调，申请调整计划量与承运安排。"
                onChange={(event) => setChangeReason(event.target.value)}
              />
            </Form.Item>
            <Form.Item label="涉及金额（元，可选）">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                value={changeAmount}
                onChange={(value) => setChangeAmount(Number(value ?? 0))}
              />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </div>
  )
}

export default PlanListPage
