import {
  BellOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  AutoComplete,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Flex,
  Input,
  Layout,
  Menu,
  Popover,
  Select,
  Space,
  Typography,
} from 'antd'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { appMenus, roleLabelMap, rolePathFallback } from '../config/navigation'
import { useAppStore } from '../store/useAppStore'

const { Header, Sider, Content } = Layout

function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = useAppStore((state) => state.currentRole)
  const currentUser = useAppStore((state) => state.currentUser)
  const switchRole = useAppStore((state) => state.switchRole)
  const logout = useAppStore((state) => state.logout)
  const notifications = useAppStore((state) => state.notifications)
  const markNotificationRead = useAppStore((state) => state.markNotificationRead)
  const plans = useAppStore((state) => state.plans)
  const orders = useAppStore((state) => state.orders)

  const visibleMenus = useMemo(
    () => appMenus.filter((item) => item.roles.includes(role)),
    [role],
  )

  const selectedMenu = useMemo(
    () =>
      visibleMenus.find((item) => location.pathname.startsWith(item.path))?.key ??
      visibleMenus[0]?.key,
    [location.pathname, visibleMenus],
  )

  const breadcrumbs = useMemo(() => {
    const activeMenu = visibleMenus.find((item) => location.pathname.startsWith(item.path))

    if (!activeMenu) {
      return ['首页']
    }

    const sections = activeMenu.label.split('/')
    return ['首页', ...sections]
  }, [location.pathname, visibleMenus])

  const unreadCount = notifications.filter((item) => !item.read).length

  const searchOptions = useMemo(() => {
    const planOptions = plans.slice(0, 5).map((item) => ({
      value: item.number,
      label: `计划：${item.number} / ${item.customerName}`,
      path: '/app/plans/list',
    }))
    const orderOptions = orders.slice(0, 5).map((item) => ({
      value: item.number,
      label: `订单：${item.number} / ${item.customerName}`,
      path: '/app/orders/fulfillment',
    }))

    return [...planOptions, ...orderOptions]
  }, [orders, plans])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64}>
        <div className="brand-block">LNG Trade</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedMenu ? [selectedMenu] : []}
          items={visibleMenus.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />
      </Sider>
      <Layout>
        <Header className="top-header">
          <Flex align="center" justify="space-between" gap={12}>
            <Space>
              <AutoComplete
                style={{ width: 340 }}
                options={searchOptions}
                onSelect={(_, option) => navigate(String(option.path))}
              >
                <Input prefix={<SearchOutlined />} placeholder="搜索计划号、订单号、客户" />
              </AutoComplete>
            </Space>

            <Space size={16} align="center">
              <Select
                value={role}
                style={{ width: 160 }}
                options={Object.entries(roleLabelMap).map(([value, label]) => ({ value, label }))}
                onChange={(value) => {
                  switchRole(value)
                  navigate(rolePathFallback[value])
                }}
              />

              <Popover
                title="消息中心"
                trigger="click"
                content={
                  <div className="message-popover">
                    {notifications.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className={item.read ? 'message-item read' : 'message-item'}
                        role="button"
                        tabIndex={0}
                        onClick={() => markNotificationRead(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            markNotificationRead(item.id)
                          }
                        }}
                      >
                        <Typography.Text strong>{item.title}</Typography.Text>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          {item.content}
                        </Typography.Paragraph>
                      </div>
                    ))}
                  </div>
                }
              >
                <Badge count={unreadCount} overflowCount={99}>
                  <Button icon={<BellOutlined />} shape="circle" aria-label="消息中心" />
                </Badge>
              </Popover>

              <Dropdown
                menu={{
                  items: [
                    { key: 'help', icon: <QuestionCircleOutlined />, label: '帮助文档（Mock）' },
                    { key: 'profile', icon: <UserOutlined />, label: '组织切换（Mock）' },
                    { type: 'divider' },
                    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'logout') {
                      logout()
                      navigate('/auth/login')
                    }
                  },
                }}
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  <Typography.Text>{currentUser?.contactName ?? roleLabelMap[role]}</Typography.Text>
                </Space>
              </Dropdown>
            </Space>
          </Flex>
        </Header>

        <Content className="content-shell">
          <Breadcrumb
            style={{ marginBottom: 12 }}
            items={breadcrumbs.map((item) => ({ title: item }))}
          />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
