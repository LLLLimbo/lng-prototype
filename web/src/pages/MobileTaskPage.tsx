import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore } from '../store/useAppStore'
import { orderStatusLabel } from '../utils/format'

type MobileTab = 'home' | 'scan' | 'messages' | 'profile' | 'exception'

function MobileTaskPage() {
  const [tab, setTab] = useState<MobileTab>('home')
  const [weightInput, setWeightInput] = useState<number>(0)
  const [exceptionTargetNo, setExceptionTargetNo] = useState<string>()
  const [exceptionReason, setExceptionReason] = useState('')
  const [exceptionAmount, setExceptionAmount] = useState<number>(0)
  const orders = useAppStore((state) => state.orders)
  const notifications = useAppStore((state) => state.notifications)
  const confirmLoad = useAppStore((state) => state.confirmLoad)
  const confirmUnload = useAppStore((state) => state.confirmUnload)
  const createException = useAppStore((state) => state.createException)
  const currentTasks = useMemo(
    () =>
      orders.filter((item) => ['ordered', 'loaded', 'transporting', 'pending-acceptance'].includes(item.status)),
    [orders],
  )

  return (
    <div className="page-section mobile-prototype">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        司机/押运员移动任务模拟
      </Typography.Title>
      <Card style={{ maxWidth: 420 }}>
        <Segmented<MobileTab>
          block
          value={tab}
          options={[
            { label: '首页', value: 'home' },
            { label: '扫一扫', value: 'scan' },
            { label: '消息', value: 'messages' },
            { label: '异常上报', value: 'exception' },
            { label: '我的', value: 'profile' },
          ]}
          onChange={(value) => setTab(value)}
        />

        {tab === 'home' ? (
          <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 16 }}>
            {currentTasks.map((order) => (
              <Card key={order.id} className="mobile-task-card" size="small">
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Typography.Text strong>{order.number}</Typography.Text>
                  <Typography.Text>{order.siteName}</Typography.Text>
                  <StatusBadge text={orderStatusLabel[order.status]} type="processing" />
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={3}
                    value={weightInput}
                    onChange={(value) => setWeightInput(Number(value ?? 0))}
                    addonAfter="吨"
                  />
                  <Space>
                    <Button
                      onClick={() => {
                        confirmLoad({ orderId: order.id, weight: weightInput })
                        message.success('装车确认已提交')
                      }}
                    >
                      装车确认
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        confirmUnload({ orderId: order.id, weight: weightInput })
                        message.success('卸车确认已提交')
                      }}
                    >
                      卸车确认
                    </Button>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        ) : null}

        {tab === 'scan' ? (
          <div style={{ marginTop: 16 }}>
            <Button type="primary" block size="large">
              拍照识别磅单（Mock）
            </Button>
            <Alert
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              message="识别结果"
              description="毛重 52.300 吨，皮重 32.100 吨，净重 20.200 吨（可编辑）"
            />
          </div>
        ) : null}

        {tab === 'messages' ? (
          <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 16 }}>
            {notifications.slice(0, 4).map((item) => (
              <Card key={item.id} size="small">
                <Typography.Text strong>{item.title}</Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 0 }}>
                  {item.content}
                </Typography.Paragraph>
              </Card>
            ))}
          </Space>
        ) : null}

        {tab === 'exception' ? (
          <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 16 }}>
            <Select
              placeholder="选择目标订单"
              value={exceptionTargetNo}
              onChange={setExceptionTargetNo}
              options={orders.map((item) => ({
                label: `${item.number} / ${item.siteName}`,
                value: item.number,
              }))}
            />
            <Input.TextArea
              rows={3}
              placeholder="请输入异常原因"
              value={exceptionReason}
              onChange={(event) => setExceptionReason(event.target.value)}
            />
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={exceptionAmount}
              onChange={(value) => setExceptionAmount(Number(value ?? 0))}
              addonAfter="元"
            />
            <Button
              type="primary"
              onClick={() => {
                if (!exceptionTargetNo || !exceptionReason.trim()) {
                  message.error('请选择目标订单并填写异常原因')
                  return
                }

                createException({
                  type: 'order-change',
                  targetNo: exceptionTargetNo,
                  reason: exceptionReason,
                  responsibilityParty: '承运商',
                  amount: exceptionAmount,
                })
                message.success('异常已上报，待调度审批')
                setExceptionReason('')
                setExceptionAmount(0)
              }}
            >
              提交异常上报
            </Button>
          </Space>
        ) : null}

        {tab === 'profile' ? (
          <div style={{ marginTop: 16 }}>
            <Typography.Text strong>当前账号：司机-赵强</Typography.Text>
            <Typography.Paragraph>
              资质有效期：2026-08-31
              <br />
              户外模式：已开启
              <br />
              弱网缓存：已启用
            </Typography.Paragraph>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

export default MobileTaskPage
