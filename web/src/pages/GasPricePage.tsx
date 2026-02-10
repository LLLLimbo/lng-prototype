import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GasPriceStatus } from '../store/useAppStore'
import { useAppStore } from '../store/useAppStore'

interface DraftFormValue {
  sourceCompany: string
  sourceSite: string
  scope: 'public' | 'exclusive'
  customerId?: string
  price: number
  validRange?: [Dayjs, Dayjs]
  taxIncluded: boolean
  note: string
}

const gasPriceStatusMeta: Record<GasPriceStatus, { label: string; color: string }> = {
  draft: {
    label: '草稿',
    color: '#42526E',
  },
  published: {
    label: '已发布',
    color: '#36B37E',
  },
  'off-shelf': {
    label: '已下架',
    color: '#FF5630',
  },
}

function GasPricePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<DraftFormValue>()
  const role = useAppStore((state) => state.currentRole)
  const currentUser = useAppStore((state) => state.currentUser)
  const authUsers = useAppStore((state) => state.authUsers)
  const prices = useAppStore((state) => state.gasPrices)
  const getVisibleGasPrices = useAppStore((state) => state.getVisibleGasPrices)
  const saveGasPriceDraft = useAppStore((state) => state.saveGasPriceDraft)
  const publishGasPrice = useAppStore((state) => state.publishGasPrice)
  const takeDownGasPrice = useAppStore((state) => state.takeDownGasPrice)
  const selectedScope = Form.useWatch('scope', form) ?? 'public'
  const operator = currentUser?.contactName
    ? `市场部-${currentUser.contactName}`
    : '市场部-操作员'

  const terminalCustomerOptions = useMemo(() => {
    const options = new Map<string, string>()
    authUsers.forEach((item) => {
      if (item.role === 'terminal' && item.customerId) {
        options.set(item.customerId, item.organizationName)
      }
    })

    return Array.from(options.entries()).map(([value, label]) => ({ value, label }))
  }, [authUsers])

  const customerNameMap = useMemo(
    () => new Map(terminalCustomerOptions.map((item) => [item.value, item.label])),
    [terminalCustomerOptions],
  )

  const orderedMarketPrices = useMemo(() => {
    const statusRank: Record<GasPriceStatus, number> = {
      draft: 0,
      published: 1,
      'off-shelf': 2,
    }

    return [...prices].sort((left, right) => {
      const statusGap = statusRank[left.status] - statusRank[right.status]
      if (statusGap !== 0) {
        return statusGap
      }

      return right.validFrom.localeCompare(left.validFrom)
    })
  }, [prices])

  const visiblePrices = role === 'market' ? [] : getVisibleGasPrices()

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      const validRange = values.validRange

      if (!validRange) {
        message.error('请选择有效期起止')
        return
      }

      const result = saveGasPriceDraft({
        sourceCompany: values.sourceCompany,
        sourceSite: values.sourceSite,
        scope: values.scope,
        customerId: values.customerId,
        price: Number(values.price ?? 0),
        validFrom: validRange[0].format('YYYY-MM-DD'),
        validTo: validRange[1].format('YYYY-MM-DD'),
        taxIncluded: values.taxIncluded,
        note: values.note ?? '',
      })

      if (!result.success) {
        message.error(result.errors[0] ?? '气价草稿保存失败')
        return
      }

      message.success('气价草稿已保存')
      form.resetFields()
      form.setFieldsValue({
        scope: 'public',
        taxIncluded: true,
      })
    } catch {
      return
    }
  }

  const handlePublish = (priceId: string) => {
    const result = publishGasPrice(priceId, operator)

    if (!result.success) {
      message.error(result.error ?? '气价发布失败')
      return
    }

    message.success('气价已发布')
  }

  const handleTakeDown = (priceId: string) => {
    const result = takeDownGasPrice(priceId, operator)

    if (!result.success) {
      message.error(result.error ?? '气价下架失败')
      return
    }

    message.success('气价已下架')
  }

  if (role === 'market') {
    return (
      <div className="page-section">
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          气价管理（市场部）
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          支持气价草稿录入、发布与下架；发布后终端用户可见并可用于计划申报。
        </Typography.Paragraph>

        <Card
          style={{
            marginBottom: 16,
            borderRadius: 8,
            boxShadow: '0 1px 2px rgba(9,30,66,0.08)',
          }}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              scope: 'public',
              taxIncluded: true,
              note: '',
            }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12} xl={8}>
                <Form.Item
                  label="上游气源公司"
                  name="sourceCompany"
                  rules={[{ required: true, message: '请输入上游气源公司' }]}
                >
                  <Input placeholder="例如：中海气源公司" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item
                  label="气源点"
                  name="sourceSite"
                  rules={[{ required: true, message: '请输入气源点' }]}
                >
                  <Input placeholder="例如：宁波接收站" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item label="适用范围" name="scope" rules={[{ required: true }]}>
                  <Radio.Group
                    options={[
                      { label: '公共价格', value: 'public' },
                      { label: '指定客户', value: 'exclusive' },
                    ]}
                    optionType="button"
                    buttonStyle="solid"
                  />
                </Form.Item>
              </Col>
              {selectedScope === 'exclusive' ? (
                <Col xs={24} md={12} xl={8}>
                  <Form.Item
                    label="指定客户"
                    name="customerId"
                    rules={[{ required: true, message: '请选择指定客户' }]}
                  >
                    <Select
                      placeholder="请选择客户"
                      options={terminalCustomerOptions}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Col>
              ) : null}
              <Col xs={24} md={12} xl={8}>
                <Form.Item
                  label="单价（元/吨）"
                  name="price"
                  rules={[{ required: true, message: '请输入单价' }]}
                >
                  <InputNumber
                    min={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="请输入单价"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item
                  label="有效期"
                  name="validRange"
                  rules={[{ required: true, message: '请选择有效期起止' }]}
                >
                  <DatePicker.RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item label="是否含税" name="taxIncluded" valuePropName="checked">
                  <Switch checkedChildren="含税" unCheckedChildren="税外" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="备注" name="note">
                  <Input.TextArea rows={3} placeholder="可填写价格说明、优惠条件等" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
          <Space size={8}>
            <Button type="primary" size="large" onClick={handleSaveDraft}>
              保存草稿
            </Button>
          </Space>
        </Card>

        {orderedMarketPrices.length === 0 ? (
          <Card>
            <Empty description="暂无气价草稿与发布记录" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {orderedMarketPrices.map((price) => {
              const statusMeta = gasPriceStatusMeta[price.status]
              const customerName =
                price.scope === 'exclusive' && price.customerId
                  ? customerNameMap.get(price.customerId) ?? price.customerId
                  : '全部终端用户'
              const canPublish = price.status !== 'published'

              return (
                <Col key={price.id} xs={24} md={12} xl={8}>
                  <Card
                    className="price-card"
                    style={{
                      borderRadius: 8,
                      boxShadow: '0 1px 2px rgba(9,30,66,0.08)',
                    }}
                  >
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text strong>{price.sourceCompany}</Typography.Text>
                        <Tag color={statusMeta.color} style={{ borderRadius: 9999 }}>
                          {statusMeta.label}
                        </Tag>
                      </Space>
                      <Typography.Title level={2} style={{ margin: 0 }}>
                        ¥{price.price.toLocaleString('zh-CN')}
                        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                          /吨
                        </Typography.Text>
                      </Typography.Title>
                      <Typography.Text type="secondary">气源点：{price.sourceSite}</Typography.Text>
                      <Typography.Text type="secondary">
                        有效期：{price.validFrom} ~ {price.validTo}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        适用对象：{customerName}
                      </Typography.Text>
                      <Typography.Text>
                        {price.taxIncluded ? '含税价' : '税外价'} · {price.note || '无备注'}
                      </Typography.Text>
                      <Space size={8}>
                        {canPublish ? (
                          <Button type="primary" onClick={() => handlePublish(price.id)}>
                            {price.status === 'off-shelf' ? '重新发布' : '发布'}
                          </Button>
                        ) : null}
                        {price.status === 'published' ? (
                          <Button danger onClick={() => handleTakeDown(price.id)}>
                            下架
                          </Button>
                        ) : null}
                      </Space>
                    </Space>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </div>
    )
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        气价列表
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        终端用户仅展示可见且已发布价格（公共价 + 一户一价）；一户一价默认覆盖公共价进行计划申报。
      </Typography.Paragraph>

      {visiblePrices.length === 0 ? (
        <Card>
          <Empty description="当前暂无可见且已发布气价" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {visiblePrices.map((price) => (
            <Col key={price.id} xs={24} md={12} xl={8}>
              <Card className="price-card" hoverable>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Typography.Text strong>{price.sourceCompany}</Typography.Text>
                    {price.scope === 'exclusive' ? (
                      <Tag color="#0052CC" style={{ borderRadius: 9999 }}>
                        专属价格
                      </Tag>
                    ) : null}
                  </Space>
                  <Typography.Title level={2} style={{ margin: 0 }}>
                    ¥{price.price.toLocaleString('zh-CN')}
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                      /吨
                    </Typography.Text>
                  </Typography.Title>
                  <Typography.Text type="secondary">气源点：{price.sourceSite}</Typography.Text>
                  <Typography.Text type="secondary">
                    有效期：{price.validFrom} ~ {price.validTo}
                  </Typography.Text>
                  <Typography.Text>{price.note}</Typography.Text>
                  {role === 'terminal' ? (
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate(`/app/plans/new?priceId=${price.id}`)}
                    >
                      申报计划
                    </Button>
                  ) : null}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default GasPricePage
