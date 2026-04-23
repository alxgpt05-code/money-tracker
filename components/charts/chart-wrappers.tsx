"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/formatters/currency";

const tooltipStyle = {
  backgroundColor: "rgba(9,11,8,0.94)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  color: "#f8faf5",
};

export function CapitalLineChart({ data }: { data: { date: string; capital: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
        <Line type="monotone" dataKey="capital" stroke="#b6ff4d" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBarChart({ data }: { data: { date: string; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
        <Bar dataKey="expense" radius={[10, 10, 0, 0]} fill="#fb7185" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseChart({ data }: { data: { date: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#b6ff4d" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#b6ff4d" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8be9fd" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8be9fd" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
        <Area type="monotone" dataKey="income" stroke="#b6ff4d" fill="url(#incomeFill)" strokeWidth={2.5} />
        <Area type="monotone" dataKey="expense" stroke="#8be9fd" fill="url(#expenseFill)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CompositionPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={4}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PortfolioLineChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
        <Line type="monotone" dataKey="value" stroke="#facc15" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AccountFlowBarChart({ data }: { data: { date: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={6}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(248,250,245,0.5)" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(Math.abs(value))} />
        <Bar dataKey="income" radius={[8, 8, 0, 0]} fill="#b6ff4d" />
        <Bar dataKey="expense" radius={[8, 8, 0, 0]} fill="#fb7185" />
      </BarChart>
    </ResponsiveContainer>
  );
}
