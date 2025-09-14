'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Zap,
  Award,
  Network
} from 'lucide-react';
import { NetworkAnalytics, User } from '@/types';

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number; alumni: number; students: number }>;
  engagement: Array<{ date: string; interactions: number; messages: number; events: number }>;
  networkStats: {
    totalConnections: number;
    averageConnections: number;
    topConnectors: Array<{ name: string; connections: number }>;
    connectionGrowth: number;
  };
  geographicData: Array<{ location: string; count: number; lat: number; lng: number }>;
  skills: Array<{ skill: string; count: number; growth: number }>;
  events: Array<{ name: string; attendance: number; satisfaction: number }>;
  realTimeMetrics: {
    activeUsers: number;
    liveEvents: number;
    messagesPerHour: number;
    networkingActivity: number;
  };
}

// D3 Visualization Components
const NetworkVisualization = ({ data, width = 400, height = 300 }: {
  data: any[];
  width?: number;
  height?: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(data)
      .force('link', d3.forceLink().id(d => (d as any).id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const links = data.slice(1).map((d, i) => ({ source: 0, target: i + 1 }));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('stroke', '#999')
      .style('stroke-opacity', 0.6)
      .style('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('r', (d, i) => i === 0 ? 12 : 8)
      .style('fill', (d, i) => i === 0 ? '#3b82f6' : '#8b5cf6')
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .call(d3.drag<SVGCircleElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    const label = svg.append('g')
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .text(d => (d as any).name)
      .style('font-size', '10px')
      .style('text-anchor', 'middle')
      .attr('dy', -15);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('cx', d => (d as any).x)
        .attr('cy', d => (d as any).y);

      label
        .attr('x', d => (d as any).x)
        .attr('y', d => (d as any).y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

const TimeSeriesChart = ({ data, width = 400, height = 200 }: {
  data: Array<{ date: string; value: number }>;
  width?: number;
  height?: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const parseTime = d3.timeParse('%Y-%m-%d');
    const processedData = data.map(d => ({
      date: parseTime(d.date) || new Date(),
      value: d.value
    }));

    const xScale = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.value) || 0])
      .range([innerHeight, 0]);

    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', innerHeight)
      .attr('x2', 0).attr('y2', 0);

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.3);

    // Add area
    const area = d3.area<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(processedData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Add line
    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(processedData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.value))
      .attr('r', 3)
      .attr('fill', '#3b82f6');

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d') as any) as any);

    g.append('g')
      .call(d3.axisLeft(yScale));

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

const SkillsWordCloud = ({ skills, width = 300, height = 200 }: {
  skills: Array<{ skill: string; count: number }>;
  width?: number;
  height?: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !skills.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const maxCount = d3.max(skills, d => d.count) || 1;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    skills.forEach((skill, i) => {
      const fontSize = 10 + (skill.count / maxCount) * 20;
      const angle = (i / skills.length) * 2 * Math.PI;
      const radius = 30 + Math.random() * 50;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', `${fontSize}px`)
        .attr('fill', color(i.toString()))
        .attr('font-weight', 'bold')
        .text(skill.skill)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this).transition().duration(200).attr('font-size', `${fontSize + 4}px`);
        })
        .on('mouseout', function() {
          d3.select(this).transition().duration(200).attr('font-size', `${fontSize}px`);
        });
    });

  }, [skills, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

const GeographicMap = ({ data, width = 400, height = 250 }: {
  data: Array<{ location: string; count: number; lat: number; lng: number }>;
  width?: number;
  height?: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Simple world map representation
    const projection = d3.geoNaturalEarth1()
      .scale(width / 7)
      .translate([width / 2, height / 2]);

    const maxCount = d3.max(data, d => d.count) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxCount])
      .range([2, 20]);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxCount]);

    // Add world map outline (simplified)
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f0f9ff');

    // Add data points
    data.forEach(d => {
      const coords = projection([d.lng, d.lat]);
      if (coords) {
        svg.append('circle')
          .attr('cx', coords[0])
          .attr('cy', coords[1])
          .attr('r', radiusScale(d.count))
          .attr('fill', colorScale(d.count))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('opacity', 0.8)
          .append('title')
          .text(`${d.location}: ${d.count} users`);
      }
    });

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
};

interface AnalyticsDashboardProps {
  user: User;
  userRole: 'super_admin' | 'admin' | 'alumni' | 'student';
}

export default function AnalyticsDashboard({ user, userRole }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimeRange, setActiveTimeRange] = useState('7d');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Mock data for hackathon
  const mockData: AnalyticsData = {
    userGrowth: [
      { date: '2024-01-01', users: 100, alumni: 60, students: 40 },
      { date: '2024-01-02', users: 120, alumni: 70, students: 50 },
      { date: '2024-01-03', users: 140, alumni: 85, students: 55 },
      { date: '2024-01-04', users: 165, alumni: 100, students: 65 },
      { date: '2024-01-05', users: 190, alumni: 115, students: 75 },
      { date: '2024-01-06', users: 220, alumni: 130, students: 90 },
      { date: '2024-01-07', users: 250, alumni: 150, students: 100 },
    ],
    engagement: [
      { date: '2024-01-01', interactions: 450, messages: 120, events: 5 },
      { date: '2024-01-02', interactions: 520, messages: 150, events: 7 },
      { date: '2024-01-03', interactions: 680, messages: 180, events: 8 },
      { date: '2024-01-04', interactions: 750, messages: 200, events: 10 },
      { date: '2024-01-05', interactions: 820, messages: 230, events: 12 },
      { date: '2024-01-06', interactions: 900, messages: 250, events: 15 },
      { date: '2024-01-07', interactions: 1050, messages: 280, events: 18 },
    ],
    networkStats: {
      totalConnections: 1250,
      averageConnections: 8.5,
      topConnectors: [
        { name: 'Alice Johnson', connections: 45 },
        { name: 'Bob Smith', connections: 38 },
        { name: 'Carol Williams', connections: 32 },
        { name: 'David Brown', connections: 28 },
        { name: 'Eva Davis', connections: 25 }
      ],
      connectionGrowth: 15.2
    },
    geographicData: [
      { location: 'San Francisco', count: 85, lat: 37.7749, lng: -122.4194 },
      { location: 'New York', count: 120, lat: 40.7128, lng: -74.0060 },
      { location: 'London', count: 65, lat: 51.5074, lng: -0.1278 },
      { location: 'Tokyo', count: 45, lat: 35.6762, lng: 139.6503 },
      { location: 'Sydney', count: 30, lat: -33.8688, lng: 151.2093 },
      { location: 'Toronto', count: 55, lat: 43.6532, lng: -79.3832 }
    ],
    skills: [
      { skill: 'JavaScript', count: 85, growth: 12.5 },
      { skill: 'Python', count: 78, growth: 18.2 },
      { skill: 'Machine Learning', count: 65, growth: 25.8 },
      { skill: 'React', count: 72, growth: 15.3 },
      { skill: 'Data Science', count: 58, growth: 22.1 },
      { skill: 'Cloud Computing', count: 45, growth: 30.2 },
      { skill: 'Blockchain', count: 35, growth: 45.6 },
      { skill: 'DevOps', count: 42, growth: 20.5 }
    ],
    events: [
      { name: 'Tech Meetup 2024', attendance: 150, satisfaction: 4.8 },
      { name: 'Career Fair', attendance: 200, satisfaction: 4.6 },
      { name: 'Alumni Reunion', attendance: 300, satisfaction: 4.9 },
      { name: 'Startup Pitch Event', attendance: 120, satisfaction: 4.7 }
    ],
    realTimeMetrics: {
      activeUsers: 47,
      liveEvents: 3,
      messagesPerHour: 85,
      networkingActivity: 92
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData(mockData);
      setLoading(false);
    }, 1000);

    // Set up real-time updates
    if (realTimeUpdates) {
      const interval = setInterval(() => {
        setAnalyticsData(prev => prev ? {
          ...prev,
          realTimeMetrics: {
            activeUsers: Math.floor(Math.random() * 20) + 40,
            liveEvents: Math.floor(Math.random() * 3) + 2,
            messagesPerHour: Math.floor(Math.random() * 30) + 70,
            networkingActivity: Math.floor(Math.random() * 20) + 80
          }
        } : null);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [realTimeUpdates]);

  if (loading || !analyticsData) {
    return (
      <div className="analytics-dashboard p-6">
        <div className="grid gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const networkData = analyticsData.networkStats.topConnectors.map((connector, i) => ({
    id: i,
    name: connector.name,
    connections: connector.connections
  }));

  const engagementTimeSeriesData = analyticsData.engagement.map(d => ({
    date: d.date,
    value: d.interactions
  }));

  const userGrowthData = analyticsData.userGrowth.map(d => ({
    date: d.date,
    value: d.users
  }));

  return (
    <div className="analytics-dashboard max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            {userRole === 'super_admin' ? 'Platform-wide analytics' : 'Institution analytics'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={realTimeUpdates ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Real-time Updates
          </Button>
          <div className="flex rounded-lg overflow-hidden border">
            {['1d', '7d', '30d', '90d'].map(range => (
              <Button
                key={range}
                variant={activeTimeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTimeRange(range)}
                className="rounded-none"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.realTimeMetrics.activeUsers}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently online</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-200">
              <div 
                className="h-1 bg-green-600 transition-all duration-1000"
                style={{ width: `${(analyticsData.realTimeMetrics.activeUsers / 60) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Live Events</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.realTimeMetrics.liveEvents}
                </p>
                <p className="text-xs text-gray-500 mt-1">In progress</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-200">
              <div 
                className="h-1 bg-purple-600 transition-all duration-1000"
                style={{ width: `${(analyticsData.realTimeMetrics.liveEvents / 5) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages/Hour</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analyticsData.realTimeMetrics.messagesPerHour}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last hour</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-200">
              <div 
                className="h-1 bg-blue-600 transition-all duration-1000"
                style={{ width: `${(analyticsData.realTimeMetrics.messagesPerHour / 100) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Networking Activity</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsData.realTimeMetrics.networkingActivity}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Engagement score</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Network className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-200">
              <div 
                className="h-1 bg-orange-600 transition-all duration-1000"
                style={{ width: `${analyticsData.realTimeMetrics.networkingActivity}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart 
                  data={userGrowthData} 
                  width={400} 
                  height={200} 
                />
                <div className="mt-4 flex justify-between text-sm text-gray-600">
                  <span>Growth Rate: +15.2%</span>
                  <span>Total Users: {analyticsData.userGrowth[analyticsData.userGrowth.length - 1].users}</span>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engagement Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart 
                  data={engagementTimeSeriesData} 
                  width={400} 
                  height={200} 
                />
                <div className="mt-4 flex justify-between text-sm text-gray-600">
                  <span>Peak Engagement: 1,050</span>
                  <span>Avg Daily Growth: +18.5%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Network Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Connections</span>
                    <span className="font-semibold">{analyticsData.networkStats.totalConnections.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg per User</span>
                    <span className="font-semibold">{analyticsData.networkStats.averageConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Growth Rate</span>
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      +{analyticsData.networkStats.connectionGrowth}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.skills.slice(0, 5).map((skill, index) => (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{skill.skill}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(skill.count / 100) * 100} className="w-16 h-2" />
                        <span className="text-sm font-medium">{skill.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.events.map((event, index) => (
                    <div key={event.name} className="flex flex-col">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {event.name}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {event.attendance}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < Math.floor(event.satisfaction) ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">{event.satisfaction}/5.0</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <NetworkVisualization data={networkData} width={400} height={300} />
                <p className="text-sm text-gray-600 mt-4">
                  Interactive network showing top connectors and their relationships
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Connectors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.networkStats.topConnectors.map((connector, index) => (
                    <div key={connector.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{connector.name}</span>
                      </div>
                      <Badge variant="outline">{connector.connections} connections</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GeographicMap data={analyticsData.geographicData} width={500} height={300} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.geographicData.map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{location.location}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(location.count / 120) * 100} 
                          className="w-16 h-2" 
                        />
                        <span className="text-sm text-gray-600">{location.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills Landscape</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillsWordCloud skills={analyticsData.skills} width={600} height={300} />
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {analyticsData.skills.map(skill => (
                  <div key={skill.skill} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{skill.count}</Badge>
                      <Badge 
                        variant={skill.growth > 20 ? "default" : "secondary"}
                        className={skill.growth > 20 ? "bg-green-100 text-green-700" : ""}
                      >
                        +{skill.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {analyticsData.engagement.map((day, index) => (
                    <div key={day.date} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{day.interactions}</div>
                      <div className="text-sm text-gray-600">Interactions</div>
                      <div className="mt-2 text-lg font-semibold">{day.messages}</div>
                      <div className="text-xs text-gray-500">Messages</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}