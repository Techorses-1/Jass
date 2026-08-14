import React, { useState, useEffect, useRef, useMemo } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import html2pdf from "html2pdf.js";
import { toast, ToastContainer } from "react-toastify";
import { FaPlus, FaFileExport, FaFileExcel, FaSearch, FaTrash, FaEdit, FaSave } from "react-icons/fa";
import Navbar from "../../Components/Sidebar/Navbar";
import GRNPrint from "./GRNPrint";
import "react-toastify/dist/ReactToastify.css";
import "./GRN.scss";
import axios from "axios";
import * as XLSX from 'xlsx';
import Select from 'react-select';

const GRN = () => {
  const [grns, setGRNs] = useState(() => {
    const stored = localStorage.getItem("grns");
    return stored ? JSON.parse(stored) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [gstType, setGstType] = useState("intra");
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const loaderTimeoutRef = useRef(null); 

  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        setCurrentPage(1);
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
      setCurrentPage(1);
      setShowLoader(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/po/get-pos`);
        const sortedPOs = (response.data.data || []).sort((a, b) => {
          const dateDiff = new Date(b.date) - new Date(a.date);
          if (dateDiff !== 0) return dateDiff;
          return b.poNumber.localeCompare(a.poNumber);
        });
        setPurchaseOrders(sortedPOs);
      } catch (error) {
        toast.error("Failed to fetch purchase orders");
        setPurchaseOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    const fetchGRNs = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/grn/get-grns`);
        const sortedGRNs = (response.data.data || []).sort((a, b) => {
          const dateDiff = new Date(b.grnDate) - new Date(a.grnDate);
          if (dateDiff !== 0) return dateDiff;
          return b.grnNumber.localeCompare(a.grnNumber);
        });
        setGRNs(sortedGRNs);
      } catch (error) {
        toast.error("Failed to load GRNs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGRNs();
  }, []);

  const initialValues = {
    grnNumber: "",
    grnDate: new Date().toISOString().slice(0, 10),
    poNumber: "",
    poDate: "",
    lrNumber: "",
    transporter: "",
    vehicleNo: "",
    companyName: "",
    vendorName: "",
    vendorGST: "",
    vendorAddress: "",
    vendorContact: "",
    vendorEmail: "",
    vendorId: "",
    items: [
      {
        itemId: "",
        name: "",
        description: "",
        hsn: "",
        qty: "",
        rate: "",
        unit: ""
      }
    ],
    comments: "",
    otherCharges: ""
  };

  const validationSchema = Yup.object({
    grnDate: Yup.string().required("GRN Date is required"),
    poNumber: Yup.string().required("PO Number is required"),
    companyName: Yup.string().required("Company Name is required"),
    vendorName: Yup.string().required("Contact Person is required"),
    vendorGST: Yup.string().required("Vendor GST is required"),
    vendorAddress: Yup.string().required("Vendor Address is required"),
    vendorContact: Yup.string().required("Vendor Contact is required"),
    vendorEmail: Yup.string().email("Invalid Email").required("Vendor Email is required"),
    items: Yup.array().of(
      Yup.object({
        name: Yup.string().required("Item Name required"),
        qty: Yup.number()
          .required("Quantity is required")
          .moreThan(0, "Quantity must be greater than 0")
          .test(
            'max-qty',
            function (value) {
              const path = this.path;
              const itemIndex = path.split('.')[1];
              const currentItem = this.parent;

              if (currentItem._remainingQty !== undefined) {
                return value <= currentItem._remainingQty;
              }
              return true;
            }
          ),
        rate: Yup.number().required("Rate is required").moreThan(0, "Min 1")
      })
    )
  });

  const filteredGRNs = useMemo(() => {
  if (!debouncedSearch) return grns;

  return grns.filter(grn => {
    if (grn.grnNumber?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.poNumber?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.lrNumber?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.companyName?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.vendorName?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.vendorGST?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.vendorAddress?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.vendorContact?.toLowerCase().includes(debouncedSearch)) return true;
    if (grn.vendorEmail?.toLowerCase().includes(debouncedSearch)) return true;

    if (grn.items?.some(item =>
      item.name?.toLowerCase().includes(debouncedSearch) ||
      item.description?.toLowerCase().includes(debouncedSearch) ||
      item.hsn?.toLowerCase().includes(debouncedSearch)
    )) return true;

    return false;
  });
}, [debouncedSearch, grns]);

// Paginated GRNs
const paginatedGRNs = useMemo(() => {
  // If searching, show all filtered results without pagination
  if (debouncedSearch) return filteredGRNs;
  
  // Otherwise, apply pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  return filteredGRNs.slice(0, startIndex + itemsPerPage);
}, [filteredGRNs, currentPage, itemsPerPage, debouncedSearch]);

// Check if there are more GRNs to load
const hasMoreGRNs = useMemo(() => {
  return debouncedSearch ? false : currentPage * itemsPerPage < filteredGRNs.length;
}, [currentPage, itemsPerPage, filteredGRNs.length, debouncedSearch]);

// Load more GRNs
const loadMoreGRNs = () => {
  setCurrentPage(prev => prev + 1);
};

  const handlePOSelect = async (e, setFieldValue) => {
    const selectedPONumber = e.target.value;
    if (!selectedPONumber) return;

    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/grn/get-grns-by-po`, {
        params: {
          poNumber: selectedPONumber,
          _: Date.now()
        },
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const selectedPO = purchaseOrders.find(po => po.poNumber === selectedPONumber);
      if (!selectedPO) {
        toast.error("Selected PO not found");
        return;
      }

      const itemsWithRemainingQty = selectedPO.items.map(poItem => {
        const receivedQty = data.data.reduce((total, grn) => {
          const grnItem = grn.items?.find(i =>
            i.name && poItem.name &&
            i.name.toString().trim().toLowerCase() ===
            poItem.name.toString().trim().toLowerCase()
          );
          return total + (Number(grnItem?.qty) || 0);
        }, 0);

        const remainingQty = Math.max(0, poItem.qty - receivedQty);

        console.log(`Item: ${poItem.name} | Ordered: ${poItem.qty} | Received: ${receivedQty} | Remaining: ${remainingQty}`);

        return {
          ...poItem,
          itemId: poItem.itemId,
          qty: remainingQty,
          _originalQty: poItem.qty,
          _receivedQty: receivedQty,
          _remainingQty: remainingQty
        };
      });

      // Filter out items with 0 remaining quantity
      const itemsWithAvailableQty = itemsWithRemainingQty.filter(item => item._remainingQty > 0);

      if (itemsWithAvailableQty.length === 0) {
        toast.error("All items in this PO have been fully received");
        setFieldValue("poNumber", "");
        return;
      }

      setFieldValue("poNumber", selectedPO.poNumber);
      setFieldValue("poDate", selectedPO.date);
      setFieldValue("companyName", selectedPO.companyName);
      setFieldValue("vendorName", selectedPO.vendorName);
      setFieldValue("vendorGST", selectedPO.vendorGST);
      setFieldValue("vendorAddress", selectedPO.vendorAddress);
      setFieldValue("vendorContact", selectedPO.vendorContact);
      setFieldValue("vendorEmail", selectedPO.vendorEmail);
      setFieldValue("vendorId", selectedPO.vendorId);
      setGstType(selectedPO.gstType);
      setFieldValue("items", itemsWithAvailableQty);

    } catch (error) {
      console.error("PO selection error:", error);
      toast.error("Failed to load PO details. Please try again.");
    }
  };

  const isPOFullyFulfilled = async (poNumber) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/grn/get-grns-by-po`, {
        params: { poNumber }
      });

      const selectedPO = purchaseOrders.find(po => po.poNumber === poNumber);
      if (!selectedPO) return false;

      for (const poItem of selectedPO.items) {
        const receivedQty = data.data.reduce((total, grn) => {
          const grnItem = grn.items?.find(i =>
            i.name && poItem.name &&
            i.name.toString().trim().toLowerCase() ===
            poItem.name.toString().trim().toLowerCase()
          );
          return total + (Number(grnItem?.qty) || 0);
        }, 0);

        if (receivedQty < poItem.qty) {
          return false; // At least one item is not fully fulfilled
        }
      }

      return true; // All items are fully fulfilled
    } catch (error) {
      console.error("Error checking PO fulfillment:", error);
      return false;
    }
  };

  const calculateTotals = (items, otherCharges = 0, vendorGST = "") => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const isIntraState = vendorGST.startsWith("24");
    setGstType(isIntraState ? "intra" : "inter");
    const cgst = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
    const sgst = isIntraState ? +(subtotal * 0.09).toFixed(2) : 0;
    const igst = !isIntraState ? +(subtotal * 0.18).toFixed(2) : 0;
    const total = +(subtotal + cgst + sgst + igst + Number(otherCharges || 0)).toFixed(2);
    return { subtotal, cgst, sgst, igst, total };
  };

  const handleSubmit = async (values, { resetForm }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const invalidItems = values.items.filter(item =>
      item._remainingQty !== undefined && item.qty > item._remainingQty
    );

    if (invalidItems.length > 0) {
      invalidItems.forEach(item => {
        toast.error(`Quantity for ${item.name} exceeds remaining PO quantity (Max: ${item._remainingQty})`);
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const numericOtherCharges = Number(values.otherCharges || 0);
      const totals = calculateTotals(values.items, numericOtherCharges, values.vendorGST);
      const newGRN = {
        ...values, otherCharges: numericOtherCharges, ...totals,
        vendorId: values.vendorId, // Ensure vendorId is included
        items: values.items.map(item => ({
          ...item,
          itemId: item.itemId // Ensure itemId is included for each item
        }))
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/grn/create-grn`, newGRN);
      setGRNs(prev => [response.data.data, ...prev]);
      toast.success("GRN saved successfully!");
      setShowForm(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save GRN");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedGRN) return toast.warn("Select a GRN to export");
    const element = document.getElementById("grn-pdf");
    const options = {
      margin: 0,
      filename: `${selectedGRN.grnNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    html2pdf().from(element).set(options).save();
  };

  const handleExportExcel = () => {
    // Use filteredGRNs instead of grns when search is applied
    const dataToExport = filteredGRNs.length > 0 ? filteredGRNs : grns;

    if (dataToExport.length === 0) {
      toast.warn("No GRNs to export");
      return;
    }

    // Create detailed data for export
    const data = dataToExport.map(grn => {
      // Format items as a string for easier reading in Excel
      const itemsString = grn.items?.map(item =>
        `${item.name || 'N/A'} (Qty: ${item.qty || 0} ${item.unit || ''}, Rate: ₹${item.rate || 0})`
      ).join('; ') || 'No items';

      // Calculate totals
      const totals = calculateTotals(
        grn.items || [],
        grn.otherCharges || 0,
        grn.vendorGST || ""
      );

      return {
        'GRN Number': grn.grnNumber || 'N/A',
        'GRN Date': grn.grnDate || 'N/A',
        'PO Number': grn.poNumber || 'N/A',
        'PO Date': grn.poDate || 'N/A',
        'LR Number': grn.lrNumber || 'N/A',
        'Transporter': grn.transporter || 'N/A',
        'Vehicle No': grn.vehicleNo || 'N/A',
        'Company Name': grn.companyName || 'N/A',
        'Vendor Name': grn.vendorName || 'N/A',
        'Vendor GST': grn.vendorGST || 'N/A',
        'Vendor Address': grn.vendorAddress || 'N/A',
        'Vendor Contact': grn.vendorContact || 'N/A',
        'Vendor Email': grn.vendorEmail || 'N/A',
        'Subtotal': `₹${totals.subtotal.toFixed(2)}`,
        'CGST': grn.vendorGST?.startsWith('24') ? `₹${totals.cgst.toFixed(2)}` : 'N/A',
        'SGST': grn.vendorGST?.startsWith('24') ? `₹${totals.sgst.toFixed(2)}` : 'N/A',
        'IGST': !grn.vendorGST?.startsWith('24') ? `₹${totals.igst.toFixed(2)}` : 'N/A',
        'Other Charges': `₹${Number(grn.otherCharges || 0).toFixed(2)}`,
        'Total': `₹${totals.total.toFixed(2)}`,
        'Items Count': grn.items?.length || 0,
        'Items Details': itemsString,
        'Comments': grn.comments || 'None',
        'GST Type': grn.vendorGST?.startsWith('24') ? 'Intra-State' : 'Inter-State',
        'Status': 'Received'
      };
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // GRN Number
      { wch: 12 }, // GRN Date
      { wch: 15 }, // PO Number
      { wch: 12 }, // PO Date
      { wch: 15 }, // LR Number
      { wch: 20 }, // Transporter
      { wch: 15 }, // Vehicle No
      { wch: 25 }, // Company Name
      { wch: 20 }, // Vendor Name
      { wch: 20 }, // Vendor GST
      { wch: 30 }, // Vendor Address
      { wch: 15 }, // Vendor Contact
      { wch: 25 }, // Vendor Email
      { wch: 15 }, // Subtotal
      { wch: 15 }, // CGST
      { wch: 15 }, // SGST
      { wch: 15 }, // IGST
      { wch: 15 }, // Other Charges
      { wch: 15 }, // Total
      { wch: 10 }, // Items Count
      { wch: 50 }, // Items Details
      { wch: 30 }, // Comments
      { wch: 15 }, // GST Type
      { wch: 15 }  // Status
    ];

    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GRNs");

    // Use appropriate filename based on whether filtered or all
    const fileName = debouncedSearch ? "filtered_grns.xlsx" : "all_grns.xlsx";
    XLSX.writeFile(workbook, fileName);

    toast.success(`Exported ${dataToExport.length} GRNs with detailed information`);
  };

  const handleUpdateGRN = async (updatedGRN) => {
    try {
      // Only send the allowed fields for update
      const updateData = {
        grnDate: updatedGRN.grnDate,
        lrNumber: updatedGRN.lrNumber,
        transporter: updatedGRN.transporter,
        vehicleNo: updatedGRN.vehicleNo
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/grn/update-grn/${updatedGRN.grnNumber}`,
        updateData
      );

      setGRNs(prev =>
        prev.map(grn =>
          grn.grnNumber === updatedGRN.grnNumber ? response.data.data : grn
        )
      );
      setSelectedGRN(response.data.data); // Add this line to update the selected GRN
      toast.success("GRN updated successfully!");
    } catch (error) {
      console.error("Error updating GRN:", error);
      toast.error(error.response?.data?.message || "Error updating GRN");
    }
  };

  const handleDeleteGRN = async (grnNumber) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/grn/delete-grn/${grnNumber}`
      );

      setGRNs(prev => prev.filter(grn => grn.grnNumber !== grnNumber));
      setSelectedGRN(null);
      toast.success("GRN deleted successfully!");
    } catch (error) {
      console.error("Error deleting GRN:", error);
      toast.error(error.response?.data?.message || "Error deleting GRN");
    }
  };



  const GRNModal = ({ grn, onClose, onExport, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedGRN, setEditedGRN] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, []);

    useEffect(() => {
      if (grn) {
        setEditedGRN({ ...grn });
      }
    }, [grn]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setEditedGRN(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
      try {
        await onUpdate(editedGRN);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating GRN:", error);
      }
    };

    if (!grn) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">GRN: {grn.grnNumber}</div>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="grn-details-grid">
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                {isEditing ? (
                  <input
                    type="date"
                    name="grnDate"
                    value={editedGRN.grnDate || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <span className="detail-value">{grn.grnDate}</span>
                )}
              </div>
              <div className="detail-row">
                <span className="detail-label">PO Number:</span>
                <span className="detail-value">{grn.poNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">PO Date:</span>
                <span className="detail-value">{grn.poDate}</span>
              </div>

              {/* Editable fields */}
              <div className="detail-row">
                <span className="detail-label">LR Number:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="lrNumber"
                    value={editedGRN.lrNumber || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <span className="detail-value">{grn.lrNumber || 'N/A'}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Transporter:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="transporter"
                    value={editedGRN.transporter || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <span className="detail-value">{grn.transporter || 'N/A'}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Vehicle No:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="vehicleNo"
                    value={editedGRN.vehicleNo || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <span className="detail-value">{grn.vehicleNo || 'N/A'}</span>
                )}
              </div>

              <div className="section-header">Vendor Details</div>
              <div className="detail-row">
                <span className="detail-label">Company Name:</span>
                <span className="detail-value">{grn.companyName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">GSTIN:</span>
                <span className="detail-value">{grn.vendorGST}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{grn.vendorAddress}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact Person:</span>
                <span className="detail-value">{grn.vendorName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Contact:</span>
                <span className="detail-value">{grn.vendorContact}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{grn.vendorEmail}</span>
              </div>

              <div className="section-header">Items Received</div>
              <div className="items-grid">
                {grn.items.map((item, index) => (
                  <div key={index} className="item-card">
                    <div className="item-header">
                      <span className="item-name">{item.name}</span>
                      <span className="item-hsn">HSN: {item.hsn || 'N/A'}</span>
                    </div>
                    <div className="item-description">{item.description || 'No description'}</div>
                    <div className="item-details">
                      <span>Qty: {item.qty} {item.unit}</span>
                      <span>Rate: ₹{item.rate}</span>
                      <span>Total: ₹{(item.qty * item.rate).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {grn.comments && (
                <div>
                  <div className="section-header">Special Instructions</div>
                  <div className="comments-section">
                    {grn.comments}
                  </div>
                </div>
              )}

              <div className="section-header">Summary</div>
              <div className="totals-section">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{grn.subtotal?.toFixed(2)}</span>
                </div>
                {grn.cgst > 0 && (
                  <div className="total-row">
                    <span>CGST (9%):</span>
                    <span>₹{grn.cgst?.toFixed(2)}</span>
                  </div>
                )}
                {grn.sgst > 0 && (
                  <div className="total-row">
                    <span>SGST (9%):</span>
                    <span>₹{grn.sgst?.toFixed(2)}</span>
                  </div>
                )}
                {grn.igst > 0 && (
                  <div className="total-row">
                    <span>IGST (18%):</span>
                    <span>₹{grn.igst?.toFixed(2)}</span>
                  </div>
                )}
                {grn.otherCharges > 0 && (
                  <div className="total-row">
                    <span>Other Charges:</span>
                    <span>₹{grn.otherCharges?.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>Total:</span>
                  <span>₹{grn.total?.toFixed(2)}</span>
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
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete GRN {grn.grnNumber}? This action cannot be undone.</p>
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
                    onDelete(grn.grnNumber);
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
      <div className="main">
        <div className="page-header">
          <h2>Goods Received Notes</h2>
          <div className="right-section">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search GRNs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons-group">
              <button className="export-all-btn" onClick={handleExportExcel}>
                <FaFileExcel /> Export All
              </button>
              <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                <FaPlus /> {showForm ? "Close GRN" : "Create GRN"}
              </button>
            </div>
          </div>
        </div>

        {isLoading && <div className="loading">Loading data...</div>}

        {showForm && (
          <div className="form-container premium">
            <h2>Create GRN</h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              validateOnBlur={true}
              validateOnChange={false}
              onSubmit={async (values, formikHelpers) => {
                await handleSubmit(values, formikHelpers);
              }}
            >
              {({ errors, submitCount, values, setFieldValue }) => {
                useEffect(() => {
                  if (submitCount > 0 && Object.keys(errors).length > 0) {
                    Object.entries(errors).slice(0, 3).forEach(([field, error]) => {
                      if (field === "items" && Array.isArray(error)) {
                        error.forEach((itemError, index) => {
                          if (itemError && typeof itemError === "object") {
                            Object.entries(itemError).forEach(([key, val]) => {
                              toast.error(`Item ${index + 1} - ${key}: ${val}`);
                            });
                          }
                        });
                      } else {
                        toast.error(`${field}: ${error}`);
                      }
                    });
                  }
                }, [submitCount, errors]);

                return (
                  <Form>
                    <div className="form-group-row">
                      <div className="grn-field-wrapper">
                        <label>GRN Date</label>
                        <Field name="grnDate" type="date" />
                      </div>
                      <div className="grn-field-wrapper">
                        <label>PO Number</label>
                        <Select
                          className="react-select-container"
                          classNamePrefix="react-select"
                          options={purchaseOrders.map(po => ({
                            value: po.poNumber,
                            label: `${po.poNumber} - ${po.vendorName}`,
                            poData: po
                          }))}
                          onChange={async (selectedOption) => {
                            if (selectedOption) {
                              // Check if PO is fully fulfilled
                              const isFulfilled = await isPOFullyFulfilled(selectedOption.value);
                              if (isFulfilled) {
                                toast.error("This PO has been fully fulfilled. Cannot create more GRNs for it.");
                                return;
                              }

                              handlePOSelect(
                                { target: { value: selectedOption.value } },
                                setFieldValue
                              );
                            }
                          }}
                          placeholder="Select PO"
                          isSearchable={true}
                          noOptionsMessage={() => "No POs found"}
                        />
                      </div>

                      <div className="grn-field-wrapper">
                        <label>PO Date</label>
                        <Field name="poDate" readOnly />
                      </div>
                      <div className="grn-field-wrapper">
                        <label>LR Number</label>
                        <Field name="lrNumber" />
                      </div>
                      <div className="grn-field-wrapper">
                        <label>Transporter</label>
                        <Field name="transporter" />
                      </div>
                      <div className="grn-field-wrapper">
                        <label>Vehicle No.</label>
                        <Field name="vehicleNo" />
                      </div>
                    </div>

                    <h3>Vendor Details</h3>
                    <div className="form-group-row">
                      <div className="field-wrapper">
                        <label>Company Name</label>
                        <Field name="companyName" readOnly />
                      </div>
                      <div className="field-wrapper">
                        <label>Contact Person</label>
                        <Field name="vendorName" readOnly />
                      </div>
                      <div className="field-wrapper">
                        <label>GSTIN</label>
                        <Field name="vendorGST" readOnly />
                      </div>
                      <div className="field-wrapper">
                        <label>Contact</label>
                        <Field name="vendorContact" readOnly />
                      </div>
                      <div className="field-wrapper">
                        <label>Email</label>
                        <Field name="vendorEmail" readOnly />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <Field name="vendorAddress" as="textarea" readOnly />
                    </div>

                    <FieldArray name="items">
                      {({ remove, push }) => (
                        <div className="form-items">
                          {values.items.map((_, index) => (
                            <div className="item-row" key={index}>
                              <Field
                                name={`items.${index}.srNo`}
                                value={index + 1}
                                readOnly
                                className="sr-no-field"
                              />

                              <Field
                                name={`items.${index}.name`}
                                placeholder="Item"
                                readOnly
                                className="item-name-field"
                              />

                              <Field
                                name={`items.${index}.description`}
                                placeholder="Description"
                                readOnly
                                className="item-desc-field"
                              />

                              <div className="quantity-field-container">
                                <Field name={`items.${index}.qty`}
                                  placeholder="Quantity">
                                  {({ field, form }) => {
                                    const currentItem = form.values.items[index];
                                    const remainingQty = currentItem?._remainingQty;

                                    return (
                                      <input
                                        {...field}
                                        type="number"
                                        min="0.01"        // Changed from min="0"
                                        step="0.01"       // Added to allow decimal values
                                        max={remainingQty}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (remainingQty !== undefined && value > remainingQty) {
                                            form.setFieldValue(field.name, remainingQty);
                                          } else {
                                            field.onChange(e);
                                          }
                                        }}
                                        className="quantity-input"
                                      />
                                    );
                                  }}
                                </Field>
                                {values.items[index]?._remainingQty !== undefined && (
                                  <div className="quantity-hint">(max: {values.items[index]._remainingQty})</div>
                                )}
                              </div>

                              <Field
                                name={`items.${index}.rate`}
                                type="number"
                                placeholder="Rate"
                                className="rate-field"
                              />

                              <Field
                                name={`items.${index}.unit`}
                                placeholder="Unit"
                                readOnly
                                className="unit-field"
                              />

                              <Field
                                name={`items.${index}.total`}
                                value={(values.items[index].qty * values.items[index].rate || 0).toFixed(2)}
                                readOnly
                                className="total-field"
                              />

                              {values.items.length > 1 && (
                                <button
                                  type="button"
                                  className="remove-btn-grn"
                                  onClick={() => remove(index)}
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </FieldArray>

                    <Field name="comments" as="textarea" placeholder="Comments or Special Instructions" />
                    <Field name="otherCharges" type="number" placeholder="Other Charges (Optional)" />

                    <div className="totals">
                      <p>Subtotal: ₹{calculateTotals(values.items, values.otherCharges, values.vendorGST).subtotal}</p>
                      {gstType === "intra" ? (
                        <>
                          <p>CGST (9%): ₹{calculateTotals(values.items, values.otherCharges, values.vendorGST).cgst}</p>
                          <p>SGST (9%): ₹{calculateTotals(values.items, values.otherCharges, values.vendorGST).sgst}</p>
                        </>
                      ) : (
                        <p>IGST (18%): ₹{calculateTotals(values.items, values.otherCharges, values.vendorGST).igst}</p>
                      )}
                      <p>Total: ₹{calculateTotals(values.items, values.otherCharges, values.vendorGST).total}</p>
                    </div>

                    <div className="submit-btn-container">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={isSubmitting ? "submitting" : ""}
                      >
                        {isSubmitting ? "Submitting..." : "Submit GRN"}
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
                <th>GRN No</th>
                <th>Date</th>
                <th>Company</th>
                <th>Contact Person</th>
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
    paginatedGRNs.map((grn) => (
      <tr
        key={grn.grnNumber}
        onClick={() => setSelectedGRN(grn)}
        className={selectedGRN?.grnNumber === grn.grnNumber ? "selected" : ""}
      >
        <td>{grn.grnNumber}</td>
        <td>{grn.grnDate}</td>
        <td>{grn.companyName}</td>
        <td>{grn.vendorName}</td>
        <td>₹{grn.total.toFixed(2)}</td>
      </tr>
    ))
  )}
</tbody>
          </table>
         {hasMoreGRNs && (
    <div className="load-more-container">
      <button className="load-more-btn" onClick={loadMoreGRNs}>
        Load More
      </button>
    </div>
  )}
</div>

        <div style={{ display: "none" }}>
          {selectedGRN && <GRNPrint grn={selectedGRN} />}
        </div>

        {selectedGRN && (
          <GRNModal
            grn={selectedGRN}
            onClose={() => setSelectedGRN(null)}
            onExport={handleExportPDF}
            onUpdate={handleUpdateGRN}
            onDelete={handleDeleteGRN}
          />
        )}
      </div>
    </Navbar>
  );
};

export default GRN;