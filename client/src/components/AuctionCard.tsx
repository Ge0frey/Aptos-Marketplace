import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message } from 'antd';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient, Types } from "aptos";

// Create an instance of AptosClient
const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

interface AuctionCardProps {
  nftId: number;
  startPrice: number;
  currentBid: number;
  endTime: number;
  highestBidder: string;
  onPlaceBid: (amount: number) => Promise<void>;
  marketplaceAddr: string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({
  nftId,
  startPrice,
  currentBid,
  endTime,
  highestBidder,
  onPlaceBid,
  marketplaceAddr,
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { connected, account } = useWallet();
  const [loading, setLoading] = useState<boolean>(false);

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
      // Check if user is connected
      if (!account) {
        message.error('Please connect your wallet first');
        return;
      }

      // Check if user is already highest bidder
      if (account.address === highestBidder) {
        message.error('You are already the highest bidder');
        return;
      }

      const amount = parseFloat(bidAmount);
      if (isNaN(amount)) {
        message.error('Please enter a valid bid amount');
        return;
      }

      if (amount <= currentBid) {
        message.error(`Bid must be higher than current bid (${currentBid} APT)`);
        return;
      }

      // Convert APT to Octas
      const amountInOctas = Math.floor(amount * 100000000);
      
      setLoading(true);
      
      const payload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::place_bid`,
        type_arguments: [],
        arguments: [
          marketplaceAddr,
          nftId.toString(),
          amountInOctas.toString()
        ]
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(payload);
      
      // Wait for transaction confirmation
      const txn = await client.waitForTransactionWithResult(response.hash);
      
      if ((txn as Types.UserTransaction).success) {
        message.success('Bid placed successfully');
        setBidAmount('');
        await onPlaceBid(amount);
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: any) {
      console.error('Error placing bid:', error);
      if (error.message?.includes('EALREADY_HIGHEST_BIDDER')) {
        message.error('You are already the highest bidder');
      } else if (error.message?.includes('EBID_TOO_LOW')) {
        message.error('Bid amount must be higher than current bid');
      } else if (error.message?.includes('EAUCTION_EXPIRED')) {
        message.error('Auction has expired');
      } else if (error.message?.includes('EAUCTION_NOT_ACTIVE')) {
        message.error('Auction is not active');
      } else {
        message.error(error.message || 'Failed to place bid');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={`NFT #${nftId} Auction`} 
      style={{ 
        borderRadius: '10px', 
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
        padding: '16px', 
        width: '300px', // Set a fixed width
        margin: '20px auto' // Center the card
      }}
    >
      <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Starting Price: {startPrice} APT</p>
      <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Current Bid: {currentBid} APT</p>
      <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Time Left: {timeLeft}</p>
      {connected && timeLeft !== 'Auction ended' && (
        <>
          <Input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter bid amount"
            style={{ 
              marginBottom: '10px', 
              borderRadius: '5px', 
              border: '1px solid #d9d9d9', 
              padding: '8px' // Add padding for better usability
            }}
          />
          <Button 
            type="primary" 
            onClick={handleBid} 
            style={{ 
              backgroundColor: '#1890ff', 
              borderColor: '#1890ff', 
              borderRadius: '5px', 
              width: '100%' // Full width button
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
            loading={loading}
          >
            Place Bid
          </Button>
        </>
      )}
    </Card>
  );
};

export default AuctionCard;