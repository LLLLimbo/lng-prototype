import { FileSearchOutlined, InboxOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { type Order, useAppStore } from '../store/useAppStore'
import { orderStatusLabel } from '../utils/format'

interface SupplementFormValue {
  upstreamOrderNo: string
  loadSiteName: string
  estimatedLoadAt: string
  supplementDocName?: string
}

function OrderManagementPage() {
  const orders = useAppStore((state) => state.orders)
  const submitOrderSupplement = useAppStore((state) => state.submitOrderSupplement)
  const reviewOrderSupplement = useAppStore((state) => state.reviewOrderSupplement)

  const [supplementForm] = Form.useForm<SupplementFormValue>()
  const [editingOrderId, setEditingOrderId] = useState<string>()
  const [activeOrderId, setActiveOrderId] = useState<string>()

  const supplementQueue = useMemo(
    () => orders.filter((item) => item.supplementStatus === 'pending' || item.status === 'pending-supplement'),
    [orders],
  )

  const orderForEdit = useMemo(
    () => orders.find((item) => item.id === editingOrderId),
    [editingOrderId, orders],
  )
  const activeOrder = useMemo(
    () => orders.find((item) => item.id === activeOrderId),
    [activeOrderId, orders],
  )

  const openSupplementDrawer = (order: Order) => {
    setEditingOrderId(order.id)
    supplementForm.setFieldsValue({
      upstreamOrderNo: order.upstreamOrderNo ?? '',
      loadSiteName: order.loadSiteName ?? '',
      estimatedLoadAt: order.estimatedLoadAt ?? '',
      supplementDocName: order.supplementDocName ?? '',
    })
  }

  const submitSupplement = async () => {
    if (!editingOrderId) {
      return
    }

    const values = await supplementForm.validateFields()
    submitOrderSupplement({
      orderId: editingOrderId,
      upstreamOrderNo: values.upstreamOrderNo,
      loadSiteName: values.loadSiteName,
      estimatedLoadAt: values.estimatedLoadAt,
      supplementDocName: values.supplementDocName,
    })

    message.success('补录信息已提交，待审核')
    setEditingOrderId(undefined)
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        订单补录与审核
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="流程说明"
        description="支持人工补录、OCR占位录入、补录审核通过后进入履约阶段。"
      />

      <Tabs
        items={[
          {
            key: 'order-list',
            label: '订单补录',
            children: (
              <Card title="订单列表">
                <Table
                  rowKey="id"
                  dataSource={orders}
                  pagination={false}
                  columns={[
                    {
                      title: '订单编号',
                      dataIndex: 'number',
                      render: (value: string, record: Order) => (
                        <Button type="link" style={{ padding: 0 }} onClick={() => setActiveOrderId(record.id)}>
                          {value}
                        </Button>
                      ),
                    },
                    { title: '客户', dataIndex: 'customerName' },
                    { title: '站点', dataIndex: 'siteName' },
                    {
                      title: '订单状态',
                      dataIndex: 'status',
                      render: (value: Order['status']) => (
                        <StatusBadge text={orderStatusLabel[value]} type="processing" />
                      ),
                    },
                    {
                      title: '补录状态',
                      dataIndex: 'supplementStatus',
                      render: (value?: Order['supplementStatus']) => {
                        if (value === 'approved') {
                          return <StatusBadge text="已通过" type="success" />
                        }
                        if (value === 'rejected') {
                          return <StatusBadge text="已驳回" type="danger" />
                        }
                        if (value === 'pending') {
                          return <StatusBadge text="待审核" type="pending" />
                        }

                        return <Typography.Text type="secondary">--</Typography.Text>
                      },
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: Order) => (
                        <Button size="small" type="primary" onClick={() => openSupplementDrawer(record)}>
                          补录订单
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'review',
            label: '补录审核',
            children: (
              <Card title="待审核补录队列">
                <Table
                  rowKey="id"
                  dataSource={supplementQueue}
                  pagination={false}
                  locale={{ emptyText: '暂无待审核补录订单' }}
                  columns={[
                    { title: '订单编号', dataIndex: 'number' },
                    { title: '上游订单号', dataIndex: 'upstreamOrderNo', render: (value?: string) => value ?? '--' },
                    { title: '装车点', dataIndex: 'loadSiteName', render: (value?: string) => value ?? '--' },
                    { title: '预计装车时间', dataIndex: 'estimatedLoadAt', render: (value?: string) => value ?? '--' },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: Order) => (
                        <Space>
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => {
                              reviewOrderSupplement({
                                orderId: record.id,
                                action: 'approve',
                                reviewer: '调度中心-王主管',
                              })
                              message.success('补录审核已通过，订单进入备货')
                            }}
                          >
                            通过
                          </Button>
                          <Button
                            size="small"
                            danger
                            onClick={() => {
                              reviewOrderSupplement({
                                orderId: record.id,
                                action: 'reject',
                                reviewer: '调度中心-王主管',
                                reason: '上游订单号不完整',
                              })
                              message.warning('补录已驳回，待重新提交')
                            }}
                          >
                            驳回
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'ocr',
            label: 'OCR/批量导入',
            children: (
              <Card title="导入能力占位">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message="OCR 识别"
                    description="上传磅单图片后返回毛重/皮重/净重等字段，支持人工修正后保存。"
                  />
                  <Button icon={<FileSearchOutlined />} onClick={() => message.success('OCR识别已完成（Mock）')}>
                    上传磅单并识别
                  </Button>
                  <Button icon={<InboxOutlined />} onClick={() => message.success('批量模板已导入（Mock）')}>
                    批量导入 CSV/Excel
                  </Button>
                </Space>
              </Card>
            ),
          },
        ]}
      />

      <Drawer
        title="订单补录"
        width={520}
        open={Boolean(orderForEdit)}
        onClose={() => setEditingOrderId(undefined)}
      >
        {orderForEdit ? (
          <Form form={supplementForm} layout="vertical">
            <Typography.Paragraph type="secondary">
              订单：{orderForEdit.number} / {orderForEdit.customerName}
            </Typography.Paragraph>
            <Form.Item
              label="上游订单号"
              name="upstreamOrderNo"
              rules={[{ required: true, message: '请输入上游订单号' }]}
            >
              <Input placeholder="例如：UP-20260210-001" />
            </Form.Item>
            <Form.Item
              label="装车点"
              name="loadSiteName"
              rules={[{ required: true, message: '请输入装车点' }]}
            >
              <Input placeholder="例如：宁波接收站" />
            </Form.Item>
            <Form.Item
              label="预计装车时间"
              name="estimatedLoadAt"
              rules={[{ required: true, message: '请输入预计装车时间' }]}
            >
              <Input placeholder="例如：2026-02-10 13:30" />
            </Form.Item>
            <Form.Item label="初始单据附件" name="supplementDocName">
              <Input placeholder="例如：upstream-outbound-0210.pdf" />
            </Form.Item>
            <Space>
              <Button onClick={() => setEditingOrderId(undefined)}>取消</Button>
              <Button type="primary" onClick={submitSupplement}>
                提交补录
              </Button>
            </Space>
          </Form>
        ) : null}
      </Drawer>

      <Drawer
        title="订单详情"
        width={520}
        open={Boolean(activeOrder)}
        onClose={() => setActiveOrderId(undefined)}
      >
        {activeOrder ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text>
              <strong>订单编号：</strong>
              {activeOrder.number}
            </Typography.Text>
            <Typography.Text>
              <strong>上游订单号：</strong>
              {activeOrder.upstreamOrderNo ?? '--'}
            </Typography.Text>
            <Typography.Text>
              <strong>装车点：</strong>
              {activeOrder.loadSiteName ?? '--'}
            </Typography.Text>
            <Typography.Text>
              <strong>预计装车时间：</strong>
              {activeOrder.estimatedLoadAt ?? '--'}
            </Typography.Text>
            <Typography.Text>
              <strong>补录附件：</strong>
              {activeOrder.supplementDocName ?? '--'}
            </Typography.Text>
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default OrderManagementPage
