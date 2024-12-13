import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

interface MakeOfferModalProps {
  visible: boolean;
  onCancel: () => void;
  nftId: number;
  marketplaceAddr: string;
}

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  visible,
  onCancel,
  nftId,
  marketplaceAddr,
}) => {
  const { signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleMakeOffer = async (values: { offerPrice: string; expirationHours: string }) => {
    try {
      setLoading(true);
      const priceInOctas = parseFloat(values.offerPrice) * 100000000;
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = currentTime + (parseInt(values.expirationHours) * 3600);

      const payload: InputTransactionData = {
        data: {
          function: `${marketplaceAddr}::NFTMarketplace::make_offer`,
          typeArguments: [],
          functionArguments: [marketplaceAddr, nftId, priceInOctas.toString(), expirationTime.toString()]
        }
      };

      const response = await signAndSubmitTransaction(payload);
      await (window as any).aptos.waitForTransaction(response.hash);
      message.success('Offer made successfully!');
      onCancel();
    } catch (error) {
      console.error('Error making offer:', error);
      message.error('Failed to make offer');
    } finally {
      setLoading(false);
    }
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