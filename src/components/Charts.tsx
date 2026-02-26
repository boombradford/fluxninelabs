import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TimeSeriesChartProps {
    data: Array<{ date: string;[key: string]: any }>;
    dataKey: string;
    color?: string;
    height?: number;
    showGrid?: boolean;
    type?: 'line' | 'area';
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
    data,
    dataKey,
    color = '#60a5fa',
    height = 300,
    showGrid = true,
    type = 'line'
}) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-400 text-xs mb-1">{payload[0].payload.date}</p>
                    <p className="text-white font-bold text-sm">
                        {payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    const ChartComponent = type === 'area' ? AreaChart : LineChart;
    const DataComponent = type === 'area' ? Area : Line;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={data}>
                {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                )}
                <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    style={{ fontSize: '12px' }}
                    tickLine={false}
                />
                <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    style={{ fontSize: '12px' }}
                    tickLine={false}
                    tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                        return value;
                    }}
                />
                <Tooltip content={<CustomTooltip />} />
                <DataComponent
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    fill={type === 'area' ? `url(#gradient-${dataKey})` : undefined}
                    strokeWidth={2}
                    dot={false}
                />
                {type === 'area' && (
                    <defs>
                        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                )}
            </ChartComponent>
        </ResponsiveContainer>
    );
};

interface MultiLineChartProps {
    data: Array<{ date: string;[key: string]: any }>;
    lines: Array<{ dataKey: string; color: string; name: string }>;
    height?: number;
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
    data,
    lines,
    height = 300
}) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-400 text-xs mb-2">{payload[0].payload.date}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-300 text-xs">{entry.name}:</span>
                            <span className="text-white font-bold text-xs">{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    style={{ fontSize: '12px' }}
                    tickLine={false}
                />
                <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    style={{ fontSize: '12px' }}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    iconType="circle"
                />
                {lines.map((line) => (
                    <Line
                        key={line.dataKey}
                        type="monotone"
                        dataKey={line.dataKey}
                        stroke={line.color}
                        name={line.name}
                        strokeWidth={2}
                        dot={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

interface BarChartProps {
    data: Array<{ name: string; value: number; color?: string }>;
    height?: number;
    horizontal?: boolean;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({
    data,
    height = 300,
    horizontal = false
}) => {
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-bold text-sm">{payload[0].payload.name}</p>
                    <p className="text-slate-400 text-xs mt-1">
                        Count: {payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                {horizontal ? (
                    <>
                        <XAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
                    </>
                ) : (
                    <>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
                        <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
                    </>
                )}
                <Tooltip content={<CustomTooltip />} />
                <Bar
                    dataKey="value"
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

// Mini sparkline for metric cards
interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    color = '#60a5fa',
    height = 40
}) => {
    const chartData = data.map((value, index) => ({ index, value }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    fill="url(#sparkline-gradient)"
                    strokeWidth={2}
                    dot={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
