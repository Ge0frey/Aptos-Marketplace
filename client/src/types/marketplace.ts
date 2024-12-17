export interface Offer {
  nft_id: number;
  buyer: string;
  price: number;
  expiration: number;
  status: number;
}

export interface NFTOffer {
  [key: number]: Offer[];
} 