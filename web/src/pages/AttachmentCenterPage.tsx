import { DownloadOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Input, Select, Space, Table, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

type AttachmentBizType = 'all' | 'plan' | 'order' | 'reconciliation' | 'invoice' | 'finance'

interface AttachmentRecord {
  id: string
  bizType: AttachmentBizType
  bizTypeLabel: string
  relatedNo: string
  fileName: string
  createdAt: string
}

function AttachmentCenterPage() {
  const deposits = useAppStore((state) => state.deposits)
  const invoices = useAppStore((state) => state.invoices)
  const reconciliations = useAppStore((state) => state.reconciliations)
  const upstreamArchives = useAppStore((state) => state.upstreamArchives)
  const orders = useAppStore((state) => state.orders)

  const [keyword, setKeyword] = useState('')
  const [bizType, setBizType] = useState<AttachmentBizType>('all')

  const attachmentData = useMemo<AttachmentRecord[]>(() => {
    const depositFiles: AttachmentRecord[] = deposits.map((item) => ({
      id: `dep-${item.id}`,
      bizType: 'finance',
      bizTypeLabel: '资金回单',
      relatedNo: item.id,
      fileName: item.receiptName,
      createdAt: item.paidAt,
    }))

    const invoiceFiles: AttachmentRecord[] = invoices
      .filter((item) => item.attachmentName)
      .map((item) => ({
        id: `inv-${item.id}`,
        bizType: 'invoice',
        bizTypeLabel: '发票附件',
        relatedNo: item.number,
        fileName: item.attachmentName as string,
        createdAt: item.issueDate,
      }))

    const reconciliationFiles: AttachmentRecord[] = reconciliations.map((item) => ({
      id: `rec-${item.id}`,
      bizType: 'reconciliation',
      bizTypeLabel: '对账单',
      relatedNo: item.number,
      fileName: `${item.number}.pdf`,
      createdAt: item.period,
    }))

    const upstreamFiles: AttachmentRecord[] = upstreamArchives.map((item) => ({
      id: `up-${item.id}`,
      bizType: 'reconciliation',
      bizTypeLabel: '上游对账',
      relatedNo: item.period,
      fileName: item.fileName,
      createdAt: item.archivedAt,
    }))

    const orderFiles: AttachmentRecord[] = orders
      .filter((item) => item.supplementDocName)
      .map((item) => ({
        id: `ord-${item.id}`,
        bizType: 'order',
        bizTypeLabel: '订单单据',
        relatedNo: item.number,
        fileName: item.supplementDocName as string,
        createdAt: item.estimatedLoadAt ?? '',
      }))

    return [...depositFiles, ...invoiceFiles, ...reconciliationFiles, ...upstreamFiles, ...orderFiles]
  }, [deposits, invoices, orders, reconciliations, upstreamArchives])

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return attachmentData.filter((item) => {
      if (bizType !== 'all' && item.bizType !== bizType) {
        return false
      }

      if (!normalizedKeyword) {
        return true
      }

      return (
        item.fileName.toLowerCase().includes(normalizedKeyword) ||
        item.relatedNo.toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [attachmentData, bizType, keyword])

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        附件中心
      </Typography.Title>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            style={{ width: 280 }}
            allowClear
            placeholder="搜索文件名/关联单号"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select<AttachmentBizType>
            style={{ width: 180 }}
            value={bizType}
            onChange={setBizType}
            options={[
              { label: '全部类型', value: 'all' },
              { label: '计划附件', value: 'plan' },
              { label: '订单单据', value: 'order' },
              { label: '对账附件', value: 'reconciliation' },
              { label: '发票附件', value: 'invoice' },
              { label: '资金回单', value: 'finance' },
            ]}
          />
        </Space>
      </Card>

      <Card title="附件列表">
        {filteredData.length === 0 ? (
          <Empty description="暂无匹配附件" />
        ) : (
          <Table
            rowKey="id"
            dataSource={filteredData}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '附件类型', dataIndex: 'bizTypeLabel' },
              { title: '关联单据', dataIndex: 'relatedNo' },
              { title: '文件名', dataIndex: 'fileName' },
              { title: '记录时间', dataIndex: 'createdAt' },
              {
                title: '操作',
                key: 'action',
                render: (_, record: AttachmentRecord) => (
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => message.success(`${record.fileName} 下载成功（Mock）`)}
                  >
                    下载
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  )
}

export default AttachmentCenterPage
