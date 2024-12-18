export interface Offer {
  nft_id: number;
  buyer: string;
  price: number;
  expiration: number;
  status: number; // 0: pending, 1: accepted, 2: rejected, 3: expired
}

export interface NFTOffer {
  [key: number]: Offer[];
} 