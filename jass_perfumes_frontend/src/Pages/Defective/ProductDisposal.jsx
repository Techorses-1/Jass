import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../Components/Sidebar/Navbar";
import {
    FaSearch,
    FaChevronDown,
    FaChevronUp,
    FaTrash,
    FaExclamationTriangle,
    FaCalendarTimes,
    FaHistory,
    FaFilter,
    FaFileExport
} from "react-icons/fa";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProductDisposal.scss";

const ProductDisposal = () => {
    const [inventory, setInventory] = useState([]);
    const [disposalHistory, setDisposalHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState(null);

    // Selection states
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [disposalType, setDisposalType] = useState(""); // "defective" or "expired"
    const [productSearch, setProductSearch] = useState("");

    // Defective disposal states
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [defectiveQuantity, setDefectiveQuantity] = useState("");
    const [defectiveReason, setDefectiveReason] = useState("");

    // Expired disposal states
    const [expiredBatches, setExpiredBatches] = useState([]);
    const [selectedExpiredBatches, setSelectedExpiredBatches] = useState(new Set());

    // History filter states
    const [historyFilter, setHistoryFilter] = useState("all"); // all, defective, expired
    const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
    const [searchHistoryTerm, setSearchHistoryTerm] = useState("");

    // UI states
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchInventory();
        fetchDisposalHistory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/get-inventory`);
            if (response.data.success) {
                setInventory(Array.isArray(response.data.data) ? response.data.data : []);
            } else {
                setError(response.data.message || "Failed to load inventory data");
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            setError("Failed to load inventory data");
            setLoading(false);
        }
    };

    const fetchDisposalHistory = async (filters = {}) => {
        setHistoryLoading(true);
        try {
            const params = new URLSearchParams();
            if (historyFilter !== 'all') params.append('type', historyFilter);
            if (dateFilter !== 'all') {
                const dates = getDateRange(dateFilter);
                if (dates.start) params.append('startDate', dates.start);
                if (dates.end) params.append('endDate', dates.end);
            }

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/inventory/disposal-history?${params}`
            );

            if (response.data.success) {
                setDisposalHistory(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching disposal history:", error);
            toast.error("Failed to load disposal history");
        }
        setHistoryLoading(false);
    };

    const getDateRange = (range) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of day

        switch (range) {
            case 'today':
                const startOfToday = new Date(today);
                startOfToday.setHours(0, 0, 0, 0);
                return {
                    start: startOfToday.toISOString(),
                    end: today.toISOString()
                };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - 6); // Last 7 days including today
                weekStart.setHours(0, 0, 0, 0);
                return {
                    start: weekStart.toISOString(),
                    end: today.toISOString()
                };
            case 'month':
                const monthStart = new Date(today);
                monthStart.setDate(today.getDate() - 29); // Last 30 days including today
                monthStart.setHours(0, 0, 0, 0);
                return {
                    start: monthStart.toISOString(),
                    end: today.toISOString()
                };
            default:
                return { start: null, end: null };
        }
    };

    // Filter products for search
    const filteredProducts = useMemo(() => {
        if (!productSearch) return inventory;
        return inventory.filter(item =>
            item.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
            item.productId.toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [inventory, productSearch]);

    // Filter disposal history
    const filteredDisposalHistory = useMemo(() => {
        let result = disposalHistory;

        // Apply search filter
        if (searchHistoryTerm) {
            const term = searchHistoryTerm.toLowerCase();
            result = result.filter(item =>
                item.productName.toLowerCase().includes(term) ||
                item.productId.toLowerCase().includes(term) ||
                item.disposalId.toLowerCase().includes(term)
            );
        }

        return result;
    }, [disposalHistory, searchHistoryTerm]);

    // Get available batches for selected product (for defective disposal)
    const availableBatches = useMemo(() => {
        if (!selectedProduct) return [];
        return selectedProduct.batches?.filter(batch => batch.quantity > 0) || [];
    }, [selectedProduct]);

    // Get expired batches for selected product
    const getExpiredBatches = useMemo(() => {
        if (!selectedProduct) return [];
        const today = new Date();
        return selectedProduct.batches?.filter(batch =>
            new Date(batch.expiryDate) < today && batch.quantity > 0
        ) || [];
    }, [selectedProduct]);

    // Handle product selection
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setProductSearch("");
        setDisposalType("");
        setSelectedBatch(null);
        setDefectiveQuantity("");
        setDefectiveReason("");
        setSelectedExpiredBatches(new Set());

        // Auto-detect if product has expired batches
        const expiredBatchesList = getExpiredBatches;
        setExpiredBatches(expiredBatchesList);
    };

    // Handle disposal type selection
    const handleDisposalTypeSelect = (type) => {
        setDisposalType(type);
        if (type === "expired") {
            const expiredBatchesList = getExpiredBatches;
            setExpiredBatches(expiredBatchesList);
        }
    };

    // Handle defective disposal
    const handleDefectiveDisposal = async () => {
        if (!selectedBatch || !defectiveQuantity || !defectiveReason) {
            toast.error("Please fill all required fields");
            return;
        }

        if (parseInt(defectiveQuantity) > selectedBatch.quantity) {
            toast.error(`Cannot remove more than available quantity (${selectedBatch.quantity})`);
            return;
        }

        if (parseInt(defectiveQuantity) <= 0) {
            toast.error("Quantity must be greater than 0");
            return;
        }

        try {
            const disposalData = {
                productId: selectedProduct.productId,
                batchNumber: selectedBatch.batchNumber,
                quantity: parseInt(defectiveQuantity),
                type: "defective",
                reason: defectiveReason,
                disposalDate: new Date()
            };

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/inventory/dispose-product`, disposalData);

            if (response.data.success) {
                toast.success("Defective products disposed successfully!");
                resetForm();
                fetchInventory();
                fetchDisposalHistory(); // Refresh history
            }
        } catch (error) {
            console.error("Error disposing defective products:", error);
            toast.error("Error disposing products: " + (error.response?.data?.message || error.message));
        }
    };

    // Handle expired disposal
    const handleExpiredDisposal = async () => {
        if (selectedExpiredBatches.size === 0) {
            toast.error("Please select at least one expired batch to dispose");
            return;
        }

        try {
            const disposalData = {
                productId: selectedProduct.productId,
                type: "expired",
                batches: Array.from(selectedExpiredBatches).map(batchIndex => ({
                    batchNumber: expiredBatches[batchIndex].batchNumber,
                    quantity: expiredBatches[batchIndex].quantity
                })),
                disposalDate: new Date()
            };

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/inventory/dispose-product`, disposalData);

            if (response.data.success) {
                toast.success("Expired products disposed successfully!");
                resetForm();
                fetchInventory();
                fetchDisposalHistory(); // Refresh history
            }
        } catch (error) {
            console.error("Error disposing expired products:", error);
            toast.error("Error disposing products: " + (error.response?.data?.message || error.message));
        }
    };

    // Toggle expired batch selection
    const toggleExpiredBatchSelection = (batchIndex) => {
        setSelectedExpiredBatches(prev => {
            const newSet = new Set(prev);
            if (newSet.has(batchIndex)) {
                newSet.delete(batchIndex);
            } else {
                newSet.add(batchIndex);
            }
            return newSet;
        });
    };

    // Reset form
    const resetForm = () => {
        setSelectedProduct(null);
        setDisposalType("");
        setProductSearch("");
        setSelectedBatch(null);
        setDefectiveQuantity("");
        setDefectiveReason("");
        setSelectedExpiredBatches(new Set());
        setExpiredBatches([]);
    };

    // Toggle row expansion in history
    const toggleHistoryRow = (disposalId) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(disposalId)) {
                newSet.delete(disposalId);
            } else {
                newSet.add(disposalId);
            }
            return newSet;
        });
    };

    // Handle history filter change
    const handleHistoryFilterChange = (filter) => {
        setHistoryFilter(filter);
        fetchDisposalHistoryWithFilters(filter, dateFilter);
    };

    // Handle date filter change
    const handleDateFilterChange = (filter) => {
        setDateFilter(filter);
        fetchDisposalHistoryWithFilters(historyFilter, filter);
    };

    // Export disposal history
    const fetchDisposalHistoryWithFilters = async (typeFilter, dateFilter) => {
        setHistoryLoading(true);
        try {
            const params = new URLSearchParams();

            // Type filter
            if (typeFilter && typeFilter !== 'all') {
                params.append('type', typeFilter);
            }

            // Date filter
            if (dateFilter && dateFilter !== 'all') {
                const dates = getDateRange(dateFilter);
                if (dates.start) params.append('startDate', dates.start);
                if (dates.end) params.append('endDate', dates.end);
            }

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/inventory/disposal-history?${params}`
            );

            if (response.data.success) {
                setDisposalHistory(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching disposal history:", error);
            toast.error("Failed to load disposal history");
        }
        setHistoryLoading(false);
    };

    // Get status badge class
    const getStatusBadgeClass = (type) => {
        return type === 'defective' ? 'defective-badge' : 'expired-badge';
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Export disposal history to Excel
    const handleExportHistory = async () => {
        try {
            // Get all data without pagination for export
            const params = new URLSearchParams();
            if (historyFilter !== 'all') params.append('type', historyFilter);
            if (dateFilter !== 'all') {
                const dates = getDateRange(dateFilter);
                if (dates.start) params.append('startDate', dates.start);
                if (dates.end) params.append('endDate', dates.end);
            }
            params.append('limit', '10000'); // Large limit to get all records

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/inventory/disposal-history?${params}`
            );

            if (!response.data.success) {
                throw new Error('Failed to fetch data for export');
            }

            const exportData = response.data.data || [];

            if (exportData.length === 0) {
                toast.info('No data to export');
                return;
            }

            // Create Excel data
            const excelData = [
                // Headers
                ['Disposal ID', 'Product Name', 'Product ID', 'Category', 'Type', 'Total Quantity Disposed', 'Reason', 'Disposal Date', 'Disposed By', 'Batch Count']
            ];

            // Add rows
            exportData.forEach(record => {
                excelData.push([
                    record.disposalId,
                    record.productName,
                    record.productId,
                    record.category,
                    record.type === 'defective' ? 'Defective' : 'Expired',
                    record.totalQuantityDisposed,
                    record.reason || (record.type === 'expired' ? 'Expired' : 'Not specified'),
                    new Date(record.disposalDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    record.disposedBy || 'System',
                    record.batches ? record.batches.length : 0
                ]);
            });

            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(excelData);

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Disposal History');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `disposal-history-${timestamp}.xlsx`;

            // Download file
            XLSX.writeFile(workbook, filename);

            toast.success(`Exported ${exportData.length} records successfully!`);

        } catch (error) {
            console.error('Error exporting disposal history:', error);

            // Fallback to CSV if XLSX fails
            try {
                await exportToCSV();
            } catch (csvError) {
                toast.error('Failed to export data. Please try again.');
            }
        }
    };

    // Fallback CSV export
    const exportToCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (historyFilter !== 'all') params.append('type', historyFilter);
            if (dateFilter !== 'all') {
                const dates = getDateRange(dateFilter);
                if (dates.start) params.append('startDate', dates.start);
                if (dates.end) params.append('endDate', dates.end);
            }
            params.append('limit', '10000');

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/inventory/disposal-history?${params}`
            );

            const exportData = response.data.data || [];

            if (exportData.length === 0) {
                toast.info('No data to export');
                return;
            }

            // Create CSV content
            const headers = ['Disposal ID', 'Product Name', 'Type', 'Quantity', 'Reason', 'Date', 'Disposed By'];
            let csvContent = "data:text/csv;charset=utf-8,";

            // Add headers
            csvContent += headers.map(header => `"${header}"`).join(",") + "\r\n";

            // Add data rows
            exportData.forEach(record => {
                const row = [
                    record.disposalId,
                    record.productName,
                    record.type === 'defective' ? 'Defective' : 'Expired',
                    record.totalQuantityDisposed,
                    record.reason || (record.type === 'expired' ? 'Expired' : 'Not specified'),
                    new Date(record.disposalDate).toLocaleDateString(),
                    record.disposedBy || 'System'
                ];
                csvContent += row.map(field => `"${field}"`).join(",") + "\r\n";
            });

            // Download CSV
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `disposal-history-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exported ${exportData.length} records as CSV!`);
        } catch (error) {
            console.error('Error in CSV export:', error);
            throw error;
        }
    };

    if (error) {
        return (
            <Navbar>
                <div className="product-disposal-page">
                    <div className="error-message">{error}</div>
                </div>
            </Navbar>
        );
    }

    return (
        <Navbar>
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div className="product-disposal-page">
                {/* <div className="page-header">
                    <h2>Product Disposal Management</h2>
                    <div className="subtitle">Manage defective and expired products with complete audit trail</div>
                </div> */}

                {/* Product Selection Section */}
                <div className="selection-section">
                    <div className="section-card">
                        <h3>1. Select Product</h3>
                        <div className="form-group">
                            <label>Search Product *</label>
                            <div className="searchable-dropdown">
                                <input
                                    type="text"
                                    placeholder="Type product name or ID..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    disabled={!!selectedProduct}
                                />
                                {productSearch && !selectedProduct && (
                                    <div className="dropdown-options">
                                        {filteredProducts.map(product => (
                                            <div
                                                key={product.inventoryId}
                                                className="dropdown-option"
                                                onClick={() => handleProductSelect(product)}
                                            >
                                                <div className="product-option">
                                                    <div className="product-name">{product.productName}</div>
                                                    <div className="product-details">
                                                        ID: {product.productId} | Stock: {product.totalQuantity} | Status: {product.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <div className="dropdown-option no-results">
                                                No products found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedProduct && (
                            <div className="product-info-card">
                                <h4>Selected Product</h4>
                                <div className="product-details-grid">
                                    <div className="detail-item">
                                        <label>Product Name:</label>
                                        <span>{selectedProduct.productName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Product ID:</label>
                                        <span>{selectedProduct.productId}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Category:</label>
                                        <span>{selectedProduct.category}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Current Stock:</label>
                                        <span className={`stock-status ${selectedProduct.status.toLowerCase().replace(' ', '-')}`}>
                                            {selectedProduct.totalQuantity} ({selectedProduct.status})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Disposal Type Selection */}
                    {selectedProduct && !disposalType && (
                        <div className="section-card">
                            <h3>2. Select Disposal Type</h3>
                            <div className="disposal-type-options">
                                <div
                                    className={`type-option ${availableBatches.length === 0 ? 'disabled' : ''}`}
                                    onClick={() => availableBatches.length > 0 && handleDisposalTypeSelect("defective")}
                                >
                                    <div className="type-icon defective">
                                        <FaExclamationTriangle />
                                    </div>
                                    <div className="type-content">
                                        <h4>Defective Products</h4>
                                        <p>Remove defective items from specific batches</p>
                                        {availableBatches.length === 0 && (
                                            <small className="warning">No available batches</small>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={`type-option ${getExpiredBatches.length === 0 ? 'disabled' : ''}`}
                                    onClick={() => getExpiredBatches.length > 0 && handleDisposalTypeSelect("expired")}
                                >
                                    <div className="type-icon expired">
                                        <FaCalendarTimes />
                                    </div>
                                    <div className="type-content">
                                        <h4>Expired Products</h4>
                                        <p>Dispose expired batches</p>
                                        {getExpiredBatches.length === 0 ? (
                                            <small className="info">No expired batches</small>
                                        ) : (
                                            <small className="warning">{getExpiredBatches.length} expired batch(s) found</small>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Defective Disposal Form */}
                    {selectedProduct && disposalType === "defective" && (
                        <div className="section-card">
                            <h3>3. Defective Product Disposal</h3>
                            <div className="disposal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Select Batch *</label>
                                        <select
                                            value={selectedBatch ? selectedBatch.batchNumber : ""}
                                            onChange={(e) => {
                                                const batch = availableBatches.find(b => b.batchNumber === e.target.value);
                                                setSelectedBatch(batch);
                                                setDefectiveQuantity("");
                                            }}
                                        >
                                            <option value="">Select a batch</option>
                                            {availableBatches.map(batch => (
                                                <option key={batch.batchNumber} value={batch.batchNumber}>
                                                    {batch.batchNumber} (Available: {batch.quantity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Quantity to Remove *</label>
                                        <input
                                            type="number"
                                            value={defectiveQuantity}
                                            onChange={(e) => setDefectiveQuantity(e.target.value)}
                                            placeholder="Enter quantity"
                                            min="1"
                                            max={selectedBatch ? selectedBatch.quantity : 0}
                                            disabled={!selectedBatch}
                                        />
                                        {selectedBatch && (
                                            <small>Max: {selectedBatch.quantity} units available</small>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Reason for Defect *</label>
                                    <select
                                        value={defectiveReason}
                                        onChange={(e) => setDefectiveReason(e.target.value)}
                                    >
                                        <option value="">Select reason</option>
                                        <option value="damaged">Damaged during handling</option>
                                        <option value="manufacturing">Manufacturing defect</option>
                                        <option value="transport">Transport damage</option>
                                        <option value="storage">Storage issue</option>
                                        <option value="quality">Quality control failure</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {defectiveReason === "other" && (
                                    <div className="form-group">
                                        <label>Specify Reason</label>
                                        <input
                                            type="text"
                                            placeholder="Enter specific reason..."
                                            onChange={(e) => setDefectiveReason(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={resetForm}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="dispose-btn defective"
                                        onClick={handleDefectiveDisposal}
                                        disabled={!selectedBatch || !defectiveQuantity || !defectiveReason}
                                    >
                                        <FaTrash /> Dispose Defective Products
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expired Disposal Form */}
                    {selectedProduct && disposalType === "expired" && (
                        <div className="section-card">
                            <h3>3. Expired Product Disposal</h3>
                            <div className="expired-batches-section">
                                {expiredBatches.length > 0 ? (
                                    <>
                                        <div className="batch-selection-header">
                                            <h4>Select Expired Batches to Dispose</h4>
                                            <div className="selection-info">
                                                {selectedExpiredBatches.size} batch(es) selected
                                            </div>
                                        </div>

                                        <div className="expired-batches-list">
                                            {expiredBatches.map((batch, index) => (
                                                <div
                                                    key={batch.batchNumber}
                                                    className={`expired-batch-card ${selectedExpiredBatches.has(index) ? 'selected' : ''}`}
                                                    onClick={() => toggleExpiredBatchSelection(index)}
                                                >
                                                    <div className="batch-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedExpiredBatches.has(index)}
                                                            onChange={() => { }}
                                                        />
                                                    </div>
                                                    <div className="batch-info">
                                                        <div className="batch-number">{batch.batchNumber}</div>
                                                        <div className="batch-details">
                                                            <span>Quantity: {batch.quantity}</span>
                                                            <span>Manufactured: {new Date(batch.manufactureDate).toLocaleDateString()}</span>
                                                            <span>Expired: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="expiry-status">
                                                        <FaCalendarTimes />
                                                        Expired
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                type="button"
                                                className="cancel-btn"
                                                onClick={resetForm}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="dispose-btn expired"
                                                onClick={handleExpiredDisposal}
                                                disabled={selectedExpiredBatches.size === 0}
                                            >
                                                <FaTrash /> Dispose Selected Batches
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-expired-batches">
                                        <FaCalendarTimes className="no-data-icon" />
                                        <h4>No Expired Batches</h4>
                                        <p>There are no expired batches for this product.</p>
                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={resetForm}
                                        >
                                            Back to Selection
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Disposal History Section */}
                <div className="history-section">
                    <div className="section-card">
                        <div className="section-header-with-actions">
                            <div className="section-title">
                                <FaHistory className="title-icon" />
                                <h3>Disposal History</h3>
                                <span className="record-count">({filteredDisposalHistory.length} records)</span>
                            </div>
                            <div className="section-actions">
                                <div className="filter-group">
                                    <div className="filter-with-icon">
                                        <FaFilter className="filter-icon" />
                                        <select
                                            value={historyFilter}
                                            onChange={(e) => handleHistoryFilterChange(e.target.value)}
                                            className="history-filter"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="defective">Defective Only</option>
                                            <option value="expired">Expired Only</option>
                                        </select>
                                    </div>
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => handleDateFilterChange(e.target.value)}
                                        className="date-filter"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">Last 7 Days</option>
                                        <option value="month">Last 30 Days</option>
                                    </select>
                                </div>
                                <div className="search-container">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search history..."
                                        value={searchHistoryTerm}
                                        onChange={(e) => setSearchHistoryTerm(e.target.value)}
                                    />
                                </div>
                                <button className="export-btn" onClick={handleExportHistory}>
                                    <FaFileExport /> Export
                                </button>
                            </div>
                        </div>

                        <div className="history-table-container">
                            {historyLoading ? (
                                <div className="loading-history">
                                    <div className="table-loader"></div>
                                    <p>Loading disposal history...</p>
                                </div>
                            ) : filteredDisposalHistory.length === 0 ? (
                                <div className="no-history-data">
                                    <FaHistory className="no-data-icon" />
                                    <h4>No Disposal Records Found</h4>
                                    <p>There are no disposal records matching your criteria.</p>
                                </div>
                            ) : (
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            {/* <th>Disposal ID</th>  */}
                                            <th>Product Name</th>
                                            <th>Type</th>
                                            <th>Quantity Disposed</th>
                                            <th>Reason</th>
                                            <th>Disposal Date</th>
                                            <th>Disposed By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDisposalHistory.map((record) => (
                                            <React.Fragment key={record.disposalId}>
                                                <tr
                                                    className={`history-clickable-row ${expandedRows.has(record.disposalId) ? 'expanded' : ''}`}
                                                    onClick={() => toggleHistoryRow(record.disposalId)}
                                                >
                                                    <td className="expand-icon">
                                                        {expandedRows.has(record.disposalId) ? <FaChevronUp /> : <FaChevronDown />}
                                                    </td>
                                                    {/* <td className="disposal-id">{record.disposalId}</td>  */}
                                                    <td>
                                                        <div className="product-info-small">
                                                            <div className="product-name">{record.productName}</div>
                                                            {/* <div className="product-id">ID: {record.productId}</div>  */}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`disposal-type-badge ${getStatusBadgeClass(record.type)}`}>
                                                            {record.type === 'defective' ? 'Defective' : 'Expired'}
                                                        </span>
                                                    </td>
                                                    <td className="quantity-cell">
                                                        <span className="quantity-badge">{record.totalQuantityDisposed}</span>
                                                    </td>
                                                    <td className="reason-cell">
                                                        {record.reason || (record.type === 'expired' ? 'Expired' : 'Not specified')}
                                                    </td>
                                                    <td className="date-cell">
                                                        {formatDate(record.disposalDate)}
                                                    </td>
                                                    <td className="disposed-by">
                                                        {record.disposedBy || 'System'}
                                                    </td>
                                                </tr>
                                                {expandedRows.has(record.disposalId) && (
                                                    <tr className="batch-details-history-row">
                                                        <td colSpan="8">
                                                            <div className="batch-details-expanded">
                                                                <h4>Batch Details</h4>
                                                                {record.batches && record.batches.length > 0 ? (
                                                                    <div className="batch-details-grid">
                                                                        {record.batches.map((batch, index) => (
                                                                            <div key={index} className="batch-detail-card">
                                                                                <div className="batch-header">
                                                                                    <span className="batch-number">{batch.batchNumber}</span>
                                                                                    <span className="batch-quantity">{batch.quantity} units</span>
                                                                                </div>
                                                                                <div className="batch-dates">
                                                                                    <div className="date-info">
                                                                                        <label>Manufactured:</label>
                                                                                        <span>{new Date(batch.manufactureDate).toLocaleDateString()}</span>
                                                                                    </div>
                                                                                    <div className="date-info">
                                                                                        <label>Expired:</label>
                                                                                        <span>{new Date(batch.expiryDate).toLocaleDateString()}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="no-batch-details">No batch details available</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Summary Statistics */}
                        {filteredDisposalHistory.length > 0 && (
                            <div className="history-summary">
                                <div className="summary-card defective">
                                    <div className="summary-icon">
                                        <FaExclamationTriangle />
                                    </div>
                                    <div className="summary-content">
                                        <div className="summary-value">
                                            {filteredDisposalHistory.filter(r => r.type === 'defective').length}
                                        </div>
                                        <div className="summary-label">Defective Disposals</div>
                                    </div>
                                </div>
                                <div className="summary-card expired">
                                    <div className="summary-icon">
                                        <FaCalendarTimes />
                                    </div>
                                    <div className="summary-content">
                                        <div className="summary-value">
                                            {filteredDisposalHistory.filter(r => r.type === 'expired').length}
                                        </div>
                                        <div className="summary-label">Expired Disposals</div>
                                    </div>
                                </div>
                                <div className="summary-card total">
                                    <div className="summary-icon">
                                        <FaTrash />
                                    </div>
                                    <div className="summary-content">
                                        <div className="summary-value">
                                            {filteredDisposalHistory.reduce((sum, record) => sum + record.totalQuantityDisposed, 0)}
                                        </div>
                                        <div className="summary-label">Total Units Disposed</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Navbar>
    );
};

export default ProductDisposal;