import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import Papa from 'papaparse'
import { Finance, Asset } from '../../../shared/types'

// Helper to format currency
const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount)
}

// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
}

// --- COMPONENTS ---

// 1. Asset Card with glassmorphism
const AssetCard = ({ asset }: { asset: Asset }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.02)',
            position: 'relative',
            overflow: 'hidden'
        }}
        onMouseEnter={(e: any) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
        }}
        onMouseLeave={(e: any) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#71717a', fontWeight: 500, letterSpacing: '-0.01em' }}>{asset.type}</span>
            <span style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 600 }}>{asset.currency}</span>
        </div>
        <div style={{ fontSize: '1.375rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>
            {asset.name}
        </div>
        <div style={{ fontSize: '1.25rem', color: '#fff', opacity: 0.95, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(asset.balance, asset.currency)}
        </div>
    </motion.div>
)

// Define local type for chart data
interface ChartDataPoint {
    date: string
    income: number
    expense: number
}

// --- MAIN COMPONENT ---
export function FinanceView() {
    const [finances, setFinances] = useState<Finance[]>([])
    const [assets, setAssets] = useState<Asset[]>([])
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [loadedFinances, loadedAssets] = await Promise.all([
                window.api.getFinances(),
                window.api.getAssets()
            ])
            setFinances(loadedFinances)
            setAssets(loadedAssets)
            processChartData(loadedFinances)
        } catch (error) {
            console.error('Failed to load finance data:', error)
        }
    }

    const processChartData = (data: Finance[]) => {
        // Get last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            return date.toISOString().split('T')[0]
        })

        // Initialize with zeros
        const grouped = last7Days.reduce((acc, date) => {
            acc[date] = { date, income: 0, expense: 0 }
            return acc
        }, {} as Record<string, ChartDataPoint>)

        // Add actual data
        data.forEach(curr => {
            const date = curr.date.split('T')[0]
            if (grouped[date]) {
                if (curr.type === 'income') grouped[date].income += curr.amount
                if (curr.type === 'expense') grouped[date].expense += curr.amount
            }
        })

        const sorted = Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setChartData(sorted)
    }

    // Handle CSV Import
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                console.log('Parsed Transaction:', results.data)
                alert(`Parsed ${results.data.length} rows. Mapping feature coming soon!`)
            }
        })
    }

    const totalAssets = assets.reduce((sum, asset) => sum + asset.balance, 0)
    const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0)
    const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0)

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '2.5rem 3rem',
            gap: '2.5rem',
            color: '#fff',
            overflowY: 'auto',
            background: '#0A0A0A'
        }}>

            {/* Header & Overview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 600, margin: 0, letterSpacing: '-0.03em' }}>Finance</h1>
                    <p style={{ color: '#71717a', marginTop: '0.75rem', fontSize: '1rem', letterSpacing: '-0.01em' }}>Track your wealth and cash flows</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '0.875rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '0.875rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontWeight: 500,
                            fontSize: '0.9375rem',
                            letterSpacing: '-0.01em',
                            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                        }}
                    >
                        Import CSV
                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </motion.label>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '0.875rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '0.875rem',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            cursor: 'pointer',
                            letterSpacing: '-0.01em',
                            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                        }}
                    >
                        + Add Asset
                    </motion.button>
                </div>
            </div>

            {/* Net Worth & Assets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {/* Total Net Worth Card */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        color: '#fff',
                        padding: '2rem',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
                >
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.7, letterSpacing: '0.05em' }}>NET WORTH</span>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(totalAssets)}
                    </div>
                </motion.div>

                {/* Existing Assets */}
                {assets.map(asset => (
                    <AssetCard key={asset.id} asset={asset} />
                ))}
                {assets.length === 0 && (
                    <div style={{
                        border: '2px dashed rgba(255, 255, 255, 0.1)',
                        borderRadius: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#52525b',
                        padding: '2rem',
                        minHeight: '150px'
                    }}>
                        No assets added yet
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    minHeight: '400px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    padding: '2rem',
                    borderRadius: '1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.02)'
                }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Cash Flow</h3>
                    <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem', letterSpacing: '-0.01em' }}>Last 7 days trend</p>
                </div>

                {/* Summary Stats */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>INCOME</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                            {formatCurrency(totalIncome)}
                        </div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>EXPENSES</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                            {formatCurrency(totalExpense)}
                        </div>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#52525b"
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            stroke="#52525b"
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(0, 0, 0, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.75rem',
                                backdropFilter: 'blur(20px)',
                                padding: '1rem'
                            }}
                            itemStyle={{ fontSize: '0.875rem', color: '#fff', fontWeight: 500 }}
                            labelStyle={{ color: '#71717a', marginBottom: '0.5rem' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#ffffff"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                            name="Income"
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            stroke="rgba(255, 255, 255, 0.5)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                            name="Expense"
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Recent Transactions */}
            <div>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#fff', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Recent Transactions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {finances.slice(0, 10).map(item => (
                        <motion.div
                            key={item.id}
                            whileHover={{ x: 4, scale: 1.01 }}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(20px)',
                                padding: '1.25rem 1.5rem',
                                borderRadius: '0.875rem',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: item.type === 'income' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid ${item.type === 'income' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '1.25rem',
                                    fontWeight: 600
                                }}>
                                    {item.type === 'income' ? '↗' : '↘'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>{item.category}</div>
                                    <div style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '0.25rem' }}>{item.description || formatDate(item.date)}</div>
                                </div>
                            </div>
                            <div style={{
                                fontWeight: 700,
                                fontSize: '1.125rem',
                                color: '#fff',
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '-0.02em'
                            }}>
                                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                            </div>
                        </motion.div>
                    ))}
                    {finances.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#52525b', fontSize: '0.9375rem' }}>No transactions found</div>
                    )}
                </div>
            </div>

        </div>
    )
}
