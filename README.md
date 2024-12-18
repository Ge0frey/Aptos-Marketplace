# Aptos NFT Marketplace

A decentralized NFT marketplace built on the Aptos blockchain, featuring NFT minting, trading, auctions, and comprehensive analytics.

This README provides a comprehensive overview of the marketplace, including:
- Installation instructions
- Project structure
- Core features
- Development guidelines
- Troubleshooting tips


## Features

### Core Functionality
- 🎨 NFT Minting
- 💰 Buy/Sell NFTs
- 🔄 Auction System
- 💎 Rarity Tiers
- 📊 Real-time Analytics
- 👑 Creator Royalties
- 💫 Offer System

### Technical Features
- ⚡ React + TypeScript Frontend
- 🔗 Move Smart Contracts
- 🎯 Aptos Blockchain Integration
- 📱 Responsive Design
- 🔐 Wallet Integration

## Prerequisites

- Node.js (v14.0.0 or later)
- npm or yarn
- Aptos CLI
- Petra Wallet (Browser Extension)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Ge0frey/Aptos-Marketplace.git
cd Aptos-Marketplace
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd client
npm install

# Install Move dependencies
cd ../onchain-logic
aptos move compile
```

### 3. Environment Setup

Create a `.env` file in the client directory:

```env
REACT_APP_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
REACT_APP_MARKETPLACE_ADDRESS=YOUR ADDRESS
```

### 4. Deploy Smart Contract

```bash
cd onchain-logic
aptos move publish --named-addresses NFTMarketplace=YOUR ADDRESS
```

### 5. Start the Application

```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
aptos-nft-marketplace/
├── client/                      # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   └── public/                # Static assets
└── onchain-logic/             # Smart contracts
    ├── contracts/
    │   └── sources/          # Move smart contracts
    └── tests/                # Contract tests
```

## Smart Contract Architecture

### Core Structures
- `NFT`: Represents a single NFT with properties
- `Marketplace`: Main contract structure managing all operations
- `Auction`: Handles auction functionality
- `Offer`: Manages offer system

### Key Functions
- `mint_nft`: Create new NFTs
- `list_for_sale`: List NFTs in marketplace
- `create_auction`: Start NFT auctions
- `make_offer`: Make offers on NFTs
- `set_creator_royalty`: Set royalty percentages

## Frontend Components

### Core Pages
- `MarketView`: Main marketplace interface
- `MyNFTs`: Personal NFT collection
- `AnalyticsDashboard`: Market statistics
- `RoyaltyManagement`: Royalty settings

### Key Components
- `AuctionCard`: Display active auctions
- `OffersDisplay`: Show and manage offers
- `MarketplaceFilters`: Filter marketplace items
- `NavBar`: Navigation and wallet connection

## Usage Guide

### Connecting Wallet
1. Install Petra Wallet browser extension
2. Create or import a wallet
3. Connect wallet through the marketplace interface

### Minting NFTs
1. Click "Mint NFT" in navigation
2. Fill in NFT details:
   - Name
   - Description
   - Image URI
   - Rarity Level

### Trading NFTs
1. List NFT for sale:
   - Set price
   - Choose sale type (direct/auction)
2. Make offers:
   - Set offer amount
   - Set expiration time
3. Accept/reject offers

### Auctions
1. Create auction:
   - Set starting price
   - Set duration
2. Place bids:
   - Enter bid amount
   - Confirm transaction

## Development

### Running Tests
```bash
# Smart Contract Tests
cd onchain-logic
aptos move test

# Frontend Tests
cd client
npm test
```

### Local Development
1. Start local Aptos node
2. Update `.env` with local node URL
3. Deploy contract to local network
4. Start frontend application

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Common Issues

### Troubleshooting
1. **Wallet Connection Issues**
   - Ensure Petra Wallet is installed
   - Check network configuration

2. **Transaction Failures**
   - Verify wallet has sufficient funds
   - Check transaction parameters

3. **NFT Display Issues**
   - Validate image URI accessibility
   - Clear browser cache

## License

This project is licensed under the MIT License 
## Contact

Ge0frey - [@Ge0frey_](https://twitter.com/Ge0frey_)

Project Link: [https://github.com/Ge0frey/aptos-nft-marketplace](https://github.com/Ge0frey/aptos-nft-marketplace)
```




