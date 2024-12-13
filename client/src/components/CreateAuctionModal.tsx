import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

interface CreateAuctionModalProps {
  visible: boolean;
  onCancel: () => void;
  nftId: number;
  marketplaceAddr: string;
}

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({
  visible,
  onCancel,
  nftId,
  marketplaceAddr,
}) => {
  const { signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleCreateAuction = async (values: { startPrice: string; duration: string }) => {
    try {
      setLoading(true);
      const startPriceInOctas = parseFloat(values.startPrice) * 100000000;
      const durationInSeconds = parseInt(values.duration) * 3600; // Convert hours to seconds

      const payload: InputTransactionData = {
        data: {
          function: `${marketplaceAddr}::NFTMarketplace::create_auction`,
          typeArguments: [],
          functionArguments: [marketplaceAddr, nftId, startPriceInOctas.toString(), durationInSeconds.toString()]
        }
      };

      const response = await signAndSubmitTransaction(payload);
      await (window as any).aptos.waitForTransaction(response.hash);
      message.success('Auction created successfully!');
      onCancel();
    } catch (error) {
      console.error('Error creating auction:', error);
      message.error('Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Auction"
      visible={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form onFinish={handleCreateAuction} layout="vertical">
        <Form.Item
          label="Starting Price (APT)"
          name="startPrice"
          rules={[{ required: true, message: 'Please enter starting price' }]}
        >
          <Input type="number" min="0" step="0.1" />
        </Form.Item>
        <Form.Item
          label="Duration (hours)"
          name="duration"
          rules={[{ required: true, message: 'Please enter duration' }]}
        >
          <Input type="number" min="1" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Auction
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAuctionModal;