import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { Opportunity, Language } from '../types';

interface TrendChartProps {
  data: Opportunity[];
  language: Language;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, language }) => {
  // Transform data for the chart
  const chartData = data.map(item => ({
    name: item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title,
    fullTitle: item.title,
    score: item.automationScore,
    difficulty: item.difficulty,
  }));

  const getBarColor = (score: number) => {
    if (score > 80) return '#10b981'; // Emerald 500
    if (score > 50) return '#3b82f6'; // Blue 500
    return '#f59e0b'; // Amber 500
  };

  const t = {
    title: language === 'zh' ? '自动化潜力分析' : 'Automation Potential Analysis',
    score: language === 'zh' ? '自动化得分' : 'Automation Score',
    difficulty: language === 'zh' ? '难度' : 'Difficulty',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
          <p className="font-bold text-slate-200 mb-1">{payload[0].payload.fullTitle}</p>
          <p className="text-emerald-400">{t.score}: {payload[0].value}/100</p>
          <p className="text-slate-400">{t.difficulty}: {payload[0].payload.difficulty}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 px-2">{t.title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 11 }} 
            width={100}
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
          <ReferenceLine x={50} stroke="#334155" strokeDasharray="3 3" />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
