import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, message, Card, Typography } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";

const { Title } = Typography;
const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

interface RoyaltyManagementProps {
  marketplaceAddr: string;
}

const RoyaltyManagement: React.FC<RoyaltyManagementProps> = ({ marketplaceAddr }) => {
  const { signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [currentRoyalty, setCurrentRoyalty] = useState<number | null>(null);

  useEffect(() => {
    // You can add a function here to fetch current royalty percentage if needed
    // For now, we'll just show the form
  }, []);

  const handleSetRoyalty = async (values: { royaltyPercentage: number }) => {
    try {
      setLoading(true);
      const payload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::set_creator_royalty`,
        type_arguments: [],
        arguments: [marketplaceAddr, values.royaltyPercentage],
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      message.success('Royalty percentage set successfully!');
      setCurrentRoyalty(values.royaltyPercentage);
    } catch (error) {
      console.error('Error setting royalty:', error);
      message.error('Failed to set royalty percentage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '0 20px' 
    }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
        Royalty Management
      </Title>
      
      <Card>
        <Form 
          onFinish={handleSetRoyalty}
          layout="vertical"
          initialValues={{ royaltyPercentage: currentRoyalty }}
        >
          <Form.Item
            label="Royalty Percentage"
            name="royaltyPercentage"
            rules={[
              { required: true, message: 'Please enter royalty percentage' },
              { type: 'number', min: 0, max: 30, message: 'Royalty must be between 0-30%' }
            ]}
            extra="Set your creator royalty percentage (0-30%)"
          >
            <InputNumber<number>
              min={0} 
              max={30}
              style={{ width: '100%' }}
              formatter={(value) => `${value}%`}
              parser={(value) => {
                const parsed = parseInt(value?.replace('%', '') || '0', 10);
                return isNaN(parsed) ? 0 : Math.min(30, Math.max(0, parsed));
              }}
              step={1}
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              Set Royalty
            </Button>
          </Form.Item>
        </Form>

        {currentRoyalty !== null && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Typography.Text strong>
              Current Royalty: {currentRoyalty}%
            </Typography.Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RoyaltyManagement; 