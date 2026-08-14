import React, { useState, useEffect, useRef, useMemo } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import { FaPlus, FaFileExport, FaFileExcel, FaSearch, FaTrash, FaEdit, FaSave } from "react-icons/fa";
import Navbar from "../../Components/Sidebar/Navbar";
import html2pdf from "html2pdf.js";
import BOMPrint from "./BOMPrint";
import "react-toastify/dist/ReactToastify.css";
import "./Bom.scss";
import axios from "axios";
import * as XLSX from "xlsx";
import Select from 'react-select';

const Bom = () => {
  const [boms, setBoms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [isEditingBOM, setIsEditingBOM] = useState(false);
  const [editedBOM, setEditedBOM] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const loaderTimeoutRef = useRef(null);

  // Add these near your other state declarations
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (loaderTimeoutRef.current) clearTimeout(loaderTimeoutRef.current);

    if (searchTerm.trim()) {
      loaderTimeoutRef.current = setTimeout(() => {
        setShowLoader(true);
      }, 300);

      const searchTimeout = setTimeout(() => {
        if (loaderTimeoutRef.current) clearTimeout(loaderTimeoutRef.current);
        setDebouncedSearch(searchTerm.trim().toLowerCase());
        setCurrentPage(1); // Reset to first page when search changes
        setShowLoader(false);
      }, 300);

      return () => {
        clearTimeout(searchTimeout);
        if (loaderTimeoutRef.current) clearTimeout(loaderTimeoutRef.current);
        setShowLoader(false);
      };
    } else {
      setDebouncedSearch("");
      setCurrentPage(1); // Reset to first page when search is cleared
      setShowLoader(false);
    }
  }, [searchTerm]);

  // Fetch Items
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/items/get-items`);
        const sortedItems = response.data.sort(
          (a, b) =>
            new Date(b.createdAt || b.date || Date.now()) -
            new Date(a.createdAt || a.date || Date.now())
        );
        setItems(sortedItems);
      } catch (error) {
        toast.error("Failed to fetch items");
        console.error("Error fetching items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Fetch BOMs
  useEffect(() => {
    const fetchBOMs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/bom/get-boms`);
        // Sort by createdAt date (newest first)
        const sortedBOMs = response.data.data.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBoms(sortedBOMs);
      } catch (error) {
        toast.error("Failed to fetch BOMs");
        console.error("Error fetching BOMs:", error);
      }
    };
    fetchBOMs();
  }, []);

  // Initial values
  const initialValues = {
    productName: "",
    description: "",
    hsnCode: "",
    items: [
      {
        itemId: "",
        itemName: "",
        itemDescription: "",
        requiredQty: 0,
      },
    ],
  };

  // Validation schema
  // Validation schema
  const validationSchema = Yup.object({
    productName: Yup.string()
      .required("Product Name is required")
      .matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$/, "Product Name must contain at least one letter and can include numbers"),
    description: Yup.string().required("Description is required"),
    hsnCode: Yup.string()
      .required("HSN Code is required")
      .matches(/^\d+$/, "HSN Code must contain only numbers"),
    items: Yup.array()
      .of(
        Yup.object({
          itemId: Yup.string().required("Item selection is required"),
          itemName: Yup.string().required("Item name is required"),
          requiredQty: Yup.number()
            .required("Required quantity is required")
            .moreThan(0, "Required quantity must be more than 0")
            .typeError("Required quantity must be a number")
            .test(
              'is-decimal',
              'Required quantity can have up to 2 decimal places',
              value => value === undefined || /^\d+(\.\d{1,2})?$/.test(value)
            ),
        })
      )
      .min(1, "At least one item is required"),
  });

  // Filter BOMs
  const filteredBOMs = useMemo(() => {
    if (!debouncedSearch) return boms;

    return boms.filter(bom => {
      // Check BOM fields
      if (bom.productName?.toLowerCase().includes(debouncedSearch)) return true;
      if (bom.description?.toLowerCase().includes(debouncedSearch)) return true;
      if (bom.hsnCode?.toLowerCase().includes(debouncedSearch)) return true;

      // Check items
      if (bom.items?.some(item =>
        item.itemName?.toLowerCase().includes(debouncedSearch) ||
        item.itemDescription?.toLowerCase().includes(debouncedSearch)
      )) return true;

      return false;
    });
  }, [debouncedSearch, boms]);


  // Paginated BOMs
  const paginatedBOMs = useMemo(() => {
    // If searching, show all filtered results without pagination
    if (debouncedSearch) return filteredBOMs;

    // Otherwise, apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBOMs.slice(0, startIndex + itemsPerPage);
  }, [filteredBOMs, currentPage, itemsPerPage, debouncedSearch]);

  // Check if there are more BOMs to load
  const hasMoreBOMs = useMemo(() => {
    return debouncedSearch ? false : currentPage * itemsPerPage < filteredBOMs.length;
  }, [currentPage, itemsPerPage, filteredBOMs.length, debouncedSearch]);


  const loadMoreBOMs = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Get available items for selection (excluding already selected items)
  const getAvailableItems = (currentItems, currentIndex) => {
    return items
      .filter(item => {
        // Check if item is not already selected in other fields
        return !currentItems.some((selectedItem, idx) =>
          idx !== currentIndex && selectedItem.itemId === item.itemId
        );
      })
      .map(item => ({
        value: item.itemId,
        label: item.itemName,
        itemData: item
      }));
  };

  // Item select handler
  const handleItemSelect = (selectedOption, index, values, setFieldValue) => {
    if (selectedOption) {
      setFieldValue(`items.${index}.itemId`, selectedOption.value);
      setFieldValue(`items.${index}.itemName`, selectedOption.label);
      setFieldValue(`items.${index}.itemDescription`, selectedOption.itemData.description);
    } else {
      // Clear the field if no option is selected
      setFieldValue(`items.${index}.itemId`, "");
      setFieldValue(`items.${index}.itemName`, "");
      setFieldValue(`items.${index}.itemDescription`, "");
    }
  };

  // Submit handler
  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/bom/create-bom`,
        values
      );
      toast.success("BOM created successfully!");
      setBoms((prev) => [...prev, response.data.data]);
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving BOM:", error);
      toast.error("Failed to save BOM");
    } finally {
      setSubmitting(false);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!selectedBOM) return toast.warn("Select a BOM to export");
    const element = document.getElementById("bom-pdf");
    html2pdf().from(element).set({ filename: `${selectedBOM.productName}.pdf` }).save();
  };

  // Export Excel
  // Export Excel - Updated to export filtered data when search is applied
  const handleExportExcel = () => {
    // Use filteredBOMs instead of boms when search is applied
    const dataToExport = filteredBOMs.length > 0 ? filteredBOMs : boms;

    if (dataToExport.length === 0) {
      toast.warn("No BOMs to export");
      return;
    }

    // Create detailed data for export
    const data = dataToExport.map((bom) => {
      // Format items as a string for easier reading in Excel
      const itemsString = bom.items?.map(item =>
        `${item.itemName || 'N/A'} (Qty: ${item.requiredQty || 0})`
      ).join('; ') || 'No items';

      return {
        'BOM ID': bom.bomId || 'N/A',
        'Product Name': bom.productName || 'N/A',
        'Description': bom.description || 'N/A',
        'HSN Code': bom.hsnCode || 'N/A',
        'Total Items': bom.items?.length || 0,
        'Items Details': itemsString,
        'Created Date': new Date(bom.createdAt).toLocaleDateString(),
        'Status': 'Active'
      };
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // BOM ID
      { wch: 25 }, // Product Name
      { wch: 30 }, // Description
      { wch: 15 }, // HSN Code
      { wch: 12 }, // Total Items
      { wch: 50 }, // Items Details
      { wch: 15 }, // Created Date
      { wch: 10 }  // Status
    ];

    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOMs");

    // Use appropriate filename based on whether filtered or all
    const fileName = debouncedSearch ? "filtered_boms.xlsx" : "all_boms.xlsx";
    XLSX.writeFile(workbook, fileName);

    toast.success(`Exported ${dataToExport.length} BOMs with detailed information`);
  };

  // Add update and delete functions
  const handleUpdateBOM = async (updatedBOM) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/bom/update-bom/${updatedBOM.bomId}`,
        updatedBOM
      );

      setBoms(prev =>
        prev.map(bom =>
          bom.bomId === updatedBOM.bomId ? response.data.data : bom
        )
      );
      setSelectedBOM(response.data.data); // Update the selected BOM with the new data
      toast.success("BOM updated successfully!");
      return response.data.data;
    } catch (error) {
      console.error("Error updating BOM:", error);
      toast.error(error.response?.data?.message || "Error updating BOM");
      throw error;
    }
  };

  const handleDeleteBOM = async (bomId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/bom/delete-bom/${bomId}`
      );

      setBoms(prev => prev.filter(bom => bom.bomId !== bomId));
      setSelectedBOM(null);
      toast.success("BOM deleted successfully!");
    } catch (error) {
      console.error("Error deleting BOM:", error);
      toast.error(error.response?.data?.message || "Error deleting BOM");
    }
  };

  // Update BOMModal to include editing functionality
  const BOMModal = ({ bom, onClose, onExport, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedBOM, setEditedBOM] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, []);

    useEffect(() => {
      if (bom) {
        setEditedBOM({ ...bom });
        setErrors({});
      }
    }, [bom]);

    const validateField = (name, value) => {
      let error = "";

      if (name === "productName") {
        if (!value) {
          error = "Product Name is required";
        } else if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$/.test(value)) {
          error = "Product Name must contain at least one letter and can include numbers";
        }
      } else if (name === "description" && !value) {
        error = "Description is required";
      } else if (name === "hsnCode") {
        if (!value) {
          error = "HSN Code is required";
        } else if (!/^\d+$/.test(value)) {
          error = "HSN Code must contain only numbers";
        }

      } else if (name.startsWith("items.") && name.endsWith(".requiredQty")) {
        const index = parseInt(name.split(".")[1]);
        if (!value || isNaN(value) || value <= 0) {
          error = "Required quantity must be more than 0";
        }
      }

      return error;
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      const error = validateField(name, value);

      setEditedBOM(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleItemQtyChange = (index, value) => {
      const name = `items.${index}.requiredQty`;
      const error = validateField(name, value);

      setEditedBOM(prev => {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], requiredQty: Number(value) };
        return { ...prev, items: newItems };
      });

      setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validateForm = () => {
      const newErrors = {};

      // Validate productName
      if (!editedBOM.productName) {
        newErrors.productName = "Product Name is required";
      } else if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$/.test(editedBOM.productName)) {
        newErrors.productName = "Product Name must contain at least one letter and can include numbers";
      }

      // Validate hsnCode
      if (!editedBOM.description) {
        newErrors.description = "Description is required";
      }
      if (!editedBOM.hsnCode) {
        newErrors.hsnCode = "HSN Code is required";
      } else if (!/^\d+$/.test(editedBOM.hsnCode)) {
        newErrors.hsnCode = "HSN Code must contain only numbers";
      }

      // Validate items
      if (!editedBOM.items || editedBOM.items.length === 0) {
        newErrors.items = "At least one item is required";
      } else {
        editedBOM.items.forEach((item, index) => {
          if (!item.requiredQty || item.requiredQty <= 0) {
            newErrors[`items.${index}.requiredQty`] = "Required quantity must be more than 0";
          }
        });
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
      if (!validateForm()) {
        toast.error("Please fix the validation errors before saving");
        return;
      }

      try {
        const updatedBOM = await onUpdate(editedBOM);
        setEditedBOM(updatedBOM);
        setIsEditing(false);
        setErrors({});
      } catch (error) {
        console.error("Error updating BOM:", error);
      }
    };

    if (!bom) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              {isEditing ? "Edit BOM" : `BOM: ${bom.productName}`}
            </div>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="wo-details-grid">
              {/* BOM Details - Editable fields */}
              <div className="detail-row">
                <span className="detail-label">Product Name:</span>
                {isEditing ? (
                  <div className="field-wrapper">
                    <input
                      type="text"
                      name="productName"
                      value={editedBOM.productName || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.productName ? 'error' : ''}`}
                    />
                    {errors.productName && <div className="error-message">{errors.productName}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{bom.productName}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Description:</span>
                {isEditing ? (
                  <div className="field-wrapper">
                    <input
                      type="text"
                      name="description"
                      value={editedBOM.description || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.description ? 'error' : ''}`}
                    />
                    {errors.description && <div className="error-message">{errors.description}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{bom.description || 'N/A'}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">HSN Code:</span>
                {isEditing ? (
                  <div className="field-wrapper">
                    <input
                      type="text"
                      name="hsnCode"
                      value={editedBOM.hsnCode || ''}
                      onChange={handleInputChange}
                      className={`edit-input ${errors.hsnCode ? 'error' : ''}`}
                    />
                    {errors.hsnCode && <div className="error-message">{errors.hsnCode}</div>}
                  </div>
                ) : (
                  <span className="detail-value">{bom.hsnCode || 'N/A'}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">BOM ID:</span>
                <span className="detail-value">{bom.bomId}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Created At:</span>
                <span className="detail-value">
                  {new Date(bom.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Items Section - Only Required Qty is editable */}
              <div className="section-header">Components</div>
              <div className="items-grid">
                {bom.items?.map((item, index) => (
                  <div key={index} className="item-card">
                    <div className="item-header">
                      <span className="item-name">{item.itemName}</span>
                    </div>
                    <div className="item-details">
                      <span>Description: {item.itemDescription || 'N/A'}</span>
                      <div className="quantity-control">
                        <span>Required Qty: </span>
                        {isEditing ? (
                          <div className="field-wrapper">
                            <input
                              type="number"
                              min="0"
                              step="0.01" // Allow decimal values
                              value={editedBOM.items?.[index]?.requiredQty || item.requiredQty}
                              onChange={(e) => handleItemQtyChange(index, e.target.value)}
                              className={`qty-input ${errors[`items.${index}.requiredQty`] ? 'error' : ''}`}
                            />
                            {errors[`items.${index}.requiredQty`] && (
                              <div className="error-message">{errors[`items.${index}.requiredQty`]}</div>
                            )}
                          </div>
                        ) : (
                          <span>{item.requiredQty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
              <p>Are you sure you want to delete BOM {bom.productName}? This action cannot be undone.</p>
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
                    onDelete(bom.bomId);
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
          <h2>Bill of Material (BOM)</h2>
          <div className="right-section">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search BOMs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons-group">
              <button className="export-all-btn" onClick={handleExportExcel}>
                <FaFileExcel /> Export All
              </button>
              <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                <FaPlus /> {showForm ? "Close BOM" : "Create BOM"}
              </button>
            </div>
          </div>
        </div>

        {isLoading && <div className="loading">Loading items...</div>}

        {showForm && (
          <div className="form-container premium">
            <h2>Create BOM</h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              validateOnBlur={false}
              validateOnChange={false}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue, errors, touched, submitCount }) => {
                // Show toast errors when submit is attempted
                useEffect(() => {
                  if (submitCount > 0 && Object.keys(errors).length > 0) {
                    // Show general errors first
                    if (errors.productName) toast.error(errors.productName);
                    if (errors.description) toast.error(errors.description); // Add this line
                    if (errors.hsnCode) toast.error(errors.hsnCode);

                    // Show items array validation error (like min 1 item)
                    if (typeof errors.items === 'string') {
                      toast.error(errors.items);
                    }

                    if (Array.isArray(errors.items)) {
                      errors.items.forEach((itemError, index) => {
                        if (itemError?.itemName)
                          toast.error(`Item ${index + 1}: ${itemError.itemName}`);
                        if (itemError?.requiredQty)
                          toast.error(`Item ${index + 1}: ${itemError.requiredQty}`);
                      });
                    }
                  }
                }, [submitCount, errors]);

                return (
                  <Form>
                    <div className="form-group-row">
                      <div className="grn-field-wrapper">
                        <label>Product Name *</label>
                        <Field
                          name="productName"
                          className={errors.productName && touched.productName ? 'error' : ''}
                        />
                        {errors.productName && touched.productName && (
                          <div className="error-message">{errors.productName}</div>
                        )}
                      </div>
                      <div className="grn-field-wrapper">
                        <label>Description *</label>
                        <Field name="description"
                          className={errors.description && touched.description ? 'error' : ''}
                        />
                        {errors.description && touched.description && (
                          <div className="error-message">{errors.description}</div>
                        )}
                      </div>
                      <div className="grn-field-wrapper">
                        <label>HSN/SAC Code *</label>
                        <Field
                          name="hsnCode"
                          className={errors.hsnCode && touched.hsnCode ? 'error' : ''}
                        />
                        {errors.hsnCode && touched.hsnCode && (
                          <div className="error-message">{errors.hsnCode}</div>
                        )}
                      </div>
                    </div>

                    <FieldArray name="items">
                      {({ remove, push }) => (
                        <div className="form-items">
                          {values.items.map((item, index) => {
                            const itemError = errors.items && errors.items[index];
                            const itemTouched = touched.items && touched.items[index];

                            return (
                              <div className="item-row" key={index}>
                                <div className="field-wrapper">
                                  <label>Item Name</label>
                                  <Select
                                    className={`react-select-container ${itemError?.itemId ? 'error' : ''}`}
                                    classNamePrefix="react-select"
                                    options={getAvailableItems(values.items, index)}
                                    onChange={(selectedOption) => handleItemSelect(selectedOption, index, values, setFieldValue)}
                                    value={items.find(i => i.itemId === item.itemId) ? {
                                      value: item.itemId,
                                      label: item.itemName,
                                      itemData: items.find(i => i.itemId === item.itemId)
                                    } : null}
                                    placeholder="Items"
                                    isSearchable={true}
                                    noOptionsMessage={() => "No items found"}
                                  />
                                  {itemError?.itemId && itemTouched?.itemId && (
                                    <div className="error-message">{itemError.itemId}</div>
                                  )}
                                </div>

                                <div className="field-wrapper">
                                  <label>Description</label>
                                  <Field
                                    name={`items.${index}.itemDescription`}
                                    placeholder="Description"
                                  />
                                </div>
                                <div className="field-wrapper">
                                  <label>Required Qty</label>
                                  <Field
                                    name={`items.${index}.requiredQty`}
                                    type="number"
                                    step="0.01" // Allow decimal values
                                    placeholder="Required Qty"
                                    className={itemError?.requiredQty && itemTouched?.requiredQty ? 'error' : ''}
                                  />
                                  {itemError?.requiredQty && itemTouched?.requiredQty && (
                                    <div className="error-message">{itemError.requiredQty}</div>
                                  )}
                                </div>
                                <div>
                                  <label style={{ opacity: 0 }}>Delete</label>
                                  {/* Only show delete button if there's more than 1 item */}
                                  {values.items.length > 1 && (
                                    <button
                                      type="button"
                                      className="remove-btn"
                                      onClick={() => remove(index)}
                                    >
                                      <FaTrash />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            className="add-btn"
                            onClick={() =>
                              push({
                                itemId: "",
                                itemName: "",
                                itemDescription: "",
                                requiredQty: 0,
                              })
                            }
                          >
                            + Add Item
                          </button>
                        </div>
                      )}
                    </FieldArray>

                    <button type="submit">Submit BOM</button>
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
                <th>Product</th>
                <th>Description</th>
                <th>Items Count</th>
              </tr>
            </thead>
            <tbody>
              {showLoader ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="table-loader"></div>
                  </td>
                </tr>
              ) : (
                paginatedBOMs.map((bom) => (
                  <tr
                    key={bom.bomId}
                    onClick={() => setSelectedBOM(bom)}
                    className={selectedBOM?.bomId === bom.bomId ? "selected" : ""}
                  >
                    <td>{bom.productName}</td>
                    <td>{bom.description}</td>
                    <td>{bom.items?.length || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {hasMoreBOMs && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={loadMoreBOMs}>
                Load More
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "none" }}>
          {selectedBOM && <BOMPrint bom={selectedBOM} />}
        </div>

        {selectedBOM && (
          <BOMModal
            bom={selectedBOM}
            onClose={() => setSelectedBOM(null)}
            onExport={handleExportPDF}
            onUpdate={handleUpdateBOM}
            onDelete={handleDeleteBOM}
          />
        )}
      </div>
    </Navbar>
  );
};

export default Bom;