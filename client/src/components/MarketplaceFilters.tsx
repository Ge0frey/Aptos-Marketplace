import React from 'react';
import { Form, Select, InputNumber, Button, Space, Row, Col } from 'antd';

const { Option } = Select;

interface FilterProps {
  onFilterChange: (filters: any) => void;
}

const MarketplaceFilters: React.FC<FilterProps> = ({ onFilterChange }) => {
  const [form] = Form.useForm();

  return (
    <div style={{
      background: "white",
      padding: "24px",
      borderRadius: "16px",
      marginBottom: "24px",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    }}>
      <Form
        form={form}
        layout="horizontal"
        onValuesChange={(_, allValues) => onFilterChange(allValues)}
      >
        <Row gutter={24}>
          <Col span={6}>
            <Form.Item name="rarity" label="Rarity">
              <Select
                style={{ width: "100%" }}
                allowClear
                placeholder="Select rarity"
              >
                <Option value={1}>Common</Option>
                <Option value={2}>Uncommon</Option>
                <Option value={3}>Rare</Option>
                <Option value={4}>Super Rare</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item label="Price Range">
              <Space>
                <Form.Item name="minPrice" noStyle>
                  <InputNumber 
                    placeholder="Min" 
                    style={{ width: "120px" }}
                  />
                </Form.Item>
                <span>-</span>
                <Form.Item name="maxPrice" noStyle>
                  <InputNumber 
                    placeholder="Max" 
                    style={{ width: "120px" }}
                  />
                </Form.Item>
              </Space>
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item name="sortBy" label="Sort By">
              <Select style={{ width: "100%" }} allowClear>
                <Option value="price_asc">Price: Low to High</Option>
                <Option value="price_desc">Price: High to Low</Option>
                <Option value="rarity_desc">Rarity: Highest</Option>
                <Option value="latest">Latest</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={4} style={{ display: "flex", alignItems: "flex-end" }}>
            <Button 
              onClick={() => form.resetFields()}
              style={{ width: "100%" }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default MarketplaceFilters; 