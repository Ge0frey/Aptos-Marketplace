import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message } from 'antd';
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";

interface AuctionCardProps {
  nftId: number;
  startPrice: number;
  currentBid: number;
  endTime: number;
  onPlaceBid: (amount: number) => Promise<void>;
  marketplaceAddr: string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({
  nftId,
  startPrice,
  currentBid,
  endTime,
  onPlaceBid,
  marketplaceAddr,
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { connected, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        setTimeLeft('Auction ended');
        clearInterval(timer);
      } else {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const handleBid = async () => {
    try {
      const amount = parseFloat(bidAmount);
      if (amount <= currentBid) {
        message.error('Bid must be higher than current bid');
        return;
      }

      const amountInOctas = amount * 100000000;
      const payload: InputTransactionData = {
        data: {
          function: `${marketplaceAddr}::NFTMarketplace::place_bid`,
          typeArguments: [],
          functionArguments: [marketplaceAddr, nftId.toString(), amountInOctas.toString()]
        }
      };

      const response = await signAndSubmitTransaction(payload);
      await (window as any).aptos.waitForTransaction(response.hash);
      
      setBidAmount('');
      message.success('Bid placed successfully');
      // Refresh auction data
      onPlaceBid(amount);
    } catch (error) {
      console.error('Error placing bid:', error);
      message.error('Failed to place bid');
    }
  };

  return (
    <Card title={`NFT #${nftId} Auction`}>
      <p>Starting Price: {startPrice} APT</p>
      <p>Current Bid: {currentBid} APT</p>
      <p>Time Left: {timeLeft}</p>
      {connected && timeLeft !== 'Auction ended' && (
        <>
          <Input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter bid amount"
            style={{ marginBottom: '10px' }}
          />
          <Button type="primary" onClick={handleBid}>
            Place Bid
          </Button>
        </>
      )}
    </Card>
  );
};

export default AuctionCard;