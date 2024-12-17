import React from 'react';
import { Card, List, Tag, Button, message } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Offer } from '../types/marketplace';

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
  
  if (!offers || offers.length === 0) {
    return <p>No offers available</p>;
  }

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="blue">Pending</Tag>;
      case 1:
        return <Tag color="green">Accepted</Tag>;
      case 2:
        return <Tag color="red">Rejected</Tag>;
      case 3:
        return <Tag color="gray">Expired</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const isExpired = (expiration: number) => {
    return Date.now() / 1000 > expiration;
  };

  return (
    <List
      grid={{ gutter: 16, column: 1 }}
      dataSource={offers}
      renderItem={(offer) => (
        <List.Item>
          <Card title={`Offer for NFT #${offer.nft_id}`}>
            <p>Price: {offer.price / 100000000} APT</p>
            <p>Buyer: {offer.buyer}</p>
            <p>Expires: {new Date(offer.expiration * 1000).toLocaleString()}</p>
            {getStatusTag(offer.status)}
            {isExpired(offer.expiration) && <Tag color="red">Expired</Tag>}
            
            {isOwner && offer.status === 0 && !isExpired(offer.expiration) && (
              <Button 
                type="primary" 
                onClick={() => onAcceptOffer?.(offer.nft_id, offers.indexOf(offer))}
              >
                Accept Offer
              </Button>
            )}
            
            {account?.address === offer.buyer && offer.status === 0 && !isExpired(offer.expiration) && (
              <Button 
                type="default" 
                danger 
                onClick={() => onCancelOffer?.(offer.nft_id, offers.indexOf(offer))}
              >
                Cancel Offer
              </Button>
            )}
          </Card>
        </List.Item>
      )}
    />
  );
};

export default OffersDisplay; 