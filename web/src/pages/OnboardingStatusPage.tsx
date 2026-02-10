import { Alert, Button, Card, Empty, Space, Table, Typography } from 'antd'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type OnboardingApplication } from '../store/useAppStore'

const statusTextMap: Record<OnboardingApplication['status'], string> = {
  pending: '待审核',
  approved: '待上传合同',
  rejected: '已驳回',
  activated: '已激活',
}

const statusTypeMap: Record<
  OnboardingApplication['status'],
  'pending' | 'processing' | 'danger' | 'success'
> = {
  pending: 'pending',
  approved: 'processing',
  rejected: 'danger',
  activated: 'success',
}

function OnboardingStatusPage() {
  const navigate = useNavigate()
  const currentUser = useAppStore((state) => state.currentUser)
  const onboardingApplications = useAppStore((state) => state.onboardingApplications)

  const myApplications = useMemo(() => {
    if (!currentUser) {
      return []
    }

    const byOrganization = onboardingApplications.filter(
      (item) => item.organizationName === currentUser.organizationName,
    )

    if (byOrganization.length > 0) {
      return byOrganization
    }

    const orgType =
      currentUser.role === 'terminal'
        ? 'terminal'
        : currentUser.role === 'carrier' || currentUser.role === 'driver'
          ? 'carrier'
          : 'upstream'

    return onboardingApplications.filter((item) => item.organizationType === orgType)
  }, [currentUser, onboardingApplications])

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        入驻状态通知
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="审核结果通知"
        description="展示入驻审核状态、驳回原因和合同激活结果。被驳回时可进入资料提交页补充后重新提交。"
      />

      {myApplications.length === 0 ? (
        <Card>
          <Empty description="暂无入驻申请记录" />
        </Card>
      ) : (
        <Table
          rowKey="id"
          dataSource={myApplications}
          pagination={false}
          columns={[
            { title: '申请编号', dataIndex: 'id' },
            { title: '组织名称', dataIndex: 'organizationName' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (value: OnboardingApplication['status']) => (
                <StatusBadge text={statusTextMap[value]} type={statusTypeMap[value]} />
              ),
            },
            {
              title: '驳回原因',
              dataIndex: 'rejectReason',
              render: (value?: string) => value ?? '--',
            },
            {
              title: '合同',
              key: 'contract',
              render: (_, record: OnboardingApplication) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text>{record.contractName ?? '--'}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {record.contractEffectiveDate ?? '--'}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record: OnboardingApplication) =>
                record.status === 'rejected' ? (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => navigate('/app/onboarding/submit')}
                  >
                    补充资料
                  </Button>
                ) : (
                  <Typography.Text type="secondary">--</Typography.Text>
                ),
            },
          ]}
        />
      )}
    </div>
  )
}

export default OnboardingStatusPage
