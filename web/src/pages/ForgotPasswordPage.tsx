import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

interface ResetPasswordFormValue {
  phone: string
  verifyCode: string
  newPassword: string
}

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const resetPassword = useAppStore((state) => state.resetPassword)

  const submit = async (value: ResetPasswordFormValue) => {
    const result = resetPassword(value)

    if (!result.success) {
      message.error(result.error)
      return
    }

    message.success('密码已重置，请重新登录')
    navigate('/auth/login')
  }

  return (
    <div className="auth-shell">
      <Card className="auth-card" title="找回密码">
        <Typography.Paragraph type="secondary">
          输入手机号并完成验证码校验后可重置密码，验证码固定为 <strong>123456</strong>。
        </Typography.Paragraph>
        <Form<ResetPasswordFormValue> layout="vertical" onFinish={submit} initialValues={{ verifyCode: '123456' }}>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="例如：13800138000" />
          </Form.Item>
          <Form.Item
            label="验证码"
            name="verifyCode"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Input
              placeholder="请输入验证码"
              addonAfter={
                <Button type="link" size="small" onClick={() => message.success('验证码已发送：123456（Mock）')}>
                  发送验证码
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button type="link" onClick={() => navigate('/auth/login')}>
              返回登录
            </Button>
            <Button type="primary" htmlType="submit">
              重置密码
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}

export default ForgotPasswordPage
