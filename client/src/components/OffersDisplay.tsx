import React, { useState } from 'react';
import { List, Card, Button, Tag, Space, Typography, Spin, Checkbox } from 'antd';
import { Offer } from '../types/marketplace';
import { truncateAddress } from '../utils/helpers';
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const { Text } = Typography;

interface OffersDisplayProps {
  offers: Offer[];
  isOwner: boolean;
  onAcceptOffer?: (nftId: number, offerId: number) => Promise<void>;
  onCancelOffer?: (nftId: number, offerId: number) => Promise<void>;
  onBatchAccept?: (selectedOffers: { nftId: number, offerId: number }[]) => Promise<void>;
  loading?: boolean;
}

const OffersDisplay: React.FC<OffersDisplayProps> = ({
  offers,
  isOwner,
  onAcceptOffer,
  onCancelOffer,
  onBatchAccept,
  loading = false
}) => {
  const { account } = useWallet();
  const [selectedOffers, setSelectedOffers] = useState<{ nftId: number, offerId: number }[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleSelectOffer = (nftId: number, offerId: number, checked: boolean) => {
    if (checked) {
      setSelectedOffers(prev => [...prev, { nftId, offerId }]);
    } else {
      setSelectedOffers(prev => prev.filter(offer => 
        !(offer.nftId === nftId && offer.offerId === offerId)
      ));
    }
  };

  const handleBatchAccept = async () => {
    if (!onBatchAccept || selectedOffers.length === 0) return;
    
    setBatchLoading(true);
    try {
      await onBatchAccept(selectedOffers);
      setSelectedOffers([]); // Clear selections after successful batch accept
    } catch (error) {
      console.error('Error in batch accept:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="processing">Pending</Tag>;
      case 1:
        return <Tag color="success">Accepted</Tag>;
      case 2:
        return <Tag color="error">Rejected</Tag>;
      case 3:
        return <Tag color="default">Expired</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Spin />
        <div style={{ marginTop: '12px' }}>Loading offers...</div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '24px',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <Text>No offers available for this NFT</Text>
      </div>
    );
  }

  return (
    <>
      {isOwner && selectedOffers.length > 0 && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          background: '#f0f5ff', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text>{selectedOffers.length} offers selected</Text>
          <Button 
            type="primary"
            onClick={handleBatchAccept}
            loading={batchLoading}
          >
            Accept Selected Offers
          </Button>
        </div>
      )}

      <List
        dataSource={offers}
        renderItem={(offer, index) => (
          <List.Item>
            <Card style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {isOwner && offer.status === 0 && (
                  <Checkbox
                    onChange={(e) => handleSelectOffer(offer.nft_id, index, e.target.checked)}
                    checked={selectedOffers.some(selected => 
                      selected.nftId === offer.nft_id && selected.offerId === index
                    )}
                    style={{ marginBottom: '8px' }}
                  >
                    Select for batch accept
                  </Checkbox>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Offer Price:</Text>
                  <Text>{offer.price.toFixed(2)} APT</Text>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Buyer:</Text>
                  <Text copyable>{truncateAddress(offer.buyer)}</Text>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Status:</Text>
                  {getStatusTag(offer.status)}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Expires:</Text>
                  <Text>{new Date(offer.expiration * 1000).toLocaleString()}</Text>
                </div>

                {offer.status === 0 && (
                  <Space style={{ marginTop: '12px', justifyContent: 'flex-end', width: '100%' }}>
                    {isOwner && !selectedOffers.length && (
                      <Button
                        type="primary"
                        onClick={() => onAcceptOffer?.(offer.nft_id, index)}
                      >
                        Accept Offer
                      </Button>
                    )}
                    {offer.buyer === account?.address && (
                      <Button
                        danger
                        onClick={() => onCancelOffer?.(offer.nft_id, index)}
                      >
                        Cancel Offer
                      </Button>
                    )}
                  </Space>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </>
  );
};

export default OffersDisplay; 