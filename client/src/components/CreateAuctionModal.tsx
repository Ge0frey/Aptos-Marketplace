import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";

interface CreateAuctionModalProps {
  visible: boolean;
  onCancel: () => void;
  nftId: number;
  marketplaceAddr: string;
}

const ERROR_MESSAGES: { [key: number]: string } = {
  1000: "You are not the owner of this NFT",
  1001: "Auction duration must be at least 1 hour",
  1010: "NFT does not exist",
};

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

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
      const startPriceInOctas = Math.floor(parseFloat(values.startPrice) * 100000000).toString();
      const durationInSeconds = (parseInt(values.duration) * 3600).toString();

      const payload: InputTransactionData = {
        data: {
          function: `${marketplaceAddr}::NFTMarketplace::create_auction`,
          typeArguments: [],
          functionArguments: [
            marketplaceAddr,
            nftId,
            startPriceInOctas,
            durationInSeconds
          ]
        }
      };

      const response = await signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      message.success('Auction created successfully!');
      onCancel();
    } catch (error) {
      console.error('Error creating auction:', error);
      const errorCode = extractErrorCode(error);
      const errorMessage = ERROR_MESSAGES[errorCode] || 'Failed to create auction';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const extractErrorCode = (error: any): number => {
    const match = error.message?.match(/Move abort (\d+)/);
    return match ? parseInt(match[1]) : 0;
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