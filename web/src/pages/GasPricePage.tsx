import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

function GasPricePage() {
  const navigate = useNavigate()
  const role = useAppStore((state) => state.currentRole)
  const customerId = useAppStore((state) => state.activeCustomerId)
  const prices = useAppStore((state) => state.gasPrices)

  const visiblePrices = prices.filter((item) => {
    if (role !== 'terminal') {
      return true
    }

    return item.scope === 'public' || item.customerId === customerId
  })

  return (
    <div className="page-section">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        气价列表
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        终端用户仅展示可见价格（公共价 + 一户一价）；一户一价默认覆盖公共价进行计划申报。
      </Typography.Paragraph>

      {visiblePrices.length === 0 ? (
        <Card>
          <Empty description="当前暂无可见气价" />
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
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate(`/app/plans/new?priceId=${price.id}`)}
                  >
                    申报计划
                  </Button>
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
