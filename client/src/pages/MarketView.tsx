import React, { useState, useEffect } from "react";
import { Typography, Radio, message, Card, Row, Col, Pagination, Tag, Button, Modal, Spin, Divider, Space } from "antd";
import { UserOutlined, TagOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import AuctionCard from '../components/AuctionCard';
import MarketplaceFilters from '../components/MarketplaceFilters';
import { hexToUint8Array } from '../utils/helpers';
import { MoveValue } from 'aptos/src/generated';
import CreateAuctionModal from '../components/CreateAuctionModal';
import MakeOfferModal from '../components/MakeOfferModal';
import OffersDisplay from '../components/OffersDisplay';
import { Offer, NFTOffer } from '../types/marketplace';
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

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
  const { signAndSubmitTransaction, account } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [viewMode, setViewMode] = useState<'marketplace' | 'auctions'>('marketplace');
  const [filters, setFilters] = useState({});
  const [sortedNfts, setSortedNfts] = useState<NFT[]>([]);
  const [isCreateAuctionModalVisible, setIsCreateAuctionModalVisible] = useState(false);
  const [isMakeOfferModalVisible, setIsMakeOfferModalVisible] = useState(false);
  const [selectedNftId, setSelectedNftId] = useState<number | null>(null);
  const [nftOffers, setNftOffers] = useState<NFTOffer>({});
  const [selectedAuctionNftId, setSelectedAuctionNftId] = useState<number | null>(null);
  const [isOffersModalVisible, setIsOffersModalVisible] = useState(false);
  const [selectedNftOffers, setSelectedNftOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

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
        const response = await client.view({
            function: `${marketplaceAddr}::NFTMarketplace::get_all_nfts_for_sale`,
            arguments: [marketplaceAddr, "100", "0"],
            type_arguments: [],
        });

        const listedNfts = Array.isArray(response[0]) ? response[0] : [];
        const filteredNfts = listedNfts.filter(nft => 
            selectedRarity === undefined || nft.rarity === selectedRarity
        );

        const decodedNfts: NFT[] = await Promise.all(
            filteredNfts.map(async (nft: any) => {
                const details = await client.view({
                    function: `${marketplaceAddr}::NFTMarketplace::get_nft_details`,
                    arguments: [marketplaceAddr, nft.id],
                    type_arguments: [],
                });
                
                return {
                    id: Number(details[0]),
                    owner: details[1].toString(),
                    name: new TextDecoder().decode(hexToUint8Array(details[2].toString())),
                    description: new TextDecoder().decode(hexToUint8Array(details[3].toString())),
                    uri: new TextDecoder().decode(hexToUint8Array(details[4].toString())),
                    price: Number(details[5]) / 100000000,
                    for_sale: Boolean(details[6]),
                    rarity: Number(details[7])
                };
            })
        );

        setNfts(decodedNfts);
        setSortedNfts(decodedNfts);
    } catch (error) {
        console.error("Error fetching NFTs:", error);
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
        arguments: [marketplaceAddr],
        type_arguments: [],
      });

      const auctions = Array.isArray(response[0]) ? response[0].map((auction: any) => ({
        nft_id: Number(auction.nft_id),
        start_price: Number(auction.start_price) / 100000000,
        current_bid: Number(auction.current_bid) / 100000000,
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

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    const filtered = nfts.filter((nft) => {
      if (newFilters.rarity && nft.rarity !== newFilters.rarity) return false;
      if (newFilters.minPrice && nft.price < newFilters.minPrice) return false;
      if (newFilters.maxPrice && nft.price > newFilters.maxPrice) return false;
      return true;
    });

    // Handle sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (newFilters.sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rarity_desc':
          return b.rarity - a.rarity;
        case 'latest':
          return b.id - a.id;
        default:
          return 0;
      }
    });

    setSortedNfts(sorted);
  };

  const paginatedNfts = sortedNfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (viewMode === 'auctions') {
      fetchAuctions();
      const interval = setInterval(fetchAuctions, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  useEffect(() => {
    const handleAuctionCreated = () => {
      if (viewMode === 'auctions') {
        fetchAuctions();
      }
    };

    window.addEventListener('auctionCreated', handleAuctionCreated);
    return () => window.removeEventListener('auctionCreated', handleAuctionCreated);
  }, [viewMode]);

  const fetchOffersForNft = async (nftId: number) => {
    try {
      console.log('Fetching offers for NFT:', nftId);
      const response = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_offers_for_nft`,
        arguments: [marketplaceAddr, nftId.toString()],
        type_arguments: [],
      });
      
      // Ensure we're getting the correct data structure from the response
      const offers = Array.isArray(response[0]) ? response[0] : [];
      
      // Transform the offers to match the Offer interface
      const transformedOffers = offers.map((offer: any) => ({
        nft_id: Number(offer.nft_id),
        buyer: offer.buyer,
        price: Number(offer.price) / 100000000,
        expiration: Number(offer.expiration),
        status: Number(offer.status)
      }));

      setNftOffers(prev => ({
        ...prev,
        [nftId]: transformedOffers
      }));
    } catch (error) {
      console.error('Error fetching offers:', error);
      setNftOffers(prev => ({
        ...prev,
        [nftId]: []
      }));
    }
  };

  useEffect(() => {
    const fetchOffers = async () => {
      if (paginatedNfts.length > 0 && !isLoadingOffers) {
        setIsLoadingOffers(true);
        try {
          const promises = paginatedNfts.map(nft => fetchOffersForNFT(nft.id));
          await Promise.all(promises);
        } catch (error) {
          console.error('Error fetching offers:', error);
        } finally {
          setIsLoadingOffers(false);
        }
      }
    };
    
    fetchOffers();
  }, [currentPage, paginatedNfts.length]);

  const handleAcceptOffer = async (nftId: number, offerId: number) => {
    try {
      const payload: InputTransactionData = {
        data: {
          function: `${marketplaceAddr}::NFTMarketplace::accept_offer`,
          typeArguments: [],
          functionArguments: [
            marketplaceAddr,
            nftId.toString(),
            offerId.toString()
          ]
        }
      };
      
      const response = await signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      message.success('Offer accepted successfully!');
      await fetchOffersForNFT(nftId);
    } catch (error) {
      console.error('Error accepting offer:', error);
      message.error('Failed to accept offer');
    }
  };

  const handleCancelOffer = async (nftId: number, offerId: number) => {
    try {
      const payload: InputTransactionData = {
        data: {
          function: `${marketplaceAddr}::NFTMarketplace::cancel_offer`,
          typeArguments: [],
          functionArguments: [marketplaceAddr, nftId, offerId]
        }
      };
      
      const response = await signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      message.success('Offer cancelled successfully!');
      fetchOffersForNft(nftId);
    } catch (error) {
      console.error('Error cancelling offer:', error);
      message.error('Failed to cancel offer');
    }
  };

  const refreshOffers = async (nftId: number) => {
    await fetchOffersForNft(nftId);
  };

  const handleCreateAuction = (nftId: number) => {
    setSelectedAuctionNftId(nftId);
    setIsCreateAuctionModalVisible(true);
  };

  const fetchOffersForNFT = async (nftId: number) => {
    try {
      console.log('Fetching offers for NFT:', nftId);
      const response = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_offers_for_nft`,
        arguments: [marketplaceAddr, nftId.toString()],
        type_arguments: [],
      });
      
      console.log('Raw offers response:', response);
      
      // The response should be an array of offers
      const offers = response && Array.isArray(response[0]) ? response[0] : [];
      
      if (!Array.isArray(offers)) {
        console.log('No offers found or invalid response format');
        setSelectedNftOffers([]);
        return;
      }

      // Transform the offers to match the Offer interface
      const transformedOffers = offers.map((offer: any) => {
        // Handle both possible response formats
        const offerData = offer.data || offer;
        
        return {
          nft_id: Number(offerData.nft_id || nftId),
          buyer: offerData.buyer,
          price: Number(offerData.price || 0) / 100000000, // Convert from octas to APT
          expiration: Number(offerData.expiration || 0),
          status: Number(offerData.status || 0)
        };
      });

      console.log('Transformed offers:', transformedOffers);
      setSelectedNftOffers(transformedOffers);
      
    } catch (error) {
      console.error('Error fetching offers:', error);
      message.error('Failed to fetch offers');
      setSelectedNftOffers([]); // Set empty array on error
    }
  };

  const handleViewOffers = async (nft: NFT) => {
    setSelectedNft(nft);
    setIsOffersModalVisible(true);
    setIsLoadingOffers(true);
    
    try {
      await fetchOffersForNFT(nft.id);
    } catch (error) {
      console.error('Error fetching offers:', error);
      message.error('Failed to fetch offers');
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const handleBatchAccept = async (selectedOffers: { nftId: number, offerId: number }[]) => {
    try {
      // Process each offer sequentially to maintain order
      for (const { nftId, offerId } of selectedOffers) {
        const payload: InputTransactionData = {
          data: {
            function: `${marketplaceAddr}::NFTMarketplace::accept_offer`,
            typeArguments: [],
            functionArguments: [
              marketplaceAddr,
              nftId.toString(),
              offerId.toString()
            ]
          }
        };

        const response = await signAndSubmitTransaction(payload);
        await client.waitForTransaction(response.hash);
      }
      
      message.success('Successfully accepted all selected offers!');
      // Refresh the offers after batch accept
      if (selectedOffers.length > 0) {
        await fetchOffersForNFT(selectedOffers[0].nftId);
      }
    } catch (error) {
      console.error('Error in batch accept:', error);
      message.error('Failed to process batch accept');
    }
  };

  return (
    <div style={{ 
      textAlign: "center", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      padding: "20px"
    }}>
      <Title level={2} style={{ marginBottom: "20px" }}>Marketplace</Title>
      
      {/* View Mode Toggle */}
      <Radio.Group 
        value={viewMode} 
        onChange={(e) => setViewMode(e.target.value)}
        style={{ marginBottom: 20 }}
      >
        <Radio.Button value="marketplace">Marketplace</Radio.Button>
        <Radio.Button value="auctions">Auctions</Radio.Button>
      </Radio.Group>

      {viewMode === 'marketplace' && (
        <>
          {loading ? (
            <Spin size="large" />
          ) : (
            <>
              {/* Filters Section */}
              <div style={{ 
                width: "100%", 
                maxWidth: "1200px",
                marginBottom: "30px",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                {/* MarketplaceFilters */}
                <div style={{ 
                  padding: "20px",
                  background: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  <MarketplaceFilters onFilterChange={handleFilterChange} />
                </div>

                {/* Rarity Filter Buttons */}
                <div style={{ 
                  padding: "15px",
                  background: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
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
              </div>

              {/* NFT Cards Grid */}
              <Row 
                gutter={[24, 24]} 
                style={{ 
                  width: "100%",
                  maxWidth: "1200px",
                  margin: "0 auto"
                }}
              >
                {paginatedNfts.map((nft) => (
                  <Col key={nft.id} xs={24} sm={12} md={8} lg={6} xl={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Card
                      hoverable
                      className="nft-card"
                      cover={
                        <div style={{ position: "relative", overflow: "hidden" }}>
                          <img 
                            alt={nft.name} 
                            src={nft.uri} 
                            style={{
                              width: "100%",
                              height: "300px",
                              objectFit: "cover",
                              transition: "transform 0.3s ease",
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                          />
                          <Tag 
                            color={rarityColors[nft.rarity]} 
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              borderRadius: "12px",
                              padding: "4px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}
                          >
                            {rarityLabels[nft.rarity]}
                          </Tag>
                        </div>
                      }
                      style={{
                        width: "100%",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                      bodyStyle={{ 
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        background: "linear-gradient(to bottom, #ffffff, #f8fafc)"
                      }}
                    >
                      <Meta
                        title={
                          <Typography.Title level={4} style={{ 
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: "600"
                          }}>
                            {nft.name}
                          </Typography.Title>
                        }
                        description={
                          <div style={{ 
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#64748b"
                          }}>
                            <UserOutlined style={{ fontSize: "14px" }} />
                            {truncateAddress(nft.owner)}
                          </div>
                        }
                      />

                      <div style={{ 
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        marginTop: "8px"
                      }}>
                        <div style={{ 
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px"
                        }}>
                          {nft.for_sale && (
                            <Button 
                              type="primary"
                              onClick={() => handleBuyClick(nft)}
                              style={{
                                height: "36px",
                                borderRadius: "8px",
                                fontWeight: "500",
                                boxShadow: "0 2px 4px rgba(24, 144, 255, 0.2)",
                              }}
                            >
                              Buy Now
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleCreateAuction(nft.id)}
                            style={{
                              height: "36px",
                              borderRadius: "8px",
                              fontWeight: "500",
                              borderColor: "#e2e8f0"
                            }}
                          >
                            Create Auction
                          </Button>
                        </div>

                        <div style={{ 
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px"
                        }}>
                          <Button 
                            onClick={() => {
                              setSelectedNftId(nft.id);
                              setIsMakeOfferModalVisible(true);
                            }}
                            style={{
                              height: "36px",
                              borderRadius: "8px",
                              fontWeight: "500",
                              background: "#f1f5f9",
                              borderColor: "transparent",
                              color: "#475569"
                            }}
                            icon={<TagOutlined />}
                          >
                            Make Offer
                          </Button>
                          <Button 
                            onClick={() => handleViewOffers(nft)}
                            style={{
                              height: "36px",
                              borderRadius: "8px",
                              fontWeight: "500",
                              background: "#f1f5f9",
                              borderColor: "transparent",
                              color: "#475569"
                            }}
                            icon={<UnorderedListOutlined />}
                          >
                            View Offers
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              <div style={{ marginTop: 30, marginBottom: 30 }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={sortedNfts.length}
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
              {selectedNftId && (
                <>
                  <CreateAuctionModal
                    visible={isCreateAuctionModalVisible}
                    onCancel={() => setIsCreateAuctionModalVisible(false)}
                    nftId={selectedNftId}
                    marketplaceAddr={marketplaceAddr}
                  />
                  <MakeOfferModal
                    visible={isMakeOfferModalVisible}
                    onCancel={() => setIsMakeOfferModalVisible(false)}
                    nftId={selectedNftId}
                    marketplaceAddr={marketplaceAddr}
                    onSuccess={() => selectedNftId && refreshOffers(selectedNftId)}
                  />
                </>
              )}
            </>
          )}
        </>
      )}

      {viewMode === 'auctions' && (
        <Row 
          gutter={[24, 24]}
          style={{ 
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto"
          }}
        >
          {activeAuctions.map((auction) => (
            <Col key={auction.nft_id} xs={24} sm={12} md={8} lg={6}>
              <AuctionCard
                nftId={auction.nft_id}
                startPrice={auction.start_price / 100000000}
                currentBid={auction.current_bid / 100000000}
                endTime={auction.end_time}
                highestBidder={auction.highest_bidder}
                onPlaceBid={(amount) => handlePlaceBid(auction.nft_id, amount)}
                marketplaceAddr={marketplaceAddr}
              />
            </Col>
          ))}
        </Row>
      )}

      {selectedAuctionNftId && (
        <CreateAuctionModal
          visible={isCreateAuctionModalVisible}
          onCancel={() => {
            setIsCreateAuctionModalVisible(false);
            setSelectedAuctionNftId(null);
          }}
          nftId={selectedAuctionNftId}
          marketplaceAddr={marketplaceAddr}
        />
      )}

      <Modal
        title={`Offers for ${selectedNft?.name}`}
        open={isOffersModalVisible}
        onCancel={() => {
          setIsOffersModalVisible(false);
          setSelectedNftOffers([]);
          setSelectedNft(null);
        }}
        footer={null}
        width={800}
      >
        <OffersDisplay
          offers={selectedNftOffers}
          isOwner={selectedNft?.owner === account?.address}
          loading={isLoadingOffers}
          onAcceptOffer={async (nftId: number, offerId: number) => {
            try {
              const payload: InputTransactionData = {
                data: {
                  function: `${marketplaceAddr}::NFTMarketplace::accept_offer`,
                  typeArguments: [],
                  functionArguments: [
                    marketplaceAddr,
                    nftId.toString(),
                    offerId.toString()
                  ]
                }
              };

              const response = await signAndSubmitTransaction(payload);
              await client.waitForTransaction(response.hash);
              message.success('Offer accepted successfully!');
              await fetchOffersForNFT(nftId);
            } catch (error) {
              console.error('Error accepting offer:', error);
              message.error('Failed to accept offer');
            }
          }}
          onCancelOffer={handleCancelOffer}
          onBatchAccept={handleBatchAccept}
        />
      </Modal>
    </div>
  );
};

export default MarketView;