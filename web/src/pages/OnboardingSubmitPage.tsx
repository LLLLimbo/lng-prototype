import { Alert, Button, Card, Empty, Form, Input, Space, Typography, message } from 'antd'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type OnboardingApplication, type RoleKey } from '../store/useAppStore'

interface OnboardingSubmitFormValue {
  contactName: string
  contactPhone: string
  invoiceTitle: string
  taxNo: string
  businessLicenseFile: string
  qualificationFile: string
}

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

function resolveOrganizationType(role: RoleKey): OnboardingApplication['organizationType'] {
  if (role === 'terminal') {
    return 'terminal'
  }

  if (role === 'carrier' || role === 'driver') {
    return 'carrier'
  }

  return 'upstream'
}

function OnboardingSubmitPage() {
  const [form] = Form.useForm<OnboardingSubmitFormValue>()
  const navigate = useNavigate()
  const currentUser = useAppStore((state) => state.currentUser)
  const onboardingApplications = useAppStore((state) => state.onboardingApplications)
  const submitOnboardingMaterials = useAppStore((state) => state.submitOnboardingMaterials)

  const targetApplication = useMemo(() => {
    if (!currentUser) {
      return undefined
    }

    const byOrganization = onboardingApplications.filter(
      (item) => item.organizationName === currentUser.organizationName,
    )

    const applications =
      byOrganization.length > 0
        ? byOrganization
        : onboardingApplications.filter(
            (item) => item.organizationType === resolveOrganizationType(currentUser.role),
          )

    return [...applications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
  }, [currentUser, onboardingApplications])

  const readOnly = targetApplication?.status === 'approved' || targetApplication?.status === 'activated'

  useEffect(() => {
    if (!targetApplication) {
      return
    }

    form.setFieldsValue({
      contactName: targetApplication.contactName,
      contactPhone: targetApplication.contactPhone,
      invoiceTitle: targetApplication.invoiceTitle,
      taxNo: targetApplication.taxNo,
      businessLicenseFile: targetApplication.businessLicenseFile,
      qualificationFile: targetApplication.qualificationFile,
    })
  }, [form, targetApplication])

  const submit = (value: OnboardingSubmitFormValue) => {
    if (!targetApplication) {
      message.error('未找到可提交的入驻申请')
      return
    }

    const result = submitOnboardingMaterials({
      applicationId: targetApplication.id,
      ...value,
    })

    if (!result.success) {
      message.error(result.error)
      return
    }

    message.success('组织资料已提交，等待市场部审核')
    navigate('/app/onboarding/status')
  }

  const mockUpload = (
    field: 'businessLicenseFile' | 'qualificationFile',
    fileName: string,
  ) => {
    form.setFieldValue(field, fileName)
    message.success(`${fileName} 上传成功（Mock）`)
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        组织资料提交
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="提交说明"
        description="需补齐组织基础信息、开票信息与关键资质附件。被驳回后可在本页补充资料后重新提交。"
      />

      {!targetApplication ? (
        <Card>
          <Empty description="暂无可提交的入驻申请" />
        </Card>
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card
            title="申请概览"
            extra={
              <StatusBadge
                text={statusTextMap[targetApplication.status]}
                type={statusTypeMap[targetApplication.status]}
              />
            }
          >
            <Space direction="vertical" size={4}>
              <Typography.Text>
                <strong>申请编号：</strong>
                {targetApplication.id}
              </Typography.Text>
              <Typography.Text>
                <strong>组织名称：</strong>
                {targetApplication.organizationName}
              </Typography.Text>
              <Typography.Text>
                <strong>提交时间：</strong>
                {targetApplication.submittedAt}
              </Typography.Text>
            </Space>
            {targetApplication.rejectReason ? (
              <Alert
                type="warning"
                style={{ marginTop: 12 }}
                message={`驳回原因：${targetApplication.rejectReason}`}
              />
            ) : null}
          </Card>

          <Card title="资料填写与附件上传">
            {readOnly ? (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                message="当前申请已进入后续环节"
                description="该申请已审核通过或已激活，资料提交入口已只读。"
              />
            ) : null}
            <Form<OnboardingSubmitFormValue>
              form={form}
              layout="vertical"
              onFinish={submit}
              disabled={readOnly}
            >
              <Form.Item
                label="联系人"
                name="contactName"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="例如：张经理" />
              </Form.Item>
              <Form.Item
                label="联系电话"
                name="contactPhone"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="例如：13800138000" />
              </Form.Item>
              <Form.Item
                label="开票抬头"
                name="invoiceTitle"
                rules={[{ required: true, message: '请输入开票抬头' }]}
              >
                <Input placeholder="例如：江苏中海清洁能源有限公司" />
              </Form.Item>
              <Form.Item
                label="税号"
                name="taxNo"
                rules={[{ required: true, message: '请输入税号' }]}
              >
                <Input placeholder="例如：91320000MA1234567X" />
              </Form.Item>
              <Form.Item
                label="营业执照附件"
                name="businessLicenseFile"
                rules={[{ required: true, message: '请上传营业执照' }]}
              >
                <Input placeholder="例如：business-license.pdf" />
              </Form.Item>
              <Button
                style={{ marginBottom: 12 }}
                onClick={() => mockUpload('businessLicenseFile', 'business-license.pdf')}
                disabled={readOnly}
              >
                模拟上传营业执照
              </Button>

              <Form.Item
                label="资质附件"
                name="qualificationFile"
                rules={[{ required: true, message: '请上传资质附件' }]}
              >
                <Input placeholder="例如：carrier-qualification.pdf" />
              </Form.Item>
              <Button
                style={{ marginBottom: 24 }}
                onClick={() => mockUpload('qualificationFile', 'carrier-qualification.pdf')}
                disabled={readOnly}
              >
                模拟上传资质附件
              </Button>

              <Space>
                <Button onClick={() => navigate('/app/onboarding/status')}>返回状态页</Button>
                <Button type="primary" htmlType="submit" disabled={readOnly}>
                  {targetApplication.status === 'rejected' ? '重新提交审核' : '提交审核'}
                </Button>
              </Space>
            </Form>
          </Card>
        </Space>
      )}
    </div>
  )
}

export default OnboardingSubmitPage
