import React, { useState, useEffect, useRef, useMemo } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import html2pdf from "html2pdf.js";
import { toast, ToastContainer } from "react-toastify";
import { FaPlus, FaFileExport, FaFileExcel, FaSearch, FaTrash, FaEdit, FaSave } from "react-icons/fa";
import Navbar from "../../Components/Sidebar/Navbar";
import WorkOrderPrint from "./WorkOrderPrint";
import "react-toastify/dist/ReactToastify.css";
import "./WorkOrder.scss";
import axios from "axios";
import * as XLSX from 'xlsx';
import { useInventory } from '../../Components/contexts/InventoryContext'; 
import Select from 'react-select';

const WorkOrder = () => {
    const { calculateStock } = useInventory();
    const [workOrders, setWorkOrders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [gstType, setGstType] = useState("intra");
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [bomProducts, setBomProducts] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showLoader, setShowLoader] = useState(false);
    const loaderTimeoutRef = useRef(null);

    const submissionStateRef = useRef({
        isSubmitting: false,
        hasValidationErrors: false
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const UNIT_OPTIONS = [
        { value: "MTR", label: "Meter (Mtr.)" },
        { value: "NOS", label: "Numbers (No.)" },
        { value: "KGS", label: "Kilogram (Kg.)" },
        { value: "LTR", label: "Litre (L.)" }
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Add debounce effect
    useEffect(() => {
        if (loaderTimeoutRef.current) {
            clearTimeout(loaderTimeoutRef.current);
        }

        if (searchTerm.trim()) {
            loaderTimeoutRef.current = setTimeout(() => {
                setShowLoader(true);
            }, 300);

            const searchTimeout = setTimeout(() => {
                if (loaderTimeoutRef.current) {
                    clearTimeout(loaderTimeoutRef.current);
                }
                setDebouncedSearch(searchTerm.trim().toLowerCase());
                setCurrentPage(1); // Reset to first page when search changes
                setShowLoader(false);
            }, 300);

            return () => {
                clearTimeout(searchTimeout);
                if (loaderTimeoutRef.current) {
                    clearTimeout(loaderTimeoutRef.current);
                }
                setShowLoader(false);
            };
        } else {
            setDebouncedSearch("");
            setCurrentPage(1); // Reset to first page when search is cleared
            setShowLoader(false);
        }
    }, [searchTerm]);

    const filteredWorkOrders = useMemo(() => {
        if (!debouncedSearch) return workOrders;

        return workOrders.filter(order => {
            // Check work order fields
            if (order.workOrderNumber?.toLowerCase().includes(debouncedSearch)) return true;
            if (order.workOrderDate?.toLowerCase().includes(debouncedSearch)) return true;

            // Check receiver/consignee fields
            if (order.receiver?.name?.toLowerCase().includes(debouncedSearch)) return true;
            if (order.receiver?.gstin?.toLowerCase().includes(debouncedSearch)) return true;
            if (order.receiver?.address?.toLowerCase().includes(debouncedSearch)) return true;
            if (order.receiver?.contact?.toLowerCase().includes(debouncedSearch)) return true;
            if (order.receiver?.email?.toLowerCase().includes(debouncedSearch)) return true;

            // Check items
            if (order.items?.some(item =>
                item.name?.toLowerCase().includes(debouncedSearch) ||
                item.description?.toLowerCase().includes(debouncedSearch) ||
                item.hsn?.toLowerCase().includes(debouncedSearch)
            )) return true;

            return false;
        });
    }, [debouncedSearch, workOrders]);

    // Paginated Work Orders
const paginatedWorkOrders = useMemo(() => {
  // If searching, show all filtered results without pagination
  if (debouncedSearch) return filteredWorkOrders;

  // Otherwise, apply pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  return filteredWorkOrders.slice(0, startIndex + itemsPerPage);
}, [filteredWorkOrders, currentPage, itemsPerPage, debouncedSearch]);

// Check if there are more work orders to load
const hasMoreWorkOrders = useMemo(() => {
  return debouncedSearch ? false : currentPage * itemsPerPage < filteredWorkOrders.length;
}, [currentPage, itemsPerPage, filteredWorkOrders.length, debouncedSearch]);

const loadMoreWorkOrders = () => {
  setCurrentPage(prev => prev + 1);
};

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchWorkOrderData(),
                    axios.get(`${import.meta.env.VITE_API_URL}/po/get-pos`).then(res =>
                        setPurchaseOrders(res.data.data || [])
                    ),
                    axios.get(`${import.meta.env.VITE_API_URL}/customer/get-customers`).then(res => {
                        // Sort customers by createdAt (newest first)
                        const sortedCustomers = (res.data || []).sort((a, b) =>
                            new Date(b.createdAt || b.date || Date.now()) - new Date(a.createdAt || a.date || Date.now())
                        );
                        setCustomers(sortedCustomers);
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/bom/get-boms`).then(res =>
                        setBomProducts(res.data.data || [])
                    ),
                    axios.get(`${import.meta.env.VITE_API_URL}/items/get-items`).then(res =>
                        setInventoryItems(res.data || [])
                    )
                ]);
            } catch (error) {
                toast.error("Failed to fetch data");
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchWorkOrderData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/workorder/get-workorders`);
            // Sort by date (newest first) and then by work order number
            const sortedWorkOrders = (response.data.data || []).sort((a, b) => {
                const dateDiff = new Date(b.workOrderDate) - new Date(a.workOrderDate);
                if (dateDiff !== 0) return dateDiff;
                return b.workOrderNumber.localeCompare(a.workOrderNumber);
            });
            setWorkOrders(sortedWorkOrders);
        } catch (error) {
            console.error("Error fetching work orders:", error);
            toast.error("Failed to load work orders");
        }
    };

    const checkInventory = async (productName, quantityToMake) => {
        try {
            const productBOM = bomProducts.find(bom => bom.productName === productName);
            if (!productBOM) return { canProduce: false, message: "No BOM found" };

            // Fetch current inventory data
            const inventoryResponse = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/get-inventory`);
            const inventoryItems = inventoryResponse.data.data || [];

            const requirements = productBOM.items.map(bomItem => {
                const totalNeeded = bomItem.requiredQty * quantityToMake;

                // Find the inventory item
                const inventoryItem = inventoryItems.find(item => item.itemName === bomItem.itemName);
                const availableQty = inventoryItem ? inventoryItem.currentStock : 0;

                return {
                    component: bomItem.itemName,
                    neededPerUnit: bomItem.requiredQty,
                    totalNeeded,
                    available: availableQty,
                    isAvailable: availableQty >= totalNeeded
                };
            });

            const missingItems = requirements.filter(item => !item.isAvailable);
            if (missingItems.length > 0) {
                return {
                    canProduce: false,
                    message: "Insufficient inventory: " +
                        missingItems.map(i => `${i.component} (Need ${i.totalNeeded}, Have ${i.available})`).join(", "),
                    details: requirements
                };
            }

            return {
                canProduce: true,
                message: "All materials available",
                details: requirements
            };
        } catch (error) {
            console.error("Error checking inventory:", error);
            return { canProduce: false, message: "Error checking inventory availability" };
        }
    };

    const initialValues = {
        workOrderDate: new Date().toISOString().split("T")[0],
        poNumber: "",
        poDate: "",
        receiver: {
            companyName: "",
            name: "",
            gstin: "",
            address: "",
            city: "",
            pincode: "",
            contact: "",
            email: "",
            customerId: ""
        },
        items: [
            {
                name: "",
                description: "",
                hsn: "",
                quantity: "",
                unitPrice: "",
                units: ""
            }
        ],
    };

    const validationSchema = Yup.object().shape({
        workOrderDate: Yup.string().required("Work Order Date is required"),
        receiver: Yup.object({
            companyName: Yup.string().required("Company name required"),
            name: Yup.string().required("Receiver name required"),
            gstin: Yup.string().required("GSTIN required"),
            address: Yup.string().required("Address required"),
            contact: Yup.string().required("Contact required"),
            city: Yup.string(),
            pincode: Yup.string(),
            email: Yup.string().email("Invalid email").required("Email required")
        }),
        items: Yup.array().of(
            Yup.object({
                name: Yup.string().required("Item name required"),
                quantity: Yup.number()
                    .required("Quantity required")
                    .moreThan(0, "Quantity must be greater than 0"),
                unitPrice: Yup.number().required("Unit price required").moreThan(0),
                units: Yup.string().required("Unit selection required")
            })
        )
    });

    const handlePOSelect = (e, setFieldValue) => {
        const selectedPONumber = e.target.value;
        const selectedPO = purchaseOrders.find(po => po.poNumber === selectedPONumber);
        if (selectedPO) {
            setFieldValue("poNumber", selectedPO.poNumber);
            setFieldValue("poDate", selectedPO.date);
        }
    };

    const handleItemSelect = (selectedOption, index, setFieldValue) => {
        if (selectedOption) {
            // Store BOM ID internally but don't show it to user
            setFieldValue(`items.${index}.bomId`, selectedOption.bomData.bomId);
            setFieldValue(`items.${index}.name`, selectedOption.bomData.productName);
            setFieldValue(`items.${index}.description`, selectedOption.bomData.description);
            setFieldValue(`items.${index}.hsn`, selectedOption.bomData.hsnCode);

            // Show BOM requirements toast
            toast.info(
                `To make 1 ${selectedOption.bomData.productName} you need: ${selectedOption.bomData.items.map(i =>
                    `${i.requiredQty} ${i.itemName}`
                ).join(", ")}`,
                {
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false,
                    closeButton: true
                }
            );
        }
    };

    const handleCompanySelect = (selectedOption, setFieldValue) => {
        if (selectedOption) {
            const selectedCustomer = selectedOption.customerData;
            setFieldValue("receiver.companyName", selectedCustomer.companyName);
            setFieldValue("receiver.name", selectedCustomer.customerName);
            setFieldValue("receiver.gstin", selectedCustomer.gstNumber);
            setFieldValue("receiver.address", selectedCustomer.address);
            setFieldValue("receiver.city", selectedCustomer.city);
            setFieldValue("receiver.pincode", selectedCustomer.pincode);
            setFieldValue("receiver.contact", selectedCustomer.contactNumber);
            setFieldValue("receiver.email", selectedCustomer.email);
            setFieldValue("receiver.customerId", selectedCustomer.customerId);

            // Set GST type based on GST number
            const isIntraState = selectedCustomer.gstNumber?.slice(0, 2) === "24";
            setGstType(isIntraState ? "intra" : "inter");
        }
    };

    const calculateTotals = (items, otherCharges = 0, receiverGST = "") => {
        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const isIntraState = receiverGST.startsWith("24");
        const cgst = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
        const sgst = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
        const igst = !isIntraState ? +(subtotal * 0.18).toFixed(2) : 0;
        const total = +(subtotal + cgst + sgst + igst + Number(otherCharges || 0)).toFixed(2);
        return { subtotal, cgst, sgst, igst, total };
    };

    const handleSubmit = async (values, { resetForm }) => {
        toast.dismiss();

        if (isSubmitting || submissionStateRef.current.hasValidationErrors) {
            return;
        }

        setIsSubmitting(true);

        try {
            const inventoryCheck = await checkInventory(
                values.items[0].name,
                values.items[0].quantity
            );

            if (!inventoryCheck.canProduce) {
                toast.error(inventoryCheck.message, {
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false,
                    closeButton: true
                });
                return;
            }

            const totals = calculateTotals(values.items, 0, values.receiver.gstin);
            const newWorkOrder = {
                ...values,
                ...totals,
                materialRequirements: inventoryCheck.details
            };

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/workorder/create-workorder`,
                newWorkOrder
            );

            setWorkOrders(prev => [response.data.data, ...prev]);
            toast.success("Work order created successfully!");
            setShowForm(false);

        } catch (error) {
            console.error("Error saving work order:", error);
            toast.error(error.response?.data?.message || "Failed to save work order");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportPDF = () => {
        if (!selectedWorkOrder) return toast.warn("Select a work order to export");

        const element = document.getElementById("workorder-pdf");

        html2pdf()
            .from(element)
            .set({
                margin: [35, 10, 10, 10], // top=30mm, right=10mm, bottom=10mm, left=10mm
                filename: `${selectedWorkOrder.workOrderNumber}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
            })
            .save();
    };

    const handleExportExcel = () => {
        // Use filteredWorkOrders instead of workOrders when search is applied
        const dataToExport = filteredWorkOrders.length > 0 ? filteredWorkOrders : workOrders;

        if (dataToExport.length === 0) {
            toast.warn("No work orders to export");
            return;
        }

        // Create detailed data for export
        const data = dataToExport.map((order) => {
            // Format items as a string for easier reading in Excel
            const itemsString = order.items?.map(item =>
                `${item.name || 'N/A'} (Qty: ${item.quantity || 0} ${item.units || ''})`
            ).join('; ') || 'No items';

            // Calculate totals
            const totals = calculateTotals(
                order.items || [],
                0,
                order.receiver?.gstin || ""
            );

            return {
                'Work Order No': order.workOrderNumber || 'N/A',
                'Work Order Date': order.workOrderDate || 'N/A',
                'PO Number': order.poNumber || 'N/A',
                'PO Date': order.poDate || 'N/A',
                'Company Name': order.receiver?.companyName || 'N/A',
                'Receiver Name': order.receiver?.name || 'N/A',
                'Receiver GSTIN': order.receiver?.gstin || 'N/A',
                'Receiver Address': order.receiver?.address || 'N/A',
                'Receiver City': order.receiver?.city || 'N/A',
                'Receiver Pincode': order.receiver?.pincode || 'N/A',
                'Receiver Contact': order.receiver?.contact || 'N/A',
                'Receiver Email': order.receiver?.email || 'N/A',
                'Subtotal': `₹${totals.subtotal.toFixed(2)}`,
                'CGST': order.receiver?.gstin?.startsWith('24') ? `₹${totals.cgst.toFixed(2)}` : 'N/A',
                'SGST': order.receiver?.gstin?.startsWith('24') ? `₹${totals.sgst.toFixed(2)}` : 'N/A',
                'IGST': !order.receiver?.gstin?.startsWith('24') ? `₹${totals.igst.toFixed(2)}` : 'N/A',
                'Total': `₹${totals.total.toFixed(2)}`,
                'Items Count': order.items?.length || 0,
                'Items Details': itemsString,
                'GST Type': order.receiver?.gstin?.startsWith('24') ? 'Intra-State' : 'Inter-State',
                'Status': 'Active'
            };
        });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Set column widths for better readability
        const columnWidths = [
            { wch: 15 }, // Work Order No
            { wch: 12 }, // Work Order Date
            { wch: 15 }, // PO Number
            { wch: 12 }, // PO Date
            { wch: 25 }, // Company Name
            { wch: 20 }, // Receiver Name
            { wch: 20 }, // Receiver GSTIN
            { wch: 30 }, // Receiver Address
            { wch: 15 }, // Receiver City
            { wch: 12 }, // Receiver Pincode
            { wch: 15 }, // Receiver Contact
            { wch: 25 }, // Receiver Email
            { wch: 15 }, // Subtotal
            { wch: 15 }, // CGST
            { wch: 15 }, // SGST
            { wch: 15 }, // IGST
            { wch: 15 }, // Total
            { wch: 10 }, // Items Count
            { wch: 50 }, // Items Details
            { wch: 15 }, // GST Type
            { wch: 10 }  // Status
        ];

        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Work Orders");

        // Use appropriate filename based on whether filtered or all
        const fileName = debouncedSearch ? "filtered_work_orders.xlsx" : "all_work_orders.xlsx";
        XLSX.writeFile(workbook, fileName);

        toast.success(`Exported ${dataToExport.length} work orders with detailed information`);
    };

    // Add these functions to your WorkOrder component
    const handleUpdateWorkOrder = async (updatedWorkOrder) => {
        try {
            // Check if all items have BOM IDs
            const missingBomItems = updatedWorkOrder.items.filter(item => !item.bomId);
            if (missingBomItems.length > 0) {
                toast.error("Some items are missing product selection. Please select products for all items.");
                throw new Error("Missing BOM IDs");
            }

            // Check inventory before updating
            for (const item of updatedWorkOrder.items) {
                const inventoryCheck = await checkInventory(item.name, item.quantity);
                if (!inventoryCheck.canProduce) {
                    toast.error(`Cannot update: ${inventoryCheck.message}`, {
                        autoClose: false,
                        closeOnClick: false,
                        draggable: false,
                        closeButton: true
                    });
                    throw new Error("Insufficient inventory");
                }
            }

            // Remove timestamp fields and other non-updatable fields
            const { createdAt, updatedAt, workOrderNumber, ...updateData } = updatedWorkOrder;

            updateData.workOrderDate = updatedWorkOrder.workOrderDate;

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/workorder/update-workorder/${updatedWorkOrder.workOrderNumber}`,
                updateData
            );

            const updatedWO = response.data.data;

            // Update the work orders list
            setWorkOrders(prev =>
                prev.map(wo =>
                    wo.workOrderNumber === updatedWorkOrder.workOrderNumber ? updatedWO : wo
                )
            );

            // Also update the selected work order if it's the one being edited
            if (selectedWorkOrder && selectedWorkOrder.workOrderNumber === updatedWorkOrder.workOrderNumber) {
                setSelectedWorkOrder(updatedWO);
            }

            toast.success("Work order updated successfully!");
            return updatedWO;
        } catch (error) {
            console.error("Error updating work order:", error);
            if (error.message !== "Insufficient inventory" && error.message !== "Missing BOM IDs") {
                toast.error(error.response?.data?.message || "Error updating work order");
            }
            throw error;
        }
    };

    const handleDeleteWorkOrder = async (workOrderNumber) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/workorder/delete-workorder/${workOrderNumber}`
            );

            setWorkOrders(prev =>
                prev.filter(wo => wo.workOrderNumber !== workOrderNumber)
            );
            setSelectedWorkOrder(null);
            toast.success("Work order deleted successfully!");
        } catch (error) {
            console.error("Error deleting work order:", error);
            toast.error(error.response?.data?.message || "Error deleting work order");
        }
    };

    const WorkOrderModal = ({ workOrder, customers, bomProducts, onClose, onExport, onUpdate, onDelete }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editedWorkOrder, setEditedWorkOrder] = useState({});
        const [errors, setErrors] = useState({});
        const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
        const [isUpdating, setIsUpdating] = useState(false);

        useEffect(() => {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'auto';
            };
        }, []);

        useEffect(() => {
            if (workOrder) {
                // Ensure each item has a bomId
                const itemsWithBomId = workOrder.items.map(item => ({
                    ...item,
                    bomId: item.bomId || findBomIdByName(item.name),
                    units: item.units || ""
                }));

                setEditedWorkOrder({
                    ...workOrder,
                    items: itemsWithBomId
                });
                setErrors({});
            }
        }, [workOrder]);

        // Helper function to find BOM ID by product name
        const findBomIdByName = (productName) => {
            const bom = bomProducts.find(b => b.productName === productName);
            return bom ? bom.bomId : null;
        };

        // Add new product function
        const handleAddProduct = () => {
            setEditedWorkOrder(prev => ({
                ...prev,
                items: [...(prev.items || []), {
                    bomId: "",
                    name: "",
                    description: "",
                    hsn: "",
                    quantity: 0,
                    unitPrice: 0,
                    units: ""
                }]
            }));
        };

        const checkSalesForProduct = async (bomId) => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/workorder/check-sales-for-product-in-workorder/${workOrder.workOrderNumber}/${bomId}`
                );
                return response.data.hasSales;
            } catch (error) {
                console.error("Error checking sales for product:", error);
                return true; // Assume there are sales to prevent accidental deletion
            }
        };

        // Update the handleRemoveProduct function
        const handleRemoveProduct = async (index) => {
            if (editedWorkOrder.items.length <= 1) {
                toast.warn("At least one product is required");
                return;
            }

            const itemToRemove = editedWorkOrder.items[index];

            // Check if this product has sales IN THIS WORK ORDER
            if (itemToRemove.bomId) {
                const hasSales = await checkSalesForProduct(itemToRemove.bomId);

                if (hasSales) {
                    toast.error(`Cannot remove "${itemToRemove.name}" because it has associated sales in this work order`);
                    return;
                }
            }

            // If no sales or no BOM ID, proceed with removal
            setEditedWorkOrder(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        };

        // Check inventory before adding/updating products
        const checkProductInventory = async (bomId, quantity) => {
            try {
                const bom = bomProducts.find(b => b.bomId === bomId);
                if (!bom) return { canProduce: false, message: "BOM not found" };

                const inventoryResponse = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/get-inventory`);
                const inventoryItems = inventoryResponse.data.data || [];

                const requirements = bom.items.map(bomItem => {
                    const totalNeeded = bomItem.requiredQty * quantity;
                    const inventoryItem = inventoryItems.find(item => item.itemName === bomItem.itemName);
                    const availableQty = inventoryItem ? inventoryItem.currentStock : 0;

                    return {
                        component: bomItem.itemName,
                        totalNeeded,
                        available: availableQty,
                        isAvailable: availableQty >= totalNeeded
                    };
                });

                const missingItems = requirements.filter(item => !item.isAvailable);
                if (missingItems.length > 0) {
                    return {
                        canProduce: false,
                        message: "Insufficient inventory: " +
                            missingItems.map(i => `${i.component} (Need ${i.totalNeeded}, Have ${i.available})`).join(", ")
                    };
                }

                return { canProduce: true, message: "Inventory available" };
            } catch (error) {
                console.error("Error checking inventory:", error);
                return { canProduce: false, message: "Error checking inventory" };
            }
        };

        // Validation function - only validate quantity and unitPrice
        const validateForm = (values) => {
            const newErrors = {};

            // Validate items array
            if (values.items && Array.isArray(values.items)) {
                values.items.forEach((item, index) => {
                    if (!item.quantity || item.quantity <= 0) {
                        newErrors[`items.${index}.quantity`] = "Quantity must be greater than 0";
                    }
                    if (!item.unitPrice || item.unitPrice <= 0) {
                        newErrors[`items.${index}.unitPrice`] = "Unit price must be greater than 0";
                    }
                    if (!item.bomId) {
                        newErrors[`items.${index}.bomId`] = "Product selection is required";
                    }
                    if (!item.units) {
                        newErrors[`items.${index}.units`] = "Unit selection is required"; // Add units validation
                    }
                });
            }

            return newErrors;
        };

        // Handler function for company selection
        const handleCompanySelect = (selectedOption) => {
            if (selectedOption) {
                const selectedCustomer = selectedOption.customerData;
                setEditedWorkOrder(prev => ({
                    ...prev,
                    receiver: {
                        ...prev.receiver,
                        companyName: selectedCustomer.companyName,
                        name: selectedCustomer.customerName,
                        gstin: selectedCustomer.gstNumber,
                        address: selectedCustomer.address,
                        city: selectedCustomer.city,
                        pincode: selectedCustomer.pincode,
                        contact: selectedCustomer.contactNumber,
                        email: selectedCustomer.email,
                        customerId: selectedCustomer.customerId
                    }
                }));
            }
        };

        // Handler function for product selection
        const handleItemSelect = async (selectedOption, index) => {
            if (selectedOption) {
                const selectedBOM = selectedOption.bomData;
                const inventoryCheck = await checkProductInventory(selectedBOM.bomId, 1);

                if (!inventoryCheck.canProduce) {
                    toast.error(`Cannot add product: ${inventoryCheck.message}`);
                    return;
                }

                const updatedItems = [...editedWorkOrder.items];
                updatedItems[index] = {
                    ...updatedItems[index],
                    bomId: selectedBOM.bomId,
                    name: selectedBOM.productName,
                    description: selectedBOM.description,
                    hsn: selectedBOM.hsnCode,
                    units: updatedItems[index].units || ""
                };

                setEditedWorkOrder(prev => ({
                    ...prev,
                    items: updatedItems
                }));

                // Clear any BOM ID error for this item
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[`items.${index}.bomId`];
                    return newErrors;
                });

                // Show BOM requirements toast
                toast.info(
                    `To make 1 ${selectedBOM.productName} you need: ${selectedBOM.items.map(i =>
                        `${i.requiredQty} ${i.itemName}`
                    ).join(", ")}`,
                    { autoClose: false, closeOnClick: false }
                );
            }
        };

        const handleInputChange = (e, index, field) => {
            const { value } = e.target;
            const newItems = [...editedWorkOrder.items];

            newItems[index] = {
                ...newItems[index],
                [field]: field === 'quantity' || field === 'unitPrice' ? Number(value) : value
            };

            setEditedWorkOrder(prev => ({ ...prev, items: newItems }));

            // Validate the field in real-time
            const fieldErrors = validateForm({ ...editedWorkOrder, items: newItems });
            setErrors(prev => ({ ...prev, ...fieldErrors }));
        };

        const handleSave = async () => {
            setIsUpdating(true);
            // Check inventory for all items
            for (const item of editedWorkOrder.items) {
                if (!item.bomId || item.quantity <= 0) continue;

                const inventoryCheck = await checkProductInventory(item.bomId, item.quantity);
                if (!inventoryCheck.canProduce) {
                    toast.error(`Cannot save: ${item.name} - ${inventoryCheck.message}`);
                    return;
                }
            }

            // Validate form
            const formErrors = validateForm(editedWorkOrder);
            if (Object.keys(formErrors).length > 0) {
                setErrors(formErrors);
                Object.entries(formErrors).forEach(([key, error]) => {
                    if (key.includes('bomId')) {
                        toast.error(`Product selection is required for item ${parseInt(key.split('.')[1]) + 1}`);
                    }
                });
                setIsUpdating(false);
                return;
            }

            try {
                await onUpdate(editedWorkOrder);
                setIsEditing(false);
                setErrors({});
            } catch (error) {
                // Error message will be shown by the parent component
                console.error("Error updating work order:", error);
            } finally {
                setIsUpdating(false); // Stop loading in all cases
            }
        };

        if (!workOrder) return null;

        const totals = calculateTotals(
            editedWorkOrder.items || workOrder.items,
            0,
            editedWorkOrder.receiver?.gstin || workOrder.receiver?.gstin
        );

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="modal-title">Work Order: {workOrder.workOrderNumber}</div>
                        <button className="modal-close" onClick={onClose}>
                            &times;
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="wo-details-grid">
                            <div className="detail-row">
                                <span className="detail-label">Work Order No:</span>
                                <span className="detail-value">{workOrder.workOrderNumber}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date:</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="workOrderDate"
                                        value={editedWorkOrder.workOrderDate || ''}
                                        onChange={(e) => setEditedWorkOrder(prev => ({ ...prev, workOrderDate: e.target.value }))}
                                        className="edit-input"
                                    />
                                ) : (
                                    <span className="detail-value">{workOrder.workOrderDate}</span>
                                )}
                            </div>
                            {workOrder.poNumber && (
                                <div className="detail-row">
                                    <span className="detail-label">PO Number:</span>
                                    <span className="detail-value">{workOrder.poNumber}</span>
                                </div>
                            )}
                            {workOrder.poDate && (
                                <div className="detail-row">
                                    <span className="detail-label">PO Date:</span>
                                    <span className="detail-value">{workOrder.poDate}</span>
                                </div>
                            )}

                            {/* <div className="section-header">Company Details</div>  */}


                            <div className="section-header">Receiver Details (Billed To)</div>
                            <div className="detail-row">
                                <span className="detail-label">Company Name:</span>
                                {isEditing ? (
                                    <div className="edit-field-container">
                                        <Select
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            options={customers.map(customer => ({
                                                value: customer.companyName,
                                                label: customer.companyName,
                                                customerData: customer
                                            }))}
                                            onChange={handleCompanySelect}
                                            value={{
                                                value: editedWorkOrder.receiver?.companyName,
                                                label: editedWorkOrder.receiver?.companyName
                                            }}
                                            placeholder="Select Company"
                                            isSearchable={true}
                                            noOptionsMessage={() => "No companies found"}
                                        />
                                    </div>
                                ) : (
                                    <span className="detail-value">{workOrder.receiver.companyName || 'N/A'}</span>
                                )}
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{editedWorkOrder.receiver?.name || workOrder.receiver.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">GSTIN:</span>
                                <span className="detail-value">{editedWorkOrder.receiver?.gstin || workOrder.receiver.gstin}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Address:</span>
                                <span className="detail-value">{editedWorkOrder.receiver?.address || workOrder.receiver.address}</span>
                            </div>

                            <div className="address-details-row">
                                <div className="detail-row">
                                    <span className="detail-label">City:</span>
                                    <span className="detail-value">
                                        {editedWorkOrder.receiver?.city || workOrder.receiver.city || "N/A"}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Pincode:</span>
                                    <span className="detail-value">
                                        {editedWorkOrder.receiver?.pincode || workOrder.receiver.pincode || "N/A"}
                                    </span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Contact:</span>
                                <span className="detail-value">
                                    {editedWorkOrder.receiver?.contact || workOrder.receiver.contact || "N/A"}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">
                                    {editedWorkOrder.receiver?.email || workOrder.receiver.email || "N/A"}
                                </span>
                            </div>

                            {/* Items Section - Only Quantity and Unit Price are editable */}
                            <div className="section-header">
                                Products Ordered
                                {isEditing && (
                                    <button
                                        // className="add-product-btn"
                                        className="new-add-item-btn"
                                        onClick={handleAddProduct}
                                        type="button"
                                    >
                                        <FaPlus /> Add Product
                                    </button>
                                )}
                            </div>
                            <div className="items-grid">
                                {(editedWorkOrder.items || workOrder.items).map((item, index) => (
                                    <div key={index} className="item-card">
                                        <div className="item-header">
                                            {isEditing ? (
                                                <div className="edit-field-container">
                                                    <Select
                                                        className="react-select-container"
                                                        classNamePrefix="react-select"
                                                        options={bomProducts
                                                            .filter(availableBOM =>
                                                                !editedWorkOrder.items.some((selectedItem, selectedIndex) =>
                                                                    selectedIndex !== index &&
                                                                    selectedItem.bomId === availableBOM.bomId
                                                                )
                                                            )
                                                            .map(bom => ({
                                                                value: bom.bomId, // Store BOM ID
                                                                label: bom.productName, // Show product name
                                                                bomData: bom
                                                            }))
                                                        }
                                                        onChange={(selectedOption) => handleItemSelect(selectedOption, index)}
                                                        value={item.bomId ? {
                                                            value: item.bomId,
                                                            label: item.name // Show the product name, not BOM ID
                                                        } : null}
                                                        placeholder="Product"
                                                        isSearchable={true}
                                                        noOptionsMessage={() => "No products available"}
                                                    />
                                                    {errors[`items.${index}.bomId`] && (
                                                        <div className="error-message">{errors[`items.${index}.bomId`]}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="item-name">{item.name}</span>
                                            )}
                                            <span className="item-hsn">HSN: {item.hsn || 'N/A'}</span>
                                        </div>




                                        <div className="item-description">
                                            {item.description || 'No description'}
                                        </div>

                                        <div className="item-details">
                                            {/* Keep quantity and price editing as before */}
                                            <div className="editable-field">
                                                <span>Qty: </span>
                                                {isEditing ? (
                                                    <div className="edit-field-container">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleInputChange(e, index, 'quantity')}
                                                            className={`edit-input ${errors[`items.${index}.quantity`] ? 'error' : ''}`}
                                                            min={0} // Set minimum to sold quantity
                                                            step="0.01"
                                                        />
                                                        {errors[`items.${index}.quantity`] && (
                                                            <div className="error-message">{errors[`items.${index}.quantity`]}</div>
                                                        )}
                                                        {/* {soldQuantities.get(item.bomId) > 0 && (
                                                            <div className="sold-quantity-info">
                                                                {soldQuantities.get(item.bomId)} units already sold
                                                            </div>
                                                        )} */}
                                                    </div>
                                                ) : (
                                                    <span>{item.quantity}</span>
                                                )}
                                                <span> {item.units}</span>
                                            </div>

                                            <div className="editable-field">
                                                <span>Rate: ₹</span>
                                                {isEditing ? (
                                                    <div className="edit-field-container">
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleInputChange(e, index, 'unitPrice')}
                                                            className={`edit-input ${errors[`items.${index}.unitPrice`] ? 'error' : ''}`}
                                                            min="0.01"
                                                            step="0.01"
                                                        />
                                                        {errors[`items.${index}.unitPrice`] && (
                                                            <div className="error-message">{errors[`items.${index}.unitPrice`]}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span>{item.unitPrice}</span>
                                                )}
                                            </div>
                                            <div className="editable-field">
                                                <span>Units: </span>
                                                {isEditing ? (
                                                    <div className="edit-field-container">
                                                        <Select
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            options={UNIT_OPTIONS}
                                                            onChange={(selectedOption) => {
                                                                const newItems = [...editedWorkOrder.items];
                                                                newItems[index] = {
                                                                    ...newItems[index],
                                                                    units: selectedOption?.value || ""
                                                                };
                                                                setEditedWorkOrder(prev => ({ ...prev, items: newItems }));
                                                            }}
                                                            value={UNIT_OPTIONS.find(option => option.value === item.units) || null}
                                                            placeholder="Select Units"
                                                            isSearchable={true}
                                                            noOptionsMessage={() => "No units found"}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span>{item.units || 'N/A'}</span>
                                                )}
                                            </div>

                                            <span>Total: ₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                                        </div>

                                        {isEditing && editedWorkOrder.items.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-product-btn"
                                                onClick={() => handleRemoveProduct(index)}
                                                title="Remove product"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="section-header">Order Summary</div>
                            <div className="totals-section">
                                <div className="total-row">
                                    <span>Subtotal:</span>
                                    <span>₹{totals.subtotal.toFixed(2)}</span>
                                </div>
                                {totals.cgst > 0 && (
                                    <div className="total-row">
                                        <span>CGST (9%):</span>
                                        <span>₹{totals.cgst.toFixed(2)}</span>
                                    </div>
                                )}
                                {totals.sgst > 0 && (
                                    <div className="total-row">
                                        <span>SGST (9%):</span>
                                        <span>₹{totals.sgst.toFixed(2)}</span>
                                    </div>
                                )}
                                {totals.igst > 0 && (
                                    <div className="total-row">
                                        <span>IGST (18%):</span>
                                        <span>₹{totals.igst.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="total-row grand-total">
                                    <span>Total:</span>
                                    <span>₹{totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="export-btn" onClick={onExport}>
                            <FaFileExport /> Export as PDF
                        </button>
                        <button
                            className={`update-btn ${isEditing ? 'save-btn' : ''}`}
                            onClick={isEditing ? handleSave : () => setIsEditing(true)}
                            disabled={isUpdating} // Disable during loading
                        >
                            {isUpdating ? (
                                <>
                                    <div className="button-loader"></div>
                                    Saving...
                                </>
                            ) : isEditing ? (
                                "Save Changes"
                            ) : (
                                "Update"
                            )}
                        </button>
                        <button
                            className="delete-btn"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <FaTrash /> Delete
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="confirm-dialog-overlay">
                        <div className="confirm-dialog">
                            <h3>Confirm Deletion</h3>
                            <p>Are you sure you want to delete {workOrder.workOrderNumber}? This action cannot be undone. This will restore the inventory items to stock.</p>
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
                                        onDelete(workOrder.workOrderNumber);
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

    return (
        <Navbar>
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="workorder-container">
                <div className="page-header">
                    <h2>Work Orders</h2>
                    <div className="right-section">
                        <div className="search-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search Work Orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="action-buttons-group">
                            <button className="export-all-btn" onClick={handleExportExcel}>
                                <FaFileExcel /> Export All
                            </button>
                            <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                                <FaPlus /> {showForm ? "Close Form" : "Create Work Order"}
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading && <div className="loading">Loading data...</div>}

                {showForm && (
                    <div className="form-container">

                        <Formik
                            initialValues={initialValues}
                            validationSchema={validationSchema}
                            validateOnBlur={false}
                            validateOnChange={false}
                            onSubmit={handleSubmit}
                        >
                            {({ values, setFieldValue, errors, submitCount, isSubmitting }) => {
                                submissionStateRef.current.isSubmitting = isSubmitting;

                                useEffect(() => {
                                    if (submitCount > 0 && Object.keys(errors).length > 0 && !submissionStateRef.current.isSubmitting) {
                                        toast.dismiss();
                                        submissionStateRef.current.hasValidationErrors = true;

                                        if (errors.workOrderDate) toast.error(errors.workOrderDate);

                                        if (errors.receiver) {
                                            Object.values(errors.receiver).forEach(err => toast.error(`Receiver: ${err}`));
                                        }

                                        if (Array.isArray(errors.items)) {
                                            errors.items.forEach((itemError, index) => {
                                                if (itemError?.name)
                                                    toast.error(`Item ${index + 1}: ${itemError.name}`);
                                                if (itemError?.quantity)
                                                    toast.error(`Item ${index + 1}: ${itemError.quantity}`);
                                                if (itemError?.unitPrice)
                                                    toast.error(`Item ${index + 1}: ${itemError.unitPrice}`);
                                                if (itemError?.units)
                                                    toast.error(`Item ${index + 1}: ${itemError.units}`);
                                            });
                                        }
                                    } else if (submitCount > 0 && Object.keys(errors).length === 0) {
                                        submissionStateRef.current.hasValidationErrors = false;
                                    }
                                }, [submitCount, errors, isSubmitting]);

                                return (
                                    <Form>
                                        {/* Company Selection */}
                                        {/* <h3>Company Details</h3>
                                        <div className="form-group-row">
                                            <div className="field-wrapper">
                                                <label>Company Name</label>
                                                <Select
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    options={customers.map(customer => ({
                                                        value: customer.companyName,
                                                        label: customer.companyName,
                                                        customerData: customer
                                                    }))}
                                                    onChange={(selectedOption) => handleCompanySelect(selectedOption, setFieldValue)}
                                                    placeholder="Select Company"
                                                    isSearchable={true}
                                                    noOptionsMessage={() => "No companies found"}
                                                />
                                            </div>
                                        </div> */}
                                        <div className="po-form-header">
                                            <h2>Create Work Order</h2>
                                            <div className="date-container">
                                                <span className="date-label">Date:</span>
                                                <Field
                                                    name="workOrderDate"
                                                    type="date"
                                                    className="workorder-date-editable"
                                                />
                                            </div>
                                        </div>
                                        {/* Receiver Section */}
                                        <h3>Receiver (Billed To)</h3>
                                        <div className="form-group-row">
                                            <div className="field-wrapper">
                                                <label>Company Name</label>
                                                <Select
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    options={customers.map(customer => ({
                                                        value: customer.companyName,
                                                        label: customer.companyName,
                                                        customerData: customer
                                                    }))}
                                                    onChange={(selectedOption) => handleCompanySelect(selectedOption, setFieldValue)}
                                                    placeholder="Select Company"
                                                    isSearchable={true}
                                                    noOptionsMessage={() => "No companies found"}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group-row">
                                            <div className="field-wrapper">
                                                <label>Customer Name</label>
                                                <Field name="receiver.name" readOnly />
                                            </div>
                                            <div className="field-wrapper">
                                                <label>GSTIN</label>
                                                <Field name="receiver.gstin" readOnly />
                                            </div>
                                            <div className="field-wrapper">
                                                <label>Contact</label>
                                                <Field name="receiver.contact" readOnly />
                                            </div>
                                            <div className="field-wrapper">
                                                <label>Email</label>
                                                <Field name="receiver.email" type="email" readOnly />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <Field name="receiver.address" as="textarea" placeholder="Receiver Address" readOnly />
                                            <div className="address-details-row">
                                                <Field name="receiver.city" placeholder="City" readOnly />
                                                <Field name="receiver.pincode" placeholder="Pincode" readOnly />
                                            </div>
                                        </div>

                                        {/* Items Section */}
                                        <h3>Product Details</h3>
                                        <FieldArray name="items">
                                            {({ push, remove }) => (
                                                <div className="form-items">
                                                    {values.items.map((_, index) => (
                                                        <div className="item-row" key={index}>
                                                            <Select
                                                                className="react-select-container"
                                                                classNamePrefix="react-select"
                                                                options={bomProducts.map(bom => ({
                                                                    value: bom.bomId, // Store BOM ID as value (hidden from user)
                                                                    label: bom.productName, // Show only product name to user
                                                                    bomData: bom
                                                                }))}
                                                                onChange={(selectedOption) => handleItemSelect(selectedOption, index, setFieldValue)}
                                                                placeholder="Products"
                                                                isSearchable={true}
                                                                noOptionsMessage={() => "No products found"}
                                                            />
                                                            <Field name={`items.${index}.description`} placeholder="Description" readOnly />
                                                            <Field name={`items.${index}.hsn`} placeholder="HSN Code" readOnly />
                                                            <Field
                                                                name={`items.${index}.quantity`}
                                                                type="number"
                                                                placeholder="Qty"
                                                                min="0.01"
                                                                step="0.01"
                                                            />                                                            <Field name={`items.${index}.unitPrice`} type="number" placeholder="Unit Price" />
                                                            <Select
                                                                className="react-select-container"
                                                                classNamePrefix="react-select"
                                                                options={UNIT_OPTIONS}
                                                                onChange={(selectedOption) =>
                                                                    setFieldValue(`items.${index}.units`, selectedOption?.value || "")
                                                                }
                                                                placeholder="Units"
                                                                isSearchable={true}
                                                                noOptionsMessage={() => "No units found"}
                                                            />
                                                            {values.items.length > 1 && (
                                                                <button type="button" className="remove-btn" onClick={() => remove(index)}>
                                                                    <FaTrash />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="add-btn"
                                                        onClick={() => push({ name: "", description: "", hsn: "", quantity: 0, unitPrice: 0, units: "" })}
                                                    >
                                                        + Add Item
                                                    </button>
                                                </div>
                                            )}
                                        </FieldArray>

                                        {/* GST and Totals Section */}
                                        <div className="totals">
                                            <p>Subtotal: ₹{calculateTotals(values.items, 0, values.receiver.gstin).subtotal.toFixed(2)}</p>
                                            {calculateTotals(values.items, 0, values.receiver.gstin).cgst > 0 && (
                                                <p>CGST (9%): ₹{calculateTotals(values.items, 0, values.receiver.gstin).cgst.toFixed(2)}</p>
                                            )}
                                            {calculateTotals(values.items, 0, values.receiver.gstin).sgst > 0 && (
                                                <p>SGST (9%): ₹{calculateTotals(values.items, 0, values.receiver.gstin).sgst.toFixed(2)}</p>
                                            )}
                                            {calculateTotals(values.items, 0, values.receiver.gstin).igst > 0 && (
                                                <p>IGST (18%): ₹{calculateTotals(values.items, 0, values.receiver.gstin).igst.toFixed(2)}</p>
                                            )}
                                            <p>Total: ₹{calculateTotals(values.items, 0, values.receiver.gstin).total.toFixed(2)}</p>
                                        </div>

                                        <div className="submit-btn-container">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className={isSubmitting ? "submitting" : "submit-btn"}
                                            >
                                                {isSubmitting ? "Submitting..." : "Submit Work Order"}
                                            </button>
                                        </div>
                                    </Form>
                                );
                            }}
                        </Formik>
                    </div>
                )}

                <div className="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Work Order No</th>
                                <th>Date</th>
                                <th>Company</th>
                                <th>Receiver</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
  {showLoader ? (
    <tr>
      <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="table-loader"></div>
      </td>
    </tr>
  ) : (
    paginatedWorkOrders.map((order) => (
      <tr
        key={order.workOrderNumber}
        onClick={() => setSelectedWorkOrder(order)}
        className={selectedWorkOrder?.workOrderNumber === order.workOrderNumber ? "selected" : ""}
      >
        <td>{order.workOrderNumber}</td>
        <td>{order.workOrderDate}</td>
        <td>{order.receiver?.companyName || 'N/A'}</td>
        <td>{order.receiver?.name || 'N/A'}</td>
        <td>₹{order.total?.toFixed(2)}</td>
      </tr>
    ))
  )}
</tbody>
                    </table>
                    {hasMoreWorkOrders && (
  <div className="load-more-container">
    <button className="load-more-btn" onClick={loadMoreWorkOrders}>
      Load More
    </button>
  </div>
)}
                </div>

                <div style={{ display: "none" }}>
                    {selectedWorkOrder && <WorkOrderPrint workOrder={selectedWorkOrder} />}
                </div>

                {selectedWorkOrder && (
                    <WorkOrderModal
                        workOrder={selectedWorkOrder}
                        customers={customers}
                        bomProducts={bomProducts}
                        onClose={() => setSelectedWorkOrder(null)}
                        onExport={handleExportPDF}
                        onUpdate={handleUpdateWorkOrder}
                        onDelete={handleDeleteWorkOrder}
                    />
                )}
            </div>
        </Navbar>
    );
};

export default WorkOrder;