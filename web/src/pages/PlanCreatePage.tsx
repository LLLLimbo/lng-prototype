import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FundWaterLevel from '../components/FundWaterLevel'
import MoneyDisplay from '../components/MoneyDisplay'
import { useAppStore } from '../store/useAppStore'

interface DraftForm {
  priceId?: string
  siteId?: string
  planDate?: string
  timeWindow?: string
  plannedVolume: number
  transportMode: 'upstream' | 'self' | 'carrier'
  carrierId?: string
  vehicleId?: string
  driverId?: string
  escortId?: string
  freightFee: number
  paymentMethod: 'prepaid' | 'postpaid'
  weighDiffRule: 'load' | 'unload' | 'delta'
  agreementChecked: boolean
}

const initialForm: DraftForm = {
  planDate: dayjs().format('YYYY-MM-DD'),
  timeWindow: '08:00-12:00',
  plannedVolume: 20,
  transportMode: 'upstream',
  freightFee: 0,
  paymentMethod: 'prepaid',
  weighDiffRule: 'load',
  agreementChecked: false,
}

const carrierOptions = [
  { label: '苏南承运联盟', value: 'carrier-01' },
  { label: '华东能源物流', value: 'carrier-02' },
]

const timeWindowOptions = [
  { label: '00:00-06:00', value: '00:00-06:00' },
  { label: '06:00-12:00', value: '06:00-12:00' },
  { label: '08:00-12:00', value: '08:00-12:00' },
  { label: '12:00-18:00', value: '12:00-18:00' },
  { label: '13:00-18:00', value: '13:00-18:00' },
  { label: '18:00-24:00', value: '18:00-24:00' },
]

function PlanCreatePage() {
  const [searchParams] = useSearchParams()
  const preselectPriceId = searchParams.get('priceId') ?? undefined
  const navigate = useNavigate()
  const createPlan = useAppStore((state) => state.createPlan)
  const account = useAppStore((state) => state.account)
  const sites = useAppStore((state) => state.sites)
  const prices = useAppStore((state) => state.gasPrices)
  const vehicles = useAppStore((state) => state.vehicles)
  const personnel = useAppStore((state) => state.personnel)
  const activeCustomerId = useAppStore((state) => state.activeCustomerId)
  const [currentStep, setCurrentStep] = useState(0)
  const [formValue, setFormValue] = useState<DraftForm>({
    ...initialForm,
    priceId: preselectPriceId,
  })
  const [errors, setErrors] = useState<string[]>([])

  const visiblePrices = useMemo(
    () =>
      prices.filter(
        (item) => item.scope === 'public' || item.customerId === activeCustomerId,
      ),
    [activeCustomerId, prices],
  )

  const selectedPrice = visiblePrices.find((item) => item.id === formValue.priceId)
  const selectedVehicle = vehicles.find((item) => item.id === formValue.vehicleId)
  const selectedSite = sites.find((item) => item.id === formValue.siteId)
  const estimatedAmount = (selectedPrice?.price ?? 0) * formValue.plannedVolume
  const totalAmount = estimatedAmount + formValue.freightFee
  const isBalanceInsufficient = totalAmount > account.available

  const stepItems = [
    { title: '基础信息' },
    { title: '履约运输' },
    { title: '费用确认' },
    { title: '提交确认' },
  ]

  const stepValidations: Array<() => string[]> = [
    () => {
      const validationErrors: string[] = []

      if (!formValue.priceId) {
        validationErrors.push('请选择气价')
      }

      if (!formValue.siteId) {
        validationErrors.push('请选择用气站点')
      }

      if (!formValue.planDate) {
        validationErrors.push('请选择计划日期')
      }

      if (!formValue.timeWindow) {
        validationErrors.push('请选择时间窗')
      }

      if (formValue.plannedVolume <= 0) {
        validationErrors.push('计划量必须大于 0')
      }

      return validationErrors
    },
    () => {
      if (formValue.transportMode === 'upstream') {
        return []
      }

      const validationErrors: string[] = []

      if (formValue.transportMode === 'carrier' && !formValue.carrierId) {
        validationErrors.push('承运商配送需选择承运商')
      }

      if (!formValue.vehicleId) {
        validationErrors.push('请选择运输车辆')
      }

      if (!formValue.driverId) {
        validationErrors.push('请选择司机')
      }

      if (!formValue.escortId) {
        validationErrors.push('请选择押运员')
      }

      return validationErrors
    },
    () => (isBalanceInsufficient ? ['可用余额不足，请先进行预存'] : []),
    () => (formValue.agreementChecked ? [] : ['提交前必须勾选确认条款']),
  ]

  const goNext = () => {
    const validationErrors = stepValidations[currentStep]()

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    setCurrentStep((prev) => Math.min(prev + 1, stepItems.length - 1))
  }

  const goPrev = () => {
    setErrors([])
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const submit = () => {
    const result = createPlan({
      siteId: formValue.siteId ?? '',
      priceId: formValue.priceId ?? '',
      planDate: formValue.planDate,
      timeWindow: formValue.timeWindow,
      plannedVolume: formValue.plannedVolume,
      freightFee: formValue.freightFee,
      transportMode: formValue.transportMode,
      paymentMethod: formValue.paymentMethod,
      weighDiffRule: formValue.weighDiffRule,
      agreementChecked: formValue.agreementChecked,
      carrierId: formValue.carrierId,
      vehicleId: formValue.vehicleId,
      driverId: formValue.driverId,
      escortId: formValue.escortId,
    })

    if (!result.success) {
      setErrors(result.errors)
      return
    }

    message.success('计划已提交，资金已锁定')
    navigate('/app/plans/list')
  }

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text strong>选择气价</Typography.Text>
          <Row gutter={[12, 12]}>
            {visiblePrices.map((price) => (
              <Col key={price.id} xs={24} md={12}>
                <Card
                  className={
                    formValue.priceId === price.id ? 'selectable-card selected' : 'selectable-card'
                  }
                  onClick={() => setFormValue((prev) => ({ ...prev, priceId: price.id }))}
                >
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <Typography.Text strong>{price.sourceCompany}</Typography.Text>
                    <Typography.Text type="secondary">{price.sourceSite}</Typography.Text>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      ¥{price.price.toLocaleString('zh-CN')}/吨
                    </Typography.Title>
                    {price.scope === 'exclusive' ? (
                      <Typography.Text type="success">一户一价（优先覆盖公共价）</Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">公共价</Typography.Text>
                    )}
                    <Typography.Text type="secondary">
                      {price.validFrom} ~ {price.validTo}
                    </Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
          <Form layout="vertical">
            <Form.Item label="用气站点">
              <Select
                placeholder="请选择站点"
                value={formValue.siteId}
                options={sites.map((site) => ({
                  label:
                    site.status === 'maintenance'
                      ? `${site.name}（维护中）`
                      : site.status === 'disabled'
                        ? `${site.name}（停用）`
                        : site.name,
                  value: site.id,
                  disabled: site.status !== 'enabled',
                }))}
                onChange={(value) => setFormValue((prev) => ({ ...prev, siteId: value }))}
              />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="计划日期">
                  <DatePicker
                    style={{ width: '100%' }}
                    value={formValue.planDate ? dayjs(formValue.planDate) : null}
                    onChange={(value) =>
                      setFormValue((prev) => ({
                        ...prev,
                        planDate: value ? value.format('YYYY-MM-DD') : undefined,
                      }))
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="时间窗">
                  <Select
                    value={formValue.timeWindow}
                    options={timeWindowOptions}
                    onChange={(value) => setFormValue((prev) => ({ ...prev, timeWindow: value }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="计划量（吨）">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={3}
                value={formValue.plannedVolume}
                onChange={(value) =>
                  setFormValue((prev) => ({ ...prev, plannedVolume: Number(value ?? 0) }))
                }
              />
            </Form.Item>
          </Form>
          <Typography.Text>
            预计货款：
            <MoneyDisplay value={estimatedAmount} />
          </Typography.Text>
        </Space>
      )
    }

    if (currentStep === 1) {
      return (
        <Form layout="vertical">
          <Form.Item label="运输方式">
            <Radio.Group
              value={formValue.transportMode}
              onChange={(event) =>
                setFormValue((prev) => ({
                  ...prev,
                  transportMode: event.target.value,
                }))
              }
            >
              <Radio.Button value="upstream">上游配送</Radio.Button>
              <Radio.Button value="self">用户自提</Radio.Button>
              <Radio.Button value="carrier">承运商配送</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {formValue.transportMode !== 'upstream' ? (
            <Row gutter={[16, 8]}>
              {formValue.transportMode === 'carrier' ? (
                <Col xs={24} md={12}>
                  <Form.Item label="承运商">
                    <Select
                      placeholder="请选择承运商"
                      value={formValue.carrierId}
                      options={carrierOptions}
                      onChange={(value) =>
                        setFormValue((prev) => ({ ...prev, carrierId: value }))
                      }
                    />
                  </Form.Item>
                </Col>
              ) : null}
              <Col xs={24} md={12}>
                <Form.Item label="车辆">
                  <Select
                    placeholder="请选择车辆"
                    value={formValue.vehicleId}
                    options={vehicles.map((vehicle) => ({
                      label: vehicle.valid
                        ? `${vehicle.plateNo}（载重${vehicle.capacity}吨）`
                        : `${vehicle.plateNo}（资质过期）`,
                      value: vehicle.id,
                    }))}
                    onChange={(value) =>
                      setFormValue((prev) => ({ ...prev, vehicleId: value }))
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="司机">
                  <Select
                    placeholder="请选择司机"
                    value={formValue.driverId}
                    options={personnel
                      .filter((item) => item.role === 'driver')
                      .map((person) => ({
                        label: person.valid
                          ? person.name
                          : `${person.name}（资质过期）`,
                        value: person.id,
                      }))}
                    onChange={(value) =>
                      setFormValue((prev) => ({ ...prev, driverId: value }))
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="押运员">
                  <Select
                    placeholder="请选择押运员"
                    value={formValue.escortId}
                    options={personnel
                      .filter((item) => item.role === 'escort')
                      .map((person) => ({
                        label: person.valid
                          ? person.name
                          : `${person.name}（资质过期）`,
                        value: person.id,
                      }))}
                    onChange={(value) =>
                      setFormValue((prev) => ({ ...prev, escortId: value }))
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {selectedVehicle && selectedVehicle.capacity < formValue.plannedVolume ? (
            <Alert
              type="warning"
              showIcon
              message="当前计划量超过车辆载重，请确认拆单或更换车辆"
            />
          ) : null}
        </Form>
      )
    }

    if (currentStep === 2) {
      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card>
                <Space direction="vertical" size={4}>
                  <Typography.Text type="secondary">预计货款</Typography.Text>
                  <MoneyDisplay value={estimatedAmount} size="large" />
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card>
                <Form layout="vertical">
                  <Form.Item label="承运费（元）">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      value={formValue.freightFee}
                      onChange={(value) =>
                        setFormValue((prev) => ({ ...prev, freightFee: Number(value ?? 0) }))
                      }
                    />
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>

          <Card>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="支付方式">
                    <Radio.Group
                      value={formValue.paymentMethod}
                      onChange={(event) =>
                        setFormValue((prev) => ({
                          ...prev,
                          paymentMethod: event.target.value,
                        }))
                      }
                    >
                      <Radio value="prepaid">预付</Radio>
                      <Radio value="postpaid">后付</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="磅差处理原则">
                    <Radio.Group
                      value={formValue.weighDiffRule}
                      onChange={(event) =>
                        setFormValue((prev) => ({
                          ...prev,
                          weighDiffRule: event.target.value,
                        }))
                      }
                    >
                      <Space direction="vertical">
                        <Radio value="load">按装车量结算</Radio>
                        <Radio value="unload">按卸车量结算</Radio>
                        <Radio value="delta">差额多退少补</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <FundWaterLevel account={account} />
          {isBalanceInsufficient ? (
            <Alert
              type="error"
              showIcon
              message="余额不足，请先充值"
              description={`需要 ¥${totalAmount.toLocaleString('zh-CN')}，当前可用 ¥${account.available.toLocaleString('zh-CN')}`}
            />
          ) : null}
        </Space>
      )
    }

    return (
      <Card>
        <Space direction="vertical" size={8}>
          <Typography.Text>气价：{selectedPrice?.sourceCompany ?? '-'}</Typography.Text>
          <Typography.Text>站点：{selectedSite?.name ?? '-'}</Typography.Text>
          <Typography.Text>计划日期：{formValue.planDate ?? '-'}</Typography.Text>
          <Typography.Text>时间窗：{formValue.timeWindow ?? '-'}</Typography.Text>
          <Typography.Text>计划量：{formValue.plannedVolume.toFixed(3)} 吨</Typography.Text>
          <Typography.Text>运输方式：{formValue.transportMode}</Typography.Text>
          <Typography.Text>预计总金额：</Typography.Text>
          <MoneyDisplay value={totalAmount} size="large" danger={isBalanceInsufficient} />
          <Checkbox
            checked={formValue.agreementChecked}
            onChange={(event) =>
              setFormValue((prev) => ({
                ...prev,
                agreementChecked: event.target.checked,
              }))
            }
          >
            我已确认货款、承运费及磅差处理原则
          </Checkbox>
        </Space>
      </Card>
    )
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        新建用气计划
      </Typography.Title>
      <Steps current={currentStep} items={stepItems} style={{ marginBottom: 20 }} />

      {errors.length > 0 ? (
        <Alert
          style={{ marginBottom: 16 }}
          message="请先处理以下问题"
          type="error"
          showIcon
          description={
            <ul style={{ paddingInlineStart: 16, margin: 0 }}>
              {errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card>{renderStepContent()}</Card>

      <Space style={{ marginTop: 16 }}>
        <Button onClick={goPrev} disabled={currentStep === 0}>
          上一步
        </Button>
        {currentStep < stepItems.length - 1 ? (
          <Button type="primary" onClick={goNext}>
            下一步
          </Button>
        ) : (
          <Button type="primary" onClick={submit}>
            提交计划
          </Button>
        )}
      </Space>
    </div>
  )
}

export default PlanCreatePage
