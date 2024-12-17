import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Table } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { message } from 'antd';
import { AptosClient } from "aptos";
import { MoveValue, MoveStructValue } from "aptos/src/generated";

const { Title } = Typography;

interface AnalyticsProps {
  marketplaceAddr: string;
}

interface Stats {
  totalSales: number;
  totalVolume: number;
  activeListings: number;
  salesByRarity: Array<{
    rarity: number;
    sales: number;
    volume: number;
  }>;
  salesHistory: Array<{
    date: string;
    sales: number;
    volume: number;
  }>;
  userActivity: Array<{
    user: string;
    purchases: number;
    sales: number;
    volume: number;
  }>;
}

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ marketplaceAddr }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalVolume: 0,
    activeListings: 0,
    salesByRarity: [],
    salesHistory: [],
    userActivity: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats with error handling
      const basicStats = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_marketplace_stats`,
        arguments: [marketplaceAddr],
        type_arguments: [],
      }).catch(() => [0, 0, 0, []]); // Provide fallback values

      // Fetch rarity stats with error handling
      const rarityStats = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_sales_by_rarity`,
        arguments: [marketplaceAddr],
        type_arguments: [],
      }).catch(() => [[]]); // Provide fallback values

      // Type assertions and proper parsing
      const parsedSalesHistory = Array.isArray(basicStats[3]) 
        ? (basicStats[3] as any[]).map((history: any) => ({
            date: new Date(Number(history.date) * 1000).toLocaleDateString(),
            sales: Number(history.sales),
            volume: Number(history.volume) / 100000000
          }))
        : [];

      const parsedRarityStats = Array.isArray(rarityStats[0])
        ? (rarityStats[0] as any[]).map((stat: any) => ({
            rarity: Number(stat.rarity),
            sales: Number(stat.sales),
            volume: Number(stat.volume) / 100000000
          }))
        : [];

      setStats({
        totalSales: Number(basicStats[0]),
        totalVolume: Number(basicStats[1]) / 100000000,
        activeListings: Number(basicStats[2]),
        salesHistory: parsedSalesHistory,
        salesByRarity: parsedRarityStats,
        userActivity: [] // This can be implemented later if needed
      });
    } catch (error) {
      console.error("Error fetching marketplace stats:", error);
      message.error("Failed to fetch marketplace statistics");
      // Set default values on error
      setStats({
        totalSales: 0,
        totalVolume: 0,
        activeListings: 0,
        salesHistory: [],
        salesByRarity: [],
        userActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const rarityLabels: { [key: number]: string } = {
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Super Rare",
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Marketplace Analytics</Title>
      
      {/* Basic Stats Cards */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Sales"
              value={stats.totalSales}
              precision={0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Volume"
              value={stats.totalVolume}
              precision={2}
              suffix="APT"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Listings"
              value={stats.activeListings}
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* Sales History Chart */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>Sales History</Title>
        <LineChart
          width={800}
          height={400}
          data={stats.salesHistory}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Number of Sales" />
          <Line type="monotone" dataKey="volume" stroke="#82ca9d" name="Volume (APT)" />
        </LineChart>
      </Card>

      {/* Sales by Rarity Chart */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>Sales by Rarity</Title>
        <BarChart
          width={800}
          height={400}
          data={stats.salesByRarity}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rarity" tickFormatter={(value) => rarityLabels[value] || value} />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip formatter={(value, name, props) => [value, name]} />
          <Legend />
          <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Number of Sales" />
          <Bar yAxisId="right" dataKey="volume" fill="#82ca9d" name="Volume (APT)" />
        </BarChart>
      </Card>

      {/* User Activity Table */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>User Activity</Title>
        <Table
          dataSource={stats.userActivity}
          columns={[
            {
              title: 'User',
              dataIndex: 'user',
              key: 'user',
              render: (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
            },
            {
              title: 'Purchases',
              dataIndex: 'purchases',
              key: 'purchases',
              sorter: (a, b) => a.purchases - b.purchases
            },
            {
              title: 'Sales',
              dataIndex: 'sales',
              key: 'sales',
              sorter: (a, b) => a.sales - b.sales
            },
            {
              title: 'Volume (APT)',
              dataIndex: 'volume',
              key: 'volume',
              sorter: (a, b) => a.volume - b.volume,
              render: (volume: number) => volume.toFixed(2)
            }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AnalyticsDashboard; 