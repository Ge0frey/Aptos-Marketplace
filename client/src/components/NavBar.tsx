import React, { useEffect, useState } from "react";
import { Layout, Typography, Menu, Space, Button, Dropdown, message } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";
import { AccountBookOutlined, DownOutlined, LogoutOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { truncateAddress } from '../utils/helpers';

const { Header } = Layout;
const { Text } = Typography;

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

interface NavBarProps {
  onMintNFTClick: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onMintNFTClick }) => {
  const { connected, account, network, disconnect } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        try {
          const resources: any[] = await client.getAccountResources(account.address);
          const accountResource = resources.find(
            (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
          );
          if (accountResource) {
            const balanceValue = (accountResource.data as any).coin.value;
            setBalance(balanceValue ? parseInt(balanceValue) / 100000000 : 0);
          } else {
            setBalance(0);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    if (connected) {
      fetchBalance();
    }
  }, [account, connected]);

  const handleLogout = async () => {
    try {
      await disconnect();
      setBalance(null);
      message.success("Disconnected from wallet");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      message.error("Failed to disconnect from wallet");
    }
  };

  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "white",
        padding: "0 24px",
        height: "72px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
      <img src="/Aptos_Primary_WHT.png" alt="Aptos Logo" style={{ height: "30px", marginRight: 16 }} />
        
        <Menu 
          mode="horizontal" 
          selectedKeys={[location.pathname]}
          style={{ 
            border: "none",
            background: "transparent",
          }}
        >
          <Menu.Item key="/" style={{ margin: "0 10px" }}>
            <Link to="/">Marketplace</Link>
          </Menu.Item>
          <Menu.Item key="/my-nfts" style={{ margin: "0 10px" }}>
            <Link to="/my-nfts">My Collection</Link>
          </Menu.Item>
          <Menu.Item key="mint-nft" style={{ margin: "0 10px" }} onClick={onMintNFTClick}>
            Mint NFT
          </Menu.Item>
          <Menu.Item key="/analytics" style={{ margin: "0 10px" }}>
            <Link to="/analytics">Analytics</Link>
          </Menu.Item>
          <Menu.Item key="/royalties" style={{ margin: "0 10px" }}>
            <Link to="/royalties">Royalties</Link>
          </Menu.Item>
        </Menu>
      </div>

      <Space size="large" style={{ marginLeft: "auto" }}>
        {connected && account ? (
          <Dropdown
            overlay={
              <Menu style={{ 
                padding: "8px",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                minWidth: "200px"
              }}>
                <Menu.Item key="address" style={{ padding: "8px 16px" }}>
                  <Text strong>Address:</Text> <br />
                  <Text copyable>{account.address}</Text>
                </Menu.Item>
                <Menu.Item key="network" style={{ padding: "8px 16px" }}>
                  <Text strong>Network:</Text> {network ? network.name : "Unknown"}
                </Menu.Item>
                <Menu.Item key="balance" style={{ padding: "8px 16px" }}>
                  <Text strong>Balance:</Text> {balance !== null ? `${balance} APT` : "Loading..."}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  key="logout" 
                  icon={<LogoutOutlined />} 
                  onClick={handleLogout}
                  style={{ padding: "8px 16px" }}
                >
                  Log Out
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button 
              type="primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "44px",
                borderRadius: "22px",
                padding: "0 16px",
              }}
            >
              <img 
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${account.address}`}
                alt="Avatar"
                style={{ 
                  width: "24px",
                  height: "24px",
                  borderRadius: "12px",
                }}
              />
              {truncateAddress(account.address)}
              <DownOutlined style={{ fontSize: "12px" }} />
            </Button>
          </Dropdown>
        ) : (
          <WalletSelector />
        )}
      </Space>
    </Header>
  );
};

export default NavBar;