import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Result
      status="404"
      title="页面不存在"
      subTitle="请通过左侧菜单访问原型页面"
      extra={
        <Button type="primary" onClick={() => navigate('/app/dashboard')}>
          返回工作台
        </Button>
      }
    />
  )
}

export default NotFoundPage
