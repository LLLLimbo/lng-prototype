import { DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, DatePicker, Descriptions, Drawer, Space, Table, Typography, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { planStatusLabel } from '../utils/format'
import { useAppStore } from '../store/useAppStore'

function DailyPlanReportPage() {
  const reports = useAppStore((state) => state.dailyPlanReports)
  const generateDailyPlanReport = useAppStore((state) => state.generateDailyPlanReport)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs('2026-02-09'))
  const [activeReportId, setActiveReportId] = useState<string>()

  const activeReport = useMemo(
    () => reports.find((item) => item.id === activeReportId),
    [activeReportId, reports],
  )

  const generateReport = () => {
    const reportDate = selectedDate.format('YYYY-MM-DD')
    const reportId = generateDailyPlanReport({
      reportDate,
      generatedBy: '市场部-值班员',
    })

    setActiveReportId(reportId)
    message.success(`${reportDate} 计划表已生成`)
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        当日申报计划表
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="22点任务说明"
        description="原型中支持按日期手工生成“当日申报计划表”，用于模拟 22 点定时任务产出。"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <DatePicker value={selectedDate} onChange={(value) => setSelectedDate(value ?? dayjs())} />
          <Button type="primary" icon={<PlusOutlined />} onClick={generateReport}>
            生成计划表
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => message.success('计划表已导出（Mock）')}
          >
            导出 Excel/PDF
          </Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        dataSource={reports}
        pagination={false}
        columns={[
          {
            title: '报表日期',
            dataIndex: 'reportDate',
            render: (value: string, record) => (
              <Button type="link" style={{ padding: 0 }} onClick={() => setActiveReportId(record.id)}>
                {value}
              </Button>
            ),
          },
          { title: '计划数', key: 'plans', render: (_, record) => `${record.plans.length} 条` },
          { title: '生成人', dataIndex: 'generatedBy' },
          {
            title: '生成时间',
            dataIndex: 'generatedAt',
            render: (value: string) => new Date(value).toLocaleString('zh-CN'),
          },
        ]}
      />

      <Drawer
        title={`计划表详情${activeReport ? ` - ${activeReport.reportDate}` : ''}`}
        width={860}
        open={Boolean(activeReport)}
        onClose={() => setActiveReportId(undefined)}
      >
        {activeReport ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="报表日期">{activeReport.reportDate}</Descriptions.Item>
              <Descriptions.Item label="生成人">{activeReport.generatedBy}</Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {new Date(activeReport.generatedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="计划总数">{activeReport.plans.length} 条</Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="planId"
              dataSource={activeReport.plans}
              pagination={false}
              columns={[
                { title: '计划编号', dataIndex: 'number' },
                { title: '客户', dataIndex: 'customerName' },
                { title: '站点', dataIndex: 'siteName' },
                {
                  title: '计划量(吨)',
                  dataIndex: 'plannedVolume',
                  align: 'right',
                  render: (value: number) => value.toFixed(3),
                },
                { title: '运输方式', dataIndex: 'transportMode' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: keyof typeof planStatusLabel) => (
                    <StatusBadge text={planStatusLabel[value]} type="processing" />
                  ),
                },
                {
                  title: '提交时间',
                  dataIndex: 'submittedAt',
                  render: (value: string) => new Date(value).toLocaleString('zh-CN'),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default DailyPlanReportPage
