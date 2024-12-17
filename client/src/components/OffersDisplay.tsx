import React, { useState } from 'react';
import { Card, List, Tag, Button, message, Modal, Form, Input, Space, Tooltip } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Offer } from '../types/marketplace';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface OffersDisplayProps {
  offers: Offer[];
  isOwner: boolean;
  onAcceptOffer?: (nftId: number, offerId: number) => Promise<void>;
  onCancelOffer?: (nftId: number, offerId: number) => Promise<void>;
}

const OffersDisplay: React.FC<OffersDisplayProps> = ({
  offers,
  isOwner,
  onAcceptOffer,
  onCancelOffer
}) => {
  const { account } = useWallet();
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!offers || offers.length === 0) {
    return <p>No offers available</p>;
  }

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag icon={<SyncOutlined spin />} color="blue">Pending</Tag>;
      case 1:
        return <Tag icon={<CheckCircleOutlined />} color="green">Accepted</Tag>;
      case 2:
        return <Tag icon={<CloseCircleOutlined />} color="red">Rejected</Tag>;
      case 3:
        return <Tag icon={<ClockCircleOutlined />} color="gray">Expired</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const isExpired = (expiration: number) => {
    return Date.now() / 1000 > expiration;
  };

  const handleBatchAccept = async () => {
    try {
      setLoading(true);
      for (const offerId of selectedOffers) {
        const offer = offers[offerId];
        await onAcceptOffer?.(offer.nft_id, offerId);
      }
      message.success('Successfully processed batch acceptance');
      setSelectedOffers([]);
      setIsBatchModalVisible(false);
    } catch (error) {
      message.error('Failed to process batch acceptance');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOfferSelection = (offerId: number) => {
    setSelectedOffers(prev => 
      prev.includes(offerId) 
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    );
  };

  const getTimeRemaining = (expiration: number) => {
    const now = Date.now() / 1000;
    const remaining = expiration - now;
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <>
      {isOwner && offers.some(o => o.status === 0) && (
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            onClick={() => setIsBatchModalVisible(true)}
            disabled={selectedOffers.length === 0}
          >
            Batch Accept Selected Offers
          </Button>
          <Button
            onClick={() => setSelectedOffers([])}
            disabled={selectedOffers.length === 0}
          >
            Clear Selection
          </Button>
        </Space>
      )}

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={offers}
        renderItem={(offer, index) => (
          <List.Item>
            <Card 
              title={`Offer for NFT #${offer.nft_id}`}
              extra={isOwner && offer.status === 0 && !isExpired(offer.expiration) && (
                <Tooltip title="Select for batch processing">
                  <input
                    type="checkbox"
                    checked={selectedOffers.includes(index)}
                    onChange={() => toggleOfferSelection(index)}
                  />
                </Tooltip>
              )}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>Price: {offer.price / 100000000} APT</div>
                <div>Buyer: {offer.buyer}</div>
                <div>Time Remaining: {getTimeRemaining(offer.expiration)}</div>
                <Space>
                  {getStatusTag(offer.status)}
                  {isExpired(offer.expiration) && <Tag color="red">Expired</Tag>}
                </Space>
                
                <Space>
                  {isOwner && offer.status === 0 && !isExpired(offer.expiration) && (
                    <Button 
                      type="primary" 
                      onClick={() => onAcceptOffer?.(offer.nft_id, index)}
                    >
                      Accept Offer
                    </Button>
                  )}
                  
                  {account?.address === offer.buyer && offer.status === 0 && !isExpired(offer.expiration) && (
                    <Button 
                      type="default" 
                      danger 
                      onClick={() => onCancelOffer?.(offer.nft_id, index)}
                    >
                      Cancel Offer
                    </Button>
                  )}
                </Space>
              </Space>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Batch Accept Offers"
        visible={isBatchModalVisible}
        onOk={handleBatchAccept}
        onCancel={() => setIsBatchModalVisible(false)}
        confirmLoading={loading}
      >
        <p>You are about to accept {selectedOffers.length} offers:</p>
        <ul>
          {selectedOffers.map(offerId => {
            const offer = offers[offerId];
            return (
              <li key={offerId}>
                Offer #{offerId} - {offer.price / 100000000} APT from {offer.buyer}
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
};

export default OffersDisplay; 