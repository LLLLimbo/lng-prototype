import { Button, Card, Form, Input, Select, Space, Typography, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { RoleKey } from '../store/useAppStore'
import { useAppStore } from '../store/useAppStore'

interface RegisterFormValue {
  organizationName: string
  contactName: string
  phone: string
  password: string
  role: RoleKey
  verifyCode: string
}

function RegisterPage() {
  const navigate = useNavigate()
  const registerAccount = useAppStore((state) => state.registerAccount)

  const submit = async (value: RegisterFormValue) => {
    const result = registerAccount(value)

    if (!result.success) {
      message.error(result.error)
      return
    }

    message.success('注册成功，请登录')
    navigate('/auth/login')
  }

  return (
    <div className="auth-shell">
      <Card className="auth-card" title="组织注册">
        <Typography.Paragraph type="secondary">
          原型阶段仅做 Mock 注册，验证码固定为 <strong>123456</strong>。
        </Typography.Paragraph>
        <Form<RegisterFormValue> layout="vertical" onFinish={submit} initialValues={{ role: 'terminal', verifyCode: '123456' }}>
          <Form.Item
            label="组织名称"
            name="organizationName"
            rules={[{ required: true, message: '请输入组织名称' }]}
          >
            <Input placeholder="例如：苏州新奥燃气有限公司" />
          </Form.Item>
          <Form.Item
            label="联系人"
            name="contactName"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="例如：李敏" />
          </Form.Item>
          <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="例如：13800138111" />
          </Form.Item>
          <Form.Item label="账号角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={[
                { label: '终端用户', value: 'terminal' },
                { label: '上游气源公司', value: 'upstream' },
                { label: '承运商管理员', value: 'carrier' },
                { label: '司机/押运员', value: 'driver' },
              ]}
            />
          </Form.Item>
          <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入登录密码" />
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
            <Button type="link" onClick={() => navigate('/auth/login')}>
              返回登录
            </Button>
            <Button type="primary" htmlType="submit">
              提交注册
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}

export default RegisterPage
