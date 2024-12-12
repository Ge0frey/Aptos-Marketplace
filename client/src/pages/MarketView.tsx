import React, { useState, useEffect } from "react";
import { Typography, Radio, message, Card, Row, Col, Pagination, Tag, Button, Modal, Spin } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import AuctionCard from '../components/AuctionCard';

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
};

type Auction = {
  nft_id: number;
  start_price: number;
  current_bid: number;
  highest_bidder: string;
  end_time: number;
  active: boolean;
};

interface MarketViewProps {
  marketplaceAddr: string;
}

const rarityColors: { [key: number]: string } = {
  1: "green",
  2: "blue",
  3: "purple",
  4: "orange",
};

const rarityLabels: { [key: number]: string } = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Super Rare",
};

const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

const MarketView: React.FC<MarketViewProps> = ({ marketplaceAddr }) => {
  const { signAndSubmitTransaction } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [viewMode, setViewMode] = useState<'marketplace' | 'auctions'>('marketplace');

  useEffect(() => {
    const fetchNfts = async () => {
      setLoading(true);
      await handleFetchNfts(undefined);
      setLoading(false);
    };
    fetchNfts();
  }, []);

  useEffect(() => {
    if (viewMode === 'auctions') {
      fetchAuctions();
    }
  }, [viewMode]);

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    try {
        const response = await client.getAccountResource(
            marketplaceAddr,
            "0x492337a98252299daa82f9daa349f61c9bb450a1b066dd974a0d28a424b08921::NFTMarketplace::Marketplace"
        );
        const nftList = (response.data as { nfts: NFT[] }).nfts;

        const hexToUint8Array = (hexString: string): Uint8Array => {
            const bytes = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
                bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
            }
            return bytes;
        };

        const decodedNfts = nftList.map((nft) => ({
            ...nft,
            name: new TextDecoder().decode(hexToUint8Array(nft.name.slice(2))),
            description: new TextDecoder().decode(hexToUint8Array(nft.description.slice(2))),
            uri: new TextDecoder().decode(hexToUint8Array(nft.uri.slice(2))),
            price: nft.price / 100000000,
        }));

        // Filter NFTs based on `for_sale` property and rarity if selected
        const filteredNfts = decodedNfts.filter((nft) => nft.for_sale && (selectedRarity === undefined || nft.rarity === selectedRarity));

        setNfts(filteredNfts);
        setCurrentPage(1);
    } catch (error) {
        console.error("Error fetching NFTs by rarity:", error);
        message.error("Failed to fetch NFTs.");
    }
};

  const handleBuyClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsBuyModalVisible(true);
  };

  const handleCancelBuy = () => {
    setIsBuyModalVisible(false);
    setSelectedNft(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedNft) return;
  
    try {
      const priceInOctas = selectedNft.price * 100000000;
  
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::purchase_nft`,
        type_arguments: [],
        arguments: [marketplaceAddr, selectedNft.id.toString(), priceInOctas.toString()],
      };
  
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT purchased successfully!");
      setIsBuyModalVisible(false);
      handleFetchNfts(rarity === 'all' ? undefined : rarity); // Refresh NFT list
      console.log("signAndSubmitTransaction:", signAndSubmitTransaction);
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      message.error("Failed to purchase NFT.");
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_active_auctions`,
        type_arguments: [],
        arguments: [],
      });
      
      // Use Array.isArray to ensure response[0] is an array before mapping
      const auctions: Auction[] = Array.isArray(response[0]) ? response[0].map((auction: any) => ({
        nft_id: Number(auction.nft_id),
        start_price: Number(auction.start_price),
        current_bid: Number(auction.current_bid),
        highest_bidder: auction.highest_bidder,
        end_time: Number(auction.end_time),
        active: Boolean(auction.active)
      })) : [];
      
      setActiveAuctions(auctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      message.error('Failed to fetch auctions');
    }
  };

  const handlePlaceBid = async (auctionId: number, amount: number) => {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::place_bid`,
        type_arguments: [],
        arguments: [marketplaceAddr, auctionId, amount * 100000000], // Convert to Octas
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      
      message.success('Bid placed successfully');
      fetchAuctions(); // Refresh auctions
    } catch (error) {
      console.error('Error placing bid:', error);
      message.error('Failed to place bid');
    }
  };

  const paginatedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Title level={2} style={{ marginBottom: "20px" }}>Marketplace</Title>
      <Radio.Group 
        value={viewMode} 
        onChange={(e) => setViewMode(e.target.value)}
        style={{ marginBottom: 20 }}
      >
        <Radio.Button value="marketplace">Marketplace</Radio.Button>
        <Radio.Button value="auctions">Auctions</Radio.Button>
      </Radio.Group>

      {viewMode === 'marketplace' ? (
        <>
          {loading ? (
            <Spin size="large" />
          ) : (
            <>
              {/* Filter Buttons */}
              <div style={{ marginBottom: "20px" }}>
                <Radio.Group
                  value={rarity}
                  onChange={(e) => {
                    const selectedRarity = e.target.value;
                    setRarity(selectedRarity);
                    handleFetchNfts(selectedRarity === 'all' ? undefined : selectedRarity);
                  }}
                  buttonStyle="solid"
                >
                  <Radio.Button value="all">All</Radio.Button>
                  <Radio.Button value={1}>Common</Radio.Button>
                  <Radio.Button value={2}>Uncommon</Radio.Button>
                  <Radio.Button value={3}>Rare</Radio.Button>
                  <Radio.Button value={4}>Super Rare</Radio.Button>
                </Radio.Group>
              </div>

              {/* Card Grid */}
              <Row gutter={[24, 24]} style={{ marginTop: 20, width: "100%", display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
                {paginatedNfts.map((nft) => (
                  <Col key={nft.id} xs={24} sm={12} md={8} lg={6} xl={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Card
                      hoverable
                      style={{ width: "100%", maxWidth: "240px", margin: "0 auto", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
                      cover={<img alt={nft.name} src={nft.uri} style={{ borderRadius: "10px 10px 0 0" }} />}
                      actions={[
                        <Button type="primary" onClick={() => handleBuyClick(nft)}>Buy</Button>
                      ]}
                    >
                      {/* Rarity Tag */}
                      <Tag color={rarityColors[nft.rarity]} style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}>
                        {rarityLabels[nft.rarity]}
                      </Tag>

                      <Meta title={nft.name} description={`Price: ${nft.price} APT`} />
                      <p>{nft.description}</p>
                      <p>ID: {nft.id}</p>
                      <p>Owner: {truncateAddress(nft.owner)}</p>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              <div style={{ marginTop: 30, marginBottom: 30 }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={nfts.length}
                  onChange={(page) => setCurrentPage(page)}
                  style={{ display: "flex", justifyContent: "center" }}
                />
              </div>

              {/* Buy Modal */}
              <Modal
                title="Purchase NFT"
                visible={isBuyModalVisible}
                onCancel={handleCancelBuy}
                footer={[
                  <Button key="cancel" onClick={handleCancelBuy}>
                    Cancel
                  </Button>,
                  <Button key="confirm" type="primary" onClick={handleConfirmPurchase}>
                    Confirm Purchase
                  </Button>,
                ]}
              >
                {selectedNft && (
                  <>
                    <p><strong>NFT ID:</strong> {selectedNft.id}</p>
                    <p><strong>Name:</strong> {selectedNft.name}</p>
                    <p><strong>Description:</strong> {selectedNft.description}</p>
                    <p><strong>Rarity:</strong> {rarityLabels[selectedNft.rarity]}</p>
                    <p><strong>Price:</strong> {selectedNft.price} APT</p>
                    <p><strong>Owner:</strong> {truncateAddress(selectedNft.owner)}</p>
                  </>
                )}
              </Modal>
            </>
          )}
        </>
      ) : (
        // Auctions view
        <Row gutter={[24, 24]}>
          {activeAuctions.map((auction) => (
            <Col key={auction.nft_id} xs={24} sm={12} md={8} lg={6}>
              <AuctionCard
                nftId={auction.nft_id}
                startPrice={auction.start_price / 100000000}
                currentBid={auction.current_bid / 100000000}
                endTime={auction.end_time}
                onPlaceBid={(amount) => handlePlaceBid(auction.nft_id, amount)}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MarketView;