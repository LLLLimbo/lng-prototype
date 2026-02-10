import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

interface LoginFormValue {
  phone: string
  password: string
  verifyCode: string
}

function LoginPage() {
  const navigate = useNavigate()
  const login = useAppStore((state) => state.login)

  const submit = async (value: LoginFormValue) => {
    const result = login(value)

    if (!result.success) {
      message.error(result.error)
      return
    }

    message.success('登录成功')
    navigate('/app/dashboard')
  }

  return (
    <div className="auth-shell">
      <Card className="auth-card" title="LNG 贸易系统登录">
        <Typography.Paragraph type="secondary">
          演示验证码固定为 <strong>123456</strong>
        </Typography.Paragraph>
        <Form<LoginFormValue> layout="vertical" onFinish={submit} initialValues={{ verifyCode: '123456' }}>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="例如：13800138000" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
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
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button type="link" onClick={() => navigate('/auth/register')}>
              注册账号
            </Button>
            <Button type="link" onClick={() => navigate('/auth/forgot')}>
              忘记密码
            </Button>
          </Space>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage
