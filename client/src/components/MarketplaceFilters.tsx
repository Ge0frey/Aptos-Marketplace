import React from 'react';
import { Form, Select, InputNumber, Button, Space } from 'antd';

const { Option } = Select;

interface FilterProps {
  onFilterChange: (filters: any) => void;
}

const MarketplaceFilters: React.FC<FilterProps> = ({ onFilterChange }) => {
  const [form] = Form.useForm();

  const handleFilterChange = (values: any) => {
    onFilterChange(values);
  };

  return (
    <Form
      form={form}
      layout="inline"
      onValuesChange={(_, allValues) => handleFilterChange(allValues)}
    >
      <Form.Item name="rarity" label="Rarity">
        <Select style={{ width: 120 }} allowClear>
          <Option value={1}>Common</Option>
          <Option value={2}>Uncommon</Option>
          <Option value={3}>Rare</Option>
          <Option value={4}>Super Rare</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Price Range">
        <Space>
          <Form.Item name="minPrice" noStyle>
            <InputNumber placeholder="Min" />
          </Form.Item>
          <span>-</span>
          <Form.Item name="maxPrice" noStyle>
            <InputNumber placeholder="Max" />
          </Form.Item>
        </Space>
      </Form.Item>

      <Form.Item name="sortBy" label="Sort By">
        <Select style={{ width: 120 }} allowClear>
          <Option value="price_asc">Price: Low to High</Option>
          <Option value="price_desc">Price: High to Low</Option>
          <Option value="rarity_desc">Rarity: Highest</Option>
          <Option value="latest">Latest</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" onClick={() => form.resetFields()}>
          Reset Filters
        </Button>
      </Form.Item>
    </Form>
  );
};

export default MarketplaceFilters; 