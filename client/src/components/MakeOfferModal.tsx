import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";

interface MakeOfferModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  nftId: number;
  marketplaceAddr: string;
}

const ERROR_MESSAGES: { [key: number]: string } = {
  1006: "Offer expiration time must be in the future",
  1009: "NFT does not exist",
};

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  nftId,
  marketplaceAddr,
}) => {
  const { signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleMakeOffer = async (values: { offerPrice: string; expirationHours: string }) => {
    try {
      setLoading(true);
      const priceInOctas = Math.floor(parseFloat(values.offerPrice) * 100000000).toString();
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = (currentTime + (parseInt(values.expirationHours) * 3600)).toString();

      const payload: InputTransactionData = {
        data: {
          function: `${marketplaceAddr}::NFTMarketplace::make_offer`,
          typeArguments: [],
          functionArguments: [
            marketplaceAddr,
            nftId,
            priceInOctas,
            expirationTime
          ]
        }
      };

      const response = await signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      message.success('Offer made successfully!');
      
      setTimeout(() => {
        onSuccess?.();
        onCancel();
      }, 1000);
      
    } catch (error) {
      console.error('Error making offer:', error);
      const errorCode = extractErrorCode(error);
      const errorMessage = ERROR_MESSAGES[errorCode] || 'Failed to make offer';
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
      title="Make Offer"
      visible={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form onFinish={handleMakeOffer} layout="vertical">
        <Form.Item
          label="Offer Price (APT)"
          name="offerPrice"
          rules={[{ required: true, message: 'Please enter offer price' }]}
        >
          <Input type="number" min="0" step="0.1" />
        </Form.Item>
        <Form.Item
          label="Expiration (hours)"
          name="expirationHours"
          rules={[{ required: true, message: 'Please enter expiration time' }]}
        >
          <Input type="number" min="1" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Make Offer
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MakeOfferModal;