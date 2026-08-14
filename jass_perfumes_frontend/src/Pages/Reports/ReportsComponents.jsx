import React, { useState, useEffect } from 'react';



// DateFilter Component
export const DateFilter = ({ currentFilter, customDateRange, onFilterChange }) => {
    const [showCustom, setShowCustom] = useState(currentFilter === 'custom');

    const quickFilters = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' },
        { value: 'custom', label: 'Custom Date' }
    ];

    const handleQuickFilterChange = (filter) => {
        if (filter === 'custom') {
            setShowCustom(true);
        } else {
            setShowCustom(false);
            onFilterChange(filter);
        }
    };

    const handleCustomDateApply = () => {
        if (customDateRange.startDate && customDateRange.endDate) {
            onFilterChange('custom', customDateRange);
        }
    };

    return (
        <div className="date-filter">
            <div className="quick-filters">
                {quickFilters.map(filter => (
                    <button
                        key={filter.value}
                        className={`quick-filter-btn ${currentFilter === filter.value ? 'active' : ''}`}
                        onClick={() => handleQuickFilterChange(filter.value)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {showCustom && (
                <div className="custom-date-picker">
                    <div className="date-inputs">
                        <input
                            type="date"
                            value={customDateRange.startDate}
                            onChange={(e) => onFilterChange('custom', {
                                ...customDateRange,
                                startDate: e.target.value
                            })}
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={customDateRange.endDate}
                            onChange={(e) => onFilterChange('custom', {
                                ...customDateRange,
                                endDate: e.target.value
                            })}
                        />
                    </div>
                    <button
                        className="apply-btn"
                        onClick={handleCustomDateApply}
                        disabled={!customDateRange.startDate || !customDateRange.endDate}
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
};

// SummaryCards Component
export const SummaryCards = ({ data, type = 'sales', dateFilter, customDateRange }) => {
    if (!data?.summary) {
        return (
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="card-title">No Data Available</div>
                    <div className="card-value">-</div>
                </div>
            </div>
        );
    }

    const { summary } = data;

    const getPeriodText = () => {
        if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
            return `${customDateRange.startDate} to ${customDateRange.endDate}`;
        }
        return dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1);
    };

    const getCardsConfig = () => {
        if (type === 'sales') {
            return [
                {
                    title: 'Total Sales',
                    value: `₹${summary.totalSales?.toLocaleString('en-IN') || 0}`,
                    className: 'sales',
                    period: getPeriodText()
                },
                {
                    title: 'Items Sold',
                    value: summary.totalItemsSold?.toLocaleString('en-IN') || 0,
                    className: 'items',
                    period: getPeriodText()
                },
                {
                    title: 'Total Orders',
                    value: summary.invoiceCount?.toLocaleString('en-IN') || 0,
                    className: 'orders',
                    period: getPeriodText()
                },
                {
                    title: 'Average Order',
                    value: `₹${summary.averageOrderValue?.toFixed(2) || 0}`,
                    className: 'average',
                    period: getPeriodText()
                },
                {
                    title: 'Tax Collected',
                    value: `₹${summary.totalTax?.toLocaleString('en-IN') || 0}`,
                    className: 'tax',
                    period: getPeriodText()
                },
                {
                    title: 'Discount Given',
                    value: `₹${summary.totalDiscount?.toLocaleString('en-IN') || 0}`,
                    className: 'discount',
                    period: getPeriodText()
                }
            ];
        } else if (type === 'purchase') {
            return [
                {
                    title: 'Total Purchase',
                    value: `₹${summary.totalPurchaseValue?.toLocaleString('en-IN') || 0}`,
                    className: 'purchase',
                    period: getPeriodText()
                },
                {
                    title: 'Quantity Purchased',
                    value: summary.totalQuantityPurchased?.toLocaleString('en-IN') || 0,
                    className: 'quantity',
                    period: getPeriodText()
                },
                {
                    title: 'Avg Purchase Price',
                    value: `₹${summary.averagePurchasePrice?.toFixed(2) || 0}`,
                    className: 'average',
                    period: getPeriodText()
                },
                {
                    title: 'Purchase Transactions',
                    value: summary.purchaseCount?.toLocaleString('en-IN') || 0,
                    className: 'orders',
                    period: getPeriodText()
                },
                {
                    title: 'Unique Products',
                    value: summary.uniqueProducts?.toLocaleString('en-IN') || 0,
                    className: 'products',
                    period: getPeriodText()
                }
            ];
        }
        return [];
    };

    const cardsConfig = getCardsConfig();

    return (
        <div className="summary-cards">
            {cardsConfig.map((card, index) => (
                <div key={index} className={`summary-card ${card.className}`}>
                    <div className="card-title">{card.title}</div>
                    <div className="card-value">{card.value}</div>
                    <div className="card-period">{card.period}</div>
                </div>
            ))}
        </div>
    );
};

// Chart Component
export const ChartContainer = ({ title, children, onViewMore, height = 280 }) => {
    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>{title}</h3>
                {onViewMore && (
                    <button className="view-more-btn" onClick={onViewMore}>
                        View Details
                    </button>
                )}
            </div>
            <div className="chart-content" style={{ height: `${height}px` }}>
                {children}
            </div>
        </div>
    );
};

// SalesChart Component
export const SalesChart = ({ data, onViewMore }) => {
    const renderSimpleChart = () => {
        if (!data?.trendData) return <div className="chart-placeholder">No chart data available</div>;

        const values = data.trendData.map(item => item.sales);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue || 1;

        return (
            <svg width="100%" height="100%" viewBox="0 0 500 200">
                {data.trendData.map((item, index) => {
                    const x = (index / (data.trendData.length - 1)) * 450 + 25;
                    const y = 180 - ((item.sales - minValue) / range) * 150;
                    return (
                        <React.Fragment key={index}>
                            <circle cx={x} cy={y} r="4" fill="#667eea" />
                            {index > 0 && (
                                <line
                                    x1={((index - 1) / (data.trendData.length - 1)) * 450 + 25}
                                    y1={180 - ((data.trendData[index - 1].sales - minValue) / range) * 150}
                                    x2={x}
                                    y2={y}
                                    stroke="#667eea"
                                    strokeWidth="2"
                                />
                            )}
                            <text x={x} y="195" fontSize="10" textAnchor="middle" fill="#718096">
                                {new Date(item.date).getDate()}
                            </text>
                        </React.Fragment>
                    );
                })}
            </svg>
        );
    };

    return (
        <ChartContainer title="Sales Trend" onViewMore={onViewMore}>
            {renderSimpleChart()}
        </ChartContainer>
    );
};

// PurchaseChart Component
export const PurchaseChart = ({ data, onViewMore }) => {
    const renderSimpleChart = () => {
        if (!data?.trendData) return <div className="chart-placeholder">No chart data available</div>;

        const values = data.trendData.map(item => item.purchaseValue);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue || 1;

        return (
            <svg width="100%" height="100%" viewBox="0 0 500 200">
                {data.trendData.map((item, index) => {
                    const x = (index / (data.trendData.length - 1)) * 450 + 25;
                    const y = 180 - ((item.purchaseValue - minValue) / range) * 150;
                    return (
                        <React.Fragment key={index}>
                            <circle cx={x} cy={y} r="4" fill="#764ba2" />
                            {index > 0 && (
                                <line
                                    x1={((index - 1) / (data.trendData.length - 1)) * 450 + 25}
                                    y1={180 - ((data.trendData[index - 1].purchaseValue - minValue) / range) * 150}
                                    x2={x}
                                    y2={y}
                                    stroke="#764ba2"
                                    strokeWidth="2"
                                />
                            )}
                            <text x={x} y="195" fontSize="10" textAnchor="middle" fill="#718096">
                                {new Date(item.date).getDate()}
                            </text>
                        </React.Fragment>
                    );
                })}
            </svg>
        );
    };

    return (
        <ChartContainer title="Purchase Trend" onViewMore={onViewMore}>
            {renderSimpleChart()}
        </ChartContainer>
    );
};

// DataTable Component
export const DataTable = ({ title, data, type, onViewMore, columns, showViewAll = true }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="data-table-container">
                <div className="table-header">
                    <h3>{title}</h3>
                </div>
                <div className="table-empty">No data available</div>
            </div>
        );
    }

    const getColumnsConfig = () => {
        if (columns) return columns;

        switch (type) {
            case 'top-products':
                return [
                    { key: 'name', label: 'Product Name', width: '40%' },
                    { key: 'category', label: 'Category', width: '25%' },
                    { key: 'totalQuantity', label: 'Quantity Sold', width: '20%', format: (val) => val.toLocaleString('en-IN') },
                    { key: 'totalRevenue', label: 'Revenue', width: '15%', format: (val) => `₹${val.toLocaleString('en-IN')}` }
                ];
            case 'payment-methods':
                return [
                    { key: 'method', label: 'Payment Method', width: '50%', format: (val) => val.toUpperCase() },
                    { key: 'count', label: 'Transactions', width: '25%', format: (val) => val.toLocaleString('en-IN') },
                    { key: 'percentage', label: 'Percentage', width: '25%', format: (val) => `${val}%` }
                ];
            case 'category-purchases':
                return [
                    { key: 'category', label: 'Category', width: '40%' },
                    { key: 'totalQuantity', label: 'Quantity', width: '20%', format: (val) => val.toLocaleString('en-IN') },
                    { key: 'totalValue', label: 'Total Value', width: '20%', format: (val) => `₹${val.toLocaleString('en-IN')}` },
                    { key: 'transactionCount', label: 'Transactions', width: '20%', format: (val) => val.toLocaleString('en-IN') }
                ];
            case 'recent-purchases':
                return [
                    { key: 'productName', label: 'Product', width: '25%' },
                    { key: 'category', label: 'Category', width: '20%' },
                    { key: 'quantity', label: 'Qty', width: '15%', format: (val) => val.toLocaleString('en-IN') },
                    { key: 'price', label: 'Price', width: '15%', format: (val) => `₹${val}` },
                    { key: 'totalValue', label: 'Total', width: '15%', format: (val) => `₹${val.toLocaleString('en-IN')}` },
                    { key: 'date', label: 'Date', width: '10%', format: (val) => new Date(val).toLocaleDateString('en-IN') }
                ];
            default:
                return Object.keys(data[0]).map(key => ({
                    key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    width: `${100 / Object.keys(data[0]).length}%`
                }));
        }
    };

    const columnsConfig = getColumnsConfig();
    const displayData = data.slice(0, 5);

    return (
        <div className="data-table-container">
            <div className="table-header">
                <h3>{title}</h3>
                {showViewAll && data.length > 5 && (
                    <div className="table-actions">
                        <button className="view-all-btn" onClick={onViewMore}>
                            View All ({data.length})
                        </button>
                    </div>
                )}
            </div>

            {data.length > 5 && (
                <div className="table-summary">
                    Showing top 5 of {data.length} records
                </div>
            )}

            <table className="data-table">
                <thead>
                    <tr>
                        {columnsConfig.map((column, index) => (
                            <th key={index} style={{ width: column.width }}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columnsConfig.map((column, colIndex) => (
                                <td key={colIndex}>
                                    {column.format ? column.format(row[column.key]) : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ReportModal Component

export const ReportModal = ({ type, data, title, dateFilter, customDateRange, onClose }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'batch-details'
    const rowsPerPage = 10;

    // Add safe dateFilter handling
    const getPeriodDisplay = () => {
        if (!dateFilter) {
            return 'Not specified';
        }

        if (dateFilter === 'custom') {
            return `${customDateRange?.startDate || 'N/A'} to ${customDateRange?.endDate || 'N/A'}`;
        }

        // Safely capitalize the dateFilter
        return dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1);
    };

    const getModalTitle = () => {
        if (viewMode === 'batch-details') {
            return selectedProduct ? `${selectedProduct.productName} - Batch Details` : 'Batch Details';
        }

        return title || (() => {
            switch (type) {
                case 'sales-trend': return 'Sales Trend Analysis';
                case 'purchase-trend': return 'Purchase Trend Analysis';
                case 'top-products': return 'Top Selling Products - Complete List';
                case 'payment-methods': return 'Payment Method Analysis';
                case 'category-purchases': return 'Category-wise Purchases';
                case 'recent-purchases': return 'Recent Purchases - Complete List';
                case 'sale-details': return 'Sale Details';
                case 'all-sales': return 'All Sales';
                case 'category-details': return 'Category Details';
                case 'all-categories': return 'All Categories';
                case 'all-inventory': return 'All Inventory Products';
                case 'all-expired': return 'All Expired & Near Expiry Products';
                case 'all-disposed': return 'All Disposed Products';
                default: return 'Report Details';
            }
        })();
    };

    const totalPages = Math.ceil((data?.length || 0) / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentData = Array.isArray(data)
        ? data.slice(startIndex, startIndex + rowsPerPage)
        : data;

    // NEW: Function to handle row click for batch details
    const handleRowClick = (product, rowData = null) => {
        setSelectedProduct(product);
        setSelectedRowData(rowData);
        setViewMode('batch-details');
    };

    // NEW: Function to go back to list view
    const handleBackToList = () => {
        setViewMode('list');
        setSelectedProduct(null);
        setSelectedRowData(null);
    };

    // NEW: Render batch details view
    const renderBatchDetailsView = () => {
        if (!selectedProduct) return <div>No product selected</div>;

        const product = selectedProduct;
        const allBatches = product.allBatches || product.batches || [];
        const expiredBatches = allBatches.filter(batch => batch.isExpired || batch.expiryStatus === 'expired');
        const nearExpiryBatches = allBatches.filter(batch => batch.isNearExpiry || batch.expiryStatus === 'near-expiry');
        const goodBatches = allBatches.filter(batch => !batch.isExpired && !batch.isNearExpiry && batch.expiryStatus === 'good');
        const disposedBatches = product.disposedBatches || [];

        return (
            <div className="batch-details-view">
                <div className="batch-details-header">
                    <button className="back-button" onClick={handleBackToList}>
                        ← Back to List
                    </button>
                    <h3>{product.productName} - Batch Details</h3>
                    <div className="product-info-summary">
                        <span>Category: {product.category}</span>
                        <span>Current Stock: {product.totalQuantity}</span>
                        <span>Status: {product.status}</span>
                    </div>
                </div>

                <div className="batch-sections">
                    {/* Active Batches */}
                    {allBatches.length > 0 && (
                        <div className="batch-section">
                            <h4>Active Batches ({allBatches.length})</h4>
                            <div className="batches-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Batch Number</th>
                                            <th>Quantity</th>
                                            <th>Manufacture Date</th>
                                            <th>Expiry Date</th>
                                            <th>Days to Expiry</th>
                                            <th>Status</th>
                                            <th>Batch Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allBatches.map((batch, index) => (
                                            <tr key={index} className={batch.expiryStatus || (batch.isExpired ? 'expired' : batch.isNearExpiry ? 'near-expiry' : 'good')}>
                                                <td className="batch-number">{batch.batchNumber}</td>
                                                <td>{batch.quantity}</td>
                                                <td>{new Date(batch.manufactureDate).toLocaleDateString('en-IN')}</td>
                                                <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                                <td>{batch.daysToExpiry}</td>
                                                <td>
                                                    <span className={`status-badge ${batch.expiryStatus || (batch.isExpired ? 'expired' : batch.isNearExpiry ? 'near-expiry' : 'good')}`}>
                                                        {batch.expiryStatus === 'expired' ? 'Expired' :
                                                            batch.expiryStatus === 'near-expiry' ? `Near Expiry (${batch.daysToExpiry} days)` : 'Good'}
                                                    </span>
                                                </td>
                                                <td>₹{((batch.quantity || 0) * (product.price || 0)).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Expired Batches Summary */}
                    {expiredBatches.length > 0 && (
                        <div className="batch-section expired">
                            <h4 className="expired-title">🚨 Expired Batches ({expiredBatches.length})</h4>
                            <div className="batches-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Batch Number</th>
                                            <th>Quantity</th>
                                            <th>Expiry Date</th>
                                            <th>Days Expired</th>
                                            <th>Batch Value</th>
                                            <th>Action Required</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiredBatches.map((batch, index) => (
                                            <tr key={index} className="expired-row">
                                                <td className="batch-number">{batch.batchNumber}</td>
                                                <td className="expired-quantity">{batch.quantity}</td>
                                                <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                                <td className="days-expired">{Math.abs(batch.daysToExpiry)} days ago</td>
                                                <td className="financial-impact">₹{((batch.quantity || 0) * (product.price || 0)).toLocaleString('en-IN')}</td>
                                                <td>
                                                    <span className="action-required">IMMEDIATE DISPOSAL</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Near Expiry Batches Summary */}
                    {nearExpiryBatches.length > 0 && (
                        <div className="batch-section near-expiry">
                            <h4 className="near-expiry-title">⚠️ Near Expiry Batches ({nearExpiryBatches.length})</h4>
                            <div className="batches-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Batch Number</th>
                                            <th>Quantity</th>
                                            <th>Expiry Date</th>
                                            <th>Days to Expiry</th>
                                            <th>Batch Value</th>
                                            <th>Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nearExpiryBatches.map((batch, index) => (
                                            <tr key={index} className="near-expiry-row">
                                                <td className="batch-number">{batch.batchNumber}</td>
                                                <td className="near-expiry-quantity">{batch.quantity}</td>
                                                <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                                <td className="days-to-expiry">{batch.daysToExpiry} days</td>
                                                <td className="financial-impact">₹{((batch.quantity || 0) * (product.price || 0)).toLocaleString('en-IN')}</td>
                                                <td>
                                                    <span className={`priority-badge ${batch.daysToExpiry <= 7 ? 'high' : 'medium'}`}>
                                                        {batch.daysToExpiry <= 7 ? 'HIGH PRIORITY' : 'MEDIUM PRIORITY'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Disposed Batches */}
                    {disposedBatches.length > 0 && (
                        <div className="batch-section disposed">
                            <h4 className="disposed-title">🗑️ Disposed Batches ({disposedBatches.length})</h4>
                            <div className="batches-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Batch Number</th>
                                            <th>Quantity</th>
                                            <th>Disposal Date</th>
                                            <th>Disposal Reason</th>
                                            <th>Financial Impact</th>
                                            <th>Disposal ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disposedBatches.map((batch, index) => (
                                            <tr key={index} className="disposed-row">
                                                <td className="batch-number">{batch.batchNumber}</td>
                                                <td className="disposed-quantity">{batch.quantity}</td>
                                                <td>{new Date(batch.disposalDate).toLocaleDateString('en-IN')}</td>
                                                <td className="disposal-reason">{batch.disposalReason || 'Expired'}</td>
                                                <td className="financial-impact">₹{((batch.quantity || 0) * (product.price || 0)).toLocaleString('en-IN')}</td>
                                                <td className="disposal-id">{batch.disposalId || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Batch Summary Statistics */}
                <div className="batch-summary-stats">
                    <div className="stat-card total-batches">
                        <span className="stat-label">Total Batches</span>
                        <span className="stat-value">{allBatches.length + disposedBatches.length}</span>
                    </div>
                    <div className="stat-card expired-batches">
                        <span className="stat-label">Expired</span>
                        <span className="stat-value">{expiredBatches.length}</span>
                    </div>
                    <div className="stat-card near-expiry-batches">
                        <span className="stat-label">Near Expiry</span>
                        <span className="stat-value">{nearExpiryBatches.length}</span>
                    </div>
                    <div className="stat-card disposed-batches">
                        <span className="stat-label">Disposed</span>
                        <span className="stat-value">{disposedBatches.length}</span>
                    </div>
                </div>
            </div>
        );
    };

    // UPDATED: All Inventory Table with clickable rows
    const renderAllInventoryTable = () => {
        // Filter data based on search term
        const filteredData = data.filter(product =>
            product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.status.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

        return (
            <div className="modal-full-data">
                {/* SEARCH BAR */}
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search products by name, category or status..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                    <div className="search-results">
                        Showing {filteredData.length} of {data.length} products
                    </div>
                </div>

                <div className="data-summary">
                    <div className="summary-text">
                        Showing <span className="highlight">{filteredData.length}</span> products
                        <span className="click-hint"> ← Click any row to view batch details</span>
                    </div>
                </div>

                <div className="full-data-table clickable-rows">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Stock Status</th>
                                <th>Current Stock</th>
                                <th>Price</th>
                                <th>Total Value</th>
                                <th>Total Batches</th>
                                <th>Expired Batches</th>
                                <th>Near Expiry</th>
                                <th>Disposed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((product, index) => (
                                <tr
                                    key={startIndex + index}
                                    className="clickable-row"
                                    onClick={() => handleRowClick(product)}
                                >
                                    <td className="product-name">{product.productName}</td>
                                    <td>{product.category}</td>
                                    <td>
                                        <span className={`status-badge ${product.status?.toLowerCase().replace(' ', '-')}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="quantity">{product.totalQuantity}</td>
                                    <td>₹{product.price}</td>
                                    <td className="value">₹{(product.totalQuantity * product.price).toLocaleString('en-IN')}</td>
                                    <td>{product.allBatches?.length || product.batches?.length || 0}</td>
                                    <td className={product.expiryStats.expiredBatches > 0 ? 'expired-count' : ''}>
                                        {product.expiryStats.expiredBatches}
                                    </td>
                                    <td className={product.expiryStats.nearExpiryBatches > 0 ? 'near-expiry-count' : ''}>
                                        {product.expiryStats.nearExpiryBatches}
                                    </td>
                                    <td className={product.expiryStats.disposedBatchesCount > 0 ? 'disposed-count' : ''}>
                                        {product.expiryStats.disposedBatchesCount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="table-pagination">
                        <div className="pagination-info">
                            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} products
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? 'active' : ''}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // UPDATED: All Expired Products with clickable rows and batch display
    const renderAllExpiredProducts = () => {
        // Filter expired and near-expiry products
        const expiredProducts = data.filter(product =>
            product.expiryStats.expiredBatches > 0 || product.expiryStats.nearExpiryBatches > 0
        );

        if (expiredProducts.length === 0) {
            return <div className="table-empty">No expired or near-expiry products found</div>;
        }

        // Filter data based on search term
        const filteredData = expiredProducts.filter(product =>
            product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.status.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

        return (
            <div className="modal-full-data">
                {/* SEARCH BAR */}
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search expired/near-expiry products by name, category or status..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                    <div className="search-results">
                        Showing {filteredData.length} of {expiredProducts.length} expired/near-expiry products
                    </div>
                </div>

                <div className="data-summary">
                    <div className="summary-text">
                        Showing <span className="highlight">{filteredData.length}</span> expired/near-expiry products
                        <span style={{ marginLeft: '10px', color: '#e53e3e', fontWeight: '600' }}>
                            ({data.filter(p => p.expiryStats.expiredBatches > 0).length} expired,
                            {data.filter(p => p.expiryStats.nearExpiryBatches > 0).length} near expiry)
                        </span>
                        <span className="click-hint"> ← Click any row to view batch details</span>
                    </div>
                </div>

                <div className="full-data-table clickable-rows">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Stock Status</th>
                                <th>Current Stock</th>
                                <th>Price</th>
                                <th>Total Value</th>
                                <th>Expired Batches</th>
                                <th>Near Expiry Batches</th>
                                <th>Expired Quantity</th>
                                <th>Near Expiry Quantity</th>
                                <th>Urgency Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((product, index) => {
                                const isExpired = product.expiryStats.expiredBatches > 0;
                                const isNearExpiry = product.expiryStats.nearExpiryBatches > 0;
                                const urgencyLevel = isExpired ? 'CRITICAL' : isNearExpiry ? 'HIGH' : 'MEDIUM';

                                return (
                                    <tr
                                        key={startIndex + index}
                                        className={`clickable-row ${isExpired ? 'disposed-row' : ''}`}
                                        onClick={() => handleRowClick(product)}
                                    >
                                        <td className="product-name">{product.productName}</td>
                                        <td>{product.category}</td>
                                        <td>
                                            <span className={`status-badge ${product.status.toLowerCase().replace(' ', '-')}`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="quantity">{product.totalQuantity}</td>
                                        <td>₹{product.price}</td>
                                        <td className="value">₹{(product.totalQuantity * product.price).toLocaleString('en-IN')}</td>
                                        <td className={product.expiryStats.expiredBatches > 0 ? 'expired-count' : ''}>
                                            {product.expiryStats.expiredBatches}
                                        </td>
                                        <td className={product.expiryStats.nearExpiryBatches > 0 ? 'near-expiry-count' : ''}>
                                            {product.expiryStats.nearExpiryBatches}
                                        </td>
                                        <td className="expired-count">
                                            {product.expiryStats.totalExpiredQuantity}
                                        </td>
                                        <td className="near-expiry-count">
                                            {product.expiryStats.totalNearExpiryQuantity}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${urgencyLevel === 'CRITICAL' ? 'expired' :
                                                urgencyLevel === 'HIGH' ? 'near-expiry' : 'good'
                                                }`}>
                                                {urgencyLevel}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="table-pagination">
                        <div className="pagination-info">
                            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} products
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? 'active' : ''}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // UPDATED: All Disposed Products with clickable rows and batch display
    const renderAllDisposedProducts = () => {
        // data is an array of disposed products here
        if (!data || data.length === 0) return <div>No disposed products found</div>;

        // Filter data based on search term
        const filteredData = data.filter(product =>
            product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

        return (
            <div className="all-disposed-modal">
                <div className="modal-header-section">
                    <h3>All Disposed Products</h3>
                    <div className="total-disposed-badge">
                        {data.length} Products Disposed
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search disposed products by name or category..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                    <div className="search-results">
                        Showing {filteredData.length} of {data.length} disposed products
                    </div>
                </div>

                <div className="click-hint" style={{ textAlign: 'center', margin: '10px 0', color: '#666', fontStyle: 'italic' }}>
                    Click any product card to view detailed disposal batch information
                </div>

                <div className="disposed-products-grid clickable-cards">
                    {currentData.map((product, index) => {
                        const totalDisposed = product.disposedBatches?.reduce((sum, batch) => sum + (batch.quantity || 0), 0) || 0;
                        const financialImpact = product.disposedBatches?.reduce((sum, batch) => sum + ((batch.quantity || 0) * product.price), 0) || 0;
                        const lastDisposal = product.disposedBatches?.length > 0
                            ? new Date(Math.max(...product.disposedBatches.map(b => new Date(b.disposalDate))))
                            : null;

                        return (
                            <div
                                key={startIndex + index}
                                className="disposed-product-summary-card clickable-card"
                                onClick={() => handleRowClick(product)}
                            >
                                <div className="product-header">
                                    <h4 className="product-name">{product.productName}</h4>
                                    <span className="disposal-count">
                                        {product.disposedBatches?.length || 0} batches
                                    </span>
                                </div>
                                <div className="product-category">{product.category}</div>

                                <div className="disposal-stats">
                                    <div className="stat">
                                        <span className="stat-value">{totalDisposed}</span>
                                        <span className="stat-label">Units</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">₹{(financialImpact / 1000).toFixed(1)}K</span>
                                        <span className="stat-label">Value</span>
                                    </div>
                                </div>

                                {lastDisposal && (
                                    <div className="last-disposal">
                                        Last disposed: <span className="date">{lastDisposal.toLocaleDateString('en-IN')}</span>
                                    </div>
                                )}

                                {/* Show first 2 batch numbers for quick reference */}
                                {product.disposedBatches?.slice(0, 2).map((batch, idx) => (
                                    <div key={idx} className="batch-preview">
                                        <span className="batch-preview-number">{batch.batchNumber}</span>
                                        <span className="batch-preview-qty">{batch.quantity} units</span>
                                    </div>
                                ))}
                                {product.disposedBatches?.length > 2 && (
                                    <div className="more-batches-preview">
                                        +{product.disposedBatches.length - 2} more batches
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="table-pagination">
                        <div className="pagination-info">
                            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} products
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? 'active' : ''}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderModalContent = () => {
        if (viewMode === 'batch-details') {
            return renderBatchDetailsView();
        }

        if (viewMode === 'sale-details') {
            return renderInvoiceDetailsView();
        }

        if (!data) return <div>No data available</div>;

        switch (type) {
            case 'all-inventory':
                return renderAllInventoryTable();

            case 'all-expired':
                return renderAllExpiredProducts();

            case 'all-disposed':
                return renderAllDisposedProducts();

            case 'sales-trend':
            case 'purchase-trend':
                return renderTrendAnalysis();

            case 'top-products':
            case 'payment-methods':
            case 'category-purchases':
            case 'recent-purchases':
            case 'all-trending':
            case 'trending-details':
                return renderFullDataView();

            case 'sale-details':
                return renderSaleDetails();

            case 'all-sales':
                return renderAllSalesTableView();

            case 'category-details':
                return renderCategoryDetails();

            case 'all-categories':
                return renderAllCategories();

            case 'disposed-details':
                return renderDisposalDetails();

            case 'product-details':
                return renderProductDetails();

            default:
                return (
                    <div className="modal-full-data">
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                );
        }
    };


    const renderFullDataView = () => {
        if (!data || !Array.isArray(data)) {
            return <div className="table-empty">No data available</div>;
        }

        const filteredData = data.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

        return (
            <div className="modal-full-data">
                {/* Search Section */}
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search data..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                    <div className="search-results">
                        Showing {filteredData.length} of {data.length} records
                    </div>
                </div>

                <div className="data-summary">
                    <div className="summary-text">
                        Showing <span className="highlight">{filteredData.length}</span> records
                        {searchTerm && (
                            <span> for "<strong>{searchTerm}</strong>"</span>
                        )}
                    </div>
                </div>

                <div className="full-data-table">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {Object.keys(data[0] || {}).map((key, index) => (
                                    <th key={index}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {Object.values(row).map((value, colIndex) => (
                                        <td key={colIndex}>
                                            {typeof value === 'number'
                                                ? value.toLocaleString('en-IN')
                                                : String(value)
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="table-pagination">
                        <div className="pagination-info">
                            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} records
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? 'active' : ''}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTrendAnalysis = () => {
        if (!data || !Array.isArray(data)) {
            return <div className="table-empty">No trend data available</div>;
        }

        return (
            <div className="modal-trend-analysis">
                <div className="trend-stats">
                    <div className="stat-card">
                        <div className="stat-label">Total Records</div>
                        <div className="stat-value">{data.length}</div>
                    </div>
                    {/* <div className="stat-card">
                        <div className="stat-label">Date Range</div>
                        <div className="stat-value">
                            {data.length > 0 ? `${new Date(data[0].date).toLocaleDateString()} - ${new Date(data[data.length - 1].date).toLocaleDateString()}` : 'N/A'}
                        </div>
                    </div> */}
                </div>

                <div className="trend-table">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {Object.keys(data[0] || {}).map((key, index) => (
                                    <th key={index}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    {Object.entries(row).map(([key, value], colIndex) => ( // ✅ Changed to Object.entries to get both key and value
                                        <td key={colIndex}>
                                            {typeof value === 'number'
                                                ? key.toLowerCase().includes('sales') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('amount')
                                                    ? `₹${value.toLocaleString('en-IN')}`
                                                    : value.toLocaleString('en-IN')
                                                : String(value)
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    const renderAllSalesTableView = () => {
        if (!data || !Array.isArray(data)) return <div>No sales data available</div>;

        const displayTitle = title || `All Invoices (${data.length})`;

        return (
            <div className="modal-full-data">
                <div className="data-summary">
                    <div className="summary-text">
                        Showing <span className="highlight">{data.length}</span> invoices for {displayTitle}
                    </div>
                </div>

                <div className="full-data-table">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice No.</th>
                                <th>Customer</th>
                                <th>Time</th>
                                <th>Payment Method</th>
                                <th>Items</th>
                                {/* <th>Subtotal</th>  */}
                                <th>Tax</th>
                                <th>Discount</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((sale, index) => (
                                <tr key={sale.invoiceNumber || index}>
                                    <td className="invoice-number">{sale.invoiceNumber}</td>
                                    <td>
                                        <div className="customer-info">
                                            <div className="customer-name">{sale.customer?.name || 'N/A'}</div>
                                            {sale.customer?.phone && (
                                                <div className="customer-phone">{sale.customer.phone}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{sale.date ? new Date(sale.date).toLocaleTimeString('en-IN') : 'N/A'}</td>
                                    <td>
                                        <span className={`payment-badge ${sale.paymentType?.toLowerCase() || 'cash'}`}>
                                            {sale.paymentType?.toUpperCase() || 'CASH'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="items-count">
                                            {sale.items?.length || 0} items
                                        </div>
                                        <div className="items-preview">
                                            {sale.items?.slice(0, 2).map(item => item.name).join(', ') || 'No items'}
                                            {sale.items?.length > 2 && ` +${sale.items.length - 2} more`}
                                        </div>
                                    </td>
                                    {/* <td className="amount">₹{sale.subtotal?.toLocaleString('en-IN') || '0'}</td> */}
                                    <td className="tax">₹{sale.tax || '0'}</td>
                                    <td className="discount">₹{sale.discount || '0'}</td>
                                    <td className="total-amount">₹{sale.total?.toLocaleString('en-IN') || '0'}</td>
                                    <td>
                                        <button
                                            className="view-details-btn small"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                handleViewInvoice(sale);
                                            }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderProductDetails = () => {
        if (!data) return <div>No product data available</div>;

        return (
            <div className="product-details-modal">
                <div className="product-header-details">
                    <h3>{data.productName || data.name}</h3>
                    <span className={`status-badge large ${data.status?.toLowerCase().replace(' ', '-')}`}>
                        {data.status}
                    </span>
                </div>

                <div className="product-info-sections">
                    <div className="info-section">
                        <h4>Basic Information</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Product Name:</span>
                                <span className="value">{data.productName || data.name}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Category:</span>
                                <span className="value">{data.category}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Current Stock:</span>
                                <span className="value quantity">{data.totalQuantity}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Price:</span>
                                <span className="value">₹{data.price}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Total Value:</span>
                                <span className="value">₹{(data.totalQuantity * data.price).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="info-section">
                        <h4>Sales Performance</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Total Revenue:</span>
                                <span className="value">₹{data.totalRevenue?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Quantity Sold:</span>
                                <span className="value">{data.totalQuantitySold || data.totalQuantity}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Total Orders:</span>
                                <span className="value">{data.totalOrders}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Sale Frequency:</span>
                                <span className="value">{data.saleFrequency?.toFixed(1)}/day</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Details Section */}
                {(data.allBatches || data.batches) && (
                    <div className="batch-section">
                        <h4>Batch Details ({(data.allBatches || data.batches).length})</h4>
                        <div className="batch-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Batch Number</th>
                                        <th>Quantity</th>
                                        <th>Manufacture Date</th>
                                        <th>Expiry Date</th>
                                        <th>Days to Expiry</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.allBatches || data.batches).slice(0, 10).map((batch, index) => (
                                        <tr key={index} className={batch.expiryStatus || (batch.isExpired ? 'expired' : batch.isNearExpiry ? 'near-expiry' : 'good')}>
                                            <td className="batch-number">{batch.batchNumber}</td>
                                            <td>{batch.quantity}</td>
                                            <td>{new Date(batch.manufactureDate).toLocaleDateString('en-IN')}</td>
                                            <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                            <td>{batch.daysToExpiry}</td>
                                            <td>
                                                <span className={`status-badge ${batch.expiryStatus || (batch.isExpired ? 'expired' : batch.isNearExpiry ? 'near-expiry' : 'good')}`}>
                                                    {batch.expiryStatus === 'expired' ? 'Expired' :
                                                        batch.expiryStatus === 'near-expiry' ? `Near Expiry` : 'Good'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(data.allBatches || data.batches).length > 10 && (
                                <div className="more-batches-message">
                                    Showing 10 of {(data.allBatches || data.batches).length} batches
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Expiry Stats */}
                {data.expiryStats && (
                    <div className="expiry-stats-section">
                        <h4>Expiry Analysis</h4>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Total Batches</span>
                                <span className="stat-value">{data.expiryStats.totalBatches}</span>
                            </div>
                            <div className="stat-card expired">
                                <span className="stat-label">Expired Batches</span>
                                <span className="stat-value">{data.expiryStats.expiredBatches}</span>
                            </div>
                            <div className="stat-card near-expiry">
                                <span className="stat-label">Near Expiry</span>
                                <span className="stat-value">{data.expiryStats.nearExpiryBatches}</span>
                            </div>
                            <div className="stat-card disposed">
                                <span className="stat-label">Disposed</span>
                                <span className="stat-value">{data.expiryStats.disposedBatchesCount || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const renderSaleDetails = () => {
        const sale = selectedRowData || data;
        if (!sale) return <div className="invoice-empty">No sale data available</div>;

        // Calculate tax breakdown if available
        const taxBreakdown = sale.items?.reduce((acc, item) => {
            const taxRate = item.taxRate || 18; // Default tax rate if not provided
            const taxAmount = item.tax || (item.totalAmount * taxRate / 100);

            if (!acc[taxRate]) {
                acc[taxRate] = { rate: taxRate, amount: 0 };
            }
            acc[taxRate].amount += taxAmount;
            return acc;
        }, {});

        return (
            <div className="sale-details-modal">
                <div className="sale-details-header">
                    <div className="invoice-info">
                        <h3>Invoice: {sale.invoiceNumber}</h3>
                        <div className="invoice-date">
                            {new Date(sale.date).toLocaleDateString('en-IN')} at {new Date(sale.date).toLocaleTimeString('en-IN')}
                        </div>
                    </div>
                    <div className="customer-info">
                        <h4>Customer Details</h4>
                        <div className="customer-details">
                            <div><strong>Name:</strong> {sale.customer?.name || 'N/A'}</div>
                            <div><strong>Phone:</strong> {sale.customer?.phone || 'N/A'}</div>
                            {sale.customer?.email && <div><strong>Email:</strong> {sale.customer.email}</div>}
                        </div>
                    </div>
                </div>

                <div className="sale-items-section">
                    <h4>Items Sold ({sale.items?.length || 0})</h4>
                    <table className="sale-items-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total Amount</th>
                                <th>Tax</th>
                                <th>Discount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'product-item-highlight' : ''}>
                                    <td>{item.name}</td>
                                    <td>{item.category}</td>
                                    <td>{item.quantity}</td>
                                    <td>₹{item.price}</td>
                                    <td>₹{item.totalAmount}</td>
                                    <td>₹{item.tax || 0}</td>
                                    <td>₹{item.discount || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Tax Breakdown */}
                    {taxBreakdown && Object.keys(taxBreakdown).length > 0 && (
                        <div className="tax-breakdown">
                            <h5>Tax Breakdown</h5>
                            {Object.values(taxBreakdown).map((tax, index) => (
                                <div key={index} className="tax-row">
                                    <span className="tax-label">GST @ {tax.rate}%</span>
                                    <span className="tax-amount">₹{tax.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Items Total Summary */}
                    <div className="items-total">
                        <div className="items-total-row">
                            <span>Subtotal:</span>
                            <span>₹{sale.subtotal?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="items-total-row">
                            <span>Total Tax:</span>
                            <span>₹{sale.tax || 0}</span>
                        </div>
                        <div className="items-total-row">
                            <span>Total Discount:</span>
                            <span>₹{sale.discount || 0}</span>
                        </div>
                        <div className="items-total-row grand-total">
                            <span>Grand Total:</span>
                            <span>₹{sale.total?.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <div className="sale-summary">
                    <div className="summary-row">
                        <span>Payment Method:</span>
                        <span className={`payment-badge ${sale.paymentType?.toLowerCase() || 'cash'}`}>
                            {sale.paymentType?.toUpperCase() || 'CASH'}
                        </span>
                    </div>
                    <div className="summary-row">
                        <span>Payment Status:</span>
                        <span className="status-indicator completed">Completed</span>
                    </div>
                    {sale.invoiceNotes && (
                        <div className="summary-row">
                            <span>Notes:</span>
                            <span>{sale.invoiceNotes}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // NEW: Handle individual invoice view
    const handleViewInvoice = (invoice) => {
        setSelectedRowData(invoice);
        setViewMode('sale-details');
    };

    // NEW: Back to list view from invoice details
    const handleBackToInvoices = () => {
        setViewMode('list');
        setSelectedRowData(null);
    };

    // NEW: Render individual invoice details view
    const renderInvoiceDetailsView = () => {
        return (
            <div className="invoice-details-view">
                <div className="invoice-details-header">
                    <button className="back-button" onClick={handleBackToInvoices}>
                        ← Back to Invoices
                    </button>
                    <h3>Invoice Details - {selectedRowData?.invoiceNumber}</h3>
                </div>
                {renderSaleDetails()}
            </div>
        );
    };

    // Add these functions to the ReportModal component:

    const renderCategoryDetails = () => {
        if (!selectedRowData) return <div>No category data available</div>;

        const category = selectedRowData;

        return (
            <div className="category-details">
                <h3>{category.category} - Detailed Analysis</h3>

                <div className="category-stats-grid">
                    <div className="stat-card">
                        <h4>Sales Performance</h4>
                        <div className="stat-value">₹{category.sales?.totalSales?.toLocaleString('en-IN') || '0'}</div>
                        <div className="stat-label">Total Sales</div>
                        <div className="stat-sub">Growth: {category.sales?.growth || 0}%</div>
                    </div>

                    <div className="stat-card">
                        <h4>Purchase Analysis</h4>
                        <div className="stat-value">₹{category.purchases?.totalPurchaseValue?.toLocaleString('en-IN') || '0'}</div>
                        <div className="stat-label">Total Purchases</div>
                        <div className="stat-sub">Growth: {category.purchases?.growth || 0}%</div>
                    </div>

                    <div className="stat-card">
                        <h4>Stock Status</h4>
                        <div className="stat-value">{category.stock?.totalProducts || 0}</div>
                        <div className="stat-label">Total Products</div>
                        <div className="stat-sub">
                            In Stock: {category.stock?.totalProducts - category.stock?.lowStockProducts - category.stock?.outOfStockProducts || 0}
                        </div>
                    </div>

                    <div className="stat-card">
                        <h4>Inventory Value</h4>
                        <div className="stat-value">₹{category.stock?.totalValue?.toLocaleString('en-IN') || '0'}</div>
                        <div className="stat-label">Stock Value</div>
                        <div className="stat-sub">Average: ₹{((category.stock?.totalValue || 0) / (category.stock?.totalProducts || 1)).toFixed(2)}</div>
                    </div>
                </div>

                {/* Detailed Tables */}
                <div className="category-tables">
                    <div className="table-section">
                        <h4>Sales Breakdown</h4>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Total Orders</td>
                                    <td>{category.sales?.totalOrders || 0}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td>Total Quantity Sold</td>
                                    <td>{category.sales?.totalQuantity || 0}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td>Average Order Value</td>
                                    <td>₹{category.sales?.averageOrderValue?.toFixed(2) || '0.00'}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td>Total Tax</td>
                                    <td>₹{category.sales?.totalTax?.toLocaleString('en-IN') || '0'}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td>Total Discount</td>
                                    <td>₹{category.sales?.totalDiscount?.toLocaleString('en-IN') || '0'}</td>
                                    <td>-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="table-section">
                        <h4>Stock Breakdown</h4>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>In Stock</td>
                                    <td>{category.stock?.totalProducts - category.stock?.lowStockProducts - category.stock?.outOfStockProducts || 0}</td>
                                    <td>{(((category.stock?.totalProducts - category.stock?.lowStockProducts - category.stock?.outOfStockProducts) / category.stock?.totalProducts) * 100 || 0).toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <td>Low Stock</td>
                                    <td>{category.stock?.lowStockProducts || 0}</td>
                                    <td>{(((category.stock?.lowStockProducts || 0) / category.stock?.totalProducts) * 100 || 0).toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <td>Out of Stock</td>
                                    <td>{category.stock?.outOfStockProducts || 0}</td>
                                    <td>{(((category.stock?.outOfStockProducts || 0) / category.stock?.totalProducts) * 100 || 0).toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <td><strong>Total Products</strong></td>
                                    <td><strong>{category.stock?.totalProducts || 0}</strong></td>
                                    <td><strong>100%</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderAllCategories = () => {
        if (!data || !Array.isArray(data)) {
            return <div className="table-empty">No category data available</div>;
        }

        // Filter data based on search term
        const filteredData = data.filter(category =>
            category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(category.sales).toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(category.purchases).toLowerCase().includes(searchTerm.toLowerCase())
        );

        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

        return (
            <div className="modal-full-data">
                {/* Search Section */}
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                    <div className="search-results">
                        Showing {filteredData.length} of {data.length} categories
                    </div>
                </div>

                <div className="data-summary">
                    <div className="summary-text">
                        Showing <span className="highlight">{filteredData.length}</span> categories
                    </div>
                </div>

                <div className="full-data-table">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Total Products</th>
                                <th>Sales Revenue</th>
                                <th>Purchase Value</th>
                                <th>Stock Value</th>
                                <th>Total Orders</th>
                                <th>Sales Growth</th>
                                <th>Purchase Growth</th>
                                <th>In Stock</th>
                                <th>Low Stock</th>
                                <th>Out of Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((category, index) => (
                                <tr key={category.category || index}>
                                    <td className="category-name">{category.category}</td>
                                    <td>{category.stock?.totalProducts || 0}</td>
                                    <td className="sales-amount">₹{category.sales?.totalSales?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="purchase-amount">₹{category.purchases?.totalPurchaseValue?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="stock-value">₹{category.stock?.totalValue?.toLocaleString('en-IN') || '0'}</td>
                                    <td>{category.sales?.totalOrders || 0}</td>
                                    <td className={category.sales?.growth > 0 ? 'positive' : 'negative'}>
                                        {category.sales?.growth || 0}%
                                    </td>
                                    <td className={category.purchases?.growth > 0 ? 'positive' : 'negative'}>
                                        {category.purchases?.growth || 0}%
                                    </td>
                                    <td className="in-stock">{category.stock?.totalProducts - category.stock?.lowStockProducts - category.stock?.outOfStockProducts || 0}</td>
                                    <td className="low-stock">{category.stock?.lowStockProducts || 0}</td>
                                    <td className="out-of-stock">{category.stock?.outOfStockProducts || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="table-pagination">
                        <div className="pagination-info">
                            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} categories
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum ? 'active' : ''}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDisposalDetails = () => {
        if (!selectedRowData) return <div>No disposal data available</div>;

        return (
            <div className="disposal-details">
                <h3>{selectedRowData.productName} - Disposal History</h3>
                <div className="disposal-stats">
                    <p>Total Disposed Batches: {selectedRowData.disposedBatches?.length || 0}</p>
                    <p>Total Disposed Quantity: {selectedRowData.expiryStats?.totalDisposedExpired || 0}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="report-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{getModalTitle()}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="modal-filter-info">
                        <strong>Period:</strong> {getPeriodDisplay()}
                    </div>
                    {renderModalContent()}
                </div>
            </div>
        </div>
    );
};

// Loading Component
export const ReportLoading = () => (
    <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading report data...</p>
    </div>
);

// Error Component
export const ReportError = ({ message, onRetry }) => (
    <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Report</h3>
        <p>{message}</p>
        {onRetry && (
            <button className="retry-btn" onClick={onRetry}>
                Try Again
            </button>
        )}
    </div>
);

// Inventory Filter Component
// Updated Inventory Filter Component with Export Button
// Updated InventoryFilter Component
export const InventoryFilter = ({
    onFilterChange,
    categories,
    onExport,
    currentFilters // Add this prop to receive current filter state
}) => {
    // Initialize with current filters or defaults
    const [filters, setFilters] = useState({
        status: currentFilters?.status || 'all',
        category: currentFilters?.category || 'all',
        showBatches: currentFilters?.showBatches || false,
        expiryFilter: currentFilters?.expiryFilter || 'all',
        startDate: currentFilters?.startDate || '',
        endDate: currentFilters?.endDate || ''
    });

    // Update local state when currentFilters prop changes
    useEffect(() => {
        if (currentFilters) {
            setFilters(currentFilters);
        }
    }, [currentFilters]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        // Validate date format
        if ((key === 'startDate' || key === 'endDate') && value) {
            if (!isValidDate(value)) {
                console.log("Invalid date format");
                return;
            }
        }

        // Immediately apply filters
        onFilterChange(newFilters);
    };

    const isValidDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    };

    return (
        <div className="inventory-filter">
            <div className="filter-header">
                <div className="header-left">
                    <h3>Inventory & Expiry Analysis</h3>
                    <p>Manage stock levels and monitor product expiration</p>
                </div>
                <div className="header-right">
                    <button
                        className="export-btn"
                        onClick={() => onExport && onExport()}
                        title="Export to Excel"
                    >
                        📊 Export Excel
                    </button>
                </div>
            </div>

            <div className="filter-row">
                <div className="filter-group">
                    <label>Stock Status</label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Category</label>
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Expiry Status</label>
                    <select
                        value={filters.expiryFilter}
                        onChange={(e) => handleFilterChange('expiryFilter', e.target.value)}
                    >
                        <option value="all">All Batches</option>
                        <option value="expired">Expired Only</option>
                        <option value="near-expiry">Near Expiry (30 days)</option>
                        <option value="good">Good Condition</option>
                    </select>
                </div>

                {/* <div className="filter-group">
                    <label>Show Batch Details</label>
                    <input
                        type="checkbox"
                        checked={filters.showBatches}
                        onChange={(e) => handleFilterChange('showBatches', e.target.checked)}
                    />
                </div> */}
            </div>

            <div className="filter-row">
                <div className="filter-group">
                    <label>From Date</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="filter-group">
                    <label>To Date</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="filter-group">
                    <button
                        className="clear-filters"
                        onClick={() => {
                            const resetFilters = {
                                status: 'all',
                                category: 'all',
                                showBatches: false,
                                expiryFilter: 'all',
                                startDate: '',
                                endDate: ''
                            };
                            setFilters(resetFilters);
                            onFilterChange(resetFilters);
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Add filter status display for debugging */}
            {/* <div className="filter-status">
                <small>
                    Active Filters: {filters.status !== 'all' ? `Status: ${filters.status}` : ''}
                    {filters.category !== 'all' ? ` | Category: ${filters.category}` : ''}
                    {filters.expiryFilter !== 'all' ? ` | Expiry: ${filters.expiryFilter}` : ''}
                </small>
            </div> */}
        </div>
    );
};

export const DisposedProductsSection = ({ data, onViewMore }) => {
    // Extract disposed products from the data
    const disposedProducts = data?.inventory?.filter(product =>
        product.hasDisposedProducts || product.disposedBatches?.length > 0
    ) || [];

    if (disposedProducts.length === 0) {
        return null;
    }

    return (
        <div className="disposed-section">
            <div className="section-header">
                <h3 className="section-title">Disposed Products</h3>
                <span className="section-badge">{disposedProducts.length} products</span>
            </div>

            <div className="disposed-grid">
                {disposedProducts.slice(0, 3).map((product, index) => (
                    <DisposedProductCard
                        key={product.inventoryId || `disposed-${index}`}
                        product={product}
                        onViewMore={() => onViewMore("disposed-details", product, `${product.productName} - Disposal History`)}
                    />
                ))}
            </div>

            {disposedProducts.length > 3 && (
                <div className="view-more-section">
                    <button
                        className="view-all-btn"
                        onClick={() => onViewMore("all-disposed", disposedProducts, "All Disposed Products")}
                    >
                        View All Disposed Products ({disposedProducts.length})
                    </button>
                </div>
            )}
        </div>
    );
};

// Disposed Product Card Component
export const DisposedProductCard = ({ product, onViewMore }) => {
    const totalDisposedQuantity = product.disposedBatches?.reduce((sum, batch) => sum + (batch.quantity || 0), 0) || 0;
    const lastDisposalDate = product.disposedBatches?.length > 0
        ? new Date(Math.max(...product.disposedBatches.map(b => new Date(b.disposalDate))))
        : null;

    return (
        <div className="disposed-product-card">
            <div className="product-header">
                <h4 className="product-name">{product.productName}</h4>
                <span className="status-badge disposed">Disposed</span>
            </div>

            <div className="product-details">
                <div className="detail-row">
                    <span>Category:</span>
                    <span>{product.category}</span>
                </div>
                <div className="detail-row">
                    <span>Total Disposed:</span>
                    <span className="quantity disposed">{totalDisposedQuantity} units</span>
                </div>
                <div className="detail-row">
                    <span>Disposal Batches:</span>
                    <span>{product.disposedBatches?.length || 0}</span>
                </div>
                {/* {lastDisposalDate && (
                    <div className="detail-row">
                        <span>Last Disposal:</span>
                        <span>{lastDisposalDate.toLocaleDateString('en-IN')}</span>
                    </div>
                )} */}
                {/* <div className="detail-row">
                    <span>Current Status:</span>
                    <span className={`status ${product.status?.toLowerCase().replace(' ', '-')}`}>
                        {product.status}
                    </span>
                </div> */}
            </div>

            {/* <div className="disposal-reasons">
                <h5>Disposal Reasons:</h5>
                {product.disposedBatches?.slice(0, 2).map((batch, index) => (
                    <div key={index} className="reason-item">
                        <span className="batch-number">{batch.batchNumber}</span>
                        <span className="reason">{batch.disposalReason || 'Expired'}</span>
                        <span className="disposal-date">
                            {new Date(batch.disposalDate).toLocaleDateString('en-IN')}
                        </span>
                    </div>
                ))}
                {product.disposedBatches?.length > 2 && (
                    <div className="more-reasons">
                        +{product.disposedBatches.length - 2} more disposal records
                    </div>
                )}
            </div> */}

            {/* <button className="view-details-btn" onClick={onViewMore}>
                View Disposal Details
            </button> */}
        </div>
    );
};

// Product Card Component
export const ProductCard = ({ product, showExpiryDetails = false, onViewMore }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'In Stock': return '#10b981';
            case 'Low Stock': return '#f59e0b';
            case 'Out of Stock': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getExpiryBadge = (batch) => {
        if (batch.isExpired) {
            return { text: 'Expired', color: '#ef4444', class: 'expired' };
        } else if (batch.isNearExpiry) {
            return { text: `Expires in ${batch.daysToExpiry} days`, color: '#f59e0b', class: 'near-expiry' };
        }
        return { text: 'Good', color: '#10b981', class: 'good' };
    };

    return (
        <div className="product-card">
            <div className="product-header">
                <h4 className="product-name">{product.productName}</h4>
                <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(product.status) }}
                >
                    {product.status}
                </span>
            </div>

            <div className="product-details">
                <div className="detail-row">
                    <span>Category:</span>
                    <span>{product.category}</span>
                </div>
                <div className="detail-row">
                    <span>Current Stock:</span>
                    <span className="quantity">{product.totalQuantity}</span>
                </div>
                <div className="detail-row">
                    <span>Price:</span>
                    <span>₹{product.price}</span>
                </div>
                <div className="detail-row">
                    <span>Total Value:</span>
                    <span>₹{(product.totalQuantity * product.price).toLocaleString('en-IN')}</span>
                </div>
            </div>

            {showExpiryDetails && (
                <div className="expiry-details">
                    <div className="expiry-stats">
                        <div className="stat">
                            <span className="label">Expired Batches:</span>
                            <span className="value expired">{product.expiryStats.expiredBatches}</span>
                        </div>
                        <div className="stat">
                            <span className="label">Near Expiry:</span>
                            <span className="value near-expiry">{product.expiryStats.nearExpiryBatches}</span>
                        </div>
                    </div>
                </div>
            )}

            {product.batches && product.batches.length > 0 && (
                <div className="batch-details">
                    <h5>Batch Details:</h5>
                    {product.batches.slice(0, 2).map((batch, index) => {
                        const badge = getExpiryBadge(batch);
                        return (
                            <div key={index} className="batch-item">
                                <span className="batch-number">{batch.batchNumber}</span>
                                <span className="batch-quantity">Qty: {batch.quantity}</span>
                                <span className={`expiry-badge ${badge.class}`}>{badge.text}</span>
                            </div>
                        );
                    })}
                    {product.batches.length > 2 && (
                        <div className="more-batches">
                            +{product.batches.length - 2} more batches
                        </div>
                    )}
                </div>
            )}

            {/* <button className="view-details-btn" onClick={onViewMore}>
                View Details
            </button> */}
        </div>
    );
};

// Expiry Summary Component
export const ExpirySummary = ({ data }) => {
    if (!data) return null;

    return (
        <div className="expiry-summary">
            <div className="summary-card critical">
                <div className="summary-icon">⚠️</div>
                <div className="summary-content">
                    <h4>Expired Products</h4>
                    <div className="summary-numbers">
                        <span className="number">{data.totalExpiredBatches}</span>
                        <span className="label">batches</span>
                    </div>
                    <div className="summary-quantity">
                        {data.totalExpiredQuantity} units
                    </div>
                </div>
            </div>

            <div className="summary-card warning">
                <div className="summary-icon">⏰</div>
                <div className="summary-content">
                    <h4>Near Expiry (30 days)</h4>
                    <div className="summary-numbers">
                        <span className="number">{data.totalNearExpiryBatches}</span>
                        <span className="label">batches</span>
                    </div>
                    <div className="summary-quantity">
                        {data.totalNearExpiryQuantity} units
                    </div>
                </div>
            </div>

            <div className="summary-card info">
                <div className="summary-icon">📦</div>
                <div className="summary-content">
                    <h4>Total Inventory</h4>
                    <div className="summary-numbers">
                        <span className="number">{data.totalProducts}</span>
                        <span className="label">products</span>
                    </div>
                    <div className="summary-quantity">
                        {data.totalQuantity} units
                    </div>
                </div>
            </div>

            <div className="summary-card success">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                    <h4>Total Value</h4>
                    <div className="summary-numbers">
                        <span className="number">₹{(data.totalValue / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="summary-quantity">
                        Total stock value
                    </div>
                </div>
            </div>
        </div>
    );
};


// Product Details Modal
export const ProductDetailsModal = ({ product, onClose, title }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="product-info-section">
                        <h3>Product Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Product Name:</label>
                                <span>{product.productName}</span>
                            </div>
                            <div className="info-item">
                                <label>Category:</label>
                                <span>{product.category}</span>
                            </div>
                            <div className="info-item">
                                <label>Current Stock:</label>
                                <span className="quantity">{product.totalQuantity} units</span>
                            </div>
                            <div className="info-item">
                                <label>Price:</label>
                                <span>₹{product.price}</span>
                            </div>
                            <div className="info-item">
                                <label>Total Value:</label>
                                <span>₹{(product.totalQuantity * product.price).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="info-item">
                                <label>Status:</label>
                                <span className={`status ${product.status?.toLowerCase().replace(' ', '-')}`}>
                                    {product.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="batches-section">
                        <h3>All Batches ({product.allBatches?.length || 0})</h3>
                        <div className="batches-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Batch Number</th>
                                        <th>Quantity</th>
                                        <th>Manufacture Date</th>
                                        <th>Expiry Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.allBatches?.map((batch, index) => (
                                        <tr key={index}>
                                            <td>{batch.batchNumber}</td>
                                            <td>{batch.quantity}</td>
                                            <td>{new Date(batch.manufactureDate).toLocaleDateString('en-IN')}</td>
                                            <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <span className={`batch-status ${batch.expiryStatus}`}>
                                                    {batch.expiryStatus === 'expired' ? 'Expired' :
                                                        batch.expiryStatus === 'near-expiry' ? `Expires in ${batch.daysToExpiry} days` : 'Good'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Expiry Details Modal
export const ExpiryDetailsModal = ({ product, onClose, title }) => {
    const expiredBatches = product.allBatches?.filter(b => b.isExpired) || [];
    const nearExpiryBatches = product.allBatches?.filter(b => b.isNearExpiry) || [];
    const goodBatches = product.allBatches?.filter(b => !b.isExpired && !b.isNearExpiry) || [];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="expiry-stats-overview">
                        <h3>Expiry Summary</h3>
                        <div className="stats-grid">
                            <div className="stat-card expired">
                                <span className="stat-number">{expiredBatches.length}</span>
                                <span className="stat-label">Expired Batches</span>
                            </div>
                            <div className="stat-card near-expiry">
                                <span className="stat-number">{nearExpiryBatches.length}</span>
                                <span className="stat-label">Near Expiry Batches</span>
                            </div>
                            <div className="stat-card good">
                                <span className="stat-number">{goodBatches.length}</span>
                                <span className="stat-label">Good Batches</span>
                            </div>
                        </div>
                    </div>

                    {expiredBatches.length > 0 && (
                        <div className="batch-section">
                            <h4>Expired Batches</h4>
                            <div className="batches-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Batch Number</th>
                                            <th>Quantity</th>
                                            <th>Manufacture Date</th>
                                            <th>Expiry Date</th>
                                            <th>Days Expired</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiredBatches.map((batch, index) => (
                                            <tr key={index} className="expired-row">
                                                <td>{batch.batchNumber}</td>
                                                <td>{batch.quantity}</td>
                                                <td>{new Date(batch.manufactureDate).toLocaleDateString('en-IN')}</td>
                                                <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                                <td>
                                                    <span className="status expired">
                                                        {Math.abs(batch.daysToExpiry)} days ago
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {nearExpiryBatches.length > 0 && (
                        <div className="batch-section">
                            <h4>Near Expiry Batches (Next 30 days)</h4>
                            <div className="batches-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Batch Number</th>
                                            <th>Quantity</th>
                                            <th>Manufacture Date</th>
                                            <th>Expiry Date</th>
                                            <th>Days to Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nearExpiryBatches.map((batch, index) => (
                                            <tr key={index} className="near-expiry-row">
                                                <td>{batch.batchNumber}</td>
                                                <td>{batch.quantity}</td>
                                                <td>{new Date(batch.manufactureDate).toLocaleDateString('en-IN')}</td>
                                                <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                                <td>
                                                    <span className="status near-expiry">
                                                        {batch.daysToExpiry} days
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// All Products Modal (for View All functionality)
export const AllProductsModal = ({ products, onClose, title, type }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content large-modal">
                <div className="modal-header">
                    <h2>{title} - Total: {products.length}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="products-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Current Stock</th>
                                    <th>Price</th>
                                    <th>Total Value</th>
                                    <th>Status</th>
                                    {type === 'expired' && (
                                        <>
                                            <th>Expired Batches</th>
                                            <th>Near Expiry Batches</th>
                                            <th>Total Expired Qty</th>
                                        </>
                                    )}
                                    {type === 'disposed' && (
                                        <>
                                            <th>Disposed Batches</th>
                                            <th>Total Disposed Qty</th>
                                            <th>Last Disposal</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product, index) => (
                                    <tr key={product.inventoryId}>
                                        <td>{product.productName}</td>
                                        <td>{product.category}</td>
                                        <td>{product.totalQuantity}</td>
                                        <td>₹{product.price}</td>
                                        <td>₹{(product.totalQuantity * product.price).toLocaleString('en-IN')}</td>
                                        <td>
                                            <span className={`status ${product.status?.toLowerCase().replace(' ', '-')}`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        {type === 'expired' && (
                                            <>
                                                <td>
                                                    <span className="expired-count">
                                                        {product.expiryStats.expiredBatches}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="near-expiry-count">
                                                        {product.expiryStats.nearExpiryBatches}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="expired-quantity">
                                                        {product.expiryStats.totalExpiredQuantity}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        {type === 'disposed' && (
                                            <>
                                                <td>
                                                    <span className="disposed-count">
                                                        {product.disposedBatches?.length || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="disposed-quantity">
                                                        {product.expiryStats.totalDisposedExpired || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    {product.disposedBatches?.length > 0 ?
                                                        new Date(Math.max(...product.disposedBatches.map(b => new Date(b.disposalDate)))).toLocaleDateString('en-IN')
                                                        : '-'
                                                    }
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Disposed Details Modal
export const DisposedDetailsModal = ({ product, onClose, title }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="product-info-section">
                        <h3>Product Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Product Name:</label>
                                <span>{product.productName}</span>
                            </div>
                            <div className="info-item">
                                <label>Category:</label>
                                <span>{product.category}</span>
                            </div>
                            <div className="info-item">
                                <label>Current Stock:</label>
                                <span className="quantity">{product.totalQuantity} units</span>
                            </div>
                            <div className="info-item">
                                <label>Total Disposed:</label>
                                <span className="quantity disposed">
                                    {product.expiryStats.totalDisposedExpired || 0} units
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="disposed-batches-section">
                        <h3>Disposal History ({product.disposedBatches?.length || 0} batches)</h3>
                        <div className="batches-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Batch Number</th>
                                        <th>Quantity</th>
                                        <th>Manufacture Date</th>
                                        <th>Expiry Date</th>
                                        <th>Disposal Date</th>
                                        <th>Reason</th>
                                        <th>Disposal ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.disposedBatches?.map((batch, index) => (
                                        <tr key={index} className="disposed-row">
                                            <td>{batch.batchNumber}</td>
                                            <td>{batch.quantity}</td>
                                            <td>{new Date(batch.manufactureDate).toLocaleDateString('en-IN')}</td>
                                            <td>{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</td>
                                            <td>{new Date(batch.disposalDate).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <span className="disposal-reason">
                                                    {batch.disposalReason || 'Expired'}
                                                </span>
                                            </td>
                                            <td>
                                                <small>{batch.disposalId}</small>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Category Filter Component
export const CategoryFilter = ({
    categories,
    selectedCategory,
    dateFilter,
    customDateRange,
    onFilterChange,
    onExport
}) => {
    // Remove internal state and use props directly
    const handleFilterChange = (key, value) => {
        let newFilters = {
            category: key === 'category' ? value : selectedCategory,
            dateFilter: key === 'dateFilter' ? value : dateFilter,
            startDate: key === 'startDate' ? value : customDateRange.startDate,
            endDate: key === 'endDate' ? value : customDateRange.endDate
        };

        // Reset custom dates when changing filter type from custom
        if (key === 'dateFilter' && value !== 'custom') {
            newFilters.startDate = '';
            newFilters.endDate = '';
        }

        // Set default dates when switching to custom
        if (key === 'dateFilter' && value === 'custom') {
            const today = new Date().toISOString().split('T')[0];
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

            newFilters.startDate = oneWeekAgoStr;
            newFilters.endDate = today;
        }

        // Apply filters automatically
        onFilterChange(newFilters);
    };

    return (
        <div className="category-filter">
            <div className="filter-header">
                <div className="header-left">
                    <h3>Category Analysis Filters</h3>
                    <p>Analyze performance across product categories</p>
                </div>
                <div className="header-right">
                    <button
                        className="export-btn"
                        onClick={() => onExport && onExport()}
                        title="Export to Excel"
                    >
                        📊 Export All
                    </button>
                </div>
            </div>

            <div className="filter-controls">
                <div className="filter-group">
                    <label>Select Category</label>
                    <select
                        value={selectedCategory} // Use prop directly
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Time Period</label>
                    <select
                        value={dateFilter} // Use prop directly
                        onChange={(e) => handleFilterChange('dateFilter', e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Date</option>
                    </select>
                </div>

                {dateFilter === 'custom' && ( // Use prop directly
                    <>
                        <div className="filter-group">
                            <label>From Date</label>
                            <input
                                type="date"
                                value={customDateRange.startDate} // Use prop directly
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="filter-group">
                            <label>To Date</label>
                            <input
                                type="date"
                                value={customDateRange.endDate} // Use prop directly
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Category Summary Component
export const CategorySummary = ({ data }) => {
    if (!data) return null;

    return (
        <div className="category-summary">
            <div className="summary-card sales">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                    <h4>Total Sales</h4>
                    <div className="summary-value">₹{data.totalSales?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">Across {data.totalCategories} categories</div>
                </div>
            </div>

            <div className="summary-card purchases">
                <div className="summary-icon">📦</div>
                <div className="summary-content">
                    <h4>Total Purchases</h4>
                    <div className="summary-value">₹{data.totalPurchases?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">Inventory purchases</div>
                </div>
            </div>

            <div className="summary-card stock">
                <div className="summary-icon">🏪</div>
                <div className="summary-content">
                    <h4>Stock Value</h4>
                    <div className="summary-value">₹{data.totalStockValue?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">{data.totalProducts} products</div>
                </div>
            </div>

            <div className="summary-card orders">
                <div className="summary-icon">📊</div>
                <div className="summary-content">
                    <h4>Total Orders</h4>
                    <div className="summary-value">{data.totalOrders}</div>
                    <div className="summary-label">Customer orders</div>
                </div>
            </div>
        </div>
    );
};

// Category Card Component
export const CategoryCard = ({ category, onViewDetails }) => {
    return (
        <div className="category-card" onClick={onViewDetails}>
            <div className="category-header">
                <h4 className="category-name">{category.category}</h4>
                <div className="product-count">{category.stock.totalProducts} products</div>
            </div>

            <div className="category-stats">
                <div className="stat-row">
                    <div className="stat-item sales">
                        <span className="stat-label">Sales</span>
                        <span className="stat-value">₹{category.sales.totalSales?.toLocaleString('en-IN')}</span>
                        <span className="stat-growth">↑ {category.sales.growth}%</span>
                    </div>

                    <div className="stat-item purchases">
                        <span className="stat-label">Purchases</span>
                        <span className="stat-value">₹{category.purchases.totalPurchaseValue?.toLocaleString('en-IN')}</span>
                        <span className="stat-growth">↑ {category.purchases.growth}%</span>
                    </div>
                </div>

                <div className="stat-row">
                    <div className="stat-item stock">
                        <span className="stat-label">Stock Value</span>
                        <span className="stat-value">₹{category.stock.totalValue?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="stat-item orders">
                        <span className="stat-label">Orders</span>
                        <span className="stat-value">{category.sales.totalOrders}</span>
                    </div>
                </div>
            </div>

            <div className="category-footer">
                <div className="stock-status">
                    <span className="status-item in-stock">{category.stock.totalProducts - category.stock.lowStockProducts - category.stock.outOfStockProducts} In Stock</span>
                    <span className="status-item low-stock">{category.stock.lowStockProducts} Low Stock</span>
                    <span className="status-item out-of-stock">{category.stock.outOfStockProducts} Out of Stock</span>
                </div>
            </div>
        </div>
    );
};

// Simple Chart Components (Placeholder - you can integrate with Chart.js later)
export const CategorySalesChart = ({ data }) => {
    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Sales by Category</h3>
            </div>
            <div className="chart-content">
                <div className="simple-bars">
                    {data.slice(0, 8).map((category, index) => (
                        <div key={category.category} className="bar-item">
                            <div className="bar-label">{category.category}</div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill sales"
                                    style={{
                                        width: `${(category.sales.totalSales / Math.max(...data.map(d => d.sales.totalSales))) * 90}%`
                                    }}
                                >
                                    <span className="bar-value">₹{category.sales.totalSales?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CategoryPurchaseChart = ({ data }) => {
    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Purchases by Category</h3>
            </div>
            <div className="chart-content">
                <div className="simple-bars">
                    {data.slice(0, 8).map((category, index) => (
                        <div key={category.category} className="bar-item">
                            <div className="bar-label">{category.category}</div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill purchases"
                                    style={{
                                        width: `${(category.purchases.totalPurchaseValue / Math.max(...data.map(d => d.purchases.totalPurchaseValue || 1))) * 90}%`
                                    }}
                                >
                                    <span className="bar-value">₹{category.purchases.totalPurchaseValue?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CategoryStockChart = ({ data }) => {
    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Stock Value by Category</h3>
            </div>
            <div className="chart-content">
                <div className="simple-bars">
                    {data.slice(0, 8).map((category, index) => (
                        <div key={category.category} className="bar-item">
                            <div className="bar-label">{category.category}</div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill stock"
                                    style={{
                                        width: `${(category.stock.totalValue / Math.max(...data.map(d => d.stock.totalValue || 1))) * 90}%`
                                    }}
                                >
                                    <span className="bar-value">₹{category.stock.totalValue?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CategoryPerformanceChart = ({ data }) => {
    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Category Performance</h3>
            </div>
            <div className="chart-content">
                <div className="performance-metrics">
                    {data.slice(0, 6).map((category, index) => (
                        <div key={category.category} className="performance-item">
                            <div className="metric-name">{category.category}</div>
                            <div className="metric-bar">
                                <div
                                    className="metric-fill sales"
                                    style={{ width: `${(category.sales.totalSales / Math.max(...data.map(d => d.sales.totalSales))) * 100}%` }}
                                ></div>
                                <div
                                    className="metric-fill purchases"
                                    style={{ width: `${(category.purchases.totalPurchaseValue / Math.max(...data.map(d => d.purchases.totalPurchaseValue || 1))) * 100}%` }}
                                ></div>
                            </div>
                            <div className="metric-value">
                                ₹{category.sales.totalSales?.toLocaleString('en-IN')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// Fixed Trending Filter Component - Showing TODAY data by default
// Fixed Trending Filter Component
export const TrendingFilter = ({
    categories,
    selectedCategory,
    dateFilter,
    customDateRange,
    onFilterChange,
    onExport
}) => {
    const [filters, setFilters] = useState({
        category: selectedCategory || 'all',
        dateFilter: dateFilter || 'today',
        startDate: customDateRange?.startDate || '',
        endDate: customDateRange?.endDate || '',
        limit: 10 // Default value
    });

    // Update local state when props change - FIXED: Added limit to the dependency
    useEffect(() => {
        setFilters({
            category: selectedCategory || 'all',
            dateFilter: dateFilter || 'today',
            startDate: customDateRange?.startDate || '',
            endDate: customDateRange?.endDate || '',
            limit: filters.limit // Preserve the current limit
        });
    }, [selectedCategory, dateFilter, customDateRange]);

    // In TrendingFilter component - Fix the handleFilterChange function
    const handleFilterChange = (key, value) => {
        let newFilters = { ...filters, [key]: value };

        // Reset custom dates when changing filter type from custom
        if (key === 'dateFilter' && value !== 'custom') {
            newFilters.startDate = '';
            newFilters.endDate = '';
        }

        // Set default dates when switching to custom
        if (key === 'dateFilter' && value === 'custom') {
            const today = new Date().toISOString().split('T')[0];
            newFilters.startDate = today;
            newFilters.endDate = today;
        }

        setFilters(newFilters);

        // Apply filters automatically
        const filterParams = {
            category: newFilters.category,
            filter: newFilters.dateFilter,
            limit: newFilters.limit
        };

        // Only include custom dates if using custom filter
        if (newFilters.dateFilter === 'custom' && newFilters.startDate && newFilters.endDate) {
            filterParams.startDate = newFilters.startDate;
            filterParams.endDate = newFilters.endDate;
        }

        console.log('Applying trending filters:', filterParams);
        onFilterChange(filterParams);
    };

    return (
        <div className="trending-filter">
            <div className="filter-header">
                <div className="header-left">
                    <h3>Trending Products Analysis</h3>
                    <p>Discover your best-selling products and sales trends</p>
                </div>
                <div className="header-right">
                    <button
                        className="export-btn"
                        onClick={() => onExport && onExport()}
                        title="Export to Excel"
                    >
                        📊 Export Excel
                    </button>
                </div>
            </div>

            <div className="filter-controls">
                <div className="filter-group">
                    <label>Category</label>
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Time Period</label>
                    <select
                        value={filters.dateFilter}
                        onChange={(e) => handleFilterChange('dateFilter', e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Date</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Top Products</label>
                    <select
                        value={filters.limit}
                        onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    >
                        <option value="5">Top 5</option>
                        <option value="10">Top 10</option>
                        <option value="20">Top 20</option>
                        <option value="50">Top 50</option>
                    </select>
                </div>

                {filters.dateFilter === 'custom' && (
                    <>
                        <div className="filter-group">
                            <label>From Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="filter-group">
                            <label>To Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


// Trending Summary Component
export const TrendingSummary = ({ data }) => {
    if (!data) return null;

    return (
        <div className="trending-summary">
            <div className="summary-card products">
                <div className="summary-icon">🏆</div>
                <div className="summary-content">
                    <h4>Top Products</h4>
                    <div className="summary-value">{data.totalProducts}</div>
                    <div className="summary-label">Trending items</div>
                </div>
            </div>

            <div className="summary-card sales">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                    <h4>Total Revenue</h4>
                    <div className="summary-value">₹{data.totalRevenue?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">From trending products</div>
                </div>
            </div>

            <div className="summary-card quantity">
                <div className="summary-icon">📦</div>
                <div className="summary-content">
                    <h4>Units Sold</h4>
                    <div className="summary-value">{data.totalQuantitySold?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">Total quantity</div>
                </div>
            </div>

            <div className="summary-card frequency">
                <div className="summary-icon">⚡</div>
                <div className="summary-content">
                    <h4>Avg. Frequency</h4>
                    <div className="summary-value">{data.averageSaleFrequency?.toFixed(1)}/day</div>
                    <div className="summary-label">Sale rate</div>
                </div>
            </div>
        </div>
    );
};

// Trending Product Card Component
export const TrendingProductCard = ({ product, rank, onViewDetails }) => {
    const getRankBadge = (rank) => {
        if (rank === 1) return { class: 'rank-1', label: '🥇' };
        if (rank === 2) return { class: 'rank-2', label: '🥈' };
        if (rank === 3) return { class: 'rank-3', label: '🥉' };
        return { class: 'rank-other', label: `#${rank}` };
    };

    const rankInfo = getRankBadge(rank);

    return (
        <div className="trending-product-card" onClick={onViewDetails}>
            <div className="product-header">
                <div className="rank-badge">
                    <span className={rankInfo.class}>{rankInfo.label}</span>
                </div>
                <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <div className="product-category">{product.category}</div>
                </div>
            </div>

            <div className="sales-stats">
                <div className="stat-grid">
                    <div className="stat-item">
                        <span className="stat-label">Units Sold</span>
                        <span className="stat-value">{product.totalQuantity}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Revenue</span>
                        <span className="stat-value">₹{product.totalRevenue?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Orders</span>
                        <span className="stat-value">{product.totalOrders}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Avg. Price</span>
                        <span className="stat-value">₹{product.averagePrice?.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="performance-metrics">
                <div className="metric">
                    <span className="metric-label">Sale Frequency</span>
                    <div className="metric-bar">
                        <div
                            className="metric-fill"
                            style={{ width: `${Math.min(product.saleFrequency * 10, 100)}%` }}
                        ></div>
                        <span className="metric-value">{product.saleFrequency?.toFixed(1)}/day</span>
                    </div>
                </div>

                <div className="metric">
                    <span className="metric-label">Unique Customers</span>
                    <span className="metric-value">{product.uniqueCustomerCount}</span>
                </div>
            </div>

            <div className="product-footer">
                <div className="sale-dates">
                    <span>First: {new Date(product.firstSold).toLocaleDateString('en-IN')}</span>
                    <span>Last: {new Date(product.lastSold).toLocaleDateString('en-IN')}</span>
                </div>
            </div>
        </div>
    );
};

// Chart Components for Trending Products
export const TopProductsChart = ({ data }) => {
    const displayData = data.slice(0, 5); // Show only top 8

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Top Products by Revenue</h3>
                <span className="chart-subtitle">Showing top {displayData.length} of {data.length} products</span>
            </div>
            <div className="chart-content">
                <div className="revenue-bars">
                    {displayData.map((product, index) => (
                        <div key={product.productId} className="bar-item">
                            <div className="bar-label">{product.name}</div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill revenue"
                                    style={{
                                        width: `${(product.totalRevenue / Math.max(...data.map(d => d.totalRevenue))) * 90}%`
                                    }}
                                >
                                    <span className="bar-value">₹{product.totalRevenue?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SalesPerformanceChart = ({ data }) => {
    const displayData = data.slice(0, 3); // Show only top 6

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Sales Performance</h3>
                <span className="chart-subtitle">Showing top {displayData.length} products</span>
            </div>
            <div className="chart-content">
                <div className="performance-grid">
                    {displayData.map((product, index) => (
                        <div key={product.productId} className="performance-item">
                            <div className="product-name">{product.name}</div>
                            <div className="metrics-row">
                                <div className="metric-box">
                                    <span className="metric-label">Qty</span>
                                    <span className="metric-value">{product.totalQuantity}</span>
                                </div>
                                <div className="metric-box">
                                    <span className="metric-label">Revenue</span>
                                    <span className="metric-value">₹{product.totalRevenue?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="metric-box">
                                    <span className="metric-label">Freq</span>
                                    <span className="metric-value">{product.saleFrequency?.toFixed(1)}/d</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Daily Sales Filter Component
// Daily Sales Filter Component
export const DailySalesFilter = ({ categories, selectedCategory, selectedDate, onFilterChange, onExport }) => {
    const [filters, setFilters] = useState({
        category: selectedCategory,
        date: selectedDate
    });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="daily-sales-filter">
            <div className="filter-header">
                <div className="header-left">
                    <h3>Daily Sales Report</h3>
                    <p>Detailed analysis of sales for selected date</p>
                </div>
                <div className="header-right">
                    <button
                        className="export-btn"
                        onClick={() => onExport && onExport()}
                        title="Export to Excel"
                    >
                        📊 Export Excel
                    </button>
                </div>
            </div>

            <div className="filter-controls">
                <div className="filter-group">
                    <label>Select Date</label>
                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="filter-group">
                    <label>Category</label>
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <div className="quick-dates">
                        <label>Quick Select</label>
                        <div className="date-buttons">
                            <button
                                onClick={() => handleFilterChange('date', new Date().toISOString().split('T')[0])}
                                className={filters.date === new Date().toISOString().split('T')[0] ? 'active' : ''}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => {
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    handleFilterChange('date', yesterday.toISOString().split('T')[0]);
                                }}
                            >
                                Yesterday
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Daily Sales Summary Component
export const DailySalesSummary = ({ data }) => {
    if (!data?.summary) return null;

    const { summary } = data;

    return (
        <div className="daily-sales-summary">
            <div className="summary-card total-sales">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                    <h4>Total Sales</h4>
                    <div className="summary-value">₹{summary.totalSales?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">{data.date}</div>
                </div>
            </div>

            <div className="summary-card total-orders">
                <div className="summary-icon">📋</div>
                <div className="summary-content">
                    <h4>Total Orders</h4>
                    <div className="summary-value">{summary.totalOrders}</div>
                    <div className="summary-label">Invoices</div>
                </div>
            </div>

            <div className="summary-card total-items">
                <div className="summary-icon">📦</div>
                <div className="summary-content">
                    <h4>Items Sold</h4>
                    <div className="summary-value">{summary.totalItems}</div>
                    <div className="summary-label">Products</div>
                </div>
            </div>

            <div className="summary-card average-order">
                <div className="summary-icon">📊</div>
                <div className="summary-content">
                    <h4>Avg. Order</h4>
                    <div className="summary-value">₹{summary.averageOrderValue?.toFixed(2)}</div>
                    <div className="summary-label">Per invoice</div>
                </div>
            </div>

            <div className="summary-card tax-collected">
                <div className="summary-icon">🏛️</div>
                <div className="summary-content">
                    <h4>Tax Collected</h4>
                    <div className="summary-value">₹{summary.totalTax?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">Total tax</div>
                </div>
            </div>

            <div className="summary-card discount-given">
                <div className="summary-icon">🎁</div>
                <div className="summary-content">
                    <h4>Discount Given</h4>
                    <div className="summary-value">₹{summary.totalDiscount?.toLocaleString('en-IN')}</div>
                    <div className="summary-label">Total discount</div>
                </div>
            </div>
        </div>
    );
};

// Sales Card Component
// Sales Card Component - FIXED
export const SalesCard = ({ sale, onViewDetails }) => {
    return (
        <div className="sales-card" onClick={() => onViewDetails("sale-details", sale, `Sale Details - ${sale.invoiceNumber}`)}>
            <div className="sale-header">
                <div className="sale-info">
                    <h4 className="invoice-number">{sale.invoiceNumber}</h4>
                    <div className="customer-name">{sale.customer?.name || 'N/A'}</div>
                </div>
                <div className="sale-amount">
                    <div className="amount">₹{sale.total?.toLocaleString('en-IN')}</div>
                    <div className="payment-type">{sale.paymentType?.toUpperCase() || 'CASH'}</div>
                </div>
            </div>

            <div className="sale-details">
                <div className="detail-item">
                    <span className="label">Time:</span>
                    <span className="value">{new Date(sale.date).toLocaleTimeString('en-IN')}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Items:</span>
                    <span className="value">{sale.items?.length || 0} products</span>
                </div>
                <div className="detail-item">
                    <span className="label">Tax:</span>
                    <span className="value">₹{sale.tax || 0}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Discount:</span>
                    <span className="value">₹{sale.discount || 0}</span>
                </div>
            </div>

            <div className="sale-products">
                <div className="products-preview">
                    {sale.items?.slice(0, 3).map((item, index) => (
                        <div key={index} className="product-tag">
                            <span className="product-name">{item.name}</span>
                            <span className="product-qty">x{item.quantity}</span>
                        </div>
                    ))}
                    {sale.items?.length > 3 && (
                        <div className="more-products">+{sale.items.length - 3} more</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Hourly Sales Chart Component
export const HourlySalesChart = ({ data }) => {
    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Sales by Hour</h3>
            </div>
            <div className="chart-content">
                <div className="hourly-bars">
                    {data.map((hourData, index) => (
                        <div key={index} className="hour-bar">
                            <div className="hour-label">{hourData.hour}:00</div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill sales"
                                    style={{
                                        height: `${(hourData.sales / Math.max(...data.map(h => h.sales || 1))) * 80}%`
                                    }}
                                >
                                    <span className="bar-value">₹{hourData.sales}</span>
                                </div>
                            </div>
                            <div className="hour-orders">{hourData.orders} orders</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Payment Methods Chart Component
export const PaymentMethodsChart = ({ data }) => {
    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Payment Methods</h3>
            </div>
            <div className="chart-content">
                <div className="payment-methods">
                    {data.map((method, index) => (
                        <div key={method.method} className="payment-item">
                            <div className="payment-info">
                                <span className="method-name">{method.method.toUpperCase()}</span>
                                <span className="method-count">{method.count} orders</span>
                            </div>
                            <div className="payment-bar">
                                <div
                                    className="method-fill"
                                    style={{ width: `${method.percentage}%` }}
                                ></div>
                                <span className="method-percentage">{method.percentage}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Top Products List Component
export const TopProductsList = ({ data }) => {
    return (
        <div className="top-products-widget">
            <div className="widget-header">
                <h3>Top Selling Products</h3>
            </div>
            <div className="widget-content">
                {data.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="top-product-item">
                        <div className="product-rank">#{index + 1}</div>
                        <div className="product-info">
                            <div className="product-name">{product.name}</div>
                            <div className="product-category">{product.category}</div>
                        </div>
                        <div className="product-sales">
                            <div className="sales-quantity">{product.totalQuantity} sold</div>
                            <div className="sales-revenue">₹{product.totalRevenue?.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Category Breakdown Component
export const CategoryBreakdown = ({ data }) => {
    return (
        <div className="category-breakdown-widget">
            <div className="widget-header">
                <h3>Sales by Category</h3>
            </div>
            <div className="widget-content">
                {data.map((category, index) => (
                    <div key={category.category} className="category-item">
                        <div className="category-info">
                            <span className="category-name">{category.category}</span>
                            <span className="category-sales">₹{category.sales?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="category-details">
                            <span className="category-qty">{category.quantity} items</span>
                            <span className="category-products">{category.products} products</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Export all components
export default {
    DateFilter,
    SummaryCards,
    ChartContainer,
    SalesChart,
    PurchaseChart,
    DataTable,
    ReportModal,
    ReportLoading,
    ReportError,
    InventoryFilter,
    ProductCard,
    ExpirySummary,
    CategoryFilter,
    CategorySummary,
    CategoryCard,
    CategorySalesChart,
    CategoryPurchaseChart,
    CategoryStockChart,
    CategoryPerformanceChart,
    TrendingFilter,
    TrendingSummary,
    TrendingProductCard,
    TopProductsChart,
    SalesPerformanceChart,
    CategoryBreakdown,
    TopProductsList,
    PaymentMethodsChart,
    HourlySalesChart,
    SalesCard,
    DailySalesSummary,
    DailySalesFilter,
    DisposedProductCard,
    DisposedProductsSection
};