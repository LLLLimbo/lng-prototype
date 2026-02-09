import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore } from '../store/useAppStore'
import { formatMoney } from '../utils/format'

function InvoicePage() {
  const role = useAppStore((state) => state.currentRole)
  const invoices = useAppStore((state) => state.invoices)
  const issueInvoice = useAppStore((state) => state.issueInvoice)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'issued'>('all')

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((item) => {
        const matchKeyword =
          item.number.includes(keyword) ||
          item.customerName.includes(keyword) ||
          item.statementNo.includes(keyword)
        const matchStatus = statusFilter === 'all' || item.status === statusFilter

        return matchKeyword && matchStatus
      }),
    [invoices, keyword, statusFilter],
  )

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        发票中心
      </Typography.Title>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            allowClear
            style={{ width: 260 }}
            placeholder="搜索发票号/客户/对账单"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(value: 'all' | 'pending' | 'issued') => setStatusFilter(value)}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '待开票', value: 'pending' },
              { label: '已开票', value: 'issued' },
            ]}
          />
          <Button onClick={() => message.info('演示环境：默认导出当前筛选结果')}>导出清单</Button>
        </Space>
      </Card>

      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message="开票逻辑说明"
        description="仅已对账确认订单进入开票队列；此处模拟财务开票与终端下载，不涉及真实税控系统。"
      />

      <Table
        rowKey="id"
        dataSource={filteredInvoices}
        pagination={false}
        columns={[
          { title: '发票号', dataIndex: 'number' },
          { title: '客户', dataIndex: 'customerName' },
          {
            title: '金额',
            dataIndex: 'amount',
            align: 'right',
            render: (value: number) => formatMoney(value),
          },
          { title: '开票日期', dataIndex: 'issueDate' },
          { title: '关联对账单', dataIndex: 'statementNo' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: 'pending' | 'issued') => (
              <StatusBadge
                text={value === 'pending' ? '待开票' : '已开票'}
                type={value === 'pending' ? 'pending' : 'success'}
              />
            ),
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Space>
                {role === 'finance' && record.status === 'pending' ? (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      issueInvoice(record.id, '财务-陈会计')
                      message.success('已完成开票并归档')
                    }}
                  >
                    财务开票
                  </Button>
                ) : null}
                <Button
                  size="small"
                  onClick={() =>
                    message.success(`${record.number}.pdf 已生成下载（Mock）`)
                  }
                >
                  下载
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}

export default InvoicePage
