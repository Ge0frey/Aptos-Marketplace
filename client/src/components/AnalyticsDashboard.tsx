import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const { Title } = Typography;

interface AnalyticsProps {
  marketplaceAddr: string;
}

const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ marketplaceAddr }) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalVolume: 0,
    activeListings: 0,
    salesHistory: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Implement your stats fetching logic here
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Marketplace Analytics</Title>
      
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
          <Line type="monotone" dataKey="sales" stroke="#8884d8" />
          <Line type="monotone" dataKey="volume" stroke="#82ca9d" />
        </LineChart>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard; 