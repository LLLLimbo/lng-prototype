import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Timeline,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAppStore } from '../store/useAppStore'
import { formatMoney, reconciliationStatusLabel } from '../utils/format'

const statusTypeMap: Record<
  'draft' | 'platform-stamped' | 'double-confirmed' | 'offline-confirmed',
  'pending' | 'processing' | 'success'
> = {
  draft: 'pending',
  'platform-stamped': 'processing',
  'double-confirmed': 'success',
  'offline-confirmed': 'success',
}

function ReconciliationPage() {
  const role = useAppStore((state) => state.currentRole)
  const statements = useAppStore((state) => state.reconciliations)
  const upstreamArchives = useAppStore((state) => state.upstreamArchives)
  const applyStamp = useAppStore((state) => state.applyStamp)
  const uploadUpstreamArchive = useAppStore((state) => state.uploadUpstreamArchive)
  const [activeId, setActiveId] = useState<string>(statements[0]?.id ?? '')
  const [stampFx, setStampFx] = useState(false)
  const [archiveCompany, setArchiveCompany] = useState('')
  const [archivePeriod, setArchivePeriod] = useState(dayjs())
  const [archiveFileName, setArchiveFileName] = useState('')
  const [archiveFileKey, setArchiveFileKey] = useState(0)
  const [archiveNote, setArchiveNote] = useState('')
  const [archiveKeyword, setArchiveKeyword] = useState('')
  const [archivePeriodFilter, setArchivePeriodFilter] = useState('all')
  const [archivePreviewId, setArchivePreviewId] = useState<string>()

  const activeStatement = useMemo(
    () => statements.find((item) => item.id === activeId),
    [activeId, statements],
  )

  const archivePeriodOptions = useMemo(
    () => ['all', ...new Set(upstreamArchives.map((item) => item.period))],
    [upstreamArchives],
  )

  const filteredUpstreamArchives = useMemo(() => {
    const keyword = archiveKeyword.trim().toLowerCase()
    return upstreamArchives.filter((item) => {
      const matchKeyword =
        keyword.length === 0 ||
        item.upstreamCompany.toLowerCase().includes(keyword) ||
        item.fileName.toLowerCase().includes(keyword)
      const matchPeriod = archivePeriodFilter === 'all' || item.period === archivePeriodFilter

      return matchKeyword && matchPeriod
    })
  }, [archiveKeyword, archivePeriodFilter, upstreamArchives])

  const previewArchive = useMemo(
    () => upstreamArchives.find((item) => item.id === archivePreviewId),
    [archivePreviewId, upstreamArchives],
  )

  const triggerStampAnimation = () => {
    setStampFx(true)
    window.setTimeout(() => setStampFx(false), 450)
  }

  const onPlatformStamp = () => {
    if (!activeStatement) {
      return
    }

    applyStamp(activeStatement.id, 'platform', '市场部-王经理')
    triggerStampAnimation()
    message.success('已加盖平台公章')
  }

  const onCustomerStamp = () => {
    if (!activeStatement) {
      return
    }

    applyStamp(activeStatement.id, 'customer', '终端用户-张三')
    triggerStampAnimation()
    message.success('客户签章完成')
  }

  const submitUpstreamArchive = () => {
    if (!archiveCompany.trim()) {
      message.error('请填写上游公司')
      return
    }

    if (!archiveFileName.trim()) {
      message.error('请上传上游对账文件')
      return
    }

    uploadUpstreamArchive({
      upstreamCompany: archiveCompany,
      period: archivePeriod.format('YYYY-MM'),
      fileName: archiveFileName,
      archivedBy: role === 'finance' ? '财务-陈会计' : '市场部-周婷',
      note: archiveNote,
    })

    setArchiveCompany('')
    setArchiveFileName('')
    setArchiveFileKey((value) => value + 1)
    setArchiveNote('')
    message.success('上游对账文件已存档')
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        对账管理
      </Typography.Title>
      <Tabs
        items={[
          {
            key: 'downstream',
            label: '终端对账签章',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={13}>
                  <Card title="对账单列表">
                    <Table
                      rowKey="id"
                      dataSource={statements}
                      pagination={false}
                      columns={[
                        {
                          title: '编号',
                          dataIndex: 'number',
                          render: (value: string, record) => (
                            <Button
                              type="link"
                              style={{ padding: 0 }}
                              onClick={() => setActiveId(record.id)}
                            >
                              {value}
                            </Button>
                          ),
                        },
                        { title: '周期', dataIndex: 'period' },
                        {
                          title: '金额',
                          dataIndex: 'totalAmount',
                          align: 'right',
                          render: (value: number) => formatMoney(value),
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          render: (
                            value:
                              | 'draft'
                              | 'platform-stamped'
                              | 'double-confirmed'
                              | 'offline-confirmed',
                          ) => (
                            <StatusBadge
                              text={reconciliationStatusLabel[value]}
                              type={statusTypeMap[value]}
                            />
                          ),
                        },
                      ]}
                    />
                  </Card>
                </Col>

                <Col xs={24} lg={11}>
                  <Card title="签章面板" className="stamp-panel">
                    {activeStatement ? (
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Typography.Text>
                          <strong>对账单：</strong>
                          {activeStatement.number}
                        </Typography.Text>
                        <Typography.Text>
                          <strong>客户：</strong>
                          {activeStatement.customerName}
                        </Typography.Text>
                        <Typography.Text>
                          <strong>状态：</strong>
                          {reconciliationStatusLabel[activeStatement.status]}
                        </Typography.Text>
                        <Alert
                          type="info"
                          showIcon
                          title="Mock 在线签章"
                          description="点击按钮触发盖章动画并更新状态，签章日志同步记录。"
                        />

                        <div className="stamp-preview">
                          <div className={stampFx ? 'stamp-mark animate' : 'stamp-mark'}>已签章</div>
                          <Typography.Text type="secondary">PDF 预览占位（演示）</Typography.Text>
                        </div>

                        <Space>
                          <Button
                            type="primary"
                            disabled={activeStatement.status !== 'draft'}
                            onClick={onPlatformStamp}
                          >
                            加盖公章
                          </Button>
                          <Button
                            danger={role === 'terminal'}
                            disabled={activeStatement.status !== 'platform-stamped'}
                            onClick={onCustomerStamp}
                          >
                            客户确认签章
                          </Button>
                        </Space>

                        <Divider style={{ margin: '4px 0' }} />

                        {activeStatement.stampLogs.length === 0 ? (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无签章记录" />
                        ) : (
                          <Timeline
                            items={activeStatement.stampLogs.map((log) => ({
                              color: log.actorType === 'platform' ? '#0052CC' : '#36B37E',
                              children: `${
                                log.actorType === 'platform' ? '平台签章' : '客户签章'
                              } - ${log.actor} (${new Date(log.stampedAt).toLocaleString('zh-CN')})`,
                            }))}
                          />
                        )}
                      </Space>
                    ) : (
                      <Empty description="请选择对账单" />
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'upstream',
            label: '上游对账存档',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={9}>
                  <Card title="线下对账文件归档">
                    <Form layout="vertical">
                      <Form.Item label="上游公司" required>
                        <Input
                          value={archiveCompany}
                          placeholder="例如：中海气源公司"
                          onChange={(event) => setArchiveCompany(event.target.value)}
                        />
                      </Form.Item>
                      <Form.Item label="对账周期" required>
                        <DatePicker
                          picker="month"
                          style={{ width: '100%' }}
                          value={archivePeriod}
                          onChange={(value) => setArchivePeriod(value ?? dayjs())}
                        />
                      </Form.Item>
                      <Form.Item label="归档文件上传" required>
                        <Space direction="vertical" style={{ width: '100%' }} size={6}>
                          <input
                            key={archiveFileKey}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              setArchiveFileName(file?.name ?? '')
                            }}
                          />
                          <Typography.Text type="secondary">
                            {archiveFileName
                              ? `已选择文件：${archiveFileName}`
                              : '支持 PDF/JPG/PNG，演示环境仅记录文件名'}
                          </Typography.Text>
                        </Space>
                      </Form.Item>
                      <Form.Item label="备注">
                        <Input.TextArea
                          rows={3}
                          value={archiveNote}
                          onChange={(event) => setArchiveNote(event.target.value)}
                        />
                      </Form.Item>
                      <Button type="primary" onClick={submitUpstreamArchive}>
                        存档上游对账文件
                      </Button>
                    </Form>
                  </Card>
                </Col>

                <Col xs={24} lg={15}>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    title="流程说明"
                    description="上游对账当前为线下执行，系统侧负责上传签字件并留痕存档。"
                  />

                  <Card style={{ marginBottom: 12 }}>
                    <Space wrap>
                      <Input
                        allowClear
                        style={{ width: 260 }}
                        value={archiveKeyword}
                        placeholder="搜索上游公司/文件名"
                        onChange={(event) => setArchiveKeyword(event.target.value)}
                      />
                      <Select
                        style={{ width: 180 }}
                        value={archivePeriodFilter}
                        options={archivePeriodOptions.map((period) => ({
                          value: period,
                          label: period === 'all' ? '全部周期' : period,
                        }))}
                        onChange={setArchivePeriodFilter}
                      />
                      <Button
                        onClick={() => {
                          setArchiveKeyword('')
                          setArchivePeriodFilter('all')
                        }}
                      >
                        重置筛选
                      </Button>
                    </Space>
                  </Card>

                  <Table
                    rowKey="id"
                    dataSource={filteredUpstreamArchives}
                    pagination={{ pageSize: 6 }}
                    columns={[
                      { title: '上游公司', dataIndex: 'upstreamCompany' },
                      { title: '周期', dataIndex: 'period' },
                      { title: '文件', dataIndex: 'fileName' },
                      { title: '归档人', dataIndex: 'archivedBy' },
                      {
                        title: '归档时间',
                        dataIndex: 'archivedAt',
                        render: (value: string) => new Date(value).toLocaleString('zh-CN'),
                      },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        render: () => <StatusBadge text="已存档" type="success" />,
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_, record) => (
                          <Button type="link" onClick={() => setArchivePreviewId(record.id)}>
                            查看详情
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Col>
              </Row>
            ),
          },
        ]}
      />

      <Modal
        open={Boolean(previewArchive)}
        title="上游对账存档详情"
        onCancel={() => setArchivePreviewId(undefined)}
        footer={
          <Button onClick={() => setArchivePreviewId(undefined)} type="primary">
            关闭
          </Button>
        }
      >
        {previewArchive ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="上游公司">
              {previewArchive.upstreamCompany}
            </Descriptions.Item>
            <Descriptions.Item label="对账周期">{previewArchive.period}</Descriptions.Item>
            <Descriptions.Item label="归档文件">{previewArchive.fileName}</Descriptions.Item>
            <Descriptions.Item label="归档人">{previewArchive.archivedBy}</Descriptions.Item>
            <Descriptions.Item label="归档时间">
              {new Date(previewArchive.archivedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="备注">{previewArchive.note ?? '--'}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  )
}

export default ReconciliationPage
