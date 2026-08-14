import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Sidebar/Navbar";
import * as XLSX from 'xlsx';

import {
    DateFilter,
    SummaryCards,
    SalesChart,
    PurchaseChart,
    DataTable,
    ReportModal,
    ReportLoading,
    InventoryFilter,
    ProductCard,
    ExpirySummary,
    CategoryFilter, // ADD THIS
    CategorySummary, // ADD THIS
    CategoryCard, // ADD THIS
    CategorySalesChart, // ADD THIS
    CategoryPurchaseChart, // ADD THIS
    CategoryStockChart, // ADD THIS
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
    DisposedProductsSection,
    DisposedProductCard,
    ProductDetailsModal,
    ExpiryDetailsModal,
    AllProductsModal,
    DisposedDetailsModal
} from "./ReportsComponents";
import "./Report.scss";
import "react-toastify/dist/ReactToastify.css";

const Report = () => {
    const [activeReport, setActiveReport] = useState("sales-purchase");
    const [dateFilter, setDateFilter] = useState("today");
    const [customDateRange, setCustomDateRange] = useState({
        startDate: "",
        endDate: ""
    });
    const [salesData, setSalesData] = useState(null);
    const [purchaseData, setPurchaseData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [modalType, setModalType] = useState("");
    const [modalTitle, setModalTitle] = useState("");

    const [inventoryData, setInventoryData] = useState(null);
    const [inventoryLoading, setInventoryLoading] = useState(false);

    const [categoryData, setCategoryData] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);

    const [trendingData, setTrendingData] = useState(null);
    const [trendingLoading, setTrendingLoading] = useState(false);

    const [dailySalesData, setDailySalesData] = useState(null);
    const [dailySalesLoading, setDailySalesLoading] = useState(false);

    const [inventoryFilters, setInventoryFilters] = useState({
        status: 'all',
        category: 'all',
        showBatches: false,
        expiryFilter: 'all',
        startDate: '',
        endDate: ''
    });

    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        data: null,
        title: ''
    });


    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const navigate = useNavigate();

    const reportTypes = [
        { id: "sales-purchase", name: "Sales & Purchase", icon: "📊" },
        { id: "inventory-expiry", name: "Inventory & Expiry", icon: "📦" },
        { id: "category", name: "Category Analysis", icon: "🏷️" },
        { id: "trending-products", name: "Trending Products", icon: "🔥" },
        { id: "daily-sale", name: "Daily Sales", icon: "📈" },
        // { id: "sale-amount", name: "Sale Amount", icon: "💰" } 
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Professional Inventory & Expiry Export Handler
    // Professional Inventory & Expiry Export Handler - Clean Data Only
    const handleExportInventoryData = (inventoryData) => {
        if (!inventoryData || !inventoryData.inventory) {
            toast.error("No inventory data available to export");
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ==================== SHEET 1: INVENTORY SUMMARY ====================
        const inventorySummary = [
            ['INVENTORY REPORT SUMMARY'],
            [''],
            ['Report Generated', new Date().toLocaleString('en-IN')],
            ['Total Products', inventoryData.summary.totalProducts],
            ['Total Inventory Value', `₹${inventoryData.summary.totalValue?.toLocaleString('en-IN')}`],
            ['Total Stock Quantity', inventoryData.summary.totalQuantity],
            ['In Stock Products', inventoryData.summary.inStock],
            ['Low Stock Products', inventoryData.summary.lowStock],
            ['Out of Stock Products', inventoryData.summary.outOfStock],
            ['Expired Batches', inventoryData.summary.totalExpiredBatches],
            ['Near Expiry Batches', inventoryData.summary.totalNearExpiryBatches]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(inventorySummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Inventory Summary');

        // ==================== SHEET 2: PRODUCT INVENTORY DATA ====================
        const inventoryDetails = inventoryData.inventory.map(product => ({
            'Product ID': product.productId,
            'Product Name': product.productName,
            'Category': product.category,
            'HSN Code': product.hsnCode,
            'Current Stock': product.totalQuantity,
            'Unit Price (₹)': product.price,
            'Total Value (₹)': product.totalQuantity * product.price,
            'Stock Status': product.status,
            'Tax Slab': `${product.taxSlab}%`,
            'Total Batches': product.expiryStats.totalBatches,
            'Expired Batches': product.expiryStats.expiredBatches,
            'Near Expiry Batches': product.expiryStats.nearExpiryBatches,
            'Expired Quantity': product.expiryStats.totalExpiredQuantity,
            'Near Expiry Quantity': product.expiryStats.totalNearExpiryQuantity,
            'Disposed Quantity': product.expiryStats.disposedQuantity
        }));

        const wsInventory = XLSX.utils.json_to_sheet(inventoryDetails);
        XLSX.utils.book_append_sheet(wb, wsInventory, 'Product Inventory');

        // ==================== SHEET 3: BATCH EXPIRY DATA ====================
        const batchData = [];
        inventoryData.inventory.forEach(product => {
            product.allBatches?.forEach(batch => {
                batchData.push({
                    'Product Name': product.productName,
                    'Category': product.category,
                    'Batch Number': batch.batchNumber,
                    'Manufacture Date': new Date(batch.manufactureDate).toLocaleDateString('en-IN'),
                    'Expiry Date': new Date(batch.expiryDate).toLocaleDateString('en-IN'),
                    'Days to Expiry': batch.daysToExpiry,
                    'Batch Quantity': batch.quantity,
                    'Batch Value (₹)': batch.quantity * product.price,
                    'Expiry Status': batch.expiryStatus
                });
            });
        });

        const wsBatches = XLSX.utils.json_to_sheet(batchData);
        XLSX.utils.book_append_sheet(wb, wsBatches, 'Batch Details');

        // ==================== SHEET 4: DISPOSED PRODUCTS DATA ====================
        const disposedProducts = inventoryData.inventory.filter(product =>
            product.hasDisposedProducts || product.disposedBatches?.length > 0
        );

        const disposedData = disposedProducts.flatMap(product =>
            product.disposedBatches?.map(batch => ({
                'Product Name': product.productName,
                'Category': product.category,
                'Batch Number': batch.batchNumber,
                'Disposal Date': new Date(batch.disposalDate).toLocaleDateString('en-IN'),
                'Disposed Quantity': batch.quantity,
                'Disposal Reason': batch.disposalReason || 'Expired',
                'Financial Impact (₹)': (batch.quantity * product.price).toLocaleString('en-IN')
            })) || []
        );

        const wsDisposed = XLSX.utils.json_to_sheet(disposedData);
        XLSX.utils.book_append_sheet(wb, wsDisposed, 'Disposal History');

        // Apply basic styling
        const sheets = [wsSummary, wsInventory, wsBatches, wsDisposed];
        const colWidths = [
            [25, 40],
            [15, 25, 15, 12, 12, 12, 15, 12, 15, 12, 15, 15, 15, 15, 15],
            [20, 15, 15, 15, 15, 12, 12, 15, 15],
            [20, 15, 15, 15, 12, 20, 15]
        ];

        applyBasicStyling(sheets, colWidths);

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `Inventory_Report_${timestamp}.xlsx`;

        // Export file
        XLSX.writeFile(wb, filename);
        toast.success("Inventory report exported successfully!");
    };

    // Helper Functions for Inventory Export
    const calculateInventoryHealthScore = (summary) => {
        const totalProducts = summary.totalProducts || 1;
        const healthyProducts = summary.inStock - summary.totalExpiredBatches;
        return `${Math.max(0, (healthyProducts / totalProducts) * 100).toFixed(1)}%`;
    };

    const getProductHealthStatus = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'Critical';
        if (product.expiryStats.nearExpiryBatches > 0) return 'High Risk';
        if (product.status === 'Low Stock') return 'Monitor';
        if (product.status === 'Out of Stock') return 'No Stock';
        return 'Healthy';
    };

    const getUrgentAction = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'IMMEDIATE DISPOSAL REQUIRED';
        if (product.expiryStats.nearExpiryBatches > 0) return 'PRIORITY SALE/USE';
        if (product.status === 'Low Stock') return 'REORDER NEEDED';
        if (product.status === 'Out of Stock') return 'RESTOCK URGENTLY';
        return 'Monitor & Maintain';
    };

    const getExpiryPriority = (batch) => {
        if (batch.isExpired) return 'CRITICAL';
        if (batch.daysToExpiry <= 7) return 'HIGH';
        if (batch.daysToExpiry <= 30) return 'MEDIUM';
        return 'LOW';
    };

    const getActionDeadline = (batch) => {
        if (batch.isExpired) return 'IMMEDIATE';
        if (batch.daysToExpiry <= 7) return 'WITHIN 7 DAYS';
        if (batch.daysToExpiry <= 30) return 'WITHIN 30 DAYS';
        return 'NO URGENT ACTION';
    };

    const getRiskLevel = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'CRITICAL';
        if (product.expiryStats.nearExpiryBatches > 0) return 'HIGH';
        if (product.status === 'Out of Stock') return 'MEDIUM';
        return 'LOW';
    };

    const getPrimaryIssue = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'Expired Stock';
        if (product.expiryStats.nearExpiryBatches > 0) return 'Near Expiry';
        if (product.status === 'Out of Stock') return 'Stock Out';
        return 'Low Stock Level';
    };

    const getImmediateAction = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'Dispose expired batches immediately';
        if (product.expiryStats.nearExpiryBatches > 0) return 'Implement priority sales strategy';
        return 'Reorder and restock inventory';
    };

    const getActionDeadlineForProduct = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'IMMEDIATE';
        if (product.expiryStats.nearExpiryBatches > 0) return 'WITHIN 7 DAYS';
        return 'WITHIN 14 DAYS';
    };

    const getResponsibleDepartment = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'Quality Control + Warehouse';
        if (product.expiryStats.nearExpiryBatches > 0) return 'Sales + Marketing';
        return 'Procurement + Inventory';
    };

    const getCostImpact = (product) => {
        const expiredValue = product.expiryStats.totalExpiredQuantity * product.price;
        const nearExpiryValue = product.expiryStats.totalNearExpiryQuantity * product.price;
        const totalRisk = expiredValue + (nearExpiryValue * 0.5); // 50% risk for near expiry
        return `₹${totalRisk.toLocaleString('en-IN')}`;
    };

    const getPreventionStrategy = (product) => {
        if (product.expiryStats.expiredBatches > 0) return 'Implement FEFO system and regular audits';
        if (product.expiryStats.nearExpiryBatches > 0) return 'Better demand forecasting and promotions';
        return 'Optimize reorder points and supplier coordination';
    };






    // Professional Sales Data Export Handler
    // Professional Sales Data Export Handler - Clean Data Only
    const handleExportSalesData = (salesData, dateFilter, customDateRange) => {
        if (!salesData) {
            toast.error("No sales data available to export");
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ==================== SHEET 1: SALES SUMMARY ====================
        const salesSummary = [
            ['SALES REPORT SUMMARY'],
            [''],
            ['Report Period', dateFilter ? `${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}` : 'Custom Period'],
            ['Date Range', dateFilter === 'custom' ?
                `${customDateRange?.startDate || 'N/A'} to ${customDateRange?.endDate || 'N/A'}` :
                `${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}`
            ],
            ['Report Generated', new Date().toLocaleString('en-IN')],
            [''],
            ['SALES PERFORMANCE'],
            ['Total Sales Revenue', `₹${salesData.summary?.totalSales?.toLocaleString('en-IN') || 0}`],
            ['Total Items Sold', salesData.summary?.totalItemsSold?.toLocaleString('en-IN') || 0],
            ['Total Orders Processed', salesData.summary?.invoiceCount?.toLocaleString('en-IN') || 0],
            ['Average Order Value', `₹${salesData.summary?.averageOrderValue?.toFixed(2) || 0}`],
            ['Tax Collected', `₹${salesData.summary?.totalTax?.toLocaleString('en-IN') || 0}`],
            ['Discount Given', `₹${salesData.summary?.totalDiscount?.toLocaleString('en-IN') || 0}`]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(salesSummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Sales Summary');

        // ==================== SHEET 2: SALES TREND DATA ====================
        const salesTrendData = (salesData.trendData || []).map(day => ({
            'Date': new Date(day.date).toLocaleDateString('en-IN'),
            'Sales Revenue (₹)': day.sales || 0,
            'Number of Orders': day.orders || 0,
            'Items Sold': day.items || 0,
            'Average Order Value (₹)': day.orders > 0 ? (day.sales / day.orders).toFixed(2) : 0
        }));

        const wsTrend = XLSX.utils.json_to_sheet(salesTrendData);
        XLSX.utils.book_append_sheet(wb, wsTrend, 'Sales Trend');

        // ==================== SHEET 3: TOP PRODUCTS DATA ====================
        const topProductsData = (salesData.topProducts || []).map((product, index) => ({
            'Rank': index + 1,
            'Product Name': product.name,
            'Category': product.category,
            'Quantity Sold': product.totalQuantity,
            'Total Revenue (₹)': product.totalRevenue,
            'Average Price (₹)': product.totalQuantity > 0 ? (product.totalRevenue / product.totalQuantity).toFixed(2) : 0,
            // 'Number of Orders': product.orderCount || 0 
        }));

        const wsProducts = XLSX.utils.json_to_sheet(topProductsData);
        XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Products');

        // ==================== SHEET 4: PAYMENT METHODS DATA ====================
        const paymentAnalysisData = (salesData.paymentMethods || []).map(method => ({
            'Payment Method': method.method.toUpperCase(),
            'Transaction Count': method.count,
            'Percentage of Total': `${method.percentage}%`,
            'Total Amount (₹)': `₹${((method.count / (salesData.summary?.invoiceCount || 1)) * (salesData.summary?.totalSales || 0)).toLocaleString('en-IN')}`
        }));

        const wsPayments = XLSX.utils.json_to_sheet(paymentAnalysisData);
        XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment Methods');

        // Apply basic styling
        const sheets = [wsSummary, wsTrend, wsProducts, wsPayments];
        const colWidths = [
            [25, 40],
            [12, 15, 15, 15, 20],
            [8, 25, 20, 15, 15, 15, 15],
            [18, 18, 18, 18]
        ];

        applyBasicStyling(sheets, colWidths);

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `Sales_Report_${dateFilter}_${timestamp}.xlsx`;

        // Export file
        XLSX.writeFile(wb, filename);
        toast.success("Sales report exported successfully!");
    };






    // Professional Purchase Data Export Handler
    // Professional Purchase Data Export Handler - Clean Data Only
    const handleExportPurchaseData = (purchaseData, dateFilter, customDateRange) => {
        if (!purchaseData) {
            toast.error("No purchase data available to export");
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ==================== SHEET 1: PURCHASE SUMMARY ====================
        const purchaseSummary = [
            ['PURCHASE REPORT SUMMARY'],
            [''],
            ['Report Period', dateFilter ? `${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}` : 'Custom Period'],
            ['Date Range', dateFilter === 'custom' ?
                `${customDateRange?.startDate || 'N/A'} to ${customDateRange?.endDate || 'N/A'}` :
                `${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}`
            ],
            ['Report Generated', new Date().toLocaleString('en-IN')],
            [''],
            ['PURCHASE PERFORMANCE'],
            ['Total Purchase Value', `₹${purchaseData.summary?.totalPurchaseValue?.toLocaleString('en-IN') || 0}`],
            ['Total Quantity Purchased', purchaseData.summary?.totalQuantityPurchased?.toLocaleString('en-IN') || 0],
            ['Purchase Transactions', purchaseData.summary?.purchaseCount?.toLocaleString('en-IN') || 0],
            ['Average Purchase Price', `₹${purchaseData.summary?.averagePurchasePrice?.toFixed(2) || 0}`],
            ['Unique Products Purchased', purchaseData.summary?.uniqueProducts?.toLocaleString('en-IN') || 0]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(purchaseSummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Purchase Summary');

        // ==================== SHEET 2: PURCHASE TREND DATA ====================
        const purchaseTrendData = (purchaseData.trendData || []).map(day => ({
            'Date': new Date(day.date).toLocaleDateString('en-IN'),
            'Purchase Value (₹)': day.purchaseValue || 0,
            'Quantity Purchased': day.quantity || 0,
            'Purchase Transactions': day.transactions || 0,
            'Average Transaction Value (₹)': day.transactions > 0 ? (day.purchaseValue / day.transactions).toFixed(2) : 0
        }));

        const wsTrend = XLSX.utils.json_to_sheet(purchaseTrendData);
        XLSX.utils.book_append_sheet(wb, wsTrend, 'Purchase Trend');

        // ==================== SHEET 3: CATEGORY PURCHASE DATA ====================
        const categoryAnalysisData = (purchaseData.categoryBreakdown || []).map(category => ({
            'Category Name': category.category,
            'Total Purchase Value (₹)': category.totalValue,
            'Quantity Purchased': category.totalQuantity,
            'Purchase Transactions': category.transactionCount,
            'Average Transaction Value (₹)': (category.totalValue / category.transactionCount).toFixed(2)
        }));

        const wsCategories = XLSX.utils.json_to_sheet(categoryAnalysisData);
        XLSX.utils.book_append_sheet(wb, wsCategories, 'Category Purchases');

        // ==================== SHEET 4: RECENT PURCHASES DETAIL ====================
        const recentPurchasesData = (purchaseData.recentPurchases || []).map(purchase => ({
            'Transaction ID': purchase.transactionId,
            'Product Name': purchase.productName,
            'Category': purchase.category,
            'Batch Numbers': purchase.batchNumbers?.join(', ') || 'N/A',
            'Quantity': purchase.quantity,
            'Unit Price (₹)': purchase.price,
            'Total Value (₹)': purchase.totalValue,
            'Purchase Date': new Date(purchase.date).toLocaleDateString('en-IN')
        }));

        const wsRecent = XLSX.utils.json_to_sheet(recentPurchasesData);
        XLSX.utils.book_append_sheet(wb, wsRecent, 'Recent Purchases');

        // Apply basic styling
        const sheets = [wsSummary, wsTrend, wsCategories, wsRecent];
        const colWidths = [
            [25, 40],
            [12, 15, 18, 15, 20],
            [20, 18, 15, 18, 20],
            [15, 25, 15, 20, 12, 12, 15, 12]
        ];

        applyBasicStyling(sheets, colWidths);

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `Purchase_Report_${dateFilter}_${timestamp}.xlsx`;

        // Export file
        XLSX.writeFile(wb, filename);
        toast.success("Purchase report exported successfully!");
    };



    // Common styling function
    const applyProfessionalStyling = (sheets, colWidths) => {
        sheets.forEach((sheet, index) => {
            if (colWidths[index]) {
                sheet['!cols'] = colWidths[index].map(width => ({ wch: width }));
            }

            // Style header rows
            const range = XLSX.utils.decode_range(sheet['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
                if (sheet[cellAddress]) {
                    sheet[cellAddress].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "2C3E50" } },
                        alignment: { horizontal: "center" }
                    };
                }
            }
        });
    };

    // Sales helper functions
    const calculateDailyGrowth = (trendData, currentDate) => {
        const currentIndex = trendData.findIndex(day => day.date === currentDate);
        if (currentIndex <= 0) return 'N/A';
        const prevDay = trendData[currentIndex - 1];
        const currentDay = trendData[currentIndex];
        if (!prevDay.sales || prevDay.sales === 0) return 'N/A';
        return `${(((currentDay.sales - prevDay.sales) / prevDay.sales) * 100).toFixed(1)}%`;
    };

    const getDailyPerformance = (sales) => {
        if (sales > 50000) return 'Excellent';
        if (sales > 20000) return 'Good';
        if (sales > 5000) return 'Average';
        return 'Needs Improvement';
    };

    const calculateProductPerformance = (product) => {
        return Math.min(100, Math.round((product.totalRevenue / 1000) + (product.totalQuantity / 10)));
    };

    // const getDemandLevel = (quantity) => {
    //     if (quantity > 1000) return 'Very High';
    //     if (quantity > 500) return 'High';
    //     if (quantity > 100) return 'Medium';
    //     return 'Low';
    // };

    const getPreferenceLevel = (percentage) => {
        if (percentage > 50) return 'Most Preferred';
        if (percentage > 25) return 'Popular';
        return 'Less Preferred';
    };

    const calculateAchievement = (value, type) => {
        // Simplified achievement calculation
        const benchmarks = { sales: 100000, orders: 100, aov: 2000, items: 3 };
        return `${Math.min(100, (value / benchmarks[type]) * 100).toFixed(1)}%`;
    };

    const getStatus = (value, type) => {
        const achievement = parseFloat(calculateAchievement(value, type));
        if (achievement > 90) return 'Excellent';
        if (achievement > 70) return 'Good';
        if (achievement > 50) return 'Average';
        return 'Needs Improvement';
    };

    const getSalesRecommendation = (salesData) => {
        const aov = salesData.summary?.averageOrderValue || 0;
        if (aov < 1500) return 'Focus on upselling and cross-selling';
        return 'Maintain current sales strategies';
    };

    // Purchase helper functions
    const calculateInventoryEfficiency = (purchaseData) => {
        const efficiency = (purchaseData.summary?.purchaseCount || 0) / (purchaseData.summary?.uniqueProducts || 1);
        if (efficiency > 2) return 'High';
        if (efficiency > 1) return 'Medium';
        return 'Low';
    };

    const getProcurementEfficiency = (day) => {
        if (day.transactions === 0) return 'No Activity';
        const efficiency = day.purchaseValue / day.transactions;
        if (efficiency > 10000) return 'Excellent';
        if (efficiency > 5000) return 'Good';
        if (efficiency > 1000) return 'Average';
        return 'Needs Review';
    };

    const getProcurementPriority = (category) => {
        const valuePerTransaction = category.totalValue / category.transactionCount;
        if (valuePerTransaction > 10000) return 'High Priority';
        if (valuePerTransaction > 5000) return 'Medium Priority';
        return 'Standard Priority';
    };

    const getInventoryRecommendation = (category) => {
        const turnover = category.totalValue / category.totalQuantity;
        if (turnover > 1000) return 'Maintain current levels';
        return 'Review stocking strategy';
    };


    // Fixed Category Analysis Export Handler with Product Data
    const handleExportCategoryData = (categoryData) => {
        if (!categoryData || !categoryData.categories) {
            toast.error("No category data available to export");
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ==================== SHEET 1: CATEGORY SUMMARY ====================
        const categorySummary = [
            ['CATEGORY ANALYSIS REPORT'],
            [''],
            ['Report Period', categoryData.dateRange?.filterType ? `${categoryData.dateRange.filterType.charAt(0).toUpperCase() + categoryData.dateRange.filterType.slice(1)}` : 'Custom Period'],
            ['Date Range', `${new Date(categoryData.dateRange?.start).toLocaleDateString('en-IN')} to ${new Date(categoryData.dateRange?.end).toLocaleDateString('en-IN')}`],
            ['Report Generated', new Date().toLocaleString('en-IN')],
            ['Total Categories', categoryData.summary.totalCategories],
            ['Total Sales Revenue', `₹${categoryData.summary.totalSales?.toLocaleString('en-IN')}`],
            ['Total Purchase Value', `₹${categoryData.summary.totalPurchases?.toLocaleString('en-IN')}`],
            ['Total Stock Value', `₹${categoryData.summary.totalStockValue?.toLocaleString('en-IN')}`],
            ['Total Products', categoryData.summary.totalProducts],
            ['Total Orders', categoryData.summary.totalOrders]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(categorySummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Category Summary');

        // ==================== SHEET 2: CATEGORY PERFORMANCE DATA ====================
        const categoryPerformanceData = categoryData.categories.map((category, index) => ({
            'Category Name': category.category,
            'Total Products': category.stock.totalProducts,
            'Sales Revenue (₹)': category.sales.totalSales,
            'Purchase Value (₹)': category.purchases.totalPurchaseValue,
            'Stock Value (₹)': category.stock.totalValue,
            'Total Orders': category.sales.totalOrders,
            'Average Order Value (₹)': category.sales.averageOrderValue?.toFixed(2),
            // 'Sales Growth Rate': `${category.sales.growth}%`, 
            'In-Stock Products': category.stock.totalProducts - category.stock.lowStockProducts - category.stock.outOfStockProducts,
            // 'Low Stock Products': category.stock.lowStockProducts,
            'Out of Stock Products': category.stock.outOfStockProducts,
            // 'Stock Health Score': `${((category.stock.totalProducts - category.stock.lowStockProducts - category.stock.outOfStockProducts) / category.stock.totalProducts * 100).toFixed(1)}%`
        }));

        const wsPerformance = XLSX.utils.json_to_sheet(categoryPerformanceData);
        XLSX.utils.book_append_sheet(wb, wsPerformance, 'Category Performance');

        // ==================== SHEET 3: PRODUCT-WISE DATA ====================
        let productWiseData = [];
        let wsProducts = null;

        if (categoryData.categoryProducts) {
            // If specific category selected
            if (categoryData.filters.selectedCategory !== 'all') {
                const selectedCategory = categoryData.filters.selectedCategory;
                const products = categoryData.categoryProducts[selectedCategory] || [];
                productWiseData = products.map(product => ({
                    // 'Product ID': product.productId, 
                    'Product Name': product.productName,
                    'Category': product.category,
                    'Sales Revenue (₹)': product.sales.totalSales,
                    'Quantity Sold': product.sales.totalQuantity,
                    'Total Orders': product.sales.totalOrders,
                    'Average Order Value (₹)': product.sales.averageOrderValue?.toFixed(2),
                    'Purchase Value (₹)': product.purchases.totalPurchaseValue,
                    'Quantity Purchased': product.purchases.totalQuantity,
                    'Purchase Transactions': product.purchases.totalTransactions,
                    'Current Stock': product.stock.totalQuantity,
                    'Stock Value (₹)': product.stock.totalValue,
                    'Current Price (₹)': product.stock.currentPrice,
                    // 'Gross Margin (₹)': product.sales.totalSales - product.purchases.totalPurchaseValue,
                    // 'Margin Percentage': product.sales.totalSales > 0 ?
                    //     `${(((product.sales.totalSales - product.purchases.totalPurchaseValue) / product.sales.totalSales) * 100).toFixed(1)}%` : '0%'
                }));
            } else {
                // All categories - combine all products
                Object.keys(categoryData.categoryProducts).forEach(category => {
                    const products = categoryData.categoryProducts[category];
                    products.forEach(product => {
                        productWiseData.push({
                            // 'Product ID': product.productId, 
                            'Product Name': product.productName,
                            'Category': product.category,
                            'Sales Revenue (₹)': product.sales.totalSales,
                            'Quantity Sold': product.sales.totalQuantity,
                            'Total Orders': product.sales.totalOrders,
                            'Average Order Value (₹)': product.sales.averageOrderValue?.toFixed(2),
                            'Purchase Value (₹)': product.purchases.totalPurchaseValue,
                            'Quantity Purchased': product.purchases.totalQuantity,
                            'Purchase Transactions': product.purchases.totalTransactions,
                            'Current Stock': product.stock.totalQuantity,
                            'Stock Value (₹)': product.stock.totalValue,
                            'Current Price (₹)': product.stock.currentPrice,
                            // 'Gross Margin (₹)': product.sales.totalSales - product.purchases.totalPurchaseValue,
                            // 'Margin Percentage': product.sales.totalSales > 0 ?
                            //     `${(((product.sales.totalSales - product.purchases.totalPurchaseValue) / product.sales.totalSales) * 100).toFixed(1)}%` : '0%'
                        });
                    });
                });
            }

            // ONLY CREATE PRODUCT SHEET IF THERE'S PRODUCT DATA
            if (productWiseData.length > 0) {
                wsProducts = XLSX.utils.json_to_sheet(productWiseData);
                XLSX.utils.book_append_sheet(wb, wsProducts, 'Product Wise Data');
            }
        }

        // ==================== SHEET 4: COMBINED CATEGORY-PRODUCT HIERARCHY ====================
        const combinedData = [];

        // Add header
        combinedData.push(['COMBINED CATEGORY & PRODUCT ANALYSIS']);
        combinedData.push(['']);
        combinedData.push([
            'Category',
            'Product Name',
            'Sales Revenue (₹)',
            'Purchase Value (₹)',
            'Stock Value (₹)',
            'Quantity Sold',
            'Current Stock',
            'Total Orders'
        ]);

        if (categoryData.categoryProducts) {
            categoryData.categories.forEach(category => {
                // Add category row with summary data
                combinedData.push([
                    category.category,
                    'CATEGORY SUMMARY',
                    category.sales.totalSales,
                    category.purchases.totalPurchaseValue,
                    category.stock.totalValue,
                    category.sales.totalQuantity,
                    category.stock.totalQuantity,
                    category.sales.totalOrders
                ]);

                // Add products under this category
                const products = categoryData.categoryProducts[category.category] || [];
                products.forEach(product => {
                    combinedData.push([
                        '', // Empty category cell for indentation
                        product.productName,
                        product.sales.totalSales,
                        product.purchases.totalPurchaseValue,
                        product.stock.totalValue,
                        product.sales.totalQuantity,
                        product.stock.totalQuantity,
                        product.sales.totalOrders
                    ]);
                });

                // Add empty row for spacing between categories
                combinedData.push(['', '', '', '', '', '', '', '']);
            });
        }

        const wsCombined = XLSX.utils.aoa_to_sheet(combinedData);
        XLSX.utils.book_append_sheet(wb, wsCombined, 'Category-Product Combined');


        // ==================== SHEET 5: SALES DATA BY CATEGORY ====================
        const salesAnalysisData = categoryData.categories.map(category => ({
            'Category Name': category.category,
            'Total Sales Revenue (₹)': category.sales.totalSales,
            'Total Quantity Sold': category.sales.totalQuantity,
            'Total Orders': category.sales.totalOrders,
            'Average Order Value (₹)': category.sales.averageOrderValue?.toFixed(2),
            'Total Tax Collected (₹)': category.sales.totalTax,
            'Total Discount Given (₹)': category.sales.totalDiscount
        }));

        const wsSales = XLSX.utils.json_to_sheet(salesAnalysisData);
        XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Data');

        // ==================== SHEET 6: PURCHASE DATA BY CATEGORY ====================
        const purchaseAnalysisData = categoryData.categories.map(category => ({
            'Category Name': category.category,
            'Total Purchase Value (₹)': category.purchases.totalPurchaseValue,
            'Total Quantity Purchased': category.purchases.totalQuantity,
            'Purchase Transactions': category.purchases.totalTransactions,
            'Average Purchase Price (₹)': category.purchases.averagePurchasePrice?.toFixed(2),
            'Current Stock Value (₹)': category.stock.totalValue,
            'Stock Quantity': category.stock.totalQuantity
        }));

        const wsPurchases = XLSX.utils.json_to_sheet(purchaseAnalysisData);
        XLSX.utils.book_append_sheet(wb, wsPurchases, 'Purchase Data');

        // Apply styling - FIXED: Build sheets array dynamically
        const sheets = [wsSummary, wsPerformance];
        const colWidths = [
            [25, 40],
            [20, 15, 15, 15, 15, 12, 15, 15, 15, 15, 15, 15]
        ];

        // Add product sheet if it exists
        if (wsProducts) {
            sheets.push(wsProducts);
            colWidths.push([15, 25, 15, 15, 12, 15, 15, 15, 12, 15, 15, 15, 15, 15]);
        }

        // Add remaining sheets
        sheets.push(wsCombined, wsSales, wsPurchases);
        colWidths.push(
            [20, 30, 15, 15, 15, 15, 15, 15, 12, 12, 15],
            [20, 18, 15, 12, 15, 15, 15],
            [20, 18, 18, 18, 15, 15, 15]
        );

        applyBasicStyling(sheets, colWidths);

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const period = categoryData.dateRange?.filterType || 'custom';
        const categoryFilter = categoryData.filters.selectedCategory !== 'all' ? `_${categoryData.filters.selectedCategory}` : '';
        const filename = `Category_Analysis${categoryFilter}_${period}_${timestamp}.xlsx`;

        // Export file
        XLSX.writeFile(wb, filename);
        toast.success("Enhanced category analysis report exported successfully!");
    };

    // ==================== HELPER FUNCTIONS ====================

    const calculateGrossMargin = (sales, purchases) => {
        if (sales === 0) return 0;
        return (((sales - purchases) / sales) * 100).toFixed(1);
    };

    const calculateInventoryTurnover = (sales, stockValue) => {
        if (stockValue === 0) return 'N/A';
        return (sales / stockValue).toFixed(2);
    };

    const calculateTotalInStock = (categories) => {
        return categories.reduce((sum, cat) => sum + (cat.stock.totalProducts - cat.stock.lowStockProducts - cat.stock.outOfStockProducts), 0);
    };

    const calculateTotalLowStock = (categories) => {
        return categories.reduce((sum, cat) => sum + cat.stock.lowStockProducts, 0);
    };

    const calculateTotalOutOfStock = (categories) => {
        return categories.reduce((sum, cat) => sum + cat.stock.outOfStockProducts, 0);
    };

    const calculateStockHealthScore = (categories) => {
        const totalProducts = categories.reduce((sum, cat) => sum + cat.stock.totalProducts, 0);
        const inStockProducts = calculateTotalInStock(categories);
        return ((inStockProducts / totalProducts) * 100).toFixed(1);
    };

    const calculateCategoryMargin = (sales, purchases) => {
        if (sales === 0) return 0;
        return (((sales - purchases) / sales) * 100).toFixed(1);
    };

    const getCategoryPerformanceRating = (category) => {
        const score = (
            (category.sales.totalSales / 10000) +
            (category.sales.growth / 10) +
            ((category.stock.totalProducts - category.stock.lowStockProducts - category.stock.outOfStockProducts) / category.stock.totalProducts) * 10
        );
        if (score > 8) return 'Excellent';
        if (score > 6) return 'Good';
        if (score > 4) return 'Average';
        return 'Needs Attention';
    };

    const calculateCategoryTurnover = (sales, stockValue) => {
        if (stockValue === 0) return 'N/A';
        return (sales / stockValue).toFixed(2);
    };

    const getCategoryRecommendation = (category) => {
        const margin = calculateCategoryMargin(category.sales.totalSales, category.purchases.totalPurchaseValue);
        const stockHealth = ((category.stock.totalProducts - category.stock.lowStockProducts - category.stock.outOfStockProducts) / category.stock.totalProducts) * 100;

        if (margin > 30 && stockHealth > 80) return 'Expand Product Line';
        if (margin > 20 && stockHealth < 50) return 'Increase Stock Levels';
        if (margin < 10) return 'Review Pricing Strategy';
        if (category.stock.outOfStockProducts > 0) return 'Urgent Restock Required';
        return 'Maintain Current Strategy';
    };

    const calculateSalesEfficiency = (category) => {
        const efficiency = (category.sales.totalSales / category.stock.totalProducts) / 1000;
        if (efficiency > 5) return 'Very High';
        if (efficiency > 3) return 'High';
        if (efficiency > 1) return 'Medium';
        return 'Low';
    };

    const analyzeSeasonalTrend = (category) => {
        // This would be enhanced with historical data
        return 'Stable Year-Round';
    };

    // const getDemandLevel = (quantity) => {
    //     if (quantity > 1000) return 'Very High';
    //     if (quantity > 500) return 'High';
    //     if (quantity > 100) return 'Medium';
    //     return 'Low';
    // };

    const calculateInventoryHealth = (category) => {
        const health = ((category.stock.totalProducts - category.stock.lowStockProducts - category.stock.outOfStockProducts) / category.stock.totalProducts) * 100;
        if (health > 80) return 'Excellent';
        if (health > 60) return 'Good';
        if (health > 40) return 'Fair';
        return 'Poor';
    };

    const getReorderPriority = (category) => {
        if (category.stock.outOfStockProducts > 0) return 'Critical';
        if (category.stock.lowStockProducts > category.stock.totalProducts * 0.3) return 'High';
        if (category.stock.lowStockProducts > 0) return 'Medium';
        return 'Low';
    };

    const calculateOptimalStockLevel = (category) => {
        const salesRate = category.sales.totalQuantity / 30; // Daily sales rate
        return Math.ceil(salesRate * 14); // 2 weeks coverage
    };

    const checkExcessStock = (category) => {
        const stockCoverage = category.stock.totalQuantity / (category.sales.totalQuantity / 30);
        return stockCoverage > 60 ? 'Yes - Reduce Orders' : 'No';
    };

    const calculateProcurementEfficiency = (category) => {
        const efficiency = category.purchases.totalPurchaseValue / category.sales.totalSales;
        if (efficiency < 0.7) return 'Excellent';
        if (efficiency < 0.8) return 'Good';
        if (efficiency < 0.9) return 'Average';
        return 'Needs Improvement';
    };

    // Stock Management Helpers
    const calculateStockTurnoverDays = (category) => {
        if (category.sales.totalSales === 0) return 'N/A';
        return (category.stock.totalValue / (category.sales.totalSales / 30)).toFixed(1);
    };

    const calculateIdealStockLevel = (category) => {
        const dailySales = category.sales.totalQuantity / 30;
        return Math.ceil(dailySales * 21); // 3 weeks coverage
    };

    // const calculateReorderQuantity = (category) => {
    //     const dailySales = category.sales.totalQuantity / 30;
    //     return Math.ceil(dailySales * 7); // 1 week supply
    // };

    const getStockRiskLevel = (category) => {
        const riskScore = (category.stock.lowStockProducts + category.stock.outOfStockProducts) / category.stock.totalProducts;
        if (riskScore > 0.3) return 'High';
        if (riskScore > 0.1) return 'Medium';
        return 'Low';
    };

    const getUrgentActions = (category) => {
        if (category.stock.outOfStockProducts > 0) return 'IMMEDIATE RESTOCK';
        if (category.stock.lowStockProducts > category.stock.totalProducts * 0.3) return 'Priority Reorder';
        return 'Monitor & Maintain';
    };

    const getOptimizationOpportunity = (category) => {
        const utilization = category.sales.totalSales / category.stock.totalValue;
        if (utilization < 1) return 'Reduce Inventory';
        if (utilization > 3) return 'Increase Inventory';
        return 'Optimal Level';
    };

    const calculateProjectedStockOut = (category) => {
        const dailySales = category.sales.totalQuantity / 30;
        if (dailySales === 0) return 'N/A';
        const daysRemaining = category.stock.totalQuantity / dailySales;
        return daysRemaining < 7 ? 'Within 7 days' : 'More than 7 days';
    };

    // Strategic Analysis Helpers
    const getHighPerformingCategories = (categories) => {
        return categories
            .filter(cat => calculateCategoryMargin(cat.sales.totalSales, cat.purchases.totalPurchaseValue) > 25)
            .slice(0, 3);
    };

    const getGrowthOpportunityCategories = (categories) => {
        return categories
            .filter(cat => cat.sales.growth > 15 && ((cat.sales.totalSales / categories.reduce((sum, c) => sum + c.sales.totalSales, 0)) * 100) < 10)
            .slice(0, 3);
    };

    const getRiskCategories = (categories) => {
        return categories
            .filter(cat => cat.stock.outOfStockProducts > 0 || cat.stock.lowStockProducts > cat.stock.totalProducts * 0.4)
            .slice(0, 3);
    };

    const getInventoryPriorities = (categories) => {
        return categories
            .filter(cat => getReorderPriority(cat) === 'Critical' || getReorderPriority(cat) === 'High')
            .map(cat => ({
                category: cat.category,
                priority: getReorderPriority(cat),
                action: getUrgentActions(cat),
                impact: 'High Business Impact'
            }))
            .slice(0, 5);
    };

    const calculateProjectedRevenue = (categories) => {
        const totalRevenue = categories.reduce((sum, cat) => sum + cat.sales.totalSales, 0);
        const avgGrowth = categories.reduce((sum, cat) => sum + parseFloat(cat.sales.growth), 0) / categories.length;
        return totalRevenue * (1 + (avgGrowth / 100));
    };

    const calculateRecommendedInvestment = (categories) => {
        return categories.reduce((sum, cat) => {
            const recommendedStock = calculateIdealStockLevel(cat);
            const currentStock = cat.stock.totalQuantity;
            const neededStock = Math.max(0, recommendedStock - currentStock);
            const avgProductValue = cat.stock.totalValue / cat.stock.totalProducts;
            return sum + (neededStock * avgProductValue);
        }, 0);
    };

    const calculateExpectedROI = (categories) => {
        const totalInvestment = calculateRecommendedInvestment(categories);
        const projectedRevenue = calculateProjectedRevenue(categories);
        const currentRevenue = categories.reduce((sum, cat) => sum + cat.sales.totalSales, 0);
        const revenueIncrease = projectedRevenue - currentRevenue;
        return totalInvestment > 0 ? ((revenueIncrease / totalInvestment) * 100).toFixed(1) : 'N/A';
    };

    const getPriorityInvestmentCategories = (categories) => {
        return categories
            .filter(cat => getCategoryPerformanceRating(cat) === 'Excellent' || getCategoryPerformanceRating(cat) === 'Good')
            .slice(0, 3)
            .map(cat => cat.category);
    };





    // Add this function to your parent component
    // Professional Trending Products Export Handler
    // Professional Trending Products Export Handler - Clean Data Only
    const handleExportTrendingData = (trendingData) => {
        if (!trendingData || !trendingData.trendingProducts) {
            toast.error("No data available to export");
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ==================== SHEET 1: TRENDING SUMMARY ====================
        const trendingSummary = [
            ['TRENDING PRODUCTS REPORT'],
            [''],
            ['Report Period', trendingData.dateRange?.filterType ? `${trendingData.dateRange.filterType.charAt(0).toUpperCase() + trendingData.dateRange.filterType.slice(1)}` : 'Custom Period'],
            ['Date Range', `${new Date(trendingData.dateRange?.start).toLocaleDateString('en-IN')} to ${new Date(trendingData.dateRange?.end).toLocaleDateString('en-IN')}`],
            ['Report Generated', new Date().toLocaleString('en-IN')],
            ['Total Products Analyzed', trendingData.summary.totalProducts],
            ['Total Quantity Sold', trendingData.summary.totalQuantitySold?.toLocaleString('en-IN')],
            ['Total Revenue Generated', `₹${trendingData.summary.totalRevenue?.toLocaleString('en-IN')}`],
            ['Total Orders Processed', trendingData.summary.totalOrders]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(trendingSummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Trending Summary');

        // ==================== SHEET 2: PRODUCT PERFORMANCE DATA ====================
        const productPerformanceData = trendingData.trendingProducts.map((product, index) => ({
            'Rank': index + 1,
            'Product Name': product.name,
            'Product ID': product.productId,
            'Category': product.category,
            'Barcode/SKU': product.barcode || 'N/A',
            'HSN Code': product.hsn || 'N/A',
            'Total Quantity Sold': product.totalQuantity,
            'Total Revenue (₹)': product.totalRevenue,
            'Average Selling Price (₹)': product.averagePrice?.toFixed(2),
            'Total Orders': product.totalOrders,
            'Average Order Value (₹)': product.averageOrderValue?.toFixed(2),
            'Sale Frequency (per day)': product.saleFrequency?.toFixed(2),
            'Unique Customers': product.uniqueCustomerCount,
            'Total Discount (₹)': product.totalDiscount || 0,
            'Total Tax (₹)': product.totalTax || 0,
            'Tax Slab': product.taxSlab || 'N/A',
            'First Sale Date': new Date(product.firstSold).toLocaleDateString('en-IN'),
            'Last Sale Date': new Date(product.lastSold).toLocaleDateString('en-IN')
        }));

        const wsProducts = XLSX.utils.json_to_sheet(productPerformanceData);
        XLSX.utils.book_append_sheet(wb, wsProducts, 'Product Performance');

        // ==================== SHEET 3: CATEGORY PERFORMANCE DATA ====================
        const categoryMap = {};
        trendingData.trendingProducts.forEach(product => {
            if (!categoryMap[product.category]) {
                categoryMap[product.category] = {
                    category: product.category,
                    totalRevenue: 0,
                    totalQuantity: 0,
                    products: 0
                };
            }
            categoryMap[product.category].totalRevenue += product.totalRevenue;
            categoryMap[product.category].totalQuantity += product.totalQuantity;
            categoryMap[product.category].products += 1;
        });

        const categoryData = Object.values(categoryMap).sort((a, b) => b.totalRevenue - a.totalRevenue)
            .map(cat => ({
                'Category Name': cat.category,
                'Number of Products': cat.products,
                'Total Revenue (₹)': cat.totalRevenue,
                'Total Quantity Sold': cat.totalQuantity,
                'Average Price (₹)': (cat.totalRevenue / cat.totalQuantity).toFixed(2)
            }));

        const wsCategories = XLSX.utils.json_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(wb, wsCategories, 'Category Performance');

        // Apply basic styling
        const sheets = [wsSummary, wsProducts, wsCategories];
        const colWidths = [
            [25, 40],
            [8, 30, 15, 20, 15, 12, 15, 15, 15, 15, 15, 15, 12, 12, 12, 15, 15],
            [20, 15, 15, 15, 15]
        ];

        applyBasicStyling(sheets, colWidths);

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const period = trendingData.dateRange?.filterType || 'custom';
        const filename = `Trending_Products_${period}_${timestamp}.xlsx`;

        // Export file
        XLSX.writeFile(wb, filename);
        toast.success("Trending products report exported successfully!");
    };

    // ==================== HELPER FUNCTIONS ====================

    const getTopCategories = (products) => {
        const categoryMap = {};
        products.forEach(product => {
            if (!categoryMap[product.category]) {
                categoryMap[product.category] = {
                    category: product.category,
                    totalRevenue: 0,
                    totalQuantity: 0,
                    products: 0
                };
            }
            categoryMap[product.category].totalRevenue += product.totalRevenue;
            categoryMap[product.category].totalQuantity += product.totalQuantity;
            categoryMap[product.category].products += 1;
        });
        return Object.values(categoryMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    };

    const calculatePerformanceScore = (product) => {
        const score = (
            (product.totalRevenue / 1000) +
            (product.saleFrequency * 10) +
            (product.uniqueCustomerCount * 2) +
            (product.averageOrderValue / 100)
        );
        return Math.min(100, Math.round(score));
    };

    const getStockStatus = (product) => {
        if (product.saleFrequency > 5) return 'High Demand';
        if (product.saleFrequency > 2) return 'Medium Demand';
        return 'Low Demand';
    };

    const getGrowthPotential = (product) => {
        const growthScore = (product.saleFrequency * product.averagePrice) / 100;
        if (growthScore > 10) return 'High';
        if (growthScore > 5) return 'Medium';
        return 'Low';
    };

    const getRevenueTrend = (product) => {
        const daysActive = Math.max(1, Math.ceil((new Date(product.lastSold) - new Date(product.firstSold)) / (1000 * 60 * 60 * 24)));
        const dailyRevenue = product.totalRevenue / daysActive;
        if (dailyRevenue > 5000) return 'Rapid Growth';
        if (dailyRevenue > 2000) return 'Steady Growth';
        if (dailyRevenue > 500) return 'Stable';
        return 'Slow';
    };

    const getDemandLevel = (product) => {
        if (product.saleFrequency > 10) return 'Very High';
        if (product.saleFrequency > 5) return 'High';
        if (product.saleFrequency > 2) return 'Medium';
        return 'Low';
    };

    const getSeasonality = (product) => {
        // Simple seasonality calculation based on sales frequency variance
        return 'Year-Round'; // This would be enhanced with historical data
    };

    const getReorderRecommendation = (product) => {
        if (product.saleFrequency > 5) return 'Weekly Restock';
        if (product.saleFrequency > 2) return 'Bi-Weekly Restock';
        return 'Monthly Restock';
    };

    const calculateOptimalStock = (product) => {
        return Math.ceil(product.saleFrequency * 14); // 2 weeks of inventory
    };

    const getSalesVelocity = (product) => {
        const velocity = product.saleFrequency * product.averagePrice;
        if (velocity > 10000) return 'Very Fast';
        if (velocity > 5000) return 'Fast';
        if (velocity > 1000) return 'Medium';
        return 'Slow';
    };

    const calculateMarketShare = (product, allProducts) => {
        const categoryProducts = allProducts.filter(p => p.category === product.category);
        const categoryRevenue = categoryProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
        return `${((product.totalRevenue / categoryRevenue) * 100).toFixed(1)}%`;
    };

    const getCategoryAnalysis = (products) => {
        const categories = getTopCategories(products);
        return categories.map(cat => {
            const categoryProducts = products.filter(p => p.category === cat.category);
            const topProduct = categoryProducts[0];
            return {
                ...cat,
                topProduct: topProduct?.name || 'N/A',
                topProductRevenue: topProduct?.totalRevenue || 0,
                avgFrequency: categoryProducts.reduce((sum, p) => sum + p.saleFrequency, 0) / categoryProducts.length,
                performance: cat.totalRevenue > 10000 ? 'Excellent' : cat.totalRevenue > 5000 ? 'Good' : 'Average',
                growthOpp: cat.totalRevenue > 10000 ? 'Market Leader' : 'Growth Potential'
            };
        });
    };

    // Inventory helper functions
    const calculateTurnoverRate = (product) => {
        return product.saleFrequency > 0 ? (30 / product.saleFrequency).toFixed(1) : 'N/A';
    };

    const calculateDaysOfInventory = (product) => {
        return Math.ceil(30 / Math.max(1, product.saleFrequency));
    };

    const calculateReorderQuantity = (product) => {
        return Math.ceil(product.saleFrequency * 7); // 1 week of sales
    };

    const calculateReorderPoint = (product) => {
        return Math.ceil(product.saleFrequency * 3); // 3 days of sales
    };

    const calculateSafetyStock = (product) => {
        return Math.ceil(product.saleFrequency * 2); // 2 days buffer
    };

    const calculateROI = (product) => {
        const investment = product.averagePrice * calculateReorderQuantity(product);
        const monthlyRevenue = product.saleFrequency * 30 * product.averagePrice;
        return `${((monthlyRevenue / investment) * 100).toFixed(1)}%`;
    };

    const getPriorityLevel = (product) => {
        if (product.saleFrequency > 5) return 'Critical';
        if (product.saleFrequency > 2) return 'High';
        return 'Medium';
    };

    const getRiskAssessment = (product) => {
        if (product.saleFrequency > 10) return 'Low Risk';
        if (product.saleFrequency > 5) return 'Medium Risk';
        return 'High Risk';
    };

    // Customer insights helper functions
    const calculateLoyaltyScore = (product) => {
        const repeatRate = product.totalOrders / product.uniqueCustomerCount;
        if (repeatRate > 3) return 'Very Loyal';
        if (repeatRate > 2) return 'Loyal';
        if (repeatRate > 1.5) return 'Somewhat Loyal';
        return 'New Customers';
    };

    const calculateCAC = (product) => {
        // Simplified CAC calculation
        return product.totalRevenue * 0.1 / product.uniqueCustomerCount;
    };

    const calculateLTV = (product) => {
        // Simplified LTV calculation
        return (product.averageOrderValue * 3 * 12); // 3 purchases per year for 12 months
    };

    const getMarketPenetration = (product) => {
        if (product.uniqueCustomerCount > 100) return 'High';
        if (product.uniqueCustomerCount > 50) return 'Medium';
        return 'Low';
    };

    const getCrossSellOpportunity = (product) => {
        if (product.averageOrderValue > 5000) return 'Premium Products';
        if (product.averageOrderValue > 2000) return 'Accessories';
        return 'Related Items';
    };

    const getUpsellPotential = (product) => {
        if (product.averagePrice > 1000) return 'Premium Versions';
        if (product.averagePrice > 500) return 'Bundles';
        return 'Volume Discounts';
    };





    // Add this function to your parent component
    // Professional Daily Sales Export Handler
    // Professional Daily Sales Export Handler - Clean Data Only
    const handleExportDailySalesData = (dailySalesData) => {
        if (!dailySalesData) {
            toast.error("No data available to export");
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ==================== SHEET 1: DAILY SALES SUMMARY ====================
        const dailySummary = [
            ['DAILY SALES REPORT'],
            [''],
            ['Report Date', dailySalesData.date],
            ['Report Generated', new Date().toLocaleString('en-IN')],
            ['Total Sales Revenue', `₹${dailySalesData.summary.totalSales?.toLocaleString('en-IN')}`],
            ['Total Number of Orders', dailySalesData.summary.totalOrders],
            ['Total Items Sold', dailySalesData.summary.totalItems],
            ['Average Order Value', `₹${dailySalesData.summary.averageOrderValue?.toFixed(2)}`],
            ['Tax Collected', `₹${dailySalesData.summary.totalTax?.toLocaleString('en-IN')}`],
            ['Discount Given', `₹${dailySalesData.summary.totalDiscount?.toLocaleString('en-IN')}`]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(dailySummary);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Daily Summary');

        // ==================== SHEET 2: INVOICE DETAILS ====================
        const invoiceHeaders = [
            'Invoice Number',
            'Customer Name',
            'Customer Phone',
            'Sale Date & Time',
            'Payment Method',
            'Subtotal (₹)',
            'Tax (₹)',
            'Discount (₹)',
            'Total (₹)'
        ];

        const invoiceData = dailySalesData.sales.map(sale => ({
            'Invoice Number': sale.invoiceNumber,
            'Customer Name': sale.customer.name,
            'Customer Phone': sale.customer.phone || 'N/A',
            'Sale Date & Time': new Date(sale.date).toLocaleString('en-IN'),
            'Payment Method': sale.paymentType.toUpperCase(),
            'Subtotal (₹)': sale.subtotal,
            'Tax (₹)': sale.tax,
            'Discount (₹)': sale.discount,
            'Total (₹)': sale.total
        }));

        const wsInvoices = XLSX.utils.json_to_sheet(invoiceData);
        XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoice Details');

        // ==================== SHEET 3: PRODUCT SALES DETAILS ====================
        const productData = dailySalesData.topProducts.map((product, index) => ({
            'Product Name': product.name,
            'Category': product.category,
            'Total Quantity Sold': product.totalQuantity,
            'Total Revenue (₹)': product.totalRevenue,
            'Average Selling Price (₹)': product.averagePrice?.toFixed(2),
            'Number of Times Sold': product.timesSold
        }));

        const wsProducts = XLSX.utils.json_to_sheet(productData);
        XLSX.utils.book_append_sheet(wb, wsProducts, 'Product Sales');

        // ==================== SHEET 4: HOURLY SALES DATA ====================
        const hourlyData = dailySalesData.hourlySales.map(hour => ({
            'Time Slot': `${hour.hour}:00 - ${hour.hour + 1}:00`,
            'Sales Revenue (₹)': hour.sales,
            'Number of Orders': hour.orders,
            'Average Order Value (₹)': hour.orders > 0 ? (hour.sales / hour.orders).toFixed(2) : 0
        }));

        const wsHourly = XLSX.utils.json_to_sheet(hourlyData);
        XLSX.utils.book_append_sheet(wb, wsHourly, 'Hourly Sales');

        // Apply basic styling
        const sheets = [wsSummary, wsInvoices, wsProducts, wsHourly];
        const colWidths = [
            [25, 40],
            [15, 20, 15, 20, 15, 15, 12, 15, 15],
            [25, 20, 15, 15, 15, 15],
            [20, 15, 15, 20]
        ];

        applyBasicStyling(sheets, colWidths);

        // Generate filename
        const formattedDate = new Date(dailySalesData.date).toLocaleDateString('en-IN').replace(/\//g, '-');
        const filename = `Daily_Sales_${formattedDate}.xlsx`;

        // Export file
        XLSX.writeFile(wb, filename);
        toast.success("Daily sales report exported successfully!");
    };

    // Helper functions for performance ratings
    const getPerformanceRating = (productRevenue, totalRevenue) => {
        const percentage = (productRevenue / totalRevenue) * 100;
        if (percentage > 10) return '★★★★★';
        if (percentage > 5) return '★★★★';
        if (percentage > 2) return '★★★';
        if (percentage > 1) return '★★';
        return '★';
    };

    const getEfficiencyRating = (sales, orders) => {
        if (orders === 0) return 'No Sales';
        const aov = sales / orders;
        if (aov > 5000) return 'Excellent';
        if (aov > 2000) return 'Good';
        if (aov > 1000) return 'Average';
        return 'Low';
    };

    const getCustomerTier = (totalSpent) => {
        if (totalSpent > 10000) return 'Premium';
        if (totalSpent > 5000) return 'Gold';
        if (totalSpent > 2000) return 'Silver';
        return 'Standard';
    };

    const handleDailySalesFilterChange = async (filters) => {
        setDailySalesLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(

                `${import.meta.env.VITE_API_URL}/report/daily-sales?${queryParams}`
            );

            const data = await response.json();
            if (data.success) {
                setDailySalesData(data.data);
            } else {
                toast.error("Failed to fetch daily sales data");
            }
        } catch (error) {
            toast.error("Error fetching daily sales");
        }
        setDailySalesLoading(false);
    };






    // Add this useEffect for initial daily sales load
    useEffect(() => {
        if (activeReport === "daily-sale") {
            handleDailySalesFilterChange({
                category: 'all',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [activeReport]);


    const handleTrendingFilterChange = async (filters) => {
        setTrendingLoading(true);
        try {
            const queryParams = new URLSearchParams();

            // Add all filter parameters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });

            console.log('Fetching trending data with:', Object.fromEntries(queryParams)); // Debug

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/report/trending-products?${queryParams}`
            );

            const data = await response.json();
            if (data.success) {
                setTrendingData(data.data);

                // Update the main date filter state to keep everything in sync
                if (filters.filter) {
                    setDateFilter(filters.filter);
                }

                if (filters.filter === 'custom' && filters.startDate && filters.endDate) {
                    setCustomDateRange({
                        startDate: filters.startDate,
                        endDate: filters.endDate
                    });
                }
            } else {
                toast.error("Failed to fetch trending products data");
            }
        } catch (error) {
            console.error('Error fetching trending products:', error);
            toast.error("Error fetching trending products");
        }
        setTrendingLoading(false);
    };

    // Add this useEffect for initial trending products load
    useEffect(() => {
        if (activeReport === "trending-products") {
            // Set the filter to 'today' as requested
            setDateFilter('today');

            handleTrendingFilterChange({
                category: 'all',
                filter: 'today',
            });
        }
    }, [activeReport]);


    // Add this function to handle category filters
    // Fix the initial load and default filter handling
    const handleCategoryFilterChange = async (filters) => {
        setCategoryLoading(true);
        try {
            // Update parent state with new filters
            const newDateFilter = filters.dateFilter || 'today'; // Default to today
            setDateFilter(newDateFilter);

            if (filters.startDate && filters.endDate) {
                setCustomDateRange({
                    startDate: filters.startDate,
                    endDate: filters.endDate
                });
            } else if (newDateFilter !== 'custom') {
                // Reset custom date range when not using custom filter
                setCustomDateRange({
                    startDate: "",
                    endDate: ""
                });
            }

            const queryParams = new URLSearchParams();
            queryParams.append('category', filters.category || 'all');
            queryParams.append('filter', newDateFilter);

            // Handle custom date range properly
            if (newDateFilter === 'custom') {
                if (filters.startDate && filters.endDate) {
                    queryParams.append('startDate', filters.startDate);
                    queryParams.append('endDate', filters.endDate);
                } else {
                    // If custom date is selected but dates aren't provided, use today as default
                    const today = new Date().toISOString().split('T')[0];
                    queryParams.append('startDate', today);
                    queryParams.append('endDate', today);

                    setCustomDateRange({
                        startDate: today,
                        endDate: today
                    });
                }
            }

            console.log('Fetching category data with params:', Object.fromEntries(queryParams)); // Debug

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/report/category-analysis?${queryParams}`
            );
            const data = await response.json();
            if (data.success) {
                setCategoryData(data.data);
            } else {
                toast.error("Failed to fetch category analysis data");
            }
        } catch (error) {
            console.error('Error fetching category analysis:', error);
            toast.error("Error fetching category analysis");
        }
        setCategoryLoading(false);
    };

    // Update the useEffect for initial category load
    useEffect(() => {
        if (activeReport === "category") {
            // Set default to today and trigger fetch
            setDateFilter('today');
            handleCategoryFilterChange({
                category: 'all',
                dateFilter: 'today'
            });
        }
    }, [activeReport]);

    //  Add this function to handle inventory filters 
    const handleInventoryFilterChange = async (filters) => {
        setInventoryLoading(true);

        // Update the filter state
        setInventoryFilters(filters);

        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value.toString());
            });

            console.log('Sending filters to API:', Object.fromEntries(queryParams));

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/report/inventory-expiry?${queryParams}`
            );
            const data = await response.json();
            if (data.success) {
                setInventoryData(data.data);
            } else {
                toast.error("Failed to fetch inventory data");
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error("Error fetching inventory report");
        }
        setInventoryLoading(false);
    };

    // Add this useEffect for initial inventory load
    useEffect(() => {
        if (activeReport === "inventory-expiry") {
            handleInventoryFilterChange({
                status: 'all',
                category: 'all',
                showBatches: false,
                expiryFilter: 'all'
            });
        }
    }, [activeReport]);

    const fetchSalesReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/report/sales-summary?filter=${dateFilter}&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`
            );
            const data = await response.json();
            if (data.success) {
                setSalesData(data.data);
            } else {
                toast.error("Failed to fetch sales data");
            }
        } catch (error) {
            toast.error("Error fetching sales report");
        }
        setLoading(false);
    };

    const fetchPurchaseReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/report/purchase-summary?filter=${dateFilter}&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`
            );
            const data = await response.json();
            if (data.success) {
                setPurchaseData(data.data);
            } else {
                toast.error("Failed to fetch purchase data");
            }
        } catch (error) {
            toast.error("Error fetching purchase report");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (activeReport === "sales-purchase") {
            fetchSalesReport();
            fetchPurchaseReport();
        }
    }, [activeReport, dateFilter, customDateRange]);

    const handleDateFilterChange = (filter, customRange = null) => {
        setDateFilter(filter);
        if (customRange) {
            setCustomDateRange(customRange);
        } else if (filter !== 'custom') {
            setCustomDateRange({ startDate: "", endDate: "" });
        }
    };

    const handleViewMore = (type, data, title = "") => {
        setModalType(type);
        setModalData(data);
        setModalTitle(title);
        // Collapse sidebar when modal opens
        setIsSidebarCollapsed(true);
    };

    const closeModal = () => {
        setModalData(null);
        setModalType("");
        setModalTitle("");
        // Re-expand sidebar when modal closes
        // setIsSidebarCollapsed(false); 
    };


    // Pass this to Navbar
    const handleNavigation = (path) => {
        // If navigating while modal is open, close modal first
        if (modalData) {
            closeModal();
        }
        navigate(path);
    }

    const renderReportContent = () => {
        if (loading || inventoryLoading || categoryLoading || trendingLoading || dailySalesLoading) {
            return <ReportLoading />;
        }

        switch (activeReport) {
            case "sales-purchase":
                return (
                    <div className="sales-purchase-report">
                        <div className="report-section">
                            <div className="section-header">
                                <h3 className="section-title">Sales Overview</h3>
                                <button
                                    className="export-btn"
                                    onClick={() => handleExportSalesData(salesData, dateFilter, customDateRange)}
                                    disabled={!salesData}
                                >
                                    📊 Export Sales Report
                                </button>
                            </div>
                            <SummaryCards
                                data={salesData}
                                type="sales"
                                dateFilter={dateFilter}
                                customDateRange={customDateRange}
                            />
                            <div className="charts-grid">
                                <SalesChart
                                    data={salesData}
                                    onViewMore={() => handleViewMore("sales-trend", salesData?.trendData, "Sales Trend Analysis")}
                                />
                                <DataTable
                                    title="Top Selling Products"
                                    data={salesData?.topProducts}
                                    type="top-products"
                                    onViewMore={() => handleViewMore("top-products", salesData?.topProducts, "Top Selling Products")}
                                />
                            </div>
                            <div className="tables-grid">
                                <DataTable
                                    title="Payment Method Analysis"
                                    data={salesData?.paymentMethods}
                                    type="payment-methods"
                                    onViewMore={() => handleViewMore("payment-methods", salesData?.paymentMethods, "Payment Method Analysis")}
                                />
                            </div>
                        </div>

                        <div className="report-section">
                            <div className="section-header">
                                <h3 className="section-title">Purchase Overview</h3>
                                <button
                                    className="export-btn"
                                    onClick={() => handleExportPurchaseData(purchaseData, dateFilter, customDateRange)}
                                    disabled={!purchaseData}
                                >
                                    📊 Export Purchase Report
                                </button>
                            </div>
                            <SummaryCards
                                data={purchaseData}
                                type="purchase"
                                dateFilter={dateFilter}
                                customDateRange={customDateRange}
                            />
                            <div className="charts-grid">
                                <PurchaseChart
                                    data={purchaseData}
                                    onViewMore={() => handleViewMore("purchase-trend", purchaseData?.trendData, "Purchase Trend Analysis")}
                                />
                                <DataTable
                                    title="Recent Purchases"
                                    data={purchaseData?.recentPurchases}
                                    type="recent-purchases"
                                    onViewMore={() => handleViewMore("recent-purchases", purchaseData?.recentPurchases, "Recent Purchases")}
                                />
                            </div>
                            <div className="tables-grid">
                                <DataTable
                                    title="Category-wise Purchases"
                                    data={purchaseData?.categoryBreakdown}
                                    type="category-purchases"
                                    onViewMore={() => handleViewMore("category-purchases", purchaseData?.categoryBreakdown, "Category-wise Purchases")}
                                />
                            </div>
                        </div>
                    </div>
                );

            case "inventory-expiry":
                return (
                    <div className="inventory-expiry-report">
                        <InventoryFilter
                            onFilterChange={handleInventoryFilterChange}
                            categories={inventoryData?.filters?.categories || []}
                            onExport={() => handleExportInventoryData(inventoryData)}
                            currentFilters={inventoryFilters}
                        />

                        {inventoryData && (
                            <>
                                <ExpirySummary data={inventoryData.summary} />

                                {/* Current Inventory Section - UPDATED */}
                                <div className="inventory-section">
                                    <h3 className="section-title">Current Inventory</h3>
                                    <div className="inventory-grid">
                                        {inventoryData.inventory.slice(0, 3).map((product, index) => (
                                            <ProductCard
                                                key={product.inventoryId}
                                                product={product}
                                                onViewMore={() => handleViewMore("product-details", product, product.productName)}
                                            />
                                        ))}
                                    </div>

                                    {inventoryData.inventory.length > 3 && (
                                        <div className="view-more-section">
                                            <button
                                                className="view-all-btn"
                                                onClick={() => handleViewMore("all-inventory", inventoryData.inventory, "Complete Inventory")}
                                            >
                                                View All Products ({inventoryData.inventory.length})
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Expired & Near Expiry Section - UPDATED */}
                                <div className="expired-section">
                                    <h3 className="section-title">Expired & Near Expiry Products</h3>
                                    <div className="expired-grid">
                                        {inventoryData.inventory
                                            .filter(product => product.expiryStats.expiredBatches > 0 || product.expiryStats.nearExpiryBatches > 0)
                                            .slice(0, 3)
                                            .map(product => (
                                                <ProductCard
                                                    key={product.inventoryId}
                                                    product={product}
                                                    showExpiryDetails={true}
                                                    onViewMore={() => handleViewMore("expiry-details", product, `${product.productName} - Expiry Details`)}
                                                />
                                            ))
                                        }
                                    </div>

                                    {/* ADD VIEW ALL BUTTON FOR EXPIRED PRODUCTS */}
                                    {inventoryData.inventory.filter(p => p.expiryStats.expiredBatches > 0 || p.expiryStats.nearExpiryBatches > 0).length > 3 && (
                                        <div className="view-more-section">
                                            <button
                                                className="view-all-btn"
                                                onClick={() => handleViewMore("all-expired",
                                                    inventoryData.inventory.filter(p => p.expiryStats.expiredBatches > 0 || p.expiryStats.nearExpiryBatches > 0),
                                                    "All Expired & Near Expiry Products"  // Make sure this title is set
                                                )}
                                            >
                                                View All Expired Products ({inventoryData.inventory.filter(p => p.expiryStats.expiredBatches > 0 || p.expiryStats.nearExpiryBatches > 0).length})
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Disposed Products Section - UPDATED */}
                                <DisposedProductsSection
                                    data={inventoryData}
                                    onViewMore={handleViewMore}
                                />
                            </>
                        )}
                    </div>
                );

            // Add this case to the renderReportContent function in Report.jsx
            case "category":
                return (
                    <div className="category-analysis-report">
                        <CategoryFilter
                            categories={categoryData?.filters?.categories || []}
                            selectedCategory={categoryData?.filters?.selectedCategory || 'all'}
                            dateFilter={dateFilter} // Now this is properly managed
                            customDateRange={customDateRange} // Now this is properly managed
                            onFilterChange={handleCategoryFilterChange}
                            onExport={() => handleExportCategoryData(categoryData)}
                        />

                        {categoryData && (
                            <>
                                <CategorySummary data={categoryData.summary} />

                                <div className="category-cards-grid">
                                    {categoryData.categories.slice(0, 3).map((category, index) => (
                                        <CategoryCard
                                            key={category.category}
                                            category={category}
                                        // onViewDetails={() => handleViewMore("category-details", category, `${category.category} - Detailed Analysis`)} 
                                        />
                                    ))}
                                </div>

                                {categoryData.categories.length > 5 && (
                                    <div className="view-more-section">
                                        <button
                                            className="view-all-btn"
                                            onClick={() => handleViewMore("all-categories", categoryData.categories, "All Categories Analysis")}                                        >
                                            View All Categories ({categoryData.categories.length})
                                        </button>
                                    </div>
                                )}

                                {/* Charts Section */}
                                <div className="category-charts">
                                    <div className="chart-row">
                                        <CategorySalesChart data={categoryData.categories} />
                                        <CategoryPurchaseChart data={categoryData.categories} />
                                    </div>
                                    <div className="chart-row">
                                        <CategoryStockChart data={categoryData.categories} />
                                        <CategoryPerformanceChart data={categoryData.categories} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );

            // Add this case to the renderReportContent function in Report.jsx
            case "trending-products":
                return (
                    <div className="trending-products-report">
                        <TrendingFilter
                            categories={trendingData?.filters?.categories || []}
                            selectedCategory={trendingData?.filters?.selectedCategory || 'all'}
                            dateFilter={dateFilter}
                            customDateRange={customDateRange}
                            onFilterChange={handleTrendingFilterChange}
                            onExport={() => handleExportTrendingData(trendingData)}
                        />

                        {trendingData && (
                            <>
                                <TrendingSummary data={trendingData.summary} />

                                {/* SHOW ONLY 5 PRODUCTS IN CARDS */}
                                <div className="trending-products-grid">
                                    {trendingData.trendingProducts.slice(0, 3).map((product, index) => (
                                        <TrendingProductCard
                                            key={product.productId}
                                            product={product}
                                            rank={index + 1}
                                            onViewDetails={() => handleViewMore("product-details", product, `${product.name} - Sales Details`)}
                                        />
                                    ))}
                                </div>

                                {/* SHOW VIEW ALL BUTTON ONLY IF MORE THAN 5 PRODUCTS */}
                                {trendingData.trendingProducts.length > 5 && (
                                    <div className="view-more-section">
                                        <button
                                            className="view-all-btn"
                                            onClick={() => handleViewMore("all-trending", trendingData.trendingProducts, "Top Trending Products")}
                                        >
                                            View All {trendingData.trendingProducts.length} Products
                                        </button>
                                    </div>
                                )}

                                {/* Performance Charts */}
                                <div className="trending-charts">
                                    <div className="chart-row">
                                        <TopProductsChart data={trendingData.trendingProducts.slice(0, 8)} /> {/* Limit to 8 for chart */}
                                        <SalesPerformanceChart data={trendingData.trendingProducts.slice(0, 6)} /> {/* Limit to 6 for chart */}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );


            // Add this case to the renderReportContent function in Report.jsx
            // Add this case to the renderReportContent function in Report.jsx
            // In the daily-sale case section, update the sales-overview part:
            case "daily-sale":
                return (
                    <div className="daily-sales-report">
                        <DailySalesFilter
                            categories={dailySalesData?.filters?.categories || []}
                            selectedCategory={dailySalesData?.filters?.selectedCategory || 'all'}
                            selectedDate={dailySalesData?.filters?.selectedDate || new Date().toISOString().split('T')[0]}
                            onFilterChange={handleDailySalesFilterChange}
                            onExport={() => handleExportDailySalesData(dailySalesData)}
                        />

                        {dailySalesData && (
                            <>
                                <DailySalesSummary data={dailySalesData} />

                                <div className="sales-overview">
                                    <div className="sales-cards">
                                        <div className="sales-list">
                                            <div className="section-header">
                                                <h3>Today's Sales</h3>
                                                <span className="invoice-count">
                                                    {dailySalesData.sales.length} invoices
                                                </span>
                                            </div>

                                            {/* SHOW ONLY 3 INVOICES */}
                                            {dailySalesData.sales.slice(0, 3).map((sale, index) => (
                                                <SalesCard
                                                    key={sale.invoiceNumber}
                                                    sale={sale}
                                                    onViewDetails={() => handleViewMore("sale-details", sale, `Sale Details - ${sale.invoiceNumber}`)}
                                                />
                                            ))}

                                            {/* SHOW VIEW ALL BUTTON IF MORE THAN 3 INVOICES */}
                                            {dailySalesData.sales.length > 3 && (
                                                <div className="view-more-section">
                                                    <button
                                                        className="view-all-btn"
                                                        // In the daily-sale case, update the handleViewMore call:
                                                        onClick={() => handleViewMore("all-sales", dailySalesData.sales, `All Invoices - ${dailySalesData.date}`)}                                                    >
                                                        View All {dailySalesData.sales.length} Invoices
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="sales-charts">
                                            {/* <HourlySalesChart data={dailySalesData.hourlySales} />  */}
                                            <PaymentMethodsChart data={dailySalesData.paymentMethods} />
                                        </div>
                                    </div>
                                </div>

                                <div className="products-section">
                                    <TopProductsList data={dailySalesData.topProducts} />
                                    <CategoryBreakdown data={dailySalesData.categoryBreakdown} />
                                </div>
                            </>
                        )}
                    </div>
                );



            default:
                return <div>Select a report type</div>;
        }
    };



    const applyBasicStyling = (sheets, colWidths) => {
        sheets.forEach((sheet, index) => {
            if (!sheet) return; // Skip if sheet is undefined

            if (colWidths[index]) {
                sheet['!cols'] = colWidths[index].map(width => ({ wch: width }));
            }

            // Style header rows
            const range = XLSX.utils.decode_range(sheet['!ref']);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
                if (sheet[cellAddress]) {
                    sheet[cellAddress].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "2C3E50" } },
                        alignment: { horizontal: "center" }
                    };
                }
            }

            // Special styling for Combined sheet (category rows)
            if (sheet['!ref'] && sheet['!ref'].includes('Category-Product Combined')) {
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 1 });
                    if (sheet[cellAddress] && sheet[cellAddress].v === 'CATEGORY SUMMARY') {
                        // Style category rows
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            const categoryCell = XLSX.utils.encode_cell({ r: R, c: C });
                            if (sheet[categoryCell]) {
                                sheet[categoryCell].s = {
                                    font: { bold: true, color: { rgb: "FFFFFF" } },
                                    fill: { fgColor: { rgb: "34495E" } }
                                };
                            }
                        }
                    }
                }
            }
        });
    };

    return (
        <Navbar
            onNavigation={handleNavigation}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={setIsSidebarCollapsed} // Add this
        >
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="report-container">
                {/* Premium Header */}
                {/* <div className="report-header premium-header">
                    <div className="header-content">
                        <h1 className="premium-title">Business Intelligence Dashboard</h1>
                        <p className="premium-subtitle">Advanced analytics and insights for your Perfume business</p>
                    </div>
                    <div className="header-decoration">
                        <div className="decoration-line"></div>
                    </div>
                </div> */}

                {/* Horizontal Report Navigation */}
                <div className="report-navigation premium-nav compact">
                    {reportTypes.map((report) => (
                        <div
                            key={report.id}
                            className={`nav-item ${activeReport === report.id ? "active" : ""}`}
                            onClick={() => setActiveReport(report.id)}
                        >
                            <div className="nav-icon">{report.icon}</div>
                            <span className="nav-name">{report.name}</span>
                        </div>
                    ))}
                </div>

                {/* Date Filter */}
                {/* Date Filter - ONLY SHOW FOR SALES & PURCHASE SECTION */}
                {activeReport === "sales-purchase" && (
                    <div className="filter-section premium-filter">
                        <DateFilter
                            currentFilter={dateFilter}
                            customDateRange={customDateRange}
                            onFilterChange={handleDateFilterChange}
                        />
                    </div>
                )}



                {/* Report Content */}
                <div className="report-content premium-content">
                    {renderReportContent()}
                </div>

                {/* Modal for detailed view */}
                {/* {modalData && (
                    <>
                        <ReportModal
                            type={modalType}
                            data={modalData}
                            title={modalTitle}
                            dateFilter={dateFilter}
                            customDateRange={customDateRange}
                            onClose={closeModal}
                        />

                        
                        {modalType === "product-details" && (
                            <ProductDetailsModal
                                product={modalData}
                                onClose={closeModal}
                                title={modalTitle}
                            />
                        )}
                        {modalType === "expiry-details" && (
                            <ExpiryDetailsModal
                                product={modalData}
                                onClose={closeModal}
                                title={modalTitle}
                            />
                        )}
                        {modalType === "all-inventory" && (
                            <AllProductsModal
                                products={modalData}
                                onClose={closeModal}
                                title={modalTitle}
                                type="inventory"
                            />
                        )}
                        {modalType === "all-expired" && (
                            <AllProductsModal
                                products={modalData}
                                onClose={closeModal}
                                title={modalTitle}
                                type="expired"
                            />
                        )}
                        {modalType === "all-disposed" && (
                            <AllProductsModal
                                products={modalData}
                                onClose={closeModal}
                                title={modalTitle}
                                type="disposed"
                            />
                        )}
                        {modalType === "disposed-details" && (
                            <DisposedDetailsModal
                                product={modalData}
                                onClose={closeModal}
                                title={modalTitle}
                            />
                        )}
                    </>
                )} */}

                {modalData && (
                    <ReportModal
                        type={modalType}
                        data={modalData}
                        title={modalTitle}
                        dateFilter={dateFilter}
                        customDateRange={customDateRange}
                        onClose={closeModal}
                    />
                )}

            </div>
        </Navbar>
    );
};

export default Report;