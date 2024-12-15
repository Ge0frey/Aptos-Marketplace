import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message } from 'antd';
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";

// Create an instance of AptosClient
const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

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
      if (isNaN(amount) || amount <= currentBid) {
        message.error('Bid must be higher than current bid');
        return;
      }

      const amountInOctas = Math.floor(amount * 100000000);
      const payload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::place_bid`,
        type_arguments: [],
        arguments: [marketplaceAddr, nftId, amountInOctas.toString()]
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      
      message.success('Bid placed successfully');
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