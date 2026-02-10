import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd'
import { useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { type Person, type Site, useAppStore, type Vehicle } from '../store/useAppStore'

interface SiteFormValue {
  name: string
  type: Site['type']
  status: Site['status']
  maintenancePolicy?: Site['maintenancePolicy']
  maintenanceWindow?: string
}

interface VehicleFormValue {
  plateNo: string
  capacity: number
  certExpiry: string
  valid: boolean
}

interface PersonFormValue {
  name: string
  role: Person['role']
  certExpiry: string
  valid: boolean
}

const siteTypeLabelMap: Record<Site['type'], string> = {
  load: '装车点',
  unload: '卸气点',
  use: '用气点',
}

const siteStatusLabelMap: Record<Site['status'], string> = {
  enabled: '启用',
  maintenance: '维护中',
  disabled: '已停用',
}

const siteStatusBadgeTypeMap: Record<Site['status'], 'success' | 'warning' | 'neutral'> = {
  enabled: 'success',
  maintenance: 'warning',
  disabled: 'neutral',
}

const personRoleLabelMap: Record<Person['role'], string> = {
  driver: '司机',
  escort: '押运员',
}

function BasicInfoPage() {
  const sites = useAppStore((state) => state.sites)
  const vehicles = useAppStore((state) => state.vehicles)
  const personnel = useAppStore((state) => state.personnel)
  const addSite = useAppStore((state) => state.addSite)
  const updateSite = useAppStore((state) => state.updateSite)
  const disableSite = useAppStore((state) => state.disableSite)
  const addVehicle = useAppStore((state) => state.addVehicle)
  const updateVehicle = useAppStore((state) => state.updateVehicle)
  const disableVehicle = useAppStore((state) => state.disableVehicle)
  const addPerson = useAppStore((state) => state.addPerson)
  const updatePerson = useAppStore((state) => state.updatePerson)
  const disablePerson = useAppStore((state) => state.disablePerson)

  const [siteForm] = Form.useForm<SiteFormValue>()
  const [vehicleForm] = Form.useForm<VehicleFormValue>()
  const [personForm] = Form.useForm<PersonFormValue>()

  const [siteModalOpen, setSiteModalOpen] = useState(false)
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false)
  const [personModalOpen, setPersonModalOpen] = useState(false)

  const [editingSiteId, setEditingSiteId] = useState<string>()
  const [editingVehicleId, setEditingVehicleId] = useState<string>()
  const [editingPersonId, setEditingPersonId] = useState<string>()

  const openCreateSiteModal = () => {
    setEditingSiteId(undefined)
    siteForm.setFieldsValue({
      name: '',
      type: 'unload',
      status: 'enabled',
      maintenancePolicy: undefined,
      maintenanceWindow: undefined,
    })
    setSiteModalOpen(true)
  }

  const openEditSiteModal = (site: Site) => {
    setEditingSiteId(site.id)
    siteForm.setFieldsValue({
      name: site.name,
      type: site.type,
      status: site.status,
      maintenancePolicy: site.maintenancePolicy,
      maintenanceWindow: site.maintenanceWindow,
    })
    setSiteModalOpen(true)
  }

  const saveSite = async () => {
    const values = await siteForm.validateFields()

    if (editingSiteId) {
      updateSite({
        siteId: editingSiteId,
        patch: values,
      })
      message.success('站点信息已更新')
    } else {
      addSite(values)
      message.success('站点已新增')
    }

    setSiteModalOpen(false)
  }

  const openCreateVehicleModal = () => {
    setEditingVehicleId(undefined)
    vehicleForm.setFieldsValue({
      plateNo: '',
      capacity: 30,
      certExpiry: '',
      valid: true,
    })
    setVehicleModalOpen(true)
  }

  const openEditVehicleModal = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id)
    vehicleForm.setFieldsValue({
      plateNo: vehicle.plateNo,
      capacity: vehicle.capacity,
      certExpiry: vehicle.certExpiry,
      valid: vehicle.valid,
    })
    setVehicleModalOpen(true)
  }

  const saveVehicle = async () => {
    const values = await vehicleForm.validateFields()

    if (editingVehicleId) {
      updateVehicle({
        vehicleId: editingVehicleId,
        patch: values,
      })
      message.success('车辆信息已更新')
    } else {
      addVehicle(values)
      message.success('车辆已新增')
    }

    setVehicleModalOpen(false)
  }

  const openCreatePersonModal = () => {
    setEditingPersonId(undefined)
    personForm.setFieldsValue({
      name: '',
      role: 'driver',
      certExpiry: '',
      valid: true,
    })
    setPersonModalOpen(true)
  }

  const openEditPersonModal = (person: Person) => {
    setEditingPersonId(person.id)
    personForm.setFieldsValue({
      name: person.name,
      role: person.role,
      certExpiry: person.certExpiry,
      valid: person.valid,
    })
    setPersonModalOpen(true)
  }

  const savePerson = async () => {
    const values = await personForm.validateFields()

    if (editingPersonId) {
      updatePerson({
        personId: editingPersonId,
        patch: values,
      })
      message.success('人员信息已更新')
    } else {
      addPerson(values)
      message.success('人员已新增')
    }

    setPersonModalOpen(false)
  }

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        基础信息管理
      </Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="模块说明"
        description="覆盖站点、车辆、人员三类基础信息，支持新增、编辑、停用，并用于计划申报与审批校验。"
      />

      <Tabs
        items={[
          {
            key: 'site',
            label: '站点管理',
            children: (
              <Card
                title="站点列表"
                extra={
                  <Button type="primary" onClick={openCreateSiteModal}>
                    新增站点
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  dataSource={sites}
                  pagination={false}
                  columns={[
                    { title: '站点名称', dataIndex: 'name' },
                    {
                      title: '站点类型',
                      dataIndex: 'type',
                      render: (value: Site['type']) => siteTypeLabelMap[value],
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (value: Site['status']) => (
                        <StatusBadge text={siteStatusLabelMap[value]} type={siteStatusBadgeTypeMap[value]} />
                      ),
                    },
                    {
                      title: '维护策略',
                      dataIndex: 'maintenancePolicy',
                      render: (value?: Site['maintenancePolicy']) =>
                        value === 'block' ? '禁止申报' : value === 'manual' ? '人工审批' : '--',
                    },
                    {
                      title: '维护时间窗',
                      dataIndex: 'maintenanceWindow',
                      render: (value?: string) => value ?? '--',
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: Site) => (
                        <Space>
                          <Button size="small" onClick={() => openEditSiteModal(record)}>
                            编辑
                          </Button>
                          <Button
                            size="small"
                            danger
                            disabled={record.status === 'disabled'}
                            onClick={() => {
                              disableSite(record.id)
                              message.success('站点已停用')
                            }}
                          >
                            停用
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
            key: 'vehicle',
            label: '车辆管理',
            children: (
              <Card
                title="车辆列表"
                extra={
                  <Button type="primary" onClick={openCreateVehicleModal}>
                    新增车辆
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  dataSource={vehicles}
                  pagination={false}
                  columns={[
                    { title: '车牌号', dataIndex: 'plateNo' },
                    {
                      title: '载重（吨）',
                      dataIndex: 'capacity',
                      align: 'right',
                      render: (value: number) => value.toFixed(1),
                    },
                    { title: '资质有效期', dataIndex: 'certExpiry' },
                    {
                      title: '资质状态',
                      dataIndex: 'valid',
                      render: (value: boolean) =>
                        value ? (
                          <StatusBadge text="有效" type="success" />
                        ) : (
                          <StatusBadge text="已停用/过期" type="neutral" />
                        ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: Vehicle) => (
                        <Space>
                          <Button size="small" onClick={() => openEditVehicleModal(record)}>
                            编辑
                          </Button>
                          <Button
                            size="small"
                            danger
                            disabled={!record.valid}
                            onClick={() => {
                              disableVehicle(record.id)
                              message.success('车辆已停用')
                            }}
                          >
                            停用
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
            key: 'person',
            label: '人员管理',
            children: (
              <Card
                title="人员列表"
                extra={
                  <Button type="primary" onClick={openCreatePersonModal}>
                    新增人员
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  dataSource={personnel}
                  pagination={false}
                  columns={[
                    { title: '姓名', dataIndex: 'name' },
                    {
                      title: '角色',
                      dataIndex: 'role',
                      render: (value: Person['role']) => personRoleLabelMap[value],
                    },
                    { title: '证件有效期', dataIndex: 'certExpiry' },
                    {
                      title: '状态',
                      dataIndex: 'valid',
                      render: (value: boolean) =>
                        value ? (
                          <StatusBadge text="有效" type="success" />
                        ) : (
                          <StatusBadge text="已停用/过期" type="neutral" />
                        ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: Person) => (
                        <Space>
                          <Button size="small" onClick={() => openEditPersonModal(record)}>
                            编辑
                          </Button>
                          <Button
                            size="small"
                            danger
                            disabled={!record.valid}
                            onClick={() => {
                              disablePerson(record.id)
                              message.success('人员已停用')
                            }}
                          >
                            停用
                          </Button>
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

      <Modal
        title={editingSiteId ? '编辑站点' : '新增站点'}
        open={siteModalOpen}
        onCancel={() => setSiteModalOpen(false)}
        onOk={saveSite}
        okText="保存"
      >
        <Form form={siteForm} layout="vertical">
          <Form.Item label="站点名称" name="name" rules={[{ required: true, message: '请输入站点名称' }]}>
            <Input placeholder="例如：无锡北站用气点" />
          </Form.Item>
          <Form.Item label="站点类型" name="type" rules={[{ required: true, message: '请选择站点类型' }]}>
            <Select
              options={[
                { label: '装车点', value: 'load' },
                { label: '卸气点', value: 'unload' },
                { label: '用气点', value: 'use' },
              ]}
            />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '启用', value: 'enabled' },
                { label: '维护中', value: 'maintenance' },
                { label: '已停用', value: 'disabled' },
              ]}
            />
          </Form.Item>
          <Form.Item label="维护策略" name="maintenancePolicy">
            <Select
              allowClear
              placeholder="维护状态时可选"
              options={[
                { label: '禁止申报', value: 'block' },
                { label: '人工审批', value: 'manual' },
              ]}
            />
          </Form.Item>
          <Form.Item label="维护时间窗" name="maintenanceWindow">
            <Input placeholder="例如：2026-02-10 ~ 2026-02-12" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingVehicleId ? '编辑车辆' : '新增车辆'}
        open={vehicleModalOpen}
        onCancel={() => setVehicleModalOpen(false)}
        onOk={saveVehicle}
        okText="保存"
      >
        <Form form={vehicleForm} layout="vertical">
          <Form.Item label="车牌号" name="plateNo" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="例如：苏A·LNG88" />
          </Form.Item>
          <Form.Item
            label="载重（吨）"
            name="capacity"
            rules={[{ required: true, message: '请输入载重' }]}
          >
            <InputNumber min={1} precision={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="证件有效期"
            name="certExpiry"
            rules={[{ required: true, message: '请输入有效期' }]}
          >
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="资质状态" name="valid" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '有效', value: true },
                { label: '无效/停用', value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingPersonId ? '编辑人员' : '新增人员'}
        open={personModalOpen}
        onCancel={() => setPersonModalOpen(false)}
        onOk={savePerson}
        okText="保存"
      >
        <Form form={personForm} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="例如：赵强" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={[
                { label: '司机', value: 'driver' },
                { label: '押运员', value: 'escort' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="证件有效期"
            name="certExpiry"
            rules={[{ required: true, message: '请输入有效期' }]}
          >
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="状态" name="valid" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '有效', value: true },
                { label: '无效/停用', value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BasicInfoPage
