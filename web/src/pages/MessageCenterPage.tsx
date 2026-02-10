import { CheckOutlined, MobileOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Select, Space, Table, Tabs, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore, type NotificationItem } from '../store/useAppStore'

type CategoryFilter = 'all' | NotificationItem['category']

function MessageCenterPage() {
  const notifications = useAppStore((state) => state.notifications)
  const markNotificationRead = useAppStore((state) => state.markNotificationRead)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')

  const unreadCount = notifications.filter((item) => !item.read).length

  const filteredNotifications = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return notifications.filter((item) => {
      if (category !== 'all' && item.category !== category) {
        return false
      }

      if (!normalizedKeyword) {
        return true
      }

      return (
        item.title.toLowerCase().includes(normalizedKeyword) ||
        item.content.toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [category, keyword, notifications])

  const smsRecords = useMemo(
    () =>
      notifications.map((item) => ({
        id: `sms-${item.id}`,
        receiver: '138****8000',
        content: `【LNG贸易】${item.title}：${item.content}`,
        sentAt: item.createdAt,
        status: 'sent',
      })),
    [notifications],
  )

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        消息中心
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card className="kpi-card">
            <Typography.Text type="secondary">未读系统消息</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0 0' }}>
              {unreadCount}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="kpi-card">
            <Typography.Text type="secondary">短信记录（Mock）</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0 0' }}>
              {smsRecords.length}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="kpi-card">
            <Typography.Text type="secondary">消息来源</Typography.Text>
            <Typography.Title level={5} style={{ margin: '8px 0 0 0' }}>
              系统通知 + 短信Mock
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'system',
            label: '系统消息',
            children: (
              <Card>
                <Space wrap style={{ marginBottom: 12 }}>
                  <Input
                    style={{ width: 320 }}
                    allowClear
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索标题/内容"
                  />
                  <Select<CategoryFilter>
                    value={category}
                    style={{ width: 180 }}
                    onChange={setCategory}
                    options={[
                      { label: '全部分类', value: 'all' },
                      { label: '审批通知', value: 'approval' },
                      { label: '履约通知', value: 'fulfillment' },
                      { label: '资金通知', value: 'finance' },
                      { label: '系统通知', value: 'system' },
                    ]}
                  />
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() => {
                      filteredNotifications
                        .filter((item) => !item.read)
                        .forEach((item) => markNotificationRead(item.id))
                      message.success('当前筛选消息已标记为已读')
                    }}
                  >
                    批量设为已读
                  </Button>
                </Space>

                <Table
                  rowKey="id"
                  dataSource={filteredNotifications}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    { title: '标题', dataIndex: 'title' },
                    { title: '内容', dataIndex: 'content' },
                    {
                      title: '类型',
                      dataIndex: 'category',
                      render: (value: NotificationItem['category']) => {
                        if (value === 'approval') {
                          return <StatusBadge text="审批" type="pending" />
                        }
                        if (value === 'fulfillment') {
                          return <StatusBadge text="履约" type="processing" />
                        }
                        if (value === 'finance') {
                          return <StatusBadge text="资金" type="success" />
                        }

                        return <StatusBadge text="系统" type="neutral" />
                      },
                    },
                    {
                      title: '状态',
                      dataIndex: 'read',
                      render: (value: boolean) =>
                        value ? (
                          <StatusBadge text="已读" type="neutral" />
                        ) : (
                          <StatusBadge text="未读" type="warning" />
                        ),
                    },
                    {
                      title: '时间',
                      dataIndex: 'createdAt',
                      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: NotificationItem) => (
                        <Button size="small" onClick={() => markNotificationRead(record.id)} disabled={record.read}>
                          标记已读
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'sms',
            label: '短信记录（Mock）',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  dataSource={smsRecords}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    { title: '接收号码', dataIndex: 'receiver' },
                    { title: '短信内容', dataIndex: 'content' },
                    {
                      title: '发送状态',
                      dataIndex: 'status',
                      render: () => <StatusBadge text="发送成功" type="success" />,
                    },
                    {
                      title: '发送时间',
                      dataIndex: 'sentAt',
                      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
                    },
                    {
                      title: '渠道',
                      key: 'channel',
                      render: () => (
                        <Space>
                          <MobileOutlined />
                          <Typography.Text>短信网关（Mock）</Typography.Text>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}

export default MessageCenterPage
