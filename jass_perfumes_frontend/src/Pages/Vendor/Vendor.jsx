import React, { useState, useEffect, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import Navbar from "../../Components/Sidebar/Navbar";
import {
  FaUserTie, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaIdCard, FaPlus, FaFileExport, FaFileExcel, FaSearch, FaEdit, FaSave, FaTrash
} from "react-icons/fa";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import "../Form/Form.scss";
import "./Vendor.scss";
import "react-toastify/dist/ReactToastify.css";

const Vendor = () => {
  const [showForm, setShowForm] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/vendors/get-vendors`);
        const sortedData = response.data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt)
            : (a._id?.getTimestamp ? new Date(a._id.getTimestamp()) : new Date(0));
          const dateB = b.createdAt ? new Date(b.createdAt)
            : (b._id?.getTimestamp ? new Date(b._id.getTimestamp()) : new Date(0));
          return dateB - dateA;
        });
        setVendors(sortedData);
      } catch (error) {
        console.error("Failed to fetch vendors:", error);
        toast.error("Failed to load vendor data.");
      }
    };
    fetchVendors();
  }, []);

  // Filter vendors

  const filteredVendors = useMemo(() => {
    if (!debouncedSearch) return vendors;

    return vendors.filter((v) =>
      v.vendorName?.toLowerCase().includes(debouncedSearch) ||
      v.gstNumber?.toLowerCase().includes(debouncedSearch) ||
      v.email?.toLowerCase().includes(debouncedSearch) ||
      v.contactNumber?.toLowerCase().includes(debouncedSearch) ||
      v.companyName?.toLowerCase().includes(debouncedSearch) ||
      v.address?.toLowerCase().includes(debouncedSearch)
    );
  }, [debouncedSearch, vendors]);

  // Paginated vendors
  const paginatedVendors = useMemo(() => {
    // If searching, show all filtered results without pagination
    if (debouncedSearch) return filteredVendors;

    // Otherwise, apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(0, startIndex + itemsPerPage);
  }, [filteredVendors, currentPage, itemsPerPage, debouncedSearch]);

  // Check if there are more vendors to load
  const hasMoreVendors = useMemo(() => {
    return debouncedSearch ? false : currentPage * itemsPerPage < filteredVendors.length;
  }, [currentPage, itemsPerPage, filteredVendors.length, debouncedSearch]);

  // Load more vendors
  const loadMoreVendors = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Submit vendor
  const initialValues = {
    vendorName: "",
    companyName: "",
    gstNumber: "",
    email: "",         // Primary email (validated)
    email2: "",        // Secondary email (optional)
    email3: "",        // Tertiary email (optional)
    contactNumber: "", // Primary contact (validated)
    contactNumber2: "",// Secondary contact (optional)
    contactNumber3: "",// Tertiary contact (optional)
    address: "",
  };

  const validationSchema = Yup.object({
    vendorName: Yup.string()
      .required("Contact Person is required")
      .matches(/^(?![0-9]+$)[a-zA-Z0-9\s]*$/, "Contact Person cannot contain only numbers"),

    companyName: Yup.string()
      .required("Company Name is required")
      .matches(/^(?![0-9]+$)[a-zA-Z0-9\s]*$/, "Company Name cannot contain only numbers"),

    email: Yup.string()
      .email("Invalid email")
      .required("Email is required"),

    contactNumber: Yup.string()
      .matches(/^[0-9]+$/, "Contact Number must contain only digits")
      .min(10, "Contact Number must be exactly 10 digits")
      .max(10, "Contact Number must be exactly 10 digits")
      .required("Contact Number is required"),

    gstNumber: Yup.string()
      .required("GST Number is required")
      .matches(/^[0-9A-Z]+$/, "GST Number must contain only uppercase letters and digits")
      .min(15, "GST Number must be 15 characters")
      .max(15, "GST Number must be 15 characters"),

    email2: Yup.string().email("Invalid email"),
    email3: Yup.string().email("Invalid email"),

    contactNumber2: Yup.string()
      .matches(/^[0-9]+$/, "Contact Number must contain only digits")
      .min(10, "Contact Number must be exactly 10 digits")
      .max(10, "Contact Number must be exactly 10 digits"),

    contactNumber3: Yup.string()
      .matches(/^[0-9]+$/, "Contact Number must contain only digits")
      .min(10, "Contact Number must be exactly 10 digits")
      .max(10, "Contact Number must be exactly 10 digits"),

    address: Yup.string().required("Address is required"),
  });

  // Update handleSubmit function
  const handleSubmit = async (values, { resetForm, setFieldError }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vendors/create-vendors`,
        values
      );

      setVendors((prev) => [response.data, ...prev]);
      toast.success("Vendor submitted successfully!");
      resetForm();
      setShowForm(false);
    } catch (error) {
      if (error.response && error.response.data.field === "email") {
        const errorMessage = "Vendor with this email already exists";
        setFieldError("email", errorMessage);
        toast.error(errorMessage);
      } else {
        console.error("Error submitting vendor:", error);
        toast.error(error.response?.data?.message || "Failed to submit vendor.");
      }
    }
  };

  const selectVendor = (vendorId) => {
    setSelectedVendor((prev) => (prev === vendorId ? null : vendorId));
  };

  // Export PDF
  // Export PDF
  const exportSelectedAsPDF = () => {
    if (!selectedVendor) {
      toast.warning("Please select a vendor to export");
      return;
    }
    const vendor = vendors.find((v) => v.vendorId === selectedVendor);

    const content = `
  <div style="font-family: 'Arial', sans-serif; padding: 30px; background: #fff; max-width: 800px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3f3f91; margin: 0; font-size: 28px; font-weight: bold;">Vendor Details</h1>
      <div style="height: 3px; background: linear-gradient(90deg, #3f3f91, #6a6ac5); width: 100px; margin: 10px auto;"></div>
    </div>
    
    <div style="border: 2px solid #3f3f91; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
      <div style="background: #3f3f91; padding: 15px; color: white;">
        <h2 style="margin: 0; font-size: 22px;">${vendor.vendorName || 'N/A'}</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${vendor.companyName || 'N/A'}</p>
      </div>
      
      <div style="padding: 25px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #3f3f91; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Contact Information</h3>
            
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Primary Email</div>
              <div>${vendor.email || 'N/A'}</div>
            </div>
            
            ${vendor.email2 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Secondary Email</div>
              <div>${vendor.email2}</div>
            </div>
            ` : ''}
            
            ${vendor.email3 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Tertiary Email</div>
              <div>${vendor.email3}</div>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Primary Contact</div>
              <div>${vendor.contactNumber || 'N/A'}</div>
            </div>
            
            ${vendor.contactNumber2 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Secondary Contact</div>
              <div>${vendor.contactNumber2}</div>
            </div>
            ` : ''}
            
            ${vendor.contactNumber3 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Tertiary Contact</div>
              <div>${vendor.contactNumber3}</div>
            </div>
            ` : ''}
          </div>
          
          <div>
            <h3 style="color: #3f3f91; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Company Details</h3>
            
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">GST Number</div>
              <div>${vendor.gstNumber || 'N/A'}</div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Address</div>
              <div>${vendor.address || 'N/A'}</div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #555; margin-bottom: 4px;">Created Date</div>
              <div>${new Date(vendor.createdAt || vendor._id?.getTimestamp()).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px; border: 1px dashed #ddd;">
          <div style="font-style: italic; color: #777;">Generated on ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  </div>`;

    const opt = {
      margin: 10,
      filename: `${vendor.vendorName}_details.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().from(content).set(opt).save();
  };

  // Export All Excel
  // Export All Excel - Updated to export filtered data when search is applied
  const exportAllAsExcel = () => {
    // Use filteredVendors instead of vendors when search is applied
    const dataToExport = filteredVendors.length > 0 ? filteredVendors : vendors;

    if (dataToExport.length === 0) {
      toast.warning("No vendors to export");
      return;
    }

    const data = dataToExport.map((vendor) => ({
      "Vendor Name": vendor.vendorName,
      "Company Name": vendor.companyName,
      "GST Number": vendor.gstNumber,
      "Primary Email": vendor.email,
      "Secondary Email": vendor.email2,
      "Tertiary Email": vendor.email3,
      "Primary Contact": vendor.contactNumber,
      "Secondary Contact": vendor.contactNumber2,
      "Tertiary Contact": vendor.contactNumber3,
      "Address": vendor.address,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");

    // Use appropriate filename based on whether filtered or all
    const fileName = debouncedSearch ? "filtered_vendors.xlsx" : "all_vendors.xlsx";
    XLSX.writeFile(workbook, fileName);
  };

  // Add these functions to your Vendor component
  const handleUpdateVendor = async (updatedVendor) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/vendors/update-vendor/${updatedVendor.vendorId}`,
        updatedVendor
      );

      setVendors(prev =>
        prev.map(v =>
          v.vendorId === updatedVendor.vendorId ? response.data : v
        )
      );
      toast.success("Vendor updated successfully!");
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error(error.response?.data?.message || "Error updating vendor");
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/vendors/delete-vendor/${vendorId}`
      );

      setVendors(prev =>
        prev.filter(v => v.vendorId !== vendorId)
      );
      setSelectedVendor(null);
      toast.success("Vendor deleted successfully!");
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error(error.response?.data?.message || "Error deleting vendor");
    }
  };

  const VendorModal = ({ vendor, onClose, onExport, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedVendor, setEditedVendor] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, []);

    useEffect(() => {
      if (vendor) {
        setEditedVendor({ ...vendor });
        setErrors({});
      }
    }, [vendor]);

    // Validation function for the modal form
    const validateForm = (values) => {
      const newErrors = {};

      // Required fields validation
      if (!values.vendorName) newErrors.vendorName = "Contact Person is required";
      else if (/^[0-9]+$/.test(values.vendorName)) newErrors.vendorName = "Contact Person cannot contain only numbers";

      if (!values.companyName) newErrors.companyName = "Company Name is required";
      else if (/^[0-9]+$/.test(values.companyName)) newErrors.companyName = "Company Name cannot contain only numbers";

      if (!values.email) newErrors.email = "Primary Email is required";
      else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email))
        newErrors.email = "Invalid email address";

      if (!values.contactNumber) newErrors.contactNumber = "Primary Contact is required";
      else if (!/^[0-9]+$/.test(values.contactNumber)) newErrors.contactNumber = "Must be only digits";
      else if (values.contactNumber.length !== 10) newErrors.contactNumber = "Must be exactly 10 digits";

      if (!values.gstNumber) newErrors.gstNumber = "GST Number is required";
      else if (!/^[0-9A-Z]+$/.test(values.gstNumber)) newErrors.gstNumber = "GST Number must contain only uppercase letters and digits";
      else if (values.gstNumber.length !== 15) newErrors.gstNumber = "GST number must be exactly 15 characters";

      if (!values.address) newErrors.address = "Address is required";

      // Optional fields validation
      if (values.email2 && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email2))
        newErrors.email2 = "Invalid email address";

      if (values.email3 && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email3))
        newErrors.email3 = "Invalid email address";

      if (values.contactNumber2 && !/^[0-9]*$/.test(values.contactNumber2))
        newErrors.contactNumber2 = "Must be only digits";
      else if (values.contactNumber2 && values.contactNumber2.length !== 10)
        newErrors.contactNumber2 = "Must be exactly 10 digits";

      if (values.contactNumber3 && !/^[0-9]*$/.test(values.contactNumber3))
        newErrors.contactNumber3 = "Must be only digits";
      else if (values.contactNumber3 && values.contactNumber3.length !== 10)
        newErrors.contactNumber3 = "Must be exactly 10 digits";

      return newErrors;
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setEditedVendor(prev => ({ ...prev, [name]: value }));

      // Validate the field in real-time
      const fieldErrors = validateForm({ ...editedVendor, [name]: value });
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    };

    const handleSave = async () => {
      const formErrors = validateForm(editedVendor);
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        toast.error("Please fix the errors before saving");
        return;
      }

      try {
        await onUpdate(editedVendor);
        setIsEditing(false);
        setErrors({});
      } catch (error) {
        console.error("Error updating vendor:", error);
      }
    };

    if (!vendor) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              {isEditing ? "Edit Vendor" : `Vendor Details: ${vendor.vendorName}`}
            </div>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="wo-details-grid">
              {/* Company Name */}
              <div className="detail-row">
                <span className="detail-label">Company Name *</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="text"
                      name="companyName"
                      value={editedVendor.companyName || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.companyName ? 'error' : ''}`}
                    />
                    {errors.companyName && <div className="error-message">{errors.companyName}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.companyName || 'N/A'}</span>
                )}
              </div>

              {/* Vendor Name */}
              <div className="detail-row">
                <span className="detail-label">Contact Person *</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="text"
                      name="vendorName"
                      value={editedVendor.vendorName || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.vendorName ? 'error' : ''}`}
                    />
                    {errors.vendorName && <div className="error-message">{errors.vendorName}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.vendorName}</span>
                )}
              </div>

              {/* GST Number */}
              <div className="detail-row">
                <span className="detail-label">GST Number *</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="text"
                      name="gstNumber"
                      value={editedVendor.gstNumber || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.gstNumber ? 'error' : ''}`}
                    />
                    {errors.gstNumber && <div className="error-message">{errors.gstNumber}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.gstNumber || 'N/A'}</span>
                )}
              </div>

              {/* Primary Email */}
              <div className="detail-row">
                <span className="detail-label">Primary Email *</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="email"
                      name="email"
                      value={editedVendor.email || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.email ? 'error' : ''}`}
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.email || 'N/A'}</span>
                )}
              </div>

              {/* Secondary Email */}
              <div className="detail-row">
                <span className="detail-label">Secondary Email</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="email"
                      name="email2"
                      value={editedVendor.email2 || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.email2 ? 'error' : ''}`}
                    />
                    {errors.email2 && <div className="error-message">{errors.email2}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.email2 || 'N/A'}</span>
                )}
              </div>

              {/* Tertiary Email */}
              <div className="detail-row">
                <span className="detail-label">Tertiary Email</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="email"
                      name="email3"
                      value={editedVendor.email3 || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.email3 ? 'error' : ''}`}
                    />
                    {errors.email3 && <div className="error-message">{errors.email3}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.email3 || 'N/A'}</span>
                )}
              </div>

              {/* Primary Contact */}
              <div className="detail-row">
                <span className="detail-label">Primary Contact *</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="text"
                      name="contactNumber"
                      value={editedVendor.contactNumber || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.contactNumber ? 'error' : ''}`}
                    />
                    {errors.contactNumber && <div className="error-message">{errors.contactNumber}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.contactNumber || 'N/A'}</span>
                )}
              </div>

              {/* Secondary Contact */}
              <div className="detail-row">
                <span className="detail-label">Secondary Contact</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="text"
                      name="contactNumber2"
                      value={editedVendor.contactNumber2 || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.contactNumber2 ? 'error' : ''}`}
                    />
                    {errors.contactNumber2 && <div className="error-message">{errors.contactNumber2}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.contactNumber2 || 'N/A'}</span>
                )}
              </div>

              {/* Tertiary Contact */}
              <div className="detail-row">
                <span className="detail-label">Tertiary Contact</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <input
                      type="text"
                      name="contactNumber3"
                      value={editedVendor.contactNumber3 || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.contactNumber3 ? 'error' : ''}`}
                    />
                    {errors.contactNumber3 && <div className="error-message">{errors.contactNumber3}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.contactNumber3 || 'N/A'}</span>
                )}
              </div>

              {/* Address */}
              <div className="detail-row">
                <span className="detail-label">Address *</span>
                {isEditing ? (
                  <div className="edit-field-container">
                    <textarea
                      name="address"
                      value={editedVendor.address || ''}
                      onChange={handleInputChange}
                      className={`edit-textarea ${errors.address ? 'error' : ''}`}
                      rows="3"
                    />
                    {errors.address && <div className="error-message">{errors.address}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{vendor.address || 'N/A'}</span>
                )}
              </div>

              {/* Created At */}
              <div className="detail-row">
                <span className="detail-label">Created At:</span>
                <span className="detail-value">
                  {new Date(vendor.createdAt || vendor._id?.getTimestamp()).toLocaleDateString()}
                </span>
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
              <p>Are you sure you want to delete {vendor.vendorName}? This action cannot be undone.</p>
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
                    onDelete(vendor.vendorId);
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
          <h2>Vendor List</h2>
          <div className="right-section">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons-group">
              <button className="export-all-btn" onClick={exportAllAsExcel}>
                <FaFileExcel /> Export All
              </button>
              <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                <FaPlus /> {showForm ? "Close" : "Add Vendor"}
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="form-container premium">
            <h2>Add Vendor</h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              <Form>
                {/* Vendor Name + Company Name */}
                <div className="form-row">

                  <div className="form-field">
                    <label><FaIdCard /> Company Name *</label>
                    <Field name="companyName" type="text" />
                    <ErrorMessage name="companyName" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaUserTie /> Contact Person *</label>
                    <Field name="vendorName" type="text" />
                    <ErrorMessage name="vendorName" component="div" className="error" />
                  </div>
                </div>

                {/* Desktop: Original email+contact rows (shown on desktop) */}
                <div className="form-row email-contact-row">
                  <div className="form-field">
                    <label><FaEnvelope /> Primary Email *</label>
                    <Field name="email" type="email" />
                    <ErrorMessage name="email" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaPhone /> Primary Contact *</label>
                    <Field name="contactNumber" type="text" />
                    <ErrorMessage name="contactNumber" component="div" className="error" />
                  </div>
                </div>

                <div className="form-row email-contact-row">
                  <div className="form-field">
                    <label><FaEnvelope /> Secondary Email</label>
                    <Field name="email2" type="email" />
                    <ErrorMessage name="email2" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaPhone /> Secondary Contact</label>
                    <Field name="contactNumber2" type="text" />
                    <ErrorMessage name="contactNumber2" component="div" className="error" />

                  </div>
                </div>

                <div className="form-row email-contact-row">
                  <div className="form-field">
                    <label><FaEnvelope /> Tertiary Email</label>
                    <Field name="email3" type="email" />
                    <ErrorMessage name="email3" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaPhone /> Tertiary Contact</label>
                    <Field name="contactNumber3" type="text" />
                    <ErrorMessage name="contactNumber3" component="div" className="error" />

                  </div>
                </div>

                {/* Mobile: Grouped email fields (hidden on desktop) */}
                <div className="email-fields-group">
                  <div className="form-field">
                    <label><FaEnvelope /> Primary Email *</label>
                    <Field name="email" type="email" />
                    <ErrorMessage name="email" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaEnvelope /> Secondary Email</label>
                    <Field name="email2" type="email" />
                    <ErrorMessage name="email2" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaEnvelope /> Tertiary Email</label>
                    <Field name="email3" type="email" />
                    <ErrorMessage name="email3" component="div" className="error" />
                  </div>
                </div>

                {/* Mobile: Grouped contact fields (hidden on desktop) */}
                <div className="contact-fields-group">
                  <div className="form-field">
                    <label><FaPhone /> Primary Contact *</label>
                    <Field name="contactNumber" type="text" />
                    <ErrorMessage name="contactNumber" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaPhone /> Secondary Contact</label>
                    <Field name="contactNumber2" type="text" />
                    <ErrorMessage name="contactNumber2" component="div" className="error" />

                  </div>
                  <div className="form-field">
                    <label><FaPhone /> Tertiary Contact</label>
                    <Field name="contactNumber3" type="text" />
                    <ErrorMessage name="contactNumber3" component="div" className="error" />

                  </div>
                </div>

                {/* GST + Address */}
                <div className="form-row">
                  <div className="form-field">
                    <label><FaIdCard /> GST Number *</label>
                    <Field name="gstNumber" type="text" />
                    <ErrorMessage name="gstNumber" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaMapMarkerAlt /> Address *</label>
                    <Field name="address" as="textarea" rows="3" />
                    <ErrorMessage name="address" component="div" className="error" />
                  </div>
                </div>

                <button type="submit">Submit</button>
              </Form>
            </Formik>
          </div>
        )}

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>GST No.</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVendors.map((vendor, index) => (
                <tr
                  key={vendor.vendorId || index}
                  className={selectedVendor === vendor.vendorId ? "selected" : ""}
                  onClick={() => selectVendor(vendor.vendorId)}
                >
                  <td>{vendor.vendorName}</td>
                  <td>{vendor.companyName}</td>
                  <td>{vendor.gstNumber}</td>
                  <td>{vendor.email}</td>
                  <td>{vendor.contactNumber}</td>
                  <td>{vendor.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {hasMoreVendors && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={loadMoreVendors}>
                Load More
              </button>
            </div>
          )}
        </div>

        {selectedVendor && (
          <VendorModal
            vendor={vendors.find(v => v.vendorId === selectedVendor)}
            onClose={() => setSelectedVendor(null)}
            onExport={exportSelectedAsPDF}
            onUpdate={handleUpdateVendor}
            onDelete={handleDeleteVendor}
          />
        )}
      </div>
    </Navbar>
  );
};

export default Vendor;