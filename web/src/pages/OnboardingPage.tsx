import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type OnboardingApplication } from '../store/useAppStore'

const statusTypeMap: Record<
  OnboardingApplication['status'],
  'pending' | 'success' | 'danger' | 'processing'
> = {
  pending: 'pending',
  approved: 'processing',
  rejected: 'danger',
  activated: 'success',
}

const statusLabelMap: Record<OnboardingApplication['status'], string> = {
  pending: '待审核',
  approved: '待上传合同',
  rejected: '已驳回',
  activated: '已激活',
}

function OnboardingPage() {
  const applications = useAppStore((state) => state.onboardingApplications)
  const reviewOnboarding = useAppStore((state) => state.reviewOnboarding)
  const uploadOnboardingContract = useAppStore((state) => state.uploadOnboardingContract)
  const [activeId, setActiveId] = useState<string>()
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewReason, setReviewReason] = useState('')
  const [reviewLevel, setReviewLevel] = useState<'A' | 'B' | 'C'>('B')
  const [contractName, setContractName] = useState('')
  const [contractDate, setContractDate] = useState(dayjs())

  const activeApplication = useMemo(
    () => applications.find((item) => item.id === activeId),
    [activeId, applications],
  )

  const submitReview = () => {
    if (!activeApplication) {
      return
    }

    if (reviewAction === 'reject' && !reviewReason.trim()) {
      message.error('驳回必须填写原因')
      return
    }

    reviewOnboarding({
      applicationId: activeApplication.id,
      action: reviewAction,
      reviewer: '市场部-赵主管',
      reason: reviewReason,
      level: reviewLevel,
    })

    message.success(reviewAction === 'approve' ? '审核通过，待上传合同' : '已驳回该入驻申请')
    setReviewReason('')
  }

  const submitContract = () => {
    if (!activeApplication) {
      return
    }

    if (!contractName.trim()) {
      message.error('请填写合同文件名')
      return
    }

    uploadOnboardingContract({
      applicationId: activeApplication.id,
      contractName,
      effectiveDate: contractDate.format('YYYY-MM-DD'),
    })

    message.success('合同上传完成，组织已激活')
    setContractName('')
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        入驻审核与合同管理
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="审核流程"
        description="审核通过后，上传服务合同即可将组织激活；驳回必须填写原因并支持重新提交。"
      />

      <Table
        rowKey="id"
        dataSource={applications}
        pagination={false}
        columns={[
          {
            title: '申请编号',
            dataIndex: 'id',
            render: (value: string, record) => (
              <Button type="link" style={{ padding: 0 }} onClick={() => setActiveId(record.id)}>
                {value}
              </Button>
            ),
          },
          { title: '组织名称', dataIndex: 'organizationName' },
          {
            title: '组织类型',
            dataIndex: 'organizationType',
            render: (value: string) =>
              value === 'terminal' ? '终端用户' : value === 'carrier' ? '承运商' : '上游气源公司',
          },
          { title: '联系人', dataIndex: 'contactName' },
          { title: '联系电话', dataIndex: 'contactPhone' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: OnboardingApplication['status']) => (
              <StatusBadge text={statusLabelMap[value]} type={statusTypeMap[value]} />
            ),
          },
          { title: '等级', dataIndex: 'level', render: (value?: string) => value ?? '--' },
        ]}
      />

      <Drawer
        title="入驻审核详情"
        open={Boolean(activeApplication)}
        onClose={() => setActiveId(undefined)}
        width={560}
      >
        {activeApplication ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text>
              <strong>组织：</strong>
              {activeApplication.organizationName}
            </Typography.Text>
            <Typography.Text>
              <strong>状态：</strong>
              {statusLabelMap[activeApplication.status]}
            </Typography.Text>
            {activeApplication.rejectReason ? (
              <Alert type="warning" message={`驳回原因：${activeApplication.rejectReason}`} />
            ) : null}

            <Form layout="vertical">
              <Form.Item label="审核动作">
                <Radio.Group
                  value={reviewAction}
                  onChange={(event) => setReviewAction(event.target.value)}
                >
                  <Radio value="approve">通过</Radio>
                  <Radio value="reject">驳回</Radio>
                </Radio.Group>
              </Form.Item>
              {reviewAction === 'approve' ? (
                <Form.Item label="用户等级">
                  <Select
                    value={reviewLevel}
                    options={[
                      { label: 'A', value: 'A' },
                      { label: 'B', value: 'B' },
                      { label: 'C', value: 'C' },
                    ]}
                    onChange={(value) => setReviewLevel(value)}
                  />
                </Form.Item>
              ) : (
                <Form.Item label="驳回原因" required>
                  <Input.TextArea
                    rows={3}
                    value={reviewReason}
                    onChange={(event) => setReviewReason(event.target.value)}
                  />
                </Form.Item>
              )}
              <Button type="primary" onClick={submitReview}>
                提交审核
              </Button>
            </Form>

            {activeApplication.status === 'approved' ? (
              <Form layout="vertical">
                <Typography.Title level={5}>合同上传</Typography.Title>
                <Form.Item label="合同文件名" required>
                  <Input
                    value={contractName}
                    placeholder="例如：service-contract.pdf"
                    onChange={(event) => setContractName(event.target.value)}
                  />
                </Form.Item>
                <Form.Item label="生效日期" required>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={contractDate}
                    onChange={(value) => setContractDate(value ?? dayjs())}
                  />
                </Form.Item>
                <Button type="primary" onClick={submitContract}>
                  上传并激活
                </Button>
              </Form>
            ) : null}

            {activeApplication.contractName ? (
              <Alert
                type="success"
                showIcon
                message={`合同：${activeApplication.contractName}`}
                description={`生效日期：${activeApplication.contractEffectiveDate ?? '--'}`}
              />
            ) : null}
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default OnboardingPage
