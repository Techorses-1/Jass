import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import {
    FaBox, FaBarcode, FaHashtag, FaDollarSign,
    FaPercentage, FaFileExport, FaPlus, FaSearch,
    FaSave, FaEdit, FaTags, FaTimes, FaTrash,
    FaCalendarAlt, FaClock
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Sidebar/Navbar";
import "../Form/Form.scss";
import "./DiscountProduct.scss";
import "react-toastify/dist/ReactToastify.css";
import PromoCodeModal from "./Promocode/PromoCodeModal";


const DiscountProduct = () => {
    const [showForm, setShowForm] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [promoCodes, setPromoCodes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPromos, setIsLoadingPromos] = useState(false);
    const [editingDiscounts, setEditingDiscounts] = useState({});
    const navigate = useNavigate();

    const [isSaving, setIsSaving] = useState(false);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [originalDiscounts, setOriginalDiscounts] = useState({});

    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Promo Code States
    const [newPromoCode, setNewPromoCode] = useState("");
    const [newPromoDiscount, setNewPromoDiscount] = useState("");
    const [newPromoStartDate, setNewPromoStartDate] = useState("");
    const [newPromoEndDate, setNewPromoEndDate] = useState("");
    const [isSavingPromo, setIsSavingPromo] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);

    // Refs for input focus management
    const promoCodeInputRef = useRef(null);
    const promoDiscountInputRef = useRef(null);
    const startDateInputRef = useRef(null);
    const endDateInputRef = useRef(null);

    // Track if modal is mounted to prevent re-renders
    const modalMountedRef = useRef(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Debounce logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim().toLowerCase());
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/products/get-products`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        navigate('/login');
                        return;
                    }
                    throw new Error('Failed to fetch products');
                }

                const data = await response.json();

                // Sort by creation date (newest first)
                const sortedData = data.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return dateB - dateA;
                });

                setProducts(sortedData);

                // Initialize editing discounts
                const initialEditingState = {};
                const initialOriginalState = {};
                sortedData.forEach(product => {
                    initialEditingState[product.productId] = product.discount || 0;
                    initialOriginalState[product.productId] = product.discount || 0;
                });
                setEditingDiscounts(initialEditingState);
                setOriginalDiscounts(initialOriginalState);

                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching products:", err);
                toast.error("Failed to fetch products");
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [navigate]);

    // Fetch promo codes
    const fetchPromoCodes = async () => {
        try {
            setIsLoadingPromos(true);
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/promoCodes/get-promos`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch promo codes');
            }

            const data = await response.json();
            setPromoCodes(data);
        } catch (error) {
            console.error("Error fetching promo codes:", error);
            toast.error("Failed to fetch promo codes");
        } finally {
            setIsLoadingPromos(false);
        }
    };

    // Open promo modal and fetch codes
    const handleOpenPromoModal = () => {
        setShowPromoModal(true);
        fetchPromoCodes();
        resetPromoForm();
        modalMountedRef.current = true;

        // Focus on promo code input when modal opens
        setTimeout(() => {
            if (promoCodeInputRef.current && modalMountedRef.current) {
                promoCodeInputRef.current.focus();
            }
        }, 100);
    };

    // Reset promo form
    const resetPromoForm = () => {
        setNewPromoCode("");
        setNewPromoDiscount("");
        setNewPromoStartDate("");
        setNewPromoEndDate("");
        setEditingPromo(null);
    };

    // Close promo modal
    const handleClosePromoModal = () => {
        setShowPromoModal(false);
        resetPromoForm();
        modalMountedRef.current = false;
    };

    // Save promo code

    const savePromoCode = async () => {
        try {
            if (!newPromoCode.trim()) {
                toast.error("Please enter promo code");
                return;
            }

            if (!newPromoDiscount || newPromoDiscount < 1 || newPromoDiscount > 100) {
                toast.error("Please enter valid discount (1-100%)");
                return;
            }

            if (!newPromoStartDate || !newPromoEndDate) {
                toast.error("Please select both start and end dates");
                return;
            }

            let startDate = new Date(newPromoStartDate);
            let endDate = new Date(newPromoEndDate);
            const now = new Date();

            // Allow same day promos (start date can be equal to end date)
            if (startDate > endDate) {
                toast.error("End date cannot be before start date");
                return;
            }

            // FOR ALL END DATES: Set to 23:59:59 of the selected end date
            endDate.setHours(23, 59, 59, 999);

            // Compare dates without time for validation
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const endDateOnly = new Date(endDate);
            endDateOnly.setHours(0, 0, 0, 0);

            // Allow today's date and future dates
            if (endDateOnly < today) {
                toast.error("End date cannot be in the past");
                return;
            }

            setIsSavingPromo(true);
            const token = localStorage.getItem('token');

            const url = editingPromo
                ? `${import.meta.env.VITE_API_URL}/promoCodes/update-promo/${editingPromo.promoId}`
                : `${import.meta.env.VITE_API_URL}/promoCodes/create-promo`;

            const method = editingPromo ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: newPromoCode,
                    discount: parseFloat(newPromoDiscount),
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to save promo code");
            }

            const result = await response.json();
            toast.success(result.message);

            // Refresh promo codes list
            await fetchPromoCodes();
            resetPromoForm();
        } catch (error) {
            console.error("Error saving promo code:", error);
            toast.error(error.message);
        } finally {
            setIsSavingPromo(false);
        }
    };

    // Delete promo code
    const deletePromoCode = async (promoId) => {
        setPromoToDelete(promoId);
        setShowDeleteConfirm(true);
    };


    const confirmDeletePromo = async () => {
        if (!promoToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/promoCodes/delete-promo/${promoToDelete}`,
                {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete promo code');
            }

            const result = await response.json();
            toast.success(result.message);
            await fetchPromoCodes();
        } catch (error) {
            console.error("Error deleting promo code:", error);
            toast.error("Failed to delete promo code");
        } finally {
            setShowDeleteConfirm(false);
            setPromoToDelete(null);
        }
    };

    // Delete Confirmation Modal
    const DeleteConfirmationModal = () => {
        if (!showDeleteConfirm) return null;

        const promo = promoCodes.find(p => p.promoId === promoToDelete);

        return (
            <div className="discount-modal-overlay">
                <div className="discount-modal-content" style={{ maxWidth: "500px" }}>
                    <div className="discount-modal-header">
                        <div className="discount-modal-title">
                            <FaTrash /> Delete Promo Code
                        </div>
                        <button className="discount-close-btn" onClick={cancelDeletePromo}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="discount-modal-body">
                        <div style={{ padding: "30px", textAlign: "center" }}>
                            <div style={{ fontSize: "48px", color: "#e74c3c", marginBottom: "20px" }}>
                                <FaTrash />
                            </div>
                            <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
                                Confirm Deletion
                            </h3>
                            <p style={{ color: "#7f8c8d", lineHeight: "1.6", marginBottom: "25px" }}>
                                Are you sure you want to delete the promo code{" "}
                                <strong style={{ color: "#9b59b6", fontFamily: "'Courier New', monospace" }}>
                                    {promo?.code}
                                </strong>
                                ? This action cannot be undone.
                            </p>

                            <div style={{
                                background: "#fff3cd",
                                border: "1px solid #ffeaa7",
                                borderRadius: "8px",
                                padding: "15px",
                                marginBottom: "25px",
                                textAlign: "left"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                    <FaTags style={{ color: "#e67e22" }} />
                                    <strong style={{ color: "#856404" }}>Promo Details:</strong>
                                </div>
                                <div style={{ fontSize: "14px", color: "#856404" }}>
                                    <div>Code: <strong>{promo?.code}</strong></div>
                                    <div>Discount: <strong>{promo?.discount}%</strong></div>
                                    <div>Valid: {formatDate(promo?.startDate)} to {formatDate(promo?.endDate)}</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                                <button
                                    className="discount-cancel-changes-btn"
                                    onClick={cancelDeletePromo}
                                    style={{
                                        background: "#95a5a6",
                                        padding: "12px 24px"
                                    }}
                                >
                                    <FaTimes /> Cancel
                                </button>
                                <button
                                    className="discount-delete-btn"
                                    onClick={confirmDeletePromo}
                                    style={{
                                        background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                                        padding: "12px 24px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}
                                >
                                    <FaTrash /> Delete Promo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const cancelDeletePromo = () => {
        setShowDeleteConfirm(false);
        setPromoToDelete(null);
    };

    // Edit promo code
    const handleEditPromo = (promo) => {
        setEditingPromo(promo);
        setNewPromoCode(promo.code);
        setNewPromoDiscount(promo.discount.toString());

        // Format dates for input fields (YYYY-MM-DD)
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);

        setNewPromoStartDate(startDate.toISOString().split('T')[0]);
        setNewPromoEndDate(endDate.toISOString().split('T')[0]);

        // Focus on promo code input when editing
        setTimeout(() => {
            if (promoCodeInputRef.current && modalMountedRef.current) {
                promoCodeInputRef.current.focus();
                promoCodeInputRef.current.setSelectionRange(
                    promoCodeInputRef.current.value.length,
                    promoCodeInputRef.current.value.length
                );
            }
        }, 100);
    };

    // Toggle promo code status
    const togglePromoStatus = async (promo) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/promoCodes/update-promo/${promo.promoId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        isActive: !promo.isActive
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update promo code');
            }

            await fetchPromoCodes();
            toast.success(`Promo code ${!promo.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            console.error("Error updating promo code:", error);
            toast.error("Failed to update promo code");
        }
    };

    // Handle promo code input change
    const handlePromoCodeChange = useCallback((e) => {
        setNewPromoCode(e.target.value.toUpperCase());
    }, []);

    // Handle promo discount change
    const handlePromoDiscountChange = useCallback((e) => {
        setNewPromoDiscount(e.target.value);
    }, []);

    // Handle date changes
    const handleStartDateChange = useCallback((e) => {
        setNewPromoStartDate(e.target.value);
    }, []);

    const handleEndDateChange = useCallback((e) => {
        setNewPromoEndDate(e.target.value);
    }, []);

    // Filtered products
    const filteredProducts = useMemo(() => {
        if (!debouncedSearch) return products;

        return products.filter((product) => {
            const searchLower = debouncedSearch.toLowerCase();
            return (
                product.productName?.toLowerCase().includes(searchLower) ||
                product.barcode?.toLowerCase().includes(searchLower) ||
                product.hsnCode?.toLowerCase().includes(searchLower) ||
                product.price?.toString().includes(searchLower)
            );
        });
    }, [debouncedSearch, products]);

    const paginatedProducts = useMemo(() => {
        if (debouncedSearch) return filteredProducts;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(0, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage, debouncedSearch]);

    // Check if there are more products to load
    const hasMoreProducts = useMemo(() => {
        return debouncedSearch ? false : currentPage * itemsPerPage < filteredProducts.length;
    }, [currentPage, itemsPerPage, filteredProducts.length, debouncedSearch]);

    const loadMoreProducts = () => {
        setCurrentPage(prev => prev + 1);
    };

    // Handle discount change
    const handleDiscountChange = (productId, value) => {
        const discountValue = Math.min(Math.max(parseFloat(value) || 0, 0), 100);
        setEditingDiscounts(prev => ({
            ...prev,
            [productId]: discountValue
        }));
    };

    // Save discount for a product
    const saveDiscount = async (productId) => {
        try {
            setIsSaving(true);
            const newDiscount = editingDiscounts[productId];
            const token = localStorage.getItem('token');

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/products/update-discount/${productId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ discount: newDiscount }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update discount");
            }

            // Update local state
            setProducts(prev =>
                prev.map(product =>
                    product.productId === productId
                        ? { ...product, discount: newDiscount }
                        : product
                )
            );

            // Update original discounts
            setOriginalDiscounts(prev => ({
                ...prev,
                [productId]: newDiscount
            }));

            toast.success("Discount updated successfully!");
        } catch (error) {
            console.error("Error updating discount:", error);
            toast.error(error.message || "Error updating discount");

            // Revert to original value on error
            const originalDiscount = originalDiscounts[productId] || 0;
            setEditingDiscounts(prev => ({
                ...prev,
                [productId]: originalDiscount
            }));
        } finally {
            setIsSaving(false);
        }
    };

    const saveAllDiscounts = async () => {
        try {
            setIsSavingAll(true);
            const token = localStorage.getItem('token');

            // Find which discounts have been changed
            const changedDiscounts = [];

            Object.keys(editingDiscounts).forEach(productId => {
                const currentDiscount = editingDiscounts[productId];
                const originalDiscount = originalDiscounts[productId] || 0;

                if (currentDiscount !== originalDiscount) {
                    changedDiscounts.push({
                        productId,
                        discount: currentDiscount
                    });
                }
            });

            if (changedDiscounts.length === 0) {
                toast.info("No changes to save");
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/products/bulk-update-discounts`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ discounts: changedDiscounts }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update discounts");
            }

            const result = await response.json();

            // Update local state with new discounts
            setProducts(prev =>
                prev.map(product => {
                    const updatedDiscount = changedDiscounts.find(
                        item => item.productId === product.productId
                    );
                    return updatedDiscount
                        ? { ...product, discount: updatedDiscount.discount }
                        : product;
                })
            );

            // Update original discounts to match current ones
            setOriginalDiscounts(prev => ({
                ...prev,
                ...changedDiscounts.reduce((acc, item) => {
                    acc[item.productId] = item.discount;
                    return acc;
                }, {})
            }));

            toast.success(`Successfully updated ${changedDiscounts.length} discounts!`);
        } catch (error) {
            console.error("Error saving all discounts:", error);
            toast.error(error.message || "Error saving discounts");
        } finally {
            setIsSavingAll(false);
        }
    };

    // Export all products as Excel
    const exportAllAsExcel = () => {
        const dataToExport = filteredProducts.length > 0 ? filteredProducts : products;

        if (dataToExport.length === 0) {
            toast.warning("No products to export");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(
            dataToExport.map((product) => ({
                "Product Name": product.productName,
                "Barcode": product.barcode || 'N/A',
                "HSN Code": product.hsnCode || 'N/A',
                "Price": `₹${product.price?.toFixed(2) || '0.00'}`,
                "Tax Slab": `${product.taxSlab || 0}%`,
                "Discount": `${product.discount || 0}%`,
                "Created At": new Date(product.createdAt).toLocaleDateString()
            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

        const fileName = debouncedSearch ? "filtered_products.xlsx" : "all_products.xlsx";
        XLSX.writeFile(workbook, fileName);
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/products/create`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(values),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to add product");
            }

            const savedProduct = data.product;
            setProducts(prev => [savedProduct, ...prev]);

            // Initialize discount for new product
            setEditingDiscounts(prev => ({
                ...prev,
                [savedProduct.productId]: savedProduct.discount || 0
            }));

            toast.success("Product added successfully!");
            setShowForm(false);
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error(error.message || "Error creating product");
        }
    };

    // Get status badge for promo code
    const getPromoStatus = (promo) => {
        const now = new Date();
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);

        if (promo.isExpired || endDate < now) {
            return { status: 'expired', label: 'Expired' };
        } else if (startDate > now) {
            return { status: 'upcoming', label: 'Upcoming' };
        } else if (!promo.isActive) {
            return { status: 'inactive', label: 'Inactive' };
        } else {
            return { status: 'active', label: 'Active' };
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata', // Explicitly set to IST
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Check if promo is currently active
    const isPromoCurrentlyActive = (promo) => {
        const now = new Date();
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        return promo.isActive && !promo.isExpired && startDate <= now && endDate >= now;
    };

    // Handle unsaved changes alert actions
    const handleUnsavedAlertAction = async (action) => {
        if (action === 'save') {
            await saveAllDiscounts();
            setShowUnsavedAlert(false);
            if (pendingNavigation) {
                navigate(pendingNavigation);
                setPendingNavigation(null);
            }
        } else if (action === 'cancel') {
            setEditingDiscounts(originalDiscounts);
            setShowUnsavedAlert(false);
            setPendingNavigation(null);
        } else if (action === 'continue') {
            setShowUnsavedAlert(false);
            if (pendingNavigation) {
                navigate(pendingNavigation);
                setPendingNavigation(null);
            }
        }
    };

    // Check for unsaved discount changes
    const hasUnsavedChanges = useMemo(() => {
        return Object.keys(editingDiscounts).some(productId =>
            editingDiscounts[productId] !== originalDiscounts[productId]
        );
    }, [editingDiscounts, originalDiscounts]);

    // Navigation guard for unsaved changes
    const handleNavigation = useCallback((path) => {
        if (hasUnsavedChanges) {
            setPendingNavigation(path);
            setShowUnsavedAlert(true);
        } else {
            navigate(path);
        }
    }, [hasUnsavedChanges, navigate]);



    // Unsaved Changes Alert Modal
    const UnsavedChangesAlert = () => {
        if (!showUnsavedAlert) return null;

        const changedCount = Object.keys(editingDiscounts).filter(
            productId => editingDiscounts[productId] !== originalDiscounts[productId]
        ).length;

        return (
            <div className="discount-unsaved-alert-overlay">
                <div className="discount-unsaved-alert-content">
                    <div className="discount-alert-header">
                        <div className="discount-alert-title">Unsaved Changes</div>
                    </div>
                    <div className="discount-alert-body">
                        <p>You have {changedCount} unsaved discount change(s). What would you like to do?</p>
                    </div>
                    <div className="discount-alert-footer">
                        <button
                            className="discount-save-all-btn"
                            onClick={() => handleUnsavedAlertAction('save')}
                            disabled={isSavingAll}
                        >
                            {isSavingAll ? (
                                <>
                                    <div className="loading-spinner small"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave />
                                    Save & Go
                                </>
                            )}
                        </button>
                        <button
                            className="discount-cancel-changes-btn"
                            onClick={() => handleUnsavedAlertAction('cancel')}
                        >
                            Discard
                        </button>
                        <button
                            className="discount-continue-editing-btn"
                            onClick={() => handleUnsavedAlertAction('continue')}
                        >
                            Go Without Saving
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Navbar onNavigation={handleNavigation}>
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="main">
                <div className="page-header">
                    <div className="right-section">
                        <div className="search-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search Products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="action-buttons-group">
                            <button
                                className="promo-code-btn"
                                onClick={handleOpenPromoModal}
                            >
                                <FaTags /> Promo Codes
                            </button>
                            <button
                                className="save-all-btn"
                                onClick={saveAllDiscounts}
                                disabled={isSavingAll}
                            >
                                {isSavingAll ? (
                                    <div className="loading-spinner small"></div>
                                ) : (
                                    <FaSave />
                                )}
                                {isSavingAll ? "Saving..." : "Save All"}
                            </button>
                            <button className="export-all-btn" onClick={exportAllAsExcel}>
                                <FaFileExport /> Export All
                            </button>
                        </div>
                    </div>
                </div>

                {showForm && (
                    <div className="form-container premium">
                        <h2>Add New Product</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const values = Object.fromEntries(formData);
                            values.price = parseFloat(values.price);
                            values.taxSlab = values.taxSlab ? parseFloat(values.taxSlab) : 0;
                            values.discount = values.discount ? parseFloat(values.discount) : 0;
                            handleSubmit(values);
                        }}>
                            <div className="form-group">
                                <div className="field-half">
                                    <label><FaBox /> Product Name *</label>
                                    <input
                                        name="productName"
                                        type="text"
                                        required
                                        placeholder="Enter product name"
                                    />
                                </div>
                                <div className="field-half">
                                    <label><FaBarcode /> Barcode</label>
                                    <input
                                        name="barcode"
                                        type="text"
                                        placeholder="Enter barcode"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="field-half">
                                    <label><FaHashtag /> HSN Code</label>
                                    <input
                                        name="hsnCode"
                                        type="text"
                                        placeholder="Enter HSN code"
                                    />
                                </div>
                                <div className="field-half">
                                    <label><FaDollarSign /> Price *</label>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="field-half">
                                    <label>Tax Slab (%)</label>
                                    <input
                                        name="taxSlab"
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="field-half">
                                    <label><FaPercentage /> Discount (%)</label>
                                    <input
                                        name="discount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        defaultValue={0}
                                    />
                                </div>
                            </div>

                            <button type="submit">Create Product</button>
                        </form>
                    </div>
                )}

                <div className="data-table">
                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner large"></div>
                            <p>Loading products...</p>
                        </div>
                    ) : (
                        <>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Barcode</th>
                                        <th>HSN Code</th>
                                        <th>Price</th>
                                        <th>Discount (%)</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProducts.map((product, index) => (
                                        <tr key={product.productId || index}>
                                            <td>{product.productName}</td>
                                            <td>{product.barcode || 'N/A'}</td>
                                            <td>{product.hsnCode || 'N/A'}</td>
                                            <td>₹{product.price?.toFixed(2) || '0.00'}</td>
                                            <td>
                                                <div className="discount-edit-container">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={editingDiscounts[product.productId] || 0}
                                                        onChange={(e) => handleDiscountChange(product.productId, e.target.value)}
                                                        className="discount-input"
                                                        placeholder="0"
                                                    />
                                                    <span>%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className="save-discount-btn"
                                                    onClick={() => saveDiscount(product.productId)}
                                                    disabled={isSaving || editingDiscounts[product.productId] === originalDiscounts[product.productId]}
                                                    title="Save discount"
                                                >
                                                    {isSaving ? (
                                                        <div className="loading-spinner small"></div>
                                                    ) : (
                                                        <FaSave />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {hasMoreProducts && (
                                <div className="load-more-container">
                                    <button className="load-more-btn" onClick={loadMoreProducts}>
                                        Load More Products
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <PromoCodeModal
                    show={showPromoModal}
                    onClose={handleClosePromoModal}
                    promoCodes={promoCodes}
                    isLoadingPromos={isLoadingPromos}
                    newPromoCode={newPromoCode}
                    newPromoDiscount={newPromoDiscount}
                    newPromoStartDate={newPromoStartDate}
                    newPromoEndDate={newPromoEndDate}
                    isSavingPromo={isSavingPromo}
                    editingPromo={editingPromo}
                    handlePromoCodeChange={handlePromoCodeChange}
                    handlePromoDiscountChange={handlePromoDiscountChange}
                    handleStartDateChange={handleStartDateChange}
                    handleEndDateChange={handleEndDateChange}
                    savePromoCode={savePromoCode}
                    handleEditPromo={handleEditPromo}
                    togglePromoStatus={togglePromoStatus}
                    deletePromoCode={deletePromoCode}
                    getPromoStatus={getPromoStatus}
                    isPromoCurrentlyActive={isPromoCurrentlyActive}
                    formatDate={formatDate}
                    promoCodeInputRef={promoCodeInputRef}
                    promoDiscountInputRef={promoDiscountInputRef}
                    startDateInputRef={startDateInputRef}
                    endDateInputRef={endDateInputRef}
                    // deletePromoCode={deletePromoCode}
                    
                />

                <UnsavedChangesAlert />
                <DeleteConfirmationModal />
            </div>
        </Navbar>
    );
};

export default DiscountProduct;