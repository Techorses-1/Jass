import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import { FaPlus, FaExchangeAlt, FaFileExport, FaFileExcel, FaSearch, FaTrash, FaSave, FaFilePdf, FaSpinner, FaEdit, FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Navbar from "../../Components/Sidebar/Navbar";
import "react-toastify/dist/ReactToastify.css";
import "./Sales.scss";
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import SalesPrint from "./SalesPrint";
import axios from "axios";

const Sales = () => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerMobileSearch, setCustomerMobileSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerNumber: "",
    name: "",
    email: "",
    mobile: "",
    date: new Date().toISOString().split('T')[0],
    remarks: ""
  });
  const [isExporting, setIsExporting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(null);
  const customerSearchRef = useRef(null);
  const batchDropdownRef = useRef(null);

  const [invoiceForPrint, setInvoiceForPrint] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isBulkImportLoading, setIsBulkImportLoading] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");


  const [activePromos, setActivePromos] = useState([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);


  const [useLoyaltyCoins, setUseLoyaltyCoins] = useState(false);
  const [availableLoyaltyCoins, setAvailableLoyaltyCoins] = useState(0);
  const [usableLoyaltyCoins, setUsableLoyaltyCoins] = useState(0);


  const [userPermissions, setUserPermissions] = useState([]);


  // ========== PAGINATION STATE (ADD THESE) ==========
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalInvoices: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
    startIndex: 0,
    endIndex: 0
  });
  const [availableYears, setAvailableYears] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimerRef = useRef(null);


  // Add these state variables after your existing state declarations
  const [timeFilter, setTimeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Add this function to get date ranges
  const getDateRange = (filterType) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (filterType) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "this-week":
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "this-month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "last-6-months":
        startDate.setMonth(today.getMonth() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "this-year":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return { start: null, end: null };
    }

    return { start: startDate, end: endDate };
  };




  // Helper function to format date in IST
  const formatDateInIST = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(date.getTime() + istOffset);

    // Format: DD-MM-YYYY HH:MM:SS
    const day = istTime.getUTCDate().toString().padStart(2, '0');
    const month = (istTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = istTime.getUTCFullYear();

    const hours = istTime.getUTCHours().toString().padStart(2, '0');
    const minutes = istTime.getUTCMinutes().toString().padStart(2, '0');
    const seconds = istTime.getUTCSeconds().toString().padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} IST`;
  };

  // Update the filteredInvoices function to include time and year filters
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Apply time filter
    if (timeFilter) {
      const { start, end } = getDateRange(timeFilter);
      if (start && end) {
        filtered = filtered.filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          return invoiceDate >= start && invoiceDate <= end;
        });
      }
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(invoice => {
        const invoiceYear = new Date(invoice.date).getFullYear().toString();
        return invoiceYear === yearFilter;
      });
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(invoice => {
        return invoice.items?.some(item => item.category === categoryFilter);
      });
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(term)) ||
        (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(term)) ||
        (invoice.customer?.mobile && invoice.customer.mobile.includes(term)) ||
        (invoice.paymentType && invoice.paymentType.toLowerCase().includes(term)) ||
        (invoice.total && invoice.total.toString().includes(term))
      );
    }

    return filtered;
  }, [searchTerm, invoices, categoryFilter, timeFilter, yearFilter]);

  // Add function to get available years from invoices
  const getAvailableYears = () => {
    const years = new Set();
    invoices.forEach(invoice => {
      if (invoice.date) {
        const year = new Date(invoice.date).getFullYear();
        years.add(year.toString());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserPermissions(user.permissions || []);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUserPermissions([]);
      }
    }
  }, []);

  const hasAdminPermission = userPermissions.includes('admin');



  // Add this useEffect to fetch active promo codes
  useEffect(() => {
    fetchActivePromos();
  }, []);

  const fetchActivePromos = async () => {
    try {
      setIsLoadingPromos(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/promoCodes/get-active-promos`);
      setActivePromos(response.data || []);
    } catch (error) {
      console.error("Error fetching active promo codes:", error);
      toast.error("Failed to load promo codes");
    } finally {
      setIsLoadingPromos(false);
    }
  };


  // Add this function to validate promo code
  const validatePromoCode = async (code) => {
    if (!code.trim()) {
      setPromoError("Please select a promo code");
      return false;
    }

    setIsValidatingPromo(true);
    setPromoError("");

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/promoCodes/validate-promo/${code.trim().toUpperCase()}`
      );

      if (response.data.isValid) {
        setAppliedPromo(response.data.promoCode);
        setPromoError("");
        toast.success(`Promo code applied! ${response.data.promoCode.discount}% discount`);
        return true;
      } else {
        // Handle validation errors...
        // (keep the existing error handling logic)
      }
    } catch (error) {
      // (keep the existing error handling logic)
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Add this function to remove applied promo
  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
    toast.info("Promo code removed");
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchInventory();
    fetchInvoices();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target)) {
        setShowBatchDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    if (!invoiceForPrint) return;

    const generatePDFAndHandleWhatsApp = async () => {
      try {
        // Wait for the SalesPrint component to render with new data
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate PDF
        await generatePDF(invoiceForPrint.invoice);

        // Open WhatsApp if needed
        // if (invoiceForPrint.openWhatsapp) {
        //   const customerMobile = (invoiceForPrint.invoice.customer?.mobile || "").replace(/\D/g, "");
        //   if (customerMobile) {
        //     const message = `Hello ${invoiceForPrint.invoice.customer?.name || ""}, your invoice (No: ${invoiceForPrint.invoice.invoiceNumber}) has been generated.`;
        //     window.open(`https://wa.me/${customerMobile}?text=${encodeURIComponent(message)}`, "_blank");
        //   }
        // }
      }
      catch (error) {
        console.error("Error in PDF/WhatsApp process:", error);
        toast.error("Failed to generate PDF");
      } finally {
        setInvoiceForPrint(null);
      }
    };

    generatePDFAndHandleWhatsApp();
  }, [invoiceForPrint]);

  useEffect(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category).filter(Boolean))];
    setCategories(uniqueCategories);
  }, [products]);


  // ========== DEBOUNCED SEARCH EFFECT ==========
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (pagination.currentPage !== 1) {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      } else {
        fetchInvoices();
      }
      // Update URL with filters
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (timeFilter) params.time = timeFilter;
      if (yearFilter) params.year = yearFilter;
      if (pagination.currentPage !== 1) params.page = pagination.currentPage;
      setSearchParams(params, { replace: true });
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, categoryFilter, timeFilter, yearFilter]);

  // ========== SYNC FILTERS FROM URL ON PAGE LOAD ==========
  useEffect(() => {
    const search = searchParams.get('search') || "";
    const category = searchParams.get('category') || "";
    const time = searchParams.get('time') || "";
    const year = searchParams.get('year') || "";
    const page = parseInt(searchParams.get('page')) || 1;

    if (search) setSearchTerm(search);
    if (category) setCategoryFilter(category);
    if (time) setTimeFilter(time);
    if (year) setYearFilter(year);
    if (page !== 1) setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  // ========== FETCH WHEN PAGE CHANGES ==========
  useEffect(() => {
    if (pagination.currentPage) {
      fetchInvoices();
    }
  }, [pagination.currentPage]);


  // NEW PAGINATED FETCH FUNCTION
  const fetchInvoicesPaginated = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.limit);
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (timeFilter) params.append('timeFilter', timeFilter);
      if (yearFilter) params.append('yearFilter', yearFilter);

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/get-invoices?${params.toString()}`);

      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setPagination({
          currentPage: response.data.data.pagination.currentPage,
          totalPages: response.data.data.pagination.totalPages,
          totalInvoices: response.data.data.pagination.totalInvoices,
          limit: response.data.data.pagination.limit,
          hasNextPage: response.data.data.pagination.hasNextPage,
          hasPrevPage: response.data.data.pagination.hasPrevPage,
          startIndex: response.data.data.pagination.startIndex,
          endIndex: response.data.data.pagination.endIndex
        });

        if (response.data.data.availableYears) {
          setAvailableYears(response.data.data.availableYears);
        }
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      // FALLBACK to old method if new endpoint fails
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/get-all-invoices`);
        const invoicesData = (response.data && response.data.data) ? response.data.data : [];
        const sortedInvoices = invoicesData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          if (dateB - dateA !== 0) return dateB - dateA;
          const numA = parseInt((a.invoiceNumber || "").replace(/\D/g, "")) || 0;
          const numB = parseInt((b.invoiceNumber || "").replace(/\D/g, "")) || 0;
          return numB - numA;
        });
        setInvoices(sortedInvoices);
      } catch (fallbackError) {
        toast.error("Failed to load invoices");
      }
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, categoryFilter, timeFilter, yearFilter]);

  // Keep your original fetchInvoices as fallback (rename it)
  const fetchInvoicesOld = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/get-all-invoices`);
      const invoicesData = (response.data && response.data.data) ? response.data.data : [];
      const sortedInvoices = invoicesData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        if (dateB - dateA !== 0) return dateB - dateA;
        const numA = parseInt((a.invoiceNumber || "").replace(/\D/g, "")) || 0;
        const numB = parseInt((b.invoiceNumber || "").replace(/\D/g, "")) || 0;
        return numB - numA;
      });
      setInvoices(sortedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  // Use this as your main fetch function (you can decide which one to use)
  const fetchInvoices = fetchInvoicesPaginated;

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/get-customers`);
      const customersData = response.data.map(customer => ({
        customerId: customer.customerId,
        id: customer.customerId,
        customerNumber: customer.customerId,
        name: customer.customerName || "",
        email: customer.email || "",
        mobile: customer.contactNumber || "",
        loyaltyCoins: customer.loyaltyCoins || 0 // ✅ THIS MUST BE INCLUDED
      }));
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/products/get-products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setIsLoadingInventory(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/get-inventory`);

      // FIX: Extract the data array from response
      setInventory(response.data.data || []);

    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Batch management functions
  // Batch management functions
  const getAvailableBatches = (productId) => {
    const inventoryItem = inventory.find(item => item.productId === productId);
    if (!inventoryItem) return [];

    const currentDate = new Date();

    return inventoryItem.batches
      .filter(batch => {
        const isExpired = new Date(batch.expiryDate) < currentDate;
        return batch.quantity > 0 && !isExpired;
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)) // Sort by expiry date (earliest first)
      .map(batch => ({
        ...batch,
        productId: inventoryItem.productId,
        productName: inventoryItem.productName,
        category: inventoryItem.category
      }));
  };


  const getAvailableQuantity = (productId, batchNumber) => {
    const inventoryItem = inventory.find(item => item.productId === productId);
    if (!inventoryItem) return 0;

    const batch = inventoryItem.batches.find(b => b.batchNumber === batchNumber);
    return batch ? batch.quantity : 0;
  };

  const handleProductSelect = (product) => {
    const availableBatches = getAvailableBatches(product.productId);

    // ✅ ADDED: Validation for batch number and expiry date
    const inventoryItem = inventory.find(item => item.productId === product.productId);

    // Check if product exists in inventory
    if (!inventoryItem) {
      toast.error("❌ Product not found in inventory. Cannot add this product.");
      setItemSearchTerm(""); // Clear search term
      return;
    }

    // Check if product has any batches at all
    if (!inventoryItem.batches || inventoryItem.batches.length === 0) {
      toast.error("❌ This product has no batch numbers. Cannot add to invoice.");
      setItemSearchTerm(""); // Clear search term
      return;
    }

    // Check if all batches are missing expiry dates
    const batchesWithoutExpiry = inventoryItem.batches.filter(batch =>
      !batch.expiryDate || batch.expiryDate === ""
    );

    if (batchesWithoutExpiry.length === inventoryItem.batches.length) {
      toast.error("❌ All batches for this product are missing expiry dates. Cannot add to invoice.");
      setItemSearchTerm(""); // Clear search term
      return;
    }

    // Check if all batches are expired
    const currentDate = new Date();
    const expiredBatches = inventoryItem.batches.filter(batch => {
      if (!batch.expiryDate) return true; // No expiry date = consider as invalid
      return new Date(batch.expiryDate) < currentDate;
    });

    if (expiredBatches.length === inventoryItem.batches.length) {
      toast.error("❌ All batches for this product are expired. Cannot add to invoice.");
      setItemSearchTerm(""); // Clear search term
      return;
    }

    // Check if all batches have zero quantity
    const batchesWithZeroQuantity = inventoryItem.batches.filter(batch =>
      batch.quantity <= 0
    );

    if (batchesWithZeroQuantity.length === inventoryItem.batches.length) {
      toast.error("❌ All batches for this product have zero quantity. Cannot add to invoice.");
      setItemSearchTerm(""); // Clear search term
      return;
    }

    // Original logic for available batches
    if (availableBatches.length === 0) {
      toast.error("❌ No available stock with valid batches for this product");
      setItemSearchTerm(""); // Clear search term
      return;
    }

    if (availableBatches.length === 1) {
      handleBatchSelect(availableBatches[0]);
      setItemSearchTerm(""); // Clear search term after selection
    } else {
      setShowBatchDropdown(product.productId);
      setItemSearchTerm(""); // Clear search term
    }
  };

  // Update the handleBatchSelect function
  const handleBatchSelect = (batch) => {
    const existingItemIndex = selectedItems.findIndex(i =>
      i.productId === batch.productId && i.batchNumber === batch.batchNumber
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...selectedItems];
      const availableQty = getAvailableQuantity(batch.productId, batch.batchNumber);

      if (updatedItems[existingItemIndex].quantity >= availableQty) {
        toast.error(`Only ${availableQty} items available in this batch`);
        return;
      }

      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      const product = products.find(p => p.productId === batch.productId);
      setSelectedItems([...selectedItems, {
        productId: batch.productId,
        id: batch.productId,
        name: batch.productName,
        category: batch.category,
        hsn: product?.hsnCode || "",
        barcode: product?.barcode || "",
        originalPrice: product?.price || 0,
        price: product?.price || 0,
        quantity: 1,
        discount: product?.discount || 0,
        taxSlab: product?.taxSlab || 18, // ✅ ADD THIS LINE
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate
      }]);
    }

    setShowBatchDropdown(null);
    setItemSearchTerm("");
  };



  // Item management
  const handleItemUpdate = (index, field, value) => {
    const updatedItems = [...selectedItems];

    if (field === 'quantity') {
      const item = updatedItems[index];
      const availableQty = getAvailableQuantity(item.productId, item.batchNumber);

      if (value > availableQty) {
        toast.error(`Only ${availableQty} items available in this batch`);
        return;
      }

      updatedItems[index][field] = value === "" ? "" : parseInt(value) || 0;
    } else if (field === 'discount') {
      updatedItems[index][field] = value === "" ? "" : parseInt(value) || 0;
    } else if (field === 'price') {
      updatedItems[index][field] = value;
    } else {
      updatedItems[index][field] = value;
    }

    setSelectedItems(updatedItems);
  };

  // Customer management
  const handleCustomerSelect = (customer) => {
    setNewCustomer({
      customerNumber: customer.customerNumber,
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      date: newCustomer.date,
      remarks: newCustomer.remarks
    });
    setCustomerMobileSearch(customer.mobile);
    setShowCustomerDropdown(false);

    // Calculate usable loyalty coins
    const totalCoins = customer.loyaltyCoins || 0;
    const usableCoins = Math.max(0, totalCoins - 50);

    setAvailableLoyaltyCoins(totalCoins);
    setUsableLoyaltyCoins(usableCoins);
    setUseLoyaltyCoins(false); // Reset checkbox
  };

  const createCustomer = async (customerData, initialCoins = 0) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/customer/create-customer`, {
        customerName: customerData.name,
        email: customerData.email,
        contactNumber: customerData.mobile.replace(/\D/g, ''),
        loyaltyCoins: initialCoins,
      });

      // ✅ Return properly structured customer object
      return {
        customerId: response.data.customerId || response.data.id,
        id: response.data.customerId || response.data.id,
        customerNumber: response.data.customerId,
        name: response.data.customerName,
        email: response.data.email,
        mobile: response.data.contactNumber,
        loyaltyCoins: initialCoins,
      };
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  };

  const calculateInvoiceTotals = (items, existingInvoice = null) => {
    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalBaseValue = 0;
    let totalTaxAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    const taxPercentages = new Set();

    // First calculate amount after all item discounts
    let amountAfterItemDiscounts = 0;

    const itemsWithCalculations = items.map(item => {
      const quantity = item.quantity || 1;
      const taxRate = item.taxSlab || 18;
      const discountPercentage = item.discount || 0;

      taxPercentages.add(taxRate);

      const itemTotalInclTax = item.price * quantity;
      const itemDiscountAmount = itemTotalInclTax * (discountPercentage / 100);
      const itemTotalAfterDiscount = itemTotalInclTax - itemDiscountAmount;

      subtotal += itemTotalInclTax;
      totalDiscountAmount += itemDiscountAmount;
      amountAfterItemDiscounts += itemTotalAfterDiscount;

      return {
        ...item,
        discountAmount: itemDiscountAmount,
        totalAmount: itemTotalAfterDiscount
      };
    });

    // ✅✅✅ CRITICAL FIX: Use the CORRECT promo data source
    let promoDiscountAmount = 0;

    // For EXISTING invoices (when editing in modal) - USE THE INVOICE'S PROMO DATA
    if (existingInvoice && existingInvoice.appliedPromoCode) {
      promoDiscountAmount = amountAfterItemDiscounts * (existingInvoice.appliedPromoCode.discount / 100);
    }
    // For NEW invoices (when creating in main form) - use the main component's appliedPromo
    else if (appliedPromo && !existingInvoice) {
      promoDiscountAmount = amountAfterItemDiscounts * (appliedPromo.discount / 100);
    }

    // Amount after promo discount
    const amountAfterPromo = amountAfterItemDiscounts - promoDiscountAmount;

    // ✅ FIXED: Handle both new and existing loyalty calculations
    let loyaltyDiscountAmount = 0;
    let actualLoyaltyCoinsUsed = 0;

    // For existing invoices, use the original loyalty coins used
    if (existingInvoice && existingInvoice.loyaltyCoinsUsed && existingInvoice.loyaltyCoinsUsed > 0) {
      loyaltyDiscountAmount = Math.min(existingInvoice.loyaltyCoinsUsed, amountAfterPromo);
      actualLoyaltyCoinsUsed = Math.floor(loyaltyDiscountAmount);
    }
    // For NEW invoices, calculate based on current loyalty coins selection
    else if (useLoyaltyCoins && usableLoyaltyCoins > 0 && !existingInvoice) {
      // Calculate maximum usable loyalty discount (1 coin = ₹1)
      const maxLoyaltyDiscount = Math.min(usableLoyaltyCoins, amountAfterPromo);
      loyaltyDiscountAmount = maxLoyaltyDiscount;
      actualLoyaltyCoinsUsed = Math.floor(loyaltyDiscountAmount);
    }

    // Final amount after ALL discounts (item + promo + loyalty)
    const finalAmountAfterAllDiscounts = amountAfterPromo - loyaltyDiscountAmount;

    // ✅✅✅ CRITICAL FIX: Prevent division by zero
    const safeAmountAfterItemDiscounts = amountAfterItemDiscounts > 0 ? amountAfterItemDiscounts : 1;

    // Calculate tax on the final amount after ALL discounts
    const itemsWithTaxCalculations = itemsWithCalculations.map(item => {
      const taxRate = item.taxSlab || 18;

      // Calculate tax based on final discounted amount for this item
      // Distribute the total discount proportionally to each item
      const itemFinalAmount = (item.totalAmount / safeAmountAfterItemDiscounts) * finalAmountAfterAllDiscounts;
      const itemBaseValue = itemFinalAmount / (1 + taxRate / 100);
      const itemTaxAmount = itemFinalAmount - itemBaseValue;
      const itemCgstAmount = taxPercentages.size === 1 ? itemTaxAmount / 2 : 0;
      const itemSgstAmount = taxPercentages.size === 1 ? itemTaxAmount / 2 : 0;

      totalBaseValue += itemBaseValue;
      totalTaxAmount += itemTaxAmount;
      cgstAmount += itemCgstAmount;
      sgstAmount += itemSgstAmount;

      return {
        ...item,
        baseValue: itemBaseValue,
        taxAmount: itemTaxAmount,
        cgstAmount: itemCgstAmount,
        sgstAmount: itemSgstAmount,
        finalAmount: itemFinalAmount
      };
    });

    const hasMixedTaxRates = taxPercentages.size > 1;
    if (hasMixedTaxRates) {
      cgstAmount = 0;
      sgstAmount = 0;
    }

    // Final grand total
    const grandTotal = finalAmountAfterAllDiscounts;

    return {
      items: itemsWithTaxCalculations,
      subtotal: subtotal,
      baseValue: totalBaseValue,
      discount: totalDiscountAmount,
      promoDiscount: promoDiscountAmount,
      loyaltyDiscount: loyaltyDiscountAmount,
      loyaltyCoinsUsed: actualLoyaltyCoinsUsed,
      tax: totalTaxAmount,
      cgst: cgstAmount,
      sgst: sgstAmount,
      hasMixedTaxRates: hasMixedTaxRates,
      taxPercentages: Array.from(taxPercentages),
      amountAfterAllDiscounts: amountAfterItemDiscounts,
      finalAmountAfterAllDiscounts: finalAmountAfterAllDiscounts,
      grandTotal: grandTotal
    };
  };


  const calculateLoyaltyCoins = (invoiceTotals) => {
    // Use baseValue which is total after discounts but before tax
    const spendAmount = invoiceTotals.baseValue;

    // Calculate coins: 1 coin per 100 rupees, rounded down
    const coins = Math.floor(spendAmount / 100);

    return coins;
  };

  const updateCustomerLoyaltyCoins = async (customerId, coinsEarned, coinsUsed) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/customer/update-loyalty-coins/${customerId}`,
        {
          coinsEarned: coinsEarned || 0,
          coinsUsed: coinsUsed || 0
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating customer loyalty coins:", error);
      throw error;
    }
  };

  const handleSubmit = async (values) => {
    // 🔥 ADD SUBMISSION LOCK
    if (isSubmitting) {
      console.log('Submission already in progress, please wait...');
      return;
    }

    // Validate items
    const hasInvalidQuantity = selectedItems.some(item =>
      !item.quantity || item.quantity === "" || item.quantity < 1
    );

    if (selectedItems.length === 0 || hasInvalidQuantity) {
      toast.error("Please add at least one item and ensure all quantities are valid (minimum 1)");
      return;
    }

    // Validate customer data from newCustomer state
    if (!newCustomer.mobile || !newCustomer.mobile.trim()) {
      toast.error("Customer mobile number is required");
      return;
    }

    if (!newCustomer.name || !newCustomer.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    // Validate mobile number format
    const mobileRegex = /^\d{10}$/;
    const cleanMobile = newCustomer.mobile.replace(/\D/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    // Validate quantities against available stock
    for (const item of selectedItems) {
      const availableQty = getAvailableQuantity(item.productId, item.batchNumber);
      if (item.quantity > availableQty) {
        toast.error(`Only ${availableQty} items available for ${item.name} (Batch: ${item.batchNumber})`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Find existing customer
      const existingCustomer = customers.find(c =>
        c.mobile?.replace(/\D/g, '') === cleanMobile
      );

      // Calculate invoice totals
      const invoiceTotals = calculateInvoiceTotals(selectedItems);
      const loyaltyCoinsEarned = calculateLoyaltyCoins(invoiceTotals);
      const loyaltyCoinsUsed = invoiceTotals.loyaltyCoinsUsed || 0;

      // ⭐⭐⭐ CRITICAL FIX: Create customer object with ALL required fields
      let customerForInvoice = null;

      if (!existingCustomer) {
        // CREATE NEW CUSTOMER
        try {
          const initialCoins = loyaltyCoinsEarned;
          const createdCustomer = await createCustomer(newCustomer, initialCoins);

          // ⭐ EXPLICITLY create customer object with name and mobile
          customerForInvoice = {
            customerId: createdCustomer.customerId || createdCustomer.id,
            customerNumber: createdCustomer.customerNumber || createdCustomer.customerId,
            name: createdCustomer.name || newCustomer.name,  // ✅ ENSURE NAME EXISTS
            email: createdCustomer.email || newCustomer.email || '',
            mobile: createdCustomer.mobile || cleanMobile  // ✅ ENSURE MOBILE EXISTS
          };

          console.log("✅ New customer created:", customerForInvoice);

          // Update customers list
          setCustomers(prev => [...prev, {
            ...customerForInvoice,
            loyaltyCoins: initialCoins
          }]);

          toast.success("New customer created successfully!");
        } catch (error) {
          console.error("Error creating customer:", error);
          toast.error(error.response?.data?.message || "Failed to create customer");
          setIsSubmitting(false);
          return;
        }
      } else {
        // USE EXISTING CUSTOMER
        // ⭐ EXPLICITLY create customer object with name and mobile from existingCustomer
        customerForInvoice = {
          customerId: existingCustomer.customerId || existingCustomer.id,
          customerNumber: existingCustomer.customerNumber || existingCustomer.customerId,
          name: existingCustomer.name || existingCustomer.customerName,  // ✅ ENSURE NAME EXISTS
          email: existingCustomer.email || '',
          mobile: existingCustomer.mobile || cleanMobile  // ✅ ENSURE MOBILE EXISTS
        };

        console.log("✅ Using existing customer:", customerForInvoice);

        // Validate loyalty coins usage
        if (useLoyaltyCoins && loyaltyCoinsUsed > 0) {
          const requiredCoins = 50 + loyaltyCoinsUsed;
          if ((existingCustomer.loyaltyCoins || 0) < requiredCoins) {
            toast.error(`Customer doesn't have enough loyalty coins. Available: ${existingCustomer.loyaltyCoins || 0}, Required: ${requiredCoins}`);
            setIsSubmitting(false);
            return;
          }
        }

        // Update loyalty coins
        if (loyaltyCoinsUsed > 0 || loyaltyCoinsEarned > 0) {
          try {
            await updateCustomerLoyaltyCoins(
              customerForInvoice.customerId,
              loyaltyCoinsEarned,
              loyaltyCoinsUsed
            );
          } catch (error) {
            console.error("Error updating loyalty coins:", error);
            toast.error("Failed to update customer loyalty coins");
            setIsSubmitting(false);
            return;
          }
        }
      }

      // ⭐⭐⭐ CRITICAL: Verify customer object has required fields before sending
      if (!customerForInvoice.name || !customerForInvoice.mobile) {
        console.error("❌ Customer object missing required fields:", customerForInvoice);
        toast.error("Customer data is invalid. Please check customer details.");
        setIsSubmitting(false);
        return;
      }

      // ⭐⭐⭐ CREATE INVOICE WITH PROPER CUSTOMER OBJECT
      const invoice = {
        date: newCustomer.date || new Date().toISOString().split('T')[0],
        customer: {
          name: customerForInvoice.name,  // ✅ MUST HAVE THIS
          mobile: customerForInvoice.mobile,  // ✅ MUST HAVE THIS
          email: customerForInvoice.email || '',
          customerId: customerForInvoice.customerId,
          customerNumber: customerForInvoice.customerNumber
        },
        items: invoiceTotals.items.map(item => ({
          productId: item.productId,
          name: item.name,
          barcode: item.barcode || "",
          hsn: item.hsn || "",
          category: item.category || "",
          price: Number(item.price) || 0,
          taxSlab: Number(item.taxSlab) || 18,
          quantity: Number(item.quantity),
          discount: Number(item.discount) || 0,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate || null,
          baseValue: Number(item.baseValue) || 0,
          discountAmount: Number(item.discountAmount) || 0,
          taxAmount: Number(item.taxAmount) || 0,
          cgstAmount: Number(item.cgstAmount) || 0,
          sgstAmount: Number(item.sgstAmount) || 0,
          totalAmount: Number(item.totalAmount) || Number(item.finalAmount) || 0
        })),
        paymentType: values.paymentType,
        subtotal: Number(invoiceTotals.subtotal) || 0,
        baseValue: Number(invoiceTotals.baseValue) || 0,
        discount: Number(invoiceTotals.discount) || 0,
        promoDiscount: Number(invoiceTotals.promoDiscount) || 0,
        appliedPromoCode: appliedPromo ? {
          promoId: appliedPromo.promoId,
          code: appliedPromo.code,
          discount: Number(appliedPromo.discount),
          description: appliedPromo.description || "",
          appliedAt: new Date()
        } : null,
        loyaltyDiscount: Number(invoiceTotals.loyaltyDiscount) || 0,
        loyaltyCoinsUsed: Number(invoiceTotals.loyaltyCoinsUsed) || 0,
        tax: Number(invoiceTotals.tax) || 0,
        cgst: Number(invoiceTotals.cgst) || 0,
        sgst: Number(invoiceTotals.sgst) || 0,
        hasMixedTaxRates: invoiceTotals.hasMixedTaxRates || false,
        taxPercentages: invoiceTotals.taxPercentages || [],
        total: Number(invoiceTotals.grandTotal) || 0,
        remarks: newCustomer.remarks || '',
        loyaltyCoinsEarned: Number(loyaltyCoinsEarned) || 0
      };

      // ⭐ DEBUG: Log the invoice customer object
      console.log("📤 FINAL INVOICE CUSTOMER OBJECT:", invoice.customer);
      console.log("📤 FULL INVOICE BEING SENT:", JSON.stringify(invoice, null, 2));

      // Save to database
      const savedInvoice = await saveInvoiceToDB(invoice);

      // Update invoices list
      setInvoices(prev => {
        const updated = [savedInvoice.data, ...prev];
        updated.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          if (dateB - dateA !== 0) return dateB - dateA;
          const numA = parseInt((a.invoiceNumber || "").replace(/\D/g, "")) || 0;
          const numB = parseInt((b.invoiceNumber || "").replace(/\D/g, "")) || 0;
          return numB - numA;
        });
        return updated;
      });

      // Refresh inventory
      await fetchInventory();

      // Reset all form states
      setSelectedItems([]);
      setNewCustomer({
        customerNumber: "",
        name: "",
        email: "",
        mobile: "",
        date: new Date().toISOString().split('T')[0],
        remarks: ""
      });
      setCustomerMobileSearch("");
      setUseLoyaltyCoins(false);
      setAvailableLoyaltyCoins(0);
      setUsableLoyaltyCoins(0);
      setPromoCode("");
      setAppliedPromo(null);
      setPromoError("");

      // Send WhatsApp message
      const customerMobile = customerForInvoice.mobile.replace(/\D/g, "");
      const whatsappMessage = `Hello ${customerForInvoice.name},\n\nYour invoice (No: ${savedInvoice.data.invoiceNumber}) has been generated.\n\nTotal Amount: ₹${invoice.total.toFixed(2)}\nPayment: ${values.paymentType.toUpperCase()}\n\nThank you for shopping with us!`;

      window.open(`https://wa.me/${customerMobile}?text=${encodeURIComponent(whatsappMessage)}`, "_blank");

      // Set invoice for PDF
      setInvoiceForPrint({ invoice: savedInvoice.data, openWhatsapp: false });

      // Show success message
      let successMessage = "Invoice created successfully!";
      if (loyaltyCoinsEarned > 0) successMessage += ` Earned ${loyaltyCoinsEarned} loyalty coins.`;
      if (loyaltyCoinsUsed > 0) successMessage += ` Used ${loyaltyCoinsUsed} loyalty coins.`;
      toast.success(successMessage);

    } catch (error) {
      console.error("❌ Error creating invoice:", error);
      toast.error(error.response?.data?.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };


  // Update your saveInvoiceToDB function
  const saveInvoiceToDB = async (invoice) => {
    try {
      // Get user from localStorage
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      // Ensure customer data is properly structured before sending
      const payload = {
        date: invoice.date,
        customer: {
          name: invoice.customer.name || invoice.customer.customerName,
          mobile: invoice.customer.mobile || invoice.customer.contactNumber,
          email: invoice.customer.email || "",
          customerId: invoice.customer.customerId || invoice.customer.id,
          customerNumber: invoice.customer.customerNumber || invoice.customer.customerId
        },
        items: invoice.items.map(item => ({
          productId: item.productId,
          name: item.name,
          barcode: item.barcode || "",
          hsn: item.hsn || "",
          category: item.category || "",
          price: Number(item.price) || 0,
          taxSlab: Number(item.taxSlab) || 18,
          quantity: Number(item.quantity) || 1,
          discount: Number(item.discount) || 0,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate || null,
          baseValue: Number(item.baseValue) || 0,
          discountAmount: Number(item.discountAmount) || 0,
          taxAmount: Number(item.taxAmount) || 0,
          cgstAmount: Number(item.cgstAmount) || 0,
          sgstAmount: Number(item.sgstAmount) || 0,
          totalAmount: Number(item.totalAmount) || Number(item.finalAmount) || 0
        })),
        paymentType: invoice.paymentType,
        subtotal: Number(invoice.subtotal) || 0,
        baseValue: Number(invoice.baseValue) || 0,
        discount: Number(invoice.discount) || 0,
        promoDiscount: Number(invoice.promoDiscount) || 0,
        appliedPromoCode: invoice.appliedPromoCode ? {
          promoId: invoice.appliedPromoCode.promoId,
          code: invoice.appliedPromoCode.code,
          discount: Number(invoice.appliedPromoCode.discount) || 0,
          description: invoice.appliedPromoCode.description || "",
          appliedAt: invoice.appliedPromoCode.appliedAt || new Date()
        } : null,
        loyaltyDiscount: Number(invoice.loyaltyDiscount) || 0,
        loyaltyCoinsUsed: Number(invoice.loyaltyCoinsUsed) || 0,
        tax: Number(invoice.tax) || 0,
        cgst: Number(invoice.cgst) || 0,
        sgst: Number(invoice.sgst) || 0,
        hasMixedTaxRates: invoice.hasMixedTaxRates || false,
        taxPercentages: invoice.taxPercentages || [],
        total: Number(invoice.total) || 0,
        remarks: invoice.remarks || "",
        loyaltyCoinsEarned: Number(invoice.loyaltyCoinsEarned) || 0,
        userDetails: user ? {
          userId: user.userId,
          name: user.name,
          email: user.email
        } : null
      };

      // Debug log to verify payload
      console.log("📤 Sending payload to backend:", JSON.stringify(payload, null, 2));
      console.log("📤 Customer data being sent:", payload.customer);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/invoices/create-invoice`, payload);
      return response.data;
    } catch (error) {
      console.error("Error saving invoice to database:", error);
      console.error("Response data:", error.response?.data);
      console.error("Request payload:", error.config?.data);
      throw error;
    }
  };

  const updateInvoice = async (invoiceData) => {
    try {

      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      const updatePayload = {
        customer: {
          customerId: invoiceData.customer?.customerId,
          customerNumber: invoiceData.customer?.customerNumber,
          name: invoiceData.customer?.name,
          email: invoiceData.customer?.email,
          mobile: invoiceData.customer?.mobile
        },
        paymentType: invoiceData.paymentType,
        remarks: invoiceData.remarks || '',

        userDetails: user ? {
          userId: user.userId,
          name: user.name,
          email: user.email
        } : null
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/invoices/update-invoice/${invoiceData.invoiceNumber}`,
        updatePayload
      );
      return response.data;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  };

  const deleteInvoice = async (invoiceNumber) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/invoices/delete-invoice/${invoiceNumber}`
      );
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  };

  // PDF generation
  const generatePDF = async (invoice) => {
    if (!invoice) return;
    if (isExporting) return;
    setIsExporting(true);

    try {
      // Wait a bit more to ensure the hidden element is rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = document.getElementById("sales-pdf");
      if (!element) {
        console.error("PDF element not found, retrying...");
        // Try one more time after a delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryElement = document.getElementById("sales-pdf");
        if (!retryElement) {
          throw new Error("PDF print element not found after retry");
        }
      }

      const addFooterToEachPage = (pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(100, 100, 100);

          const pageWidth = pdf.internal.pageSize.getWidth();
          const text = "THIS IS A COMPUTER GENERATED BILL";
          const textWidth = pdf.getTextWidth(text);
          const xPosition = (pageWidth - textWidth) / 2;
          const yPosition = pageHeight - 10;

          pdf.text(text, xPosition, yPosition);
          pdf.setDrawColor(200, 200, 200);
          pdf.line(15, yPosition - 3, pageWidth - 15, yPosition - 3);
        }

        return pdf;
      };

      const opt = {
        filename: `${invoice.invoiceNumber}_${(invoice.customer?.name || "customer").replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['tr', '.invoice-footer']
        },
        margin: [0, 0, 20, 0]
      };

      await html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          return addFooterToEachPage(pdf);
        })
        .save();

      console.log("PDF generated successfully");

    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  // ========== EXPORT EXCEL - FIXED VERSION ==========
  const handleExportExcel = async () => {
    setIsExporting(true);

    try {
      // Build filter parameters for the export endpoint
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (timeFilter) params.append('timeFilter', timeFilter);
      if (yearFilter) params.append('yearFilter', yearFilter);

      // Show loading toast
      const loadingToast = toast.loading("Fetching all invoices for export...");

      // Call the export endpoint - gets ALL filtered data (no pagination)
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/invoices/export-invoices?${params.toString()}`
      );

      toast.dismiss(loadingToast);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch invoices for export");
      }

      const allInvoices = response.data.data;

      if (allInvoices.length === 0) {
        toast.warn("No invoices to export");
        setIsExporting(false);
        return;
      }

      console.log(`📊 Exporting ${allInvoices.length} invoices with ${response.data.count || allInvoices.length} total`);

      // Process ALL invoices for Excel export
      const data = allInvoices.flatMap((invoice) => {
        // Filter items based on category filter
        let filteredItems = invoice.items || [];

        if (categoryFilter) {
          filteredItems = filteredItems.filter(item =>
            item.category === categoryFilter
          );
        }

        // If no items after filtering and we have a category filter, skip this invoice
        if (categoryFilter && filteredItems.length === 0) {
          return [];
        }

        if (filteredItems.length === 0) {
          return [{
            'Invoice Number': invoice.invoiceNumber,
            'Date': invoice.date,
            'Customer Name': invoice.customer?.name || '',
            'Customer Email': invoice.customer?.email || '',
            'Customer Mobile': invoice.customer?.mobile || '',
            'Payment Type': invoice.paymentType,
            'Remarks': invoice.remarks || '',
            'Subtotal': `₹${invoice.subtotal?.toFixed(2) || '0.00'}`,
            'Total Discount': `₹${invoice.discount?.toFixed(2) || '0.00'}`,
            'CGST Amount': `₹${invoice.cgst?.toFixed(2) || '0.00'}`,
            'SGST Amount': `₹${invoice.sgst?.toFixed(2) || '0.00'}`,
            'Total Tax': `₹${invoice.tax?.toFixed(2) || '0.00'}`,
            'Grand Total': `₹${invoice.total?.toFixed(2) || '0.00'}`,
            'Items Count': 0,
            'Item Name': 'No items',
            'HSN Code': 'N/A',
            'Batch Number': 'N/A',
            'Category': 'N/A',
            'Quantity': 0,
            'Price': 0,
            'Item Total': '0.00',
            'Promo Name': invoice.appliedPromoCode?.code || '',
            'Promo Amount': `₹${invoice.promoDiscount?.toFixed(2) || '0.00'}`,
            'Loyalty Coins Used': invoice.loyaltyCoinsUsed || 0,
            'Loyalty Coins Earned': invoice.loyaltyCoinsEarned || 0,
            'Invoice Date': new Date(invoice.createdAt || invoice.date).toLocaleDateString(),
            'Invoice Time': new Date(invoice.createdAt || invoice.date).toLocaleTimeString()
          }];
        }

        return filteredItems.map((item) => {
          // Calculate item total for export
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          const itemDiscountAmount = itemTotal * ((item.discount || 0) / 100);
          const itemTotalAfterDiscount = itemTotal - itemDiscountAmount;

          return {
            'Invoice Number': invoice.invoiceNumber,
            'Date': invoice.date,
            'Customer Name': invoice.customer?.name || '',
            'Customer Email': invoice.customer?.email || '',
            'Customer Mobile': invoice.customer?.mobile || '',
            'Payment Type': invoice.paymentType,
            'Remarks': invoice.remarks || '',
            'Subtotal': `₹${invoice.subtotal?.toFixed(2) || '0.00'}`,
            'Total Discount': `₹${invoice.discount?.toFixed(2) || '0.00'}`,
            'CGST Amount': `₹${invoice.cgst?.toFixed(2) || '0.00'}`,
            'SGST Amount': `₹${invoice.sgst?.toFixed(2) || '0.00'}`,
            'Total Tax': `₹${invoice.tax?.toFixed(2) || '0.00'}`,
            'Grand Total': `₹${invoice.total?.toFixed(2) || '0.00'}`,
            'Items Count': filteredItems.length,
            'Item Name': item.name || item.productName || 'Unknown',
            'HSN Code': item.hsn || item.hsnCode || 'N/A',
            'Batch Number': item.batchNumber || 'N/A',
            'Category': item.category || 'N/A',
            'Quantity': item.quantity || 0,
            'Price': `₹${(item.price || 0).toFixed(2)}`,
            'Discount %': `${item.discount || 0}%`,
            'Item Total': `₹${itemTotalAfterDiscount.toFixed(2)}`,
            'Promo Name': invoice.appliedPromoCode?.code || '',
            'Promo Amount': `₹${invoice.promoDiscount?.toFixed(2) || '0.00'}`,
            'Loyalty Coins Used': invoice.loyaltyCoinsUsed || 0,
            'Loyalty Coins Earned': invoice.loyaltyCoinsEarned || 0,
            'Invoice Date': new Date(invoice.createdAt || invoice.date).toLocaleDateString(),
            'Invoice Time': new Date(invoice.createdAt || invoice.date).toLocaleTimeString()
          };
        });
      });

      if (data.length === 0) {
        toast.warn(`No invoices found with current filters`);
        setIsExporting(false);
        return;
      }

      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

      // Create filename based on filters
      let fileName = "invoices";

      if (timeFilter) {
        fileName += `_${timeFilter.replace(/\s+/g, '_')}`;
      }
      if (yearFilter) {
        fileName += `_${yearFilter}`;
      }
      if (categoryFilter) {
        fileName += `_${categoryFilter.replace(/\s+/g, '_')}`;
      }
      if (searchTerm) {
        fileName += `_search_${searchTerm.replace(/\s+/g, '_')}`;
      }

      fileName += ".xlsx";

      XLSX.writeFile(workbook, fileName);

      const invoiceCount = new Set(data.map(item => item['Invoice Number'])).size;

      let filterMessage = `Exported ${invoiceCount} invoices with ${data.length} item rows`;
      if (timeFilter || yearFilter || categoryFilter || searchTerm) {
        filterMessage += " (Filtered by:";
        if (timeFilter) filterMessage += ` ${timeFilter}`;
        if (yearFilter) filterMessage += ` ${yearFilter}`;
        if (categoryFilter) filterMessage += ` ${categoryFilter}`;
        if (searchTerm) filterMessage += ` search: "${searchTerm}"`;
        filterMessage += ")";
      }

      toast.success(filterMessage);

    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Failed to export invoices");
    } finally {
      setIsExporting(false);
    }
  };


  const handleUpdateInvoice = async (updatedInvoice) => {
    try {


      const result = await updateInvoice(updatedInvoice);
      setInvoices(prev =>
        prev.map(inv =>
          inv.invoiceNumber === updatedInvoice.invoiceNumber ? { ...inv, ...result.data } : inv
        )
      );
      setSelectedInvoice(prev => prev ? { ...prev, ...result.data } : null);
      toast.success("Invoice updated successfully!");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error(error.response?.data?.message || "Error updating invoice");
    }
  };

  const handleDeleteInvoice = async (invoiceNumber) => {
    try {
      console.log('🗑️ Frontend: Attempting to delete invoice:', invoiceNumber);

      // Get user from localStorage
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/invoices/delete-invoice/${invoiceNumber}`,
        {
          // ADD THIS - Send user details in request body
          data: {
            userDetails: user ? {
              userId: user.userId,
              name: user.name,
              email: user.email
            } : null
          }
        }
      );

      // Remove from invoices list
      setInvoices(prev => prev.filter(inv => inv.invoiceNumber !== invoiceNumber));
      setSelectedInvoice(null);

      console.log('✅ Frontend: Invoice deleted successfully:', {
        invoiceNumber,
        response: response.data
      });

      // Show success message
      toast.success(
        `Invoice deleted successfully! ${response.data.restorationDetails.itemsRestored} items restored to inventory.`
      );

      // Refresh inventory data
      await fetchInventory();

    } catch (error) {
      console.error('❌ Frontend: Error deleting invoice:', {
        invoiceNumber,
        error: error.response?.data,
        message: error.message
      });

      // Handle batch not found error specifically
      if (error.response?.data?.success === false &&
        error.response?.data?.message?.includes("inventory batches not found")) {

        const errorData = error.response.data;
        const errorCount = errorData.details?.totalErrors || 0;
        const firstError = errorData.errors?.[0] || {};

        toast.error(
          `Cannot delete invoice! ${errorCount} item(s) not found in inventory. Example: ${firstError.productName} (Batch: ${firstError.batchNumber})`
        );

        console.warn('🛑 Invoice deletion blocked due to missing batches:', errorData.details);

      } else {
        // Generic error
        toast.error(error.response?.data?.message || "Error deleting invoice");
      }
    }
  };

  // Filter functions
  const filteredProducts = useMemo(() => {
    if (!itemSearchTerm) return [];
    const term = itemSearchTerm.toLowerCase();
    return products.filter(product =>
      (product.productName && product.productName.toLowerCase().includes(term)) ||
      (product.hsnCode && product.hsnCode.toLowerCase().includes(term)) ||
      (product.barcode && product.barcode.includes(term)) ||
      (product.price && product.price.toString().includes(term))
    );
  }, [itemSearchTerm, products]);

  const filteredCustomers = useMemo(() => {
    if (!customerMobileSearch) return [];
    const term = customerMobileSearch.toLowerCase();
    return customers.filter(customer =>
      (customer.mobile && customer.mobile.includes(term)) ||
      (customer.name && customer.name.toLowerCase().includes(term))
    );
  }, [customerMobileSearch, customers]);

  // Filter functions - UPDATED VERSION
  // const filteredInvoices = useMemo(() => {
  //   if (!searchTerm && !categoryFilter) return invoices;

  //   let filtered = invoices;

  //   // Apply category filter first
  //   if (categoryFilter) {
  //     filtered = filtered.filter(invoice => {
  //       // Check if any item in the invoice matches the selected category
  //       return invoice.items?.some(item => item.category === categoryFilter);
  //     });
  //   }

  //   // Apply search term filter
  //   if (searchTerm) {
  //     const term = searchTerm.toLowerCase();
  //     filtered = filtered.filter(invoice =>
  //       (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(term)) ||
  //       (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(term)) ||
  //       (invoice.customer?.mobile && invoice.customer.mobile.includes(term)) ||
  //       (invoice.paymentType && invoice.paymentType.toLowerCase().includes(term)) ||
  //       (invoice.total && invoice.total.toString().includes(term))
  //     );
  //   }

  //   return filtered;
  // }, [searchTerm, invoices, categoryFilter]);


  // Bulk import function - Groups items by invoice
  const handleBulkImport = async (file) => {
    try {
      setIsBulkImportLoading(true);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            toast.error("No data found in the file");
            setIsBulkImportLoading(false);
            return;
          }

          console.log("Raw Excel data:", jsonData[0]); // Debug first row

          // Group rows by invoice number
          const invoicesMap = new Map();

          jsonData.forEach((row, index) => {
            const invoiceNumber = row['Invoice Number'];

            if (!invoiceNumber) {
              console.warn(`Skipping row ${index + 1}: No invoice number`);
              return;
            }

            if (!invoicesMap.has(invoiceNumber)) {
              // Create new invoice structure with ALL fields from Excel
              invoicesMap.set(invoiceNumber, {
                invoiceNumber: invoiceNumber,
                date: row['Date'] || new Date().toISOString().split('T')[0],
                customer: {
                  customerId: row['Customer ID'] || `CUST-${invoiceNumber}`,
                  customerNumber: row['Customer ID'] || `CUST-${invoiceNumber}`,
                  name: row['Customer Name'] || '',
                  email: row['Customer Email'] || '',
                  mobile: row['Customer Mobile'] || ''
                },
                items: [],
                paymentType: row['Payment Type'] || 'cash',
                // IMPORTANT: Read all calculation fields from Excel
                subtotal: parseFloat(row['Subtotal']) || 0,
                baseValue: parseFloat(row['Base Value']) || 0,
                discount: parseFloat(row['Total Discount']) || 0,
                tax: parseFloat(row['Total Tax']) || 0,
                cgst: parseFloat(row['CGST']) || 0,
                sgst: parseFloat(row['SGST']) || 0,
                total: parseFloat(row['Grand Total']) || 0,
                hasMixedTaxRates: row['Has Mixed Tax Rates'] === 'Yes',
                taxPercentages: row['Tax Percentages'] ?
                  row['Tax Percentages'].toString().split(',').map(p => parseFloat(p.trim())).filter(n => !isNaN(n)) : [],
                remarks: row['Remarks'] || '',
                createdAt: row['Created At'] ? new Date(row['Created At']) : new Date(),
                updatedAt: row['Updated At'] ? new Date(row['Updated At']) : new Date()
              });
            }

            // Add item to the invoice if it has valid item data
            const currentInvoice = invoicesMap.get(invoiceNumber);
            if (row['Item Name'] && row['Item Name'] !== 'No items') {
              const newItem = {
                productId: row['Item Product ID'] || `PROD-${invoiceNumber}-${index}`,
                name: row['Item Name'],
                barcode: row['Item Barcode'] || '',
                hsn: row['Item HSN'] || row['HSN Code'] || '',
                category: row['Item Category'] || row['Category'] || '',
                price: parseFloat(row['Item Price']) || 0,
                taxSlab: parseFloat(row['Item Tax Slab']) || 18,
                quantity: parseInt(row['Item Quantity']) || 1,
                discount: parseFloat(row['Item Discount %']) || 0,
                batchNumber: row['Item Batch Number'] || 'DEFAULT',
                expiryDate: row['Item Expiry Date'] || null,
                // IMPORTANT: Read all item calculation fields
                baseValue: parseFloat(row['Item Base Value']) || 0,
                discountAmount: parseFloat(row['Item Discount Amount']) || 0,
                taxAmount: parseFloat(row['Item Tax Amount']) || 0,
                cgstAmount: parseFloat(row['Item CGST Amount']) || 0,
                sgstAmount: parseFloat(row['Item SGST Amount']) || 0,
                totalAmount: parseFloat(row['Item Total Amount']) || 0
              };

              currentInvoice.items.push(newItem);
            }
          });

          const invoicesToImport = Array.from(invoicesMap.values());

          console.log(`Processed ${invoicesToImport.length} invoices with multiple items`);

          // Debug: Check if data is properly read
          if (invoicesToImport.length > 0) {
            const sampleInvoice = invoicesToImport[0];
            console.log("Sample invoice data:", {
              invoiceNumber: sampleInvoice.invoiceNumber,
              subtotal: sampleInvoice.subtotal,
              cgst: sampleInvoice.cgst,
              sgst: sampleInvoice.sgst,
              taxPercentages: sampleInvoice.taxPercentages,
              hasMixedTaxRates: sampleInvoice.hasMixedTaxRates,
              items: sampleInvoice.items.map(item => ({
                name: item.name,
                cgstAmount: item.cgstAmount,
                sgstAmount: item.sgstAmount
              }))
            });
          }

          // Send to backend
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/invoices/bulk-import-invoices`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ invoices: invoicesToImport }),
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Failed to import invoices");
          }

          // Show detailed results
          const totalInvoices = invoicesToImport.length;
          const totalItems = invoicesToImport.reduce((sum, inv) => sum + inv.items.length, 0);

          toast.success(
            `Import completed: ${result.results.successful.length}/${totalInvoices} invoices successful, ${totalItems} total items`
          );

          // Refresh invoices list
          if (result.results.successful.length > 0) {
            await fetchInvoices();
          }

          // Log failed imports for debugging
          if (result.results.failed.length > 0) {
            console.warn("Failed imports:", result.results.failed);
            toast.info(`${result.results.failed.length} invoices failed to import. Check console for details.`);
          }

          setShowBulkImport(false);

        } catch (error) {
          console.error("Error processing file:", error);
          toast.error(error.message || "Error processing the file");
        } finally {
          setIsBulkImportLoading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Error reading file");
        setIsBulkImportLoading(false);
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error("Error in bulk import:", error);
      toast.error("Failed to import invoices");
      setIsBulkImportLoading(false);
    }
  };


  const InvoiceModal = ({ invoice, onClose, onUpdate, onDelete, fetchInventory }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingProducts, setIsEditingProducts] = useState(false);
    const [editedInvoice, setEditedInvoice] = useState({});
    const [editedItems, setEditedItems] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemSearchTerm, setItemSearchTerm] = useState("");
    const [showBatchDropdown, setShowBatchDropdown] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [userPermissions, setUserPermissions] = useState([]);

    const getAvailableQuantity = (productId, batchNumber) => {
      const inventoryItem = inventory.find(item => item.productId === productId);
      if (!inventoryItem) return 0;

      const batch = inventoryItem.batches.find(b => b.batchNumber === batchNumber);
      return batch ? batch.quantity : 0;
    };

    useEffect(() => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserPermissions(user.permissions || []);
        } catch (error) {
          console.error("Error parsing user data:", error);
          setUserPermissions([]);
        }
      }
    }, []);


    const hasAdminPermission = userPermissions.includes('admin');


    // Refs
    const batchDropdownRef = useRef(null);

    useEffect(() => {
      if (invoice) {
        setEditedInvoice({ ...invoice });
        // ✅ FIXED: Create DEEP COPY of items to avoid reference issues
        setEditedItems(invoice.items.map(item => ({
          ...item,
          // Ensure we have the original quantity for comparison
          originalQuantity: item.quantity
        })));
      }
    }, [invoice]);



    // Add this useEffect in the InvoiceModal component to debug promo discount updates
    // Update the debug useEffect to use the correct function call:

    useEffect(() => {
      if (isEditingProducts) {
        const currentTotals = calculateInvoiceTotals(editedItems, invoice); // ✅ Pass invoice here
        console.log("🔄 PROMO DISCOUNT UPDATE:", {
          itemsCount: editedItems.length,
          subtotal: currentTotals.subtotal,
          amountAfterItemDiscounts: currentTotals.amountAfterAllDiscounts,
          promoDiscount: currentTotals.promoDiscount,
          appliedPromoCode: invoice.appliedPromoCode,
          recalculated: new Date().toLocaleTimeString()
        });
      }
    }, [editedItems, isEditingProducts, invoice]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target)) {
          setShowBatchDropdown(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Filter products for search
    const filteredProducts = useMemo(() => {
      if (!itemSearchTerm) return [];
      const term = itemSearchTerm.toLowerCase();
      return products.filter(product =>
        (product.productName && product.productName.toLowerCase().includes(term)) ||
        (product.hsnCode && product.hsnCode.toLowerCase().includes(term)) ||
        (product.barcode && product.barcode.includes(term))
      );
    }, [itemSearchTerm, products]);

    // Get available batches for product
    const getAvailableBatches = (productId) => {
      const inventoryItem = inventory.find(item => item.productId === productId);
      if (!inventoryItem) return [];

      const currentDate = new Date();
      return inventoryItem.batches
        .filter(batch => {
          const isExpired = new Date(batch.expiryDate) < currentDate;
          return batch.quantity > 0 && !isExpired;
        })
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    };

    // Handle product selection for adding new item
    const handleProductSelect = (product) => {
      const availableBatches = getAvailableBatches(product.productId);

      if (availableBatches.length === 0) {
        toast.error("No available stock for this product");
        return;
      }

      if (availableBatches.length === 1) {
        handleAddNewItem(product, availableBatches[0]);
      } else {
        setShowBatchDropdown(product.productId);
      }
    };

    // Add new item to edited items
    const handleAddNewItem = (product, batch) => {
      const newItem = {
        productId: product.productId,
        id: product.productId,
        name: product.productName,
        category: product.category,
        hsn: product.hsnCode || "",
        barcode: product.barcode || "",
        originalPrice: product.price || 0,
        price: product.price || 0,
        quantity: 1,
        discount: product.discount || 0,
        taxSlab: product.taxSlab || 18,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate
      };

      setEditedItems(prev => [...prev, newItem]);
      setItemSearchTerm("");
      setShowBatchDropdown(null);
    };

    // Update existing item - FIXED QUANTITY UPDATE LOGIC
    const handleItemUpdate = (index, field, value) => {
      const updatedItems = [...editedItems];

      if (field === 'quantity') {
        // Ensure quantity is at least 1
        const newQuantity = Math.max(1, parseInt(value) || 1);

        // Store the original quantity if not already stored
        if (!updatedItems[index].hasOwnProperty('originalQuantity')) {
          updatedItems[index].originalQuantity = updatedItems[index].quantity;
        }

        updatedItems[index][field] = newQuantity;

        console.log(`🔄 Quantity updated:`, {
          product: updatedItems[index].name,
          batch: updatedItems[index].batchNumber,
          originalQuantity: updatedItems[index].originalQuantity,
          newQuantity: newQuantity,
          difference: newQuantity - updatedItems[index].originalQuantity
        });
      } else if (field === 'discount') {
        updatedItems[index][field] = value === "" ? "" : parseInt(value) || 0;
      } else if (field === 'price') {
        updatedItems[index][field] = value;
      } else {
        updatedItems[index][field] = value;
      }

      setEditedItems(updatedItems);
    };

    // Remove item
    const handleRemoveItem = (index) => {
      const removedItem = editedItems[index];
      console.log(`🗑️ Removing item:`, {
        product: removedItem.name,
        batch: removedItem.batchNumber,
        quantity: removedItem.quantity
      });

      setEditedItems(prev => prev.filter((_, i) => i !== index));
    };

    // FIXED: Save product changes with proper inventory synchronization
    const handleSaveProducts = async () => {
      if (!invoice) return;

      setIsSaving(true);
      try {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;

        console.log("🔄 Starting product update process...");

        // ✅ FIX: Calculate proper tax values for each item before sending
        const itemsWithProperCalculations = editedItems.map(item => {
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const discount = item.discount || 0;
          const taxRate = item.taxSlab || 18;

          // Calculate item totals with proper tax breakdown
          const itemTotalBeforeDiscount = price * quantity;
          const discountAmount = itemTotalBeforeDiscount * (discount / 100);
          const itemTotalAfterDiscount = itemTotalBeforeDiscount - discountAmount;

          // Calculate tax components
          const baseValue = itemTotalAfterDiscount / (1 + taxRate / 100);
          const taxAmount = itemTotalAfterDiscount - baseValue;
          const cgstAmount = taxAmount / 2;
          const sgstAmount = taxAmount / 2;
          const finalAmount = itemTotalAfterDiscount;

          return {
            ...item,
            baseValue: parseFloat(baseValue.toFixed(2)),
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            cgstAmount: parseFloat(cgstAmount.toFixed(2)),
            sgstAmount: parseFloat(sgstAmount.toFixed(2)),
            totalAmount: parseFloat(itemTotalAfterDiscount.toFixed(2)),
            finalAmount: parseFloat(finalAmount.toFixed(2))
          };
        });

        console.log("✅ Items with proper calculations:", itemsWithProperCalculations);

        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/invoices/update-invoice-products/${invoice.invoiceNumber}`,
          {
            updatedItems: itemsWithProperCalculations,
            originalItems: invoice.items,
            userDetails: user ? {
              userId: user.userId,
              name: user.name,
              email: user.email
            } : null
          }
        );

        if (response.data.success) {
          setEditedInvoice(response.data.data);
          setIsEditingProducts(false);
          toast.success("Invoice products updated successfully!");

          if (onUpdate) {
            onUpdate(response.data.data);
          }
          fetchInventory();
        }
      } catch (error) {
        console.error("❌ Error updating invoice products:", error);
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          if (Array.isArray(errors)) {
            errors.forEach(err => {
              toast.error(`Inventory error: ${err.productName} - ${err.error} (Available: ${err.available})`);
            });
          }
        } else {
          toast.error(error.response?.data?.message || "Failed to update products");
        }
      } finally {
        setIsSaving(false);
      }
    };

    // FIXED: EXACT SAME CALCULATION LOGIC AS MAIN SALES COMPONENT
    // const calculateInvoiceTotals = (items) => {
    //   let subtotal = 0;
    //   let totalDiscountAmount = 0;
    //   let totalBaseValue = 0;
    //   let totalTaxAmount = 0;
    //   let cgstAmount = 0;
    //   let sgstAmount = 0;
    //   const taxPercentages = new Set();

    //   // First calculate amount after all discounts
    //   let amountAfterAllDiscounts = 0;

    //   const itemsWithCalculations = items.map(item => {
    //     const quantity = item.quantity || 1;
    //     const taxRate = item.taxSlab || 18;
    //     const discountPercentage = item.discount || 0;

    //     taxPercentages.add(taxRate);

    //     const itemTotalInclTax = item.price * quantity;
    //     const itemDiscountAmount = itemTotalInclTax * (discountPercentage / 100);
    //     const itemTotalAfterDiscount = itemTotalInclTax - itemDiscountAmount;

    //     subtotal += itemTotalInclTax;
    //     totalDiscountAmount += itemDiscountAmount;
    //     amountAfterAllDiscounts += itemTotalAfterDiscount;

    //     return {
    //       ...item,
    //       discountAmount: itemDiscountAmount,
    //       totalAmount: itemTotalAfterDiscount
    //     };
    //   });

    //   // Apply promo discount - PRESERVE ORIGINAL INVOICE'S PROMO DISCOUNT
    //   let promoDiscountAmount = invoice.promoDiscount || 0;

    //   // Amount after promo discount
    //   const amountAfterPromo = amountAfterAllDiscounts - promoDiscountAmount;

    //   // Apply loyalty coins discount - PRESERVE ORIGINAL INVOICE'S LOYALTY DISCOUNT
    //   let loyaltyDiscountAmount = invoice.loyaltyDiscount || 0;

    //   // Final amount after ALL discounts (promo + loyalty)
    //   const finalAmountAfterAllDiscounts = amountAfterPromo - loyaltyDiscountAmount;

    //   // Calculate tax on the final amount after ALL discounts
    //   const itemsWithTaxCalculations = itemsWithCalculations.map(item => {
    //     const taxRate = item.taxSlab || 18;

    //     // Calculate tax based on final discounted amount for this item
    //     const itemFinalAmount = (item.totalAmount / amountAfterAllDiscounts) * finalAmountAfterAllDiscounts;
    //     const itemBaseValue = itemFinalAmount / (1 + taxRate / 100);
    //     const itemTaxAmount = itemFinalAmount - itemBaseValue;
    //     const itemCgstAmount = taxPercentages.size === 1 ? itemTaxAmount / 2 : 0;
    //     const itemSgstAmount = taxPercentages.size === 1 ? itemTaxAmount / 2 : 0;

    //     totalBaseValue += itemBaseValue;
    //     totalTaxAmount += itemTaxAmount;
    //     cgstAmount += itemCgstAmount;
    //     sgstAmount += itemSgstAmount;

    //     return {
    //       ...item,
    //       baseValue: itemBaseValue,
    //       taxAmount: itemTaxAmount,
    //       cgstAmount: itemCgstAmount,
    //       sgstAmount: itemSgstAmount,
    //       finalAmount: itemFinalAmount
    //     };
    //   });

    //   const hasMixedTaxRates = taxPercentages.size > 1;
    //   if (hasMixedTaxRates) {
    //     cgstAmount = 0;
    //     sgstAmount = 0;
    //   }

    //   // Final grand total
    //   const grandTotal = finalAmountAfterAllDiscounts;

    //   return {
    //     items: itemsWithTaxCalculations,
    //     subtotal: subtotal,
    //     baseValue: totalBaseValue,
    //     discount: totalDiscountAmount,
    //     promoDiscount: promoDiscountAmount,
    //     loyaltyDiscount: loyaltyDiscountAmount,
    //     loyaltyCoinsUsed: invoice.loyaltyCoinsUsed || 0,
    //     tax: totalTaxAmount,
    //     cgst: cgstAmount,
    //     sgst: sgstAmount,
    //     hasMixedTaxRates: hasMixedTaxRates,
    //     taxPercentages: Array.from(taxPercentages),
    //     amountAfterAllDiscounts: amountAfterAllDiscounts,
    //     finalAmountAfterAllDiscounts: finalAmountAfterAllDiscounts,
    //     grandTotal: grandTotal
    //   };
    // };

    // FIXED: Proper calculation breakdown for VIEW MODE that shows ALL discounts



    const calculateInvoiceBreakdown = (invoice) => {


      // For view mode, use the actual invoice data with proper fallbacks
      const subtotal = invoice.subtotal || 0;
      const itemDiscount = invoice.discount || 0; // ✅ FIXED: Ensure this is 0 if undefined
      const promoDiscount = invoice.promoDiscount || 0;
      const loyaltyDiscount = invoice.loyaltyDiscount || 0;
      const tax = invoice.tax || 0;
      const cgst = invoice.cgst || 0;
      const sgst = invoice.sgst || 0;
      const total = invoice.total || 0;

      // ✅ FIXED: Direct calculation without unnecessary Math.max
      const amountBeforeTax = subtotal - itemDiscount;
      const amountAfterPromo = amountBeforeTax - promoDiscount;
      const amountAfterLoyalty = amountAfterPromo - loyaltyDiscount;



      return {
        subtotal,
        itemDiscount,
        promoDiscount,
        loyaltyDiscount,
        amountBeforeTax: amountBeforeTax, // ✅ NOW IT WILL SHOW THE CORRECT VALUE
        amountAfterPromo: amountAfterPromo, // ✅ NOW IT WILL SHOW CORRECT VALUE
        amountAfterLoyalty: amountAfterLoyalty,
        tax,
        cgst,
        sgst,
        grandTotal: total,
        hasMixedTaxRates: invoice.hasMixedTaxRates || false,
        taxPercentages: invoice.taxPercentages || [18],
        loyaltyCoinsUsed: invoice.loyaltyCoinsUsed || 0
      };
    };

    // In the InvoiceModal component, update the calculateCurrentTotals function:


    const calculateCurrentTotals = () => {
      if (isEditingProducts) {
        // In edit mode, recalculate with the original invoice's promo and loyalty data
        const totals = calculateInvoiceTotals(editedItems, invoice);



        return totals;
      } else {
        // In view mode, use original invoice data
        const viewTotals = calculateInvoiceBreakdown(invoice);



        return viewTotals;
      }
    };

    // Original functions
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      if (name === "remarks") {
        setEditedInvoice(prev => ({
          ...prev,
          remarks: value
        }));
      } else {
        setEditedInvoice(prev => ({
          ...prev,
          customer: {
            ...prev.customer,
            [name]: value
          }
        }));
      }
    };

    const handlePaymentTypeChange = (e) => {
      setEditedInvoice(prev => ({
        ...prev,
        paymentType: e.target.value
      }));
    };

    const handleSave = async () => {
      try {
        await onUpdate(editedInvoice);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating invoice:", error);
      }
    };

    const calculateItemTotal = (item) => {
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const discount = item.discount || 0;

      const totalBeforeDiscount = price * quantity;
      const discountAmount = totalBeforeDiscount * (discount / 100);
      return totalBeforeDiscount - discountAmount;
    };

    if (!invoice) return null;

    // FIXED: Use proper calculation based on mode
    const currentTotals = calculateCurrentTotals();

    // FIXED: Safe number formatting function
    const safeToFixed = (value, decimals = 2) => {
      if (value === undefined || value === null || isNaN(value)) {
        return '0.00';
      }
      return Number(value).toFixed(decimals);
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content invoice-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              {isEditingProducts ? "Edit Invoice Products" :
                isEditing ? "Edit Invoice" :
                  `Invoice Details: ${invoice.invoiceNumber}`}
            </div>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            {/* Basic Invoice Information */}
            <div className="invoice-section">
              <h3 className="section-title">Basic Information</h3>
              <div className="wo-details-grid">
                <div className="detail-row">
                  <span className="detail-label">Invoice Number:</span>
                  <span className="detail-value">{invoice.invoiceNumber}</span>
                </div>



                <div className="detail-row">
                  <span className="detail-label">Invoice Date:</span>
                  <span className="detail-value">{invoice.date}</span>
                </div>





                <div className="detail-row">
                  <span className="detail-label">Customer Name:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editedInvoice.customer?.name || ''}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  ) : (
                    <span className="detail-value">{invoice.customer?.name}</span>
                  )}
                </div>

                <div className="detail-row">
                  <span className="detail-label">Customer Email:</span>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editedInvoice.customer?.email || ''}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  ) : (
                    <span className="detail-value">{invoice.customer?.email || 'N/A'}</span>
                  )}
                </div>

                <div className="detail-row">
                  <span className="detail-label">Customer Mobile:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      name="mobile"
                      value={editedInvoice.customer?.mobile || ''}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  ) : (
                    <span className="detail-value">{invoice.customer?.mobile}</span>
                  )}
                </div>

                <div className="detail-row">
                  <span className="detail-label">Payment Type:</span>
                  {isEditing ? (
                    <select
                      value={editedInvoice.paymentType || ''}
                      onChange={handlePaymentTypeChange}
                      className="edit-input"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  ) : (
                    <span className="detail-value">{invoice.paymentType}</span>
                  )}
                </div>

                <div className="detail-row">
                  <span className="detail-label">Remarks:</span>
                  {isEditing ? (
                    <textarea
                      name="remarks"
                      value={editedInvoice.remarks || ''}
                      onChange={(e) => setEditedInvoice(prev => ({
                        ...prev,
                        remarks: e.target.value
                      }))}
                      className="edit-input"
                      rows={3}
                      style={{ width: '100%', resize: 'vertical' }}
                      placeholder="Optional remarks..."
                    />
                  ) : (
                    <span className="detail-value">{invoice.remarks || 'No remarks'}</span>
                  )}
                </div>


                <div className="detail-row">
                  <span className="detail-label">Created Date</span>
                  <span className="detail-value">
                    {formatDateInIST(invoice.createdAt || invoice.date)}
                    {!invoice.createdAt && (
                      <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                        (Time not recorded)
                      </span>
                    )}
                  </span>
                </div>

                {invoice.loyaltyCoinsUsed > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Loyalty Coins Used:</span>
                    <span className="detail-value">
                      {invoice.loyaltyCoinsUsed} coins (₹{safeToFixed(currentTotals.loyaltyDiscount)})
                    </span>
                  </div>
                )}

                {invoice.appliedPromoCode && (
                  <div className="detail-row">
                    <span className="detail-label">Promo Code Applied:</span>
                    <span className="detail-value promo-code-value">
                      {invoice.appliedPromoCode.code} - {invoice.appliedPromoCode.discount}% off
                      {invoice.appliedPromoCode.description && (
                        <div className="promo-description">{invoice.appliedPromoCode.description}</div>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Details Section */}
            <div className="invoice-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 className="section-title">
                  Items Details ({isEditingProducts ? editedItems.length : invoice.items?.length || 0} items)
                  {isEditingProducts && (
                    <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>
                      (Editing Mode)
                    </span>
                  )}
                </h3>

                {!isEditing && !isEditingProducts && hasAdminPermission && (
                  <button
                    className="update-btn"
                    onClick={() => setIsEditingProducts(true)}
                    style={{ margin: 0 }}
                  >
                    <FaEdit /> Update Products
                  </button>
                )}
              </div>

              {isEditingProducts ? (
                /* EDIT MODE - Products Editing */
                <div>
                  {/* Search and Add New Product */}
                  <div className="form-group-row">
                    <div className="field-wrapper">
                      <label>Add New Product</label>
                      <input
                        type="text"
                        placeholder="Search products to add..."
                        value={itemSearchTerm}
                        onChange={(e) => setItemSearchTerm(e.target.value)}
                      />
                      {itemSearchTerm && filteredProducts.length > 0 && (
                        <div className="search-dropdown">
                          {filteredProducts.map(product => {
                            const availableBatches = getAvailableBatches(product.productId);
                            const totalAvailable = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);

                            return (
                              <div
                                key={product.productId}
                                className={`dropdown-item ${totalAvailable === 0 ? 'out-of-stock' : ''}`}
                                onClick={() => {
                                  if (totalAvailable > 0) {
                                    handleProductSelect(product);
                                  }
                                }}
                              >
                                <div>
                                  {product.productName}
                                  {totalAvailable > 0 && (
                                    <span className="stock-badge">In Stock: {totalAvailable}</span>
                                  )}
                                  {totalAvailable === 0 && (
                                    <span className="stock-badge out-of-stock">Out of Stock</span>
                                  )}
                                </div>
                                <div>
                                  HSN: {product.hsnCode || "N/A"} |
                                  Price: ₹{product.price || 0} |
                                  Category: {product.category}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch Selection Modal */}
                  {showBatchDropdown && (
                    <div className="batch-dropdown-overlay">
                      <div className="batch-dropdown" ref={batchDropdownRef}>
                        <h4>Select Batch</h4>
                        {getAvailableBatches(showBatchDropdown).map(batch => (
                          <div
                            key={batch.batchNumber}
                            className="batch-option"
                            onClick={() => {
                              const product = products.find(p => p.productId === showBatchDropdown);
                              handleAddNewItem(product, batch);
                            }}
                          >
                            <div className="batch-info">
                              <strong>Batch: {batch.batchNumber}</strong>
                              <span>Qty: {batch.quantity}</span>
                            </div>
                            <div className="batch-details">
                              Expiry: {new Date(batch.expiryDate).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                        <button
                          className="cancel-batch-select"
                          onClick={() => setShowBatchDropdown(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Editable Items Table */}
                  <div className="items-table-container">
                    <table className="items-details-table">
                      <thead>
                        <tr>
                          <th width="5%">Sr No</th>
                          <th width="20%">Product Name</th>
                          <th width="10%">Batch No</th>
                          <th width="8%">Qty</th>
                          <th width="12%">Price</th>
                          <th width="10%">Discount %</th>
                          <th width="15%">Total</th>
                          <th width="20%">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editedItems.map((item, index) => (
                          <tr key={`${item.productId}-${item.batchNumber}-${index}`}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="product-name">{item.name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {item.category} | HSN: {item.hsn || "N/A"}
                              </div>
                            </td>
                            <td>
                              <div className="batch-info">
                                <span className="batch-tag">{item.batchNumber || "N/A"}</span>
                                {item.expiryDate && (
                                  <div className="expiry-date">
                                    Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max={getAvailableQuantity(item.productId, item.batchNumber)}
                                value={item.quantity || 1}
                                onChange={(e) => handleItemUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
                                style={{ width: '60px', padding: '4px' }}
                              />
                              <div className="available-qty" style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                                Max: {getAvailableQuantity(item.productId, item.batchNumber)}
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price || 0}
                                onChange={(e) => handleItemUpdate(index, 'price', parseFloat(e.target.value) || 0)}
                                style={{ width: '80px', padding: '4px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount || 0}
                                onChange={(e) => handleItemUpdate(index, 'discount', parseInt(e.target.value) || 0)}
                                style={{ width: '60px', padding: '4px' }}
                              />%
                            </td>
                            <td className="amount-cell">
                              ₹{safeToFixed(calculateItemTotal(item))}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                  className="invoice-remove-btn"
                                  onClick={() => handleRemoveItem(index)}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  <FaTrash /> Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Current Calculation Preview */}
                  <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <h4>Current Calculation Preview</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <strong>Subtotal:</strong> ₹{safeToFixed(currentTotals.subtotal)}
                      </div>
                      <div>
                        <strong>Discount:</strong> ₹{safeToFixed(currentTotals.discount)}
                      </div>
                      {currentTotals.promoDiscount > 0 && (
                        <div>
                          <strong>Promo Discount:</strong> ₹{safeToFixed(currentTotals.promoDiscount)}
                        </div>
                      )}
                      {currentTotals.loyaltyDiscount > 0 && (
                        <div>
                          <strong>Loyalty Discount:</strong> ₹{safeToFixed(currentTotals.loyaltyDiscount)}
                        </div>
                      )}
                      <div>
                        <strong>Tax:</strong> ₹{safeToFixed(currentTotals.tax)}
                      </div>
                      <div>
                        <strong>Grand Total:</strong> ₹{safeToFixed(currentTotals.grandTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW MODE - Original Items Display */
                invoice.items && invoice.items.length > 0 ? (
                  <div className="items-table-container">
                    <table className="items-details-table">
                      <thead>
                        <tr>
                          <th width="5%">Sr No</th>
                          <th width="20%">Product Name</th>
                          <th width="10%">HSN Code</th>
                          <th width="10%">Category</th>
                          <th width="10%">Batch No</th>
                          <th width="8%">Qty</th>
                          <th width="12%">Price</th>
                          <th width="10%">Discount %</th>
                          <th width="15%">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, index) => (
                          <tr key={`${item.productId}-${item.batchNumber}-${index}`}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="product-name">{item.name}</div>
                              {item.barcode && (
                                <div className="product-barcode">Barcode: {item.barcode}</div>
                              )}
                            </td>
                            <td>{item.hsn || "N/A"}</td>
                            <td>
                              <span className="category-tag">{item.category || "N/A"}</span>
                            </td>
                            <td>
                              <div className="batch-info">
                                <span className="batch-tag">{item.batchNumber || "N/A"}</span>
                                {item.expiryDate && (
                                  <div className="expiry-date">
                                    Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{item.quantity || 0}</td>
                            <td>₹{safeToFixed(item.price || 0)}</td>
                            <td>
                              {isEditingProducts ? (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.discount || 0}
                                    onChange={(e) => handleItemUpdate(index, 'discount', parseInt(e.target.value) || 0)}
                                    style={{ width: '60px', padding: '4px' }}
                                  />%
                                </>
                              ) : (
                                `${item.discount || 0}%`
                              )}
                            </td>
                            <td className="amount-cell">₹{safeToFixed(calculateItemTotal(item))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-items-message">No items found in this invoice</div>
                )
              )}
            </div>

            {/* Invoice Summary Section - FIXED CALCULATION BREAKDOWN */}
            <div className="invoice-section">
              <h3 className="section-title">
                Invoice Calculation Breakdown
                {isEditingProducts && " (Preview)"}
              </h3>
              <div className="invoice-summary-grid detailed-calculation">
                <div className="calculation-step">
                  <span className="step-label">Subtotal (Incl. Tax):</span>
                  <span className="step-value">₹{safeToFixed(currentTotals.subtotal)}</span>
                </div>

                <div className="calculation-step discount-step">
                  <span className="step-label">Total Item Discount:</span>
                  <span className="step-value">
                    -₹{safeToFixed(isEditingProducts ? (currentTotals.discount || currentTotals.itemDiscount || 0) : currentTotals.itemDiscount)}
                  </span>
                </div>

                <div className="calculation-step amount-before-tax">
                  <span className="step-label">Amount Before Tax:</span>
                  <span className="step-value">
                    ₹{safeToFixed(
                      isEditingProducts
                        ? (currentTotals.amountBeforeTax || (currentTotals.subtotal - (currentTotals.discount || currentTotals.itemDiscount || 0)))
                        : currentTotals.amountBeforeTax
                    )}
                  </span>                </div>

                {/* Promo Discount Section - ALWAYS SHOW IF EXISTS */}
                {currentTotals.promoDiscount > 0 && (
                  <>
                    <div className="calculation-step promo-step">
                      <span className="step-label">
                        Promo Discount ({invoice.appliedPromoCode?.discount || 0}%):
                      </span>
                      <span className="step-value">-₹{safeToFixed(currentTotals.promoDiscount)}</span>
                    </div>

                    <div className="calculation-step taxable-amount">
                      <span className="step-label">Amount After Promo:</span>
                      <span className="step-value">
                        ₹{safeToFixed(currentTotals.amountAfterPromo)} {/* ✅ FIXED */}
                      </span>
                    </div>
                  </>
                )}

                {/* Loyalty Coins Section - ALWAYS SHOW IF EXISTS */}
                {currentTotals.loyaltyDiscount > 0 && (
                  <>
                    <div className="calculation-step loyalty-step">
                      <span className="step-label">
                        Loyalty Coins Used ({currentTotals.loyaltyCoinsUsed} coins):
                      </span>
                      <span className="step-value">-₹{safeToFixed(currentTotals.loyaltyDiscount)}</span>
                    </div>

                    <div className="calculation-step amount-after-loyalty">
                      <span className="step-label">Amount After Loyalty:</span>
                      <span className="step-value">
                        ₹{safeToFixed(currentTotals.amountAfterLoyalty)} {/* ✅ FIXED */}
                      </span>
                    </div>
                  </>
                )}

                {/* Tax Calculation */}
                {!currentTotals.hasMixedTaxRates && currentTotals.taxPercentages && currentTotals.taxPercentages.length > 0 && (
                  <>
                    <div className="calculation-step tax-step">
                      <span className="step-label">CGST ({currentTotals.taxPercentages[0] / 2}%):</span>
                      <span className="step-value">+₹{safeToFixed(currentTotals.cgst)}</span>
                    </div>
                    <div className="calculation-step tax-step">
                      <span className="step-label">SGST ({currentTotals.taxPercentages[0] / 2}%):</span>
                      <span className="step-value">+₹{safeToFixed(currentTotals.sgst)}</span>
                    </div>
                  </>
                )}

                {currentTotals.hasMixedTaxRates && (
                  <div className="calculation-step tax-step">
                    <span className="step-label">Total GST:</span>
                    <span className="step-value">+₹{safeToFixed(currentTotals.tax)}</span>
                  </div>
                )}

                <div className="calculation-step total-row">
                  <span className="step-label">Grand Total:</span>
                  <span className="step-value total-amount">
                    ₹{safeToFixed(currentTotals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {isEditingProducts ? (
              /* EDIT PRODUCTS MODE BUTTONS */
              <>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditingProducts(false);
                    setEditedItems([...invoice.items]); // Reset changes
                    setItemSearchTerm("");
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="update-btn save-btn"
                  onClick={handleSaveProducts}
                  disabled={isSaving}
                >
                  {isSaving ? <FaSpinner className="spinner" /> : <FaSave />}
                  {isSaving ? "Saving..." : "Save Products"}
                </button>
              </>
            ) : (
              /* VIEW MODE BUTTONS */
              <>
                <button
                  className={`update-btn ${isEditing ? 'save-btn' : ''}`}
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                >
                  {isEditing ? <FaSave /> : <FaEdit />}
                  {isEditing ? "Save Changes" : "Update"}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <FaTrash /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete invoice {invoice.invoiceNumber}? This action cannot be undone.</p>
              <div className="confirm-buttons">
                <button
                  className="confirm-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-delete"
                  onClick={() => {
                    onDelete(invoice.invoiceNumber);
                    setShowDeleteConfirm(false);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Bulk Import Modal Component
  const BulkImportModal = ({ onClose, onImport, isLoading }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
      if (selectedFile && !isLoading) {
        const validTypes = [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv'
        ];

        if (!validTypes.includes(selectedFile.type)) {
          toast.error("Please select a valid Excel file (.xlsx, .xls, .csv)");
          return;
        }
        setFile(selectedFile);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      if (!isLoading) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      if (!isLoading) {
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFileSelect(droppedFile);
      }
    };

    const handleImport = () => {
      if (!file || isLoading) return;
      onImport(file);
    };

    return (
      <div className="modal-overlay" onClick={!isLoading ? onClose : undefined}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              {isLoading ? "Importing Invoices..." : "Bulk Import Invoices"}
            </div>
            {!isLoading && (
              <button className="modal-close" onClick={onClose}>&times;</button>
            )}
          </div>

          <div className="modal-body">
            {isLoading ? (
              <div className="import-loading">
                <div className="loading-spinner large"></div>
                <p>Importing invoices, please wait...</p>
                <div className="loading-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="import-instructions">
                  <h4>File Requirements:</h4>
                  <ul>
                    <li>File format: Excel (.xlsx, .xls) or CSV</li>
                    <li>Must contain the exported invoice data with original structure</li>
                    <li>Multiple items in same invoice will be grouped automatically</li>
                    <li>Invoice numbers will be preserved as in the file</li>
                    <li>All data will be imported as-is without validation</li>
                  </ul>
                </div>

                <div
                  className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''} ${isLoading ? 'disabled' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    disabled={isLoading}
                  />

                  {file ? (
                    <div className="file-selected">
                      <FaFileExcel className="file-icon" />
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      {!isLoading && (
                        <button
                          className="remove-file"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <FaFileExcel className="upload-icon" />
                      <p>Drop Excel file here or click to browse</p>
                      <small>Supports .xlsx, .xls, .csv files</small>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            {!isLoading && (
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
            )}
            <button
              className={`import-btn ${isLoading ? 'loading' : ''}`}
              onClick={handleImport}
              disabled={!file || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner small"></div>
                  Importing...
                </>
              ) : (
                <>
                  <FaFileExcel /> Import Invoices
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };



  const invoiceTotals = useMemo(() => {
    console.log("🔄 Recalculating invoice totals:", {
      itemsCount: selectedItems.length,
      hasPromo: !!appliedPromo,
      promoCode: appliedPromo?.code,
      useLoyaltyCoins,
      usableLoyaltyCoins,
      appliedPromo: appliedPromo // Add this for debugging
    });

    // For new invoice creation, don't pass any existing invoice
    return calculateInvoiceTotals(selectedItems);
  }, [selectedItems, appliedPromo, useLoyaltyCoins, usableLoyaltyCoins]);



  return (
    <Navbar>
      {/* <ToastContainer position="top-center" autoClose={3000} />  */}

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
      <div className="main">
        <div className="page-header">
          {/* <h2>Tax Invoices</h2>  */}
          <div className="right-section">
            <div className="time-filter">
              <select
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  if (e.target.value) setYearFilter(""); // Clear year filter when time filter is selected
                }}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="this-year">This Year</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className="year-filter">
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  if (e.target.value) setTimeFilter(""); // Clear time filter when year filter is selected
                }}
              >
                <option value="">All Years</option>
                {getAvailableYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="category-filter">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>


            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons-group">

              {/* <button
                className="bulk-import-btn"
                onClick={() => setShowBulkImport(true)}
              >
                <FaFileExcel /> Bulk Import
              </button> */}


              <button className="export-all-btn" onClick={handleExportExcel}>
                <FaFileExcel /> Export All
              </button>
              <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                <FaPlus /> {showForm ? "Close" : "Create"}
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="form-container premium">
            <h2>Create Tax Invoice.</h2>
            <Formik
              initialValues={{ paymentType: "cash" }}
              validationSchema={Yup.object().shape({
                paymentType: Yup.string().required("Payment type is required")
              })}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue }) => (
                <Form>
                  <h3 className="section-heading">Invoice Date</h3>
                  <div className="form-group-row">
                    <div className="field-wrapper" style={{ flex: '0 0 33%', maxWidth: '300px' }}>
                      <label>Date *</label>
                      <input
                        type="date"
                        value={newCustomer.date}
                        onChange={(e) => setNewCustomer({ ...newCustomer, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <h3 className="section-heading">Item Details</h3>
                  <div className="form-group-row">
                    <div className="field-wrapper">
                      <label>Search Products</label>
                      <input
                        type="text"
                        placeholder="Search by name, HSN Code, barcode or price..."
                        value={itemSearchTerm}
                        onChange={(e) => setItemSearchTerm(e.target.value)}
                      />
                      {isLoadingProducts && (
                        <div className="search-dropdown">
                          <div className="dropdown-item">Loading products...</div>
                        </div>
                      )}
                      {/* In the product search section */}


                      {itemSearchTerm && !isLoadingProducts && filteredProducts.length > 0 && (
                        <div className="search-dropdown">
                          {filteredProducts.map(product => {
                            const availableBatches = getAvailableBatches(product.productId);
                            const totalAvailable = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);

                            // ✅ ADDED: Validation checks for display
                            const inventoryItem = inventory.find(item => item.productId === product.productId);
                            const hasBatches = inventoryItem && inventoryItem.batches && inventoryItem.batches.length > 0;
                            const hasValidBatches = hasBatches && inventoryItem.batches.some(batch =>
                              batch.expiryDate && new Date(batch.expiryDate) >= new Date() && batch.quantity > 0
                            );
                            const hasExpiredBatches = inventoryItem && inventoryItem.batches.some(batch => {
                              const isExpired = new Date(batch.expiryDate) < new Date();
                              return batch.quantity > 0 && isExpired;
                            });
                            const hasNoBatches = !hasBatches;
                            const hasBatchesWithoutExpiry = hasBatches && inventoryItem.batches.some(batch =>
                              !batch.expiryDate || batch.expiryDate === ""
                            );

                            return (
                              <div
                                key={product.productId}
                                className={`dropdown-item ${!hasValidBatches ? 'invalid-product' : totalAvailable === 0 ? 'out-of-stock' : ''}`}
                                onClick={() => {
                                  if (hasValidBatches && totalAvailable > 0) {
                                    handleProductSelect(product);
                                  } else {
                                    // Show specific error message
                                    if (hasNoBatches) {
                                      toast.error("❌ This product has no batch numbers. Cannot add to invoice.");
                                    } else if (hasBatchesWithoutExpiry) {
                                      toast.error("❌ This product has batches missing expiry dates. Cannot add to invoice.");
                                    } else if (!hasValidBatches) {
                                      toast.error("❌ This product has no valid batches. Cannot add to invoice.");
                                    }
                                  }
                                }}
                              >
                                <div>
                                  {product.productName}
                                  {/* Status badges */}
                                  {hasNoBatches && (
                                    <span className="error-badge">No Batches</span>
                                  )}
                                  {hasBatchesWithoutExpiry && (
                                    <span className="error-badge">Missing Expiry</span>
                                  )}
                                  {hasExpiredBatches && !hasValidBatches && (
                                    <span className="expired-badge">All Expired</span>
                                  )}
                                  {totalAvailable === 0 && hasValidBatches && (
                                    <span className="stock-badge">Out of Stock</span>
                                  )}
                                  {totalAvailable > 0 && hasValidBatches && (
                                    <span className="stock-badge">In Stock: {totalAvailable}</span>
                                  )}
                                </div>
                                <div>
                                  HSN Code: {product.hsnCode || "N/A"} |
                                  Price: ₹{product.price || 0} |
                                  Tax: {product.taxSlab || 18}% |
                                  Category: {product.category}
                                </div>
                                {/* Additional validation info */}
                                {hasBatches && (
                                  <div className="batch-validation-info">
                                    Batches: {inventoryItem.batches.length} |
                                    Valid: {inventoryItem.batches.filter(b =>
                                      b.expiryDate && new Date(b.expiryDate) >= new Date() && b.quantity > 0
                                    ).length}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {showBatchDropdown && (
                    <div className="batch-dropdown-overlay">
                      <div className="batch-dropdown" ref={batchDropdownRef}>
                        <h4>Select Batch</h4>
                        {getAvailableBatches(showBatchDropdown).map(batch => (
                          <div
                            key={batch.batchNumber}
                            className="batch-option"
                            onClick={() => handleBatchSelect(batch)}
                          >
                            <div className="batch-info">
                              <strong>Batch: {batch.batchNumber}</strong>
                              <span>Qty: {batch.quantity}</span>
                            </div>
                            <div className="batch-details">
                              Expiry: {new Date(batch.expiryDate).toLocaleDateString()}
                            </div>
                          </div>
                        ))}

                        {/* Show expired batches as disabled */}
                        {(() => {
                          const inventoryItem = inventory.find(item => item.productId === showBatchDropdown);
                          const expiredBatches = inventoryItem ? inventoryItem.batches.filter(batch => {
                            const isExpired = new Date(batch.expiryDate) < new Date();
                            return batch.quantity > 0 && isExpired;
                          }) : [];

                          return expiredBatches.length > 0 ? (
                            <div className="expired-batches-section">
                              <h5 style={{ color: '#ff6b6b', margin: '10px 0 5px 0' }}>Expired Batches</h5>
                              {expiredBatches.map(batch => (
                                <div
                                  key={batch.batchNumber}
                                  className="batch-option expired"
                                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                  onClick={() => toast.error("This batch has expired and cannot be selected")}
                                >
                                  <div className="batch-info">
                                    <strong>Batch: {batch.batchNumber}</strong>
                                    <span>Qty: {batch.quantity}</span>
                                  </div>
                                  <div className="batch-details" style={{ color: '#ff6b6b' }}>
                                    EXPIRED: {new Date(batch.expiryDate).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        <button
                          className="cancel-batch-select"
                          onClick={() => setShowBatchDropdown(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedItems.length > 0 && (
                    <div>
                      <div className="items-table-container">
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th width="5%">Sr No</th>
                              <th width="15%">Batch No</th>
                              <th width="20%">Product Name</th>
                              <th width="10%">Item Code</th>
                              <th width="8%">Qty</th>
                              <th width="12%">Price</th>
                              <th width="10%">Discount %</th>
                              <th width="15%">Total</th>
                              <th width="5%"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedItems.slice().reverse().map((item, index) => {
                              const availableQty = getAvailableQuantity(item.productId, item.batchNumber);
                              const actualIndex = selectedItems.length - index - 1;

                              return (
                                <tr key={`${item.productId}-${item.batchNumber}`}>
                                  <td>{selectedItems.length - index}</td>
                                  <td>
                                    <span className="batch-tag">{item.batchNumber}</span>
                                    <br />
                                    <small>Exp: {new Date(item.expiryDate).toLocaleDateString()}</small>
                                  </td>
                                  <td>
                                    {item.name}
                                    <br />
                                    <small className="category-tag">{item.category}</small>
                                  </td>
                                  <td>{item.hsn || "N/A"}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="1"
                                      max={availableQty}
                                      required
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const newQty = parseInt(e.target.value) || 0;
                                        if (newQty > availableQty) {
                                          toast.error(`Only ${availableQty} items available`);
                                          return;
                                        }
                                        handleItemUpdate(actualIndex, 'quantity', newQty);
                                      }}
                                    />
                                    <div className="available-qty">Available: {availableQty}</div>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.price || 0}
                                      onChange={(e) => handleItemUpdate(actualIndex, 'price', parseFloat(e.target.value) || 0)}
                                      style={{ width: "80px" }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={item.discount || 0}
                                      onChange={(e) => handleItemUpdate(actualIndex, 'discount', parseInt(e.target.value) || 0)}
                                      style={{ width: "60px" }}
                                    />%
                                  </td>
                                  <td>
                                    ₹{(
                                      (item.price || 0) * item.quantity -
                                      ((item.price || 0) * item.quantity * (item.discount || 0) / 100)
                                    ).toFixed(2)}
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="invoice-remove-btn"
                                      onClick={() => {
                                        setSelectedItems(selectedItems.filter((_, i) => i !== actualIndex));
                                      }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <div style={{ width: '350px', background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                          <h4 style={{ marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Invoice Calculation</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Subtotal (Incl. Tax):</span>
                            <span>₹{invoiceTotals.subtotal.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Product Discount:</span>
                            <span>₹{invoiceTotals.discount.toFixed(2)}</span>
                          </div>

                          {/* Promo Discount */}
                          {appliedPromo && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#28a745' }}>
                              <span>Promo Discount ({appliedPromo.discount}%):</span>
                              <span>-₹{invoiceTotals.promoDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Loyalty Coins Discount */}
                          {useLoyaltyCoins && invoiceTotals.loyaltyCoinsUsed > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#ff6b35' }}>
                              <span>Loyalty Coins Used ({invoiceTotals.loyaltyCoinsUsed} coins):</span>
                              <span>-₹{invoiceTotals.loyaltyDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          {/* Tax Calculation remains same */}
                          {!invoiceTotals.hasMixedTaxRates && invoiceTotals.taxPercentages.length > 0 && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>CGST ({invoiceTotals.taxPercentages[0] / 2}%):</span>
                                <span>₹{invoiceTotals.cgst.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>SGST ({invoiceTotals.taxPercentages[0] / 2}%):</span>
                                <span>₹{invoiceTotals.sgst.toFixed(2)}</span>
                              </div>
                            </>
                          )}

                          {invoiceTotals.hasMixedTaxRates && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span>GST:</span>
                              <span>₹{invoiceTotals.tax.toFixed(2)}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
                            <span>Total Tax:</span>
                            <span>₹{invoiceTotals.tax.toFixed(2)}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '10px', fontWeight: 'bold' }}>
                            <span>Grand Total:</span>
                            <span>₹{invoiceTotals.grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 className="section-heading">Customer Details</h3>
                  <div className="form-group-row" ref={customerSearchRef}>
                    <div className="field-wrapper">
                      <label>Mobile Number *</label>
                      <input
                        type="text"
                        placeholder="Search by mobile number"
                        value={customerMobileSearch}
                        onChange={(e) => {
                          setCustomerMobileSearch(e.target.value);
                          setNewCustomer({ ...newCustomer, mobile: e.target.value });
                          setShowCustomerDropdown(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowCustomerDropdown(customerMobileSearch.length > 0)}
                      />
                      {isLoadingCustomers && (
                        <div className="search-dropdown">
                          <div className="dropdown-item">Loading customers...</div>
                        </div>
                      )}
                      {showCustomerDropdown && !isLoadingCustomers && filteredCustomers.length > 0 && (
                        <div className="search-dropdown">
                          {filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              className="dropdown-item"
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              <div>{customer.mobile} - {customer.name}</div>
                              <div>{customer.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group-row">
                    <div className="field-wrapper">
                      <label>Customer Name *</label>
                      <input
                        type="text"
                        placeholder="Enter customer name"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field-wrapper">
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder="Enter customer email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Loyalty Coins Section */}
                  {availableLoyaltyCoins > 0 && (
                    <>
                      <h3 className="section-heading">Loyalty Coins</h3>
                      <div className="form-group-row">
                        <div className="field-wrapper" style={{ width: '100%' }}>
                          <div className="loyalty-coins-container">
                            <div className="loyalty-info">
                              <span>Available Coins: {availableLoyaltyCoins}</span>
                              {usableLoyaltyCoins > 0 && (
                                <span className="usable-coins">Usable Coins: {usableLoyaltyCoins} (1 Coin = ₹1)</span>
                              )}
                            </div>

                            {usableLoyaltyCoins > 0 ? (
                              <label className="loyalty-checkbox">
                                <input
                                  type="checkbox"
                                  checked={useLoyaltyCoins}
                                  onChange={(e) => setUseLoyaltyCoins(e.target.checked)}
                                />
                                <span>Use Loyalty Coins (Maximum: {usableLoyaltyCoins} coins)</span>
                              </label>
                            ) : (
                              <div className="loyalty-message">
                                Minimum 50 coins required to use loyalty rewards. Need {50 - availableLoyaltyCoins} more coins.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}


                  <h3 className="section-heading">Promo Code (Optional)</h3>
                  <div className="form-group-row">
                    <div className="field-wrapper" style={{ width: '100%' }}>
                      <div className="promo-code-container">
                        <div className="promo-dropdown-group">
                          <div className="dropdown-wrapper">
                            <select
                              value={promoCode}
                              onChange={(e) => {
                                const selectedCode = e.target.value;
                                setPromoCode(selectedCode);
                                if (selectedCode) {
                                  validatePromoCode(selectedCode);
                                } else {
                                  removePromoCode();
                                }
                              }}
                              disabled={isValidatingPromo || isLoadingPromos}
                              className={`${promoError ? 'error' : ''} ${isLoadingPromos ? 'dropdown-loading' : ''}`}
                            >
                              <option value="">Select a promo code</option>
                              {isLoadingPromos ? (
                                <option disabled>Loading promo codes...</option>
                              ) : (
                                activePromos.map(promo => (
                                  <option key={promo.promoId} value={promo.code}>
                                    {promo.code} - {promo.discount}% off
                                    {promo.description && ` - ${promo.description}`}
                                  </option>
                                ))
                              )}
                            </select>
                            <FaChevronDown className="dropdown-arrow" />
                          </div>
                          {appliedPromo && (
                            <button
                              type="button"
                              className="remove-promo-btn"
                              onClick={removePromoCode}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {isValidatingPromo && (
                          <div className="promo-loading">
                            <FaSpinner className="spinner" /> Validating...
                          </div>
                        )}
                        {promoError && <div className="promo-error">{promoError}</div>}
                        {appliedPromo && (
                          <div className="promo-success">
                            ✅ {appliedPromo.code} applied - {appliedPromo.discount}% discount
                            {appliedPromo.description && `: ${appliedPromo.description}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="section-heading">Payment Type</h3>
                  <div className="payment-options-container">
                    <div className="payment-options">
                      <label className="payment-option">
                        <Field type="radio" name="paymentType" value="cash" />
                        <span className="payment-label">Cash</span>
                      </label>
                      <label className="payment-option">
                        <Field type="radio" name="paymentType" value="card" />
                        <span className="payment-label">Card</span>
                      </label>
                      <label className="payment-option">
                        <Field type="radio" name="paymentType" value="upi" />
                        <span className="payment-label">UPI</span>
                      </label>
                    </div>
                  </div>




                  <h3 className="section-heading">Remarks (Optional)</h3>
                  <div className="form-group-row">
                    <div className="field-wrapper" style={{ width: '100%' }}>
                      <textarea
                        placeholder="Enter any additional remarks or notes..."
                        value={newCustomer.remarks || ''}
                        onChange={(e) => setNewCustomer({ ...newCustomer, remarks: e.target.value })}
                        rows={3}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <div className="submit-btn-container">
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={isSubmitting || isExporting}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="spinner" /> Creating Invoice..
                        </>
                      ) : isExporting ? (
                        "Generating PDF..."
                      ) : (
                        "Create Invoice"
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment Type</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    {searchTerm ? 'No invoices match your search' : 'No invoices found. Create your first invoice.'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr
                    key={invoice.invoiceNumber}
                    onClick={(e) => {
                      if (e.target.closest('.export-pdf-btn')) {
                        return;
                      }
                      setSelectedInvoice(invoice);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.date}</td>
                    <td>{invoice.customer.name}</td>
                    <td>{invoice.items.length} items</td>
                    <td>{invoice.paymentType}</td>
                    <td>₹{invoice.total.toFixed(2)}</td>
                    <td>
                      <button
                        className="export-pdf-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInvoiceForPrint({ invoice, openWhatsapp: false });
                        }}
                        disabled={isExporting}
                      >
                        <FaFilePdf /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>


          {/* Pagination Component - ADD THIS RIGHT BEFORE THE CLOSING </div> */}
          {pagination.totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalInvoices} invoices
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrevPage || isLoading}
                  className="pagination-btn"
                >
                  <FaChevronLeft /> Previous
                </button>

                {(() => {
                  const { currentPage, totalPages } = pagination;
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) pages.push(i);

                  return (
                    <>
                      {startPage > 1 && (
                        <>
                          <button onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))} className="pagination-btn">1</button>
                          {startPage > 2 && <span className="pagination-dots">...</span>}
                        </>
                      )}
                      {pages.map(page => (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                          className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      ))}
                      {endPage < totalPages && (
                        <>
                          {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
                          <button onClick={() => setPagination(prev => ({ ...prev, currentPage: totalPages }))} className="pagination-btn">{totalPages}</button>
                        </>
                      )}
                    </>
                  );
                })()}

                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNextPage || isLoading}
                  className="pagination-btn"
                >
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onUpdate={handleUpdateInvoice}
            onDelete={handleDeleteInvoice}
            fetchInventory={fetchInventory}
          />
        )}

        {showBulkImport && (
          <BulkImportModal
            onClose={() => setShowBulkImport(false)}
            onImport={handleBulkImport}
            isLoading={isBulkImportLoading}
          />
        )}

        <div style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}>
          {invoiceForPrint && <SalesPrint invoice={invoiceForPrint.invoice} />}
        </div>
      </div>
    </Navbar>
  );
};

export default Sales;