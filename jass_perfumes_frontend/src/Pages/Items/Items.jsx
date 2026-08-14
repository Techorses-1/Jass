import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../Components/Sidebar/Navbar";
import {
  FaCubes,
  FaBarcode,
  FaHashtag,
  FaDollarSign,
  FaPercent,
  FaPlus,
  FaFileExport,
  FaFileExcel,
  FaSearch,
  FaEdit,
  FaSave,
  FaTrash,
  FaUpload,
  FaFileDownload,
  FaRupeeSign
} from "react-icons/fa";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import "../Form/Form.scss";
import "./Items.scss";
import "react-toastify/dist/ReactToastify.css";
import { TAX_SLABS } from "../../Components/TaxSlab/Taxslab";



const Items = () => {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [categories, setCategories] = useState([]);

  // Price editing states (same pattern as discount page)
  const [editingPrices, setEditingPrices] = useState({});
  const [originalPrices, setOriginalPrices] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);



  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const initialValues = {
    productName: "",
    barcode: "",
    hsnCode: "",
    taxSlab: "",
    price: "",
    category: ""
  };


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/categories`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  const validationSchema = Yup.object({
    productName: Yup.string().required("Product Name is required"),
    barcode: Yup.string().required("Barcode is required"),
    hsnCode: Yup.string().required("HSN Code is required"),
    taxSlab: Yup.string().required("Tax Slab is required"),
    price: Yup.number()
      .required("Price is required")
      .min(0, "Price cannot be negative"),
    category: Yup.string().required("Category is required")
  });

  // Fetch items
  useEffect(() => {
    setIsLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/products/get-products`)
      .then((res) => {
        const sortedData = res.data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt)
            : (a._id?.getTimestamp ? new Date(a._id.getTimestamp()) : new Date(0));
          const dateB = b.createdAt ? new Date(b.createdAt)
            : (b._id?.getTimestamp ? new Date(b._id.getTimestamp()) : new Date(0));
          return dateB - dateA;
        });
        setItems(sortedData);

        // Initialize editing prices
        const initialEditingState = {};
        const initialOriginalState = {};
        sortedData.forEach(item => {
          initialEditingState[item.productId] = item.price || 0;
          initialOriginalState[item.productId] = item.price || 0;
        });
        setEditingPrices(initialEditingState);
        setOriginalPrices(initialOriginalState);

        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching items:", err);
        toast.error("Failed to load items.");
        setIsLoading(false);
      });
  }, []);

  // Filter items by productName, barcode
  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((item) =>
      item.productName?.toLowerCase().includes(debouncedSearch) ||
      item.hsnCode?.toLowerCase().includes(debouncedSearch) ||
      item.barcode?.toLowerCase().includes(debouncedSearch) ||
      item.category?.toLowerCase().includes(debouncedSearch) ||
      item.price?.toString().includes(debouncedSearch)
    );
  }, [debouncedSearch, items]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    if (debouncedSearch) return filteredItems;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(0, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage, debouncedSearch]);

  // Check if there are more items to load
  const hasMoreItems = useMemo(() => {
    return debouncedSearch ? false : currentPage * itemsPerPage < filteredItems.length;
  }, [currentPage, itemsPerPage, filteredItems.length, debouncedSearch]);

  // Load more items
  const loadMoreItems = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Check for unsaved price changes
  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(editingPrices).some(productId =>
      editingPrices[productId] !== originalPrices[productId]
    );
  }, [editingPrices, originalPrices]);

  // Handle price change
  const handlePriceChange = (productId, value) => {
    const priceValue = Math.max(parseFloat(value) || 0, 0);

    setEditingPrices(prev => ({
      ...prev,
      [productId]: priceValue
    }));
  };

  // Save price for a product
  const savePrice = async (productId) => {
    try {
      setIsSaving(true);
      const newPrice = editingPrices[productId];
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/update-price/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ price: newPrice }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update price");
      }

      // Update local state
      setItems(prev =>
        prev.map(item =>
          item.productId === productId
            ? { ...item, price: newPrice }
            : item
        )
      );

      // Update original prices
      setOriginalPrices(prev => ({
        ...prev,
        [productId]: newPrice
      }));

      toast.success("Price updated successfully!");
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error(error.message || "Error updating price");

      // Revert to original value on error
      const originalPrice = originalPrices[productId] || 0;
      setEditingPrices(prev => ({
        ...prev,
        [productId]: originalPrice
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // Save all prices
  const saveAllPrices = async () => {
    try {
      setIsSavingAll(true);
      const token = localStorage.getItem('token');

      // Find which prices have been changed
      const changedPrices = [];

      Object.keys(editingPrices).forEach(productId => {
        const currentPrice = editingPrices[productId];
        const originalPrice = originalPrices[productId] || 0;

        if (currentPrice !== originalPrice) {
          changedPrices.push({
            productId,
            price: currentPrice
          });
        }
      });

      if (changedPrices.length === 0) {
        toast.info("No changes to save");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/bulk-update-prices`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prices: changedPrices }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update prices");
      }

      const result = await response.json();

      // Update local state with new prices
      setItems(prev =>
        prev.map(item => {
          const updatedPrice = changedPrices.find(
            priceItem => priceItem.productId === item.productId
          );
          return updatedPrice
            ? { ...item, price: updatedPrice.price }
            : item;
        })
      );

      // Update original prices to match current ones
      setOriginalPrices(prev => ({
        ...prev,
        ...changedPrices.reduce((acc, item) => {
          acc[item.productId] = item.price;
          return acc;
        }, {})
      }));

      toast.success(`Successfully updated ${changedPrices.length} prices!`);
    } catch (error) {
      console.error("Error saving all prices:", error);
      toast.error(error.message || "Error saving prices");
    } finally {
      setIsSavingAll(false);
    }
  };

  // Navigation guard for unsaved changes
  const handleNavigation = useCallback((path) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedAlert(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate]);

  // Handle unsaved changes alert actions
  const handleUnsavedAlertAction = async (action) => {
    if (action === 'save') {
      await saveAllPrices();
      setShowUnsavedAlert(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    } else if (action === 'cancel') {
      // Revert all changes
      setEditingPrices(originalPrices);
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

  const handleSubmit = async (values, { resetForm, setFieldError }) => {
    setIsSubmitting(true);
    try {


      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;


      const payload = {
        ...values,
        taxSlab: Number(values.taxSlab),
        price: Number(values.price),
        discount: 0,
        userDetails: user ? {
          userId: user.userId,
          name: user.name,
          email: user.email
        } : null
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/create-product`,
        payload
      );

      const newProduct = response.data;
      setItems((prev) => [newProduct, ...prev]);

      // Initialize price for new product
      setEditingPrices(prev => ({
        ...prev,
        [newProduct.productId]: newProduct.price || 0
      }));
      setOriginalPrices(prev => ({
        ...prev,
        [newProduct.productId]: newProduct.price || 0
      }));

      toast.success("Product submitted successfully!");
      resetForm();
      setShowForm(false);
    } catch (error) {
      if (error.response && error.response.data.field === "productName") {
        const errorMessage = "Product with this name already exists";
        setFieldError("productName", errorMessage);
        toast.error(errorMessage);
      } else if (error.response && error.response.data.field === "barcode") {
        const errorMessage = "Product with this barcode already exists";
        setFieldError("barcode", errorMessage);
        toast.error(errorMessage);
      } else {
        console.error("Error saving product:", error);
        toast.error(error.response?.data?.message || "Failed to submit product.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectItem = (productId) => {
    setSelectedItem(prev => prev === productId ? null : productId);
  };

  const exportSelectedAsPDF = () => {
    if (!selectedItem) {
      toast.warning("Please select a product to export");
      return;
    }

    const item = items.find(i => i.productId === selectedItem);

    const content = `
    <div style="font-family: 'Arial', sans-serif; padding: 30px; background: #fff;">
      <h1 style="color: #3f3f91; text-align: center; margin-bottom: 20px; font-size: 24px;">
        Product Details
      </h1>

      <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
        <h2 style="color: #3f3f91; margin-bottom: 15px; font-size: 20px;">
         <strong>Product Name:</strong> ${item.productName}
        </h2>
        <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 15px;" />
        <p style="margin: 10px 0; font-size: 14px;">
          <strong>Category:</strong> ${item.category} 
        </p>

        <p style="margin: 10px 0; font-size: 14px;">
          <strong>Barcode:</strong> ${item.barcode}
        </p>
        <p style="margin: 10px 0; font-size: 14px;">
          <strong>HSN Code:</strong> ${item.hsnCode}
        </p>
        <p style="margin: 10px 0; font-size: 14px;">
          <strong>Tax Slab:</strong> ${item.taxSlab}%
        </p>
        <p style="margin: 10px 0; font-size: 14px;">
          <strong>Price:</strong> ₹${item.price.toFixed(2)}
        </p>
      </div>
    </div>
  `;

    const opt = {
      margin: 10,
      filename: `${item.productName}_details.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(content).set(opt).save();
  };

  const exportAllAsExcel = () => {
    const dataToExport = filteredItems.length > 0 ? filteredItems : items;

    if (dataToExport.length === 0) {
      toast.warning("No products to export");
      return;
    }

    const data = dataToExport.map(item => ({
      "Product Name": item.productName,
      "Category": item.category,
      "Barcode": item.barcode,
      "HSN Code": item.hsnCode,
      "Tax Slab": `${item.taxSlab}%`,
      "Price": `₹${item.price.toFixed(2)}`
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const fileName = debouncedSearch ? "filtered_products.xlsx" : "all_products.xlsx";
    XLSX.writeFile(workbook, fileName);
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      const { productId, _id, createdAt, updatedAt, ...itemData } = updatedItem;

      // Get user from localStorage
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/products/update-product/${updatedItem.productId}`,
        {
          ...itemData,
          // ADD THIS - Send user details
          userDetails: user ? {
            userId: user.userId,
            name: user.name,
            email: user.email
          } : null
        }
      );

      // Update editing prices if price was changed
      if (updatedItem.price !== undefined) {
        setEditingPrices(prev => ({
          ...prev,
          [updatedItem.productId]: updatedItem.price
        }));
        setOriginalPrices(prev => ({
          ...prev,
          [updatedItem.productId]: updatedItem.price
        }));
      }

      toast.success("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.response?.data?.message || "Error updating product");
    }
  };

  const handleDeleteItem = async (productId) => {
    try {


      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;


      await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/delete-product/${productId}`,
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


      setItems(prev =>
        prev.filter(item => item.productId !== productId)
      );

      // Remove from editing states
      setEditingPrices(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });

      setOriginalPrices(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });

      setSelectedItem(null);
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.response?.data?.message || "Error deleting product");
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Product Name": "Example Product",
        "Barcode": "1234567890123",
        "HSN Code": "123456",
        "Tax Slab": "18",
        "Price": "29.99",
        "Category": "Electronics"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products Template");
    XLSX.writeFile(workbook, "products_template.xlsx");
  };

  const handleBulkUpload = (event) => {
    setIsBulkUploading(true);
    const file = event.target.files[0];
    if (!file) {
      setIsBulkUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("No data found in the file");
        setIsBulkUploading(false);
        return;
      }

      // Get valid category names from database
      const validCategoryNames = categories.map(cat => cat.name.toLowerCase());

      // Prepare data for bulk upload with validation
      const productsData = jsonData.map((item, index) => {
        const productName = item['Product Name']?.toString().trim() || null;
        const category = item['Category']?.toString().trim()?.toLowerCase() || null;
        const barcode = item['Barcode'] ? item['Barcode'].toString().trim() : null;
        const hsnCode = item['HSN Code']?.toString().trim() || '00';
        const taxSlab = item['Tax Slab'] ? Number(item['TaxSlab']) : 0;
        const price = item['Price'] ? Number(item['Price']) : 0;

        // Validate category
        const isValidCategory = category && validCategoryNames.includes(category.toLowerCase());

        return {
          productName,
          category: isValidCategory ? category : null,
          barcode,
          hsnCode,
          taxSlab: isNaN(taxSlab) ? 0 : taxSlab,
          price: isNaN(price) ? 0 : price,
          discount: 0,
          isValid: !!(productName && isValidCategory),
          validationError: !productName ? 'Missing product name' :
            !category ? 'Missing category' :
              !isValidCategory ? `Invalid category "${category}". Available: ${validCategoryNames.join(', ')}` : null
        };
      });

      // Separate valid and invalid products
      const validProducts = productsData.filter(product => product.isValid);
      const invalidProducts = productsData.filter(product => !product.isValid);

      // Show warnings for invalid products
      if (invalidProducts.length > 0) {
        const errorMessages = invalidProducts.map((product, index) =>
          `Row ${index + 2}: ${product.validationError} - "${product.productName || 'No Name'}"`
        ).join('\n');

        toast.warning(
          <div>
            <strong>{invalidProducts.length} products failed validation:</strong>
            <br />
            {errorMessages.split('\n').map((line, i) => (
              <div key={i} style={{ fontSize: '12px', marginTop: '2px' }}>{line}</div>
            ))}
          </div>,
          { autoClose: 10000 }
        );
      }

      if (validProducts.length === 0) {
        toast.error("No valid products found to upload. Please check your file.");
        setIsBulkUploading(false);
        return;
      }

      // Prepare final payload
      const uploadPayload = {
        products: validProducts.map(product => ({
          productName: product.productName,
          category: product.category,
          barcode: product.barcode,
          hsnCode: product.hsnCode,
          taxSlab: product.taxSlab,
          price: product.price,
          discount: product.discount
        })),
        // ADD THIS - Send user details for bulk upload
        userDetails: user ? {
          userId: user.userId,
          name: user.name,
          email: user.email
        } : null
      };

      // Show confirmation before upload
      const shouldUpload = window.confirm(
        `Found ${validProducts.length} valid products and ${invalidProducts.length} invalid products.\n\nDo you want to upload the ${validProducts.length} valid products?`
      );

      if (!shouldUpload) {
        setIsBulkUploading(false);
        return;
      }

      // Send bulk upload request
      axios.post(
        `${import.meta.env.VITE_API_URL}/products/bulk-upload-products`,
        uploadPayload
      )
        .then(response => {
          const data = response.data;

          // Handle different response structures safely
          const successful = data.successful || [];
          const failed = data.failed || [];
          const summary = data.summary || {
            total: (successful.length + failed.length),
            successful: successful.length,
            failed: failed.length
          };

          console.log("Bulk upload response:", data); // Debug log

          // Show comprehensive results
          if (successful.length > 0) {
            toast.success(`Successfully uploaded ${successful.length} products!`);
          }

          // Show ALL failed products - both validation errors and backend errors
          const allFailedProducts = [...invalidProducts, ...failed];

          if (allFailedProducts.length > 0) {
            const failedMessages = allFailedProducts.map((fail, index) => {
              let productName = 'Unknown Product';
              let reason = 'Unknown error';

              // Handle validation errors (from frontend)
              if (fail.validationError) {
                productName = fail.productName || 'No Name';
                reason = fail.validationError;
              }
              // Handle backend errors
              else if (fail.reason || fail.message) {
                productName = fail.product?.productName || fail.productName || 'Unknown Product';
                reason = fail.reason || fail.message;
              }
              // Handle field-specific errors
              else if (fail.field) {
                productName = fail.product?.productName || 'Unknown Product';
                reason = `${fail.field}: ${fail.reason || 'Validation failed'}`;
              }

              return `❌ ${productName} - ${reason}`;
            }).join('\n');

            // Create a detailed error modal instead of toast for better visibility
            const shouldShowDetails = window.confirm(
              `${allFailedProducts.length} products failed to upload.\n\n` +
              `Successful: ${successful.length}\n` +
              `Failed: ${allFailedProducts.length}\n\n` +
              `Click OK to see detailed error messages for all failed products.`
            );

            if (shouldShowDetails) {
              // Show detailed errors in alert with scrollable content
              const errorWindow = window.open('', 'Upload Errors', 'width=800,height=600');
              errorWindow.document.write(`
        <html>
          <head>
            <title>Bulk Upload Errors</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #d32f2f; }
              .error-list { max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
              .error-item { padding: 5px; border-bottom: 1px solid #eee; }
              .product-name { font-weight: bold; color: #333; }
              .error-reason { color: #d32f2f; margin-left: 10px; }
              .summary { background: #f5f5f5; padding: 10px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>📊 Bulk Upload Results</h1>
            <div class="summary">
              <strong>Summary:</strong><br>
              ✅ Successful: ${successful.length}<br>
              ❌ Failed: ${allFailedProducts.length}<br>
              📦 Total Processed: ${summary.total}
            </div>
            <h2>Failed Products:</h2>
            <div class="error-list">
              ${allFailedProducts.map((fail, index) => {
                let productName = 'Unknown Product';
                let reason = 'Unknown error';

                if (fail.validationError) {
                  productName = fail.productName || 'No Name';
                  reason = fail.validationError;
                } else if (fail.reason || fail.message) {
                  productName = fail.product?.productName || fail.productName || 'Unknown Product';
                  reason = fail.reason || fail.message;
                } else if (fail.field) {
                  productName = fail.product?.productName || 'Unknown Product';
                  reason = `${fail.field}: ${fail.reason || 'Validation failed'}`;
                }

                return `
                  <div class="error-item">
                    <span class="product-name">${index + 1}. ${productName}</span>
                    <span class="error-reason">${reason}</span>
                  </div>
                `;
              }).join('')}
            </div>
            <br>
            <button onclick="window.print()">Print Errors</button>
            <button onclick="window.close()">Close</button>
          </body>
        </html>
      `);
              errorWindow.document.close();
            }
          }

          // Show summary toast
          if (data.message) {
            toast.info(data.message, { autoClose: 5000 });
          } else {
            toast.info(`Upload completed: ${summary.successful} successful, ${summary.failed} failed`, { autoClose: 5000 });
          }

          // Refresh the products list if any were successful
          if (successful.length > 0) {
            axios.get(`${import.meta.env.VITE_API_URL}/products/get-products`)
              .then((res) => {
                const sortedData = res.data.sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt)
                    : (a._id?.getTimestamp ? new Date(a._id.getTimestamp()) : new Date(0));
                  const dateB = b.createdAt ? new Date(b.createdAt)
                    : (b._id?.getTimestamp ? new Date(b._id.getTimestamp()) : new Date(0));
                  return dateB - dateA;
                });
                setItems(sortedData);

                // Initialize editing prices for new products
                const newEditingState = { ...editingPrices };
                const newOriginalState = { ...originalPrices };
                sortedData.forEach(item => {
                  if (!newEditingState[item.productId]) {
                    newEditingState[item.productId] = item.price || 0;
                    newOriginalState[item.productId] = item.price || 0;
                  }
                });
                setEditingPrices(newEditingState);
                setOriginalPrices(newOriginalState);
              })
              .catch(err => {
                console.error("Error refreshing products:", err);
              });
          }

          setShowBulkUpload(false);
        })
        .catch(error => {
          console.error("Error in bulk upload:", error);

          if (error.response?.data?.message) {
            toast.error(`Upload failed: ${error.response.data.message}`);
          } else if (error.response?.data?.errors) {
            const serverErrors = error.response.data.errors;
            const errorMessage = serverErrors.map(err =>
              `${err.field}: ${err.message}`
            ).join(', ');
            toast.error(`Validation errors: ${errorMessage}`);
          } else {
            toast.error("Failed to process bulk upload. Please check your file format.");
          }

          setShowBulkUpload(false);
        })
        .finally(() => {
          setIsBulkUploading(false);
        });
    };
    reader.readAsArrayBuffer(file);
  };

  const ItemModal = ({ item, onClose, onExport, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedItem, setEditedItem] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, []);

    useEffect(() => {
      if (item) {
        setEditedItem({ ...item });
      }
    }, [item]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;

      if (name === 'taxSlab' || name === 'price') {
        setEditedItem(prev => ({ ...prev, [name]: Number(value) }));
      } else {
        setEditedItem(prev => ({ ...prev, [name]: value }));
      }
    };

    const handleSave = async () => {
      if (!editedItem.price || editedItem.price < 0) {
        toast.error("Price cannot be negative");
        return;
      }

      if (!editedItem.productName || !editedItem.barcode || !editedItem.hsnCode || !editedItem.taxSlab) {
        toast.error("All fields are required");
        return;
      }

      try {
        await onUpdate(editedItem);
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating product:", error);
      }
    };

    if (!item) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              {isEditing ? "Edit Product" : `Product Details: ${item.productName}`}
            </div>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="wo-details-grid">
              <div className="detail-row">
                <span className="detail-label">Product Name:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="productName"
                    value={editedItem.productName || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <span className="detail-value">{item.productName}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Category:</span>
                {isEditing ? (
                  <select
                    name="category"
                    value={editedItem.category || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category, index) => (
                      <option key={category.categoryId || index} value={category.name}>
                        {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">
                    {editedItem.category ? editedItem.category.charAt(0).toUpperCase() + editedItem.category.slice(1) : 'N/A'}
                  </span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Barcode:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="barcode"
                    value={editedItem.barcode || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <span className="detail-value">{item.barcode}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">HSN Code:</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="hsnCode"
                    value={editedItem.hsnCode || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <span className="detail-value">{item.hsnCode}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Tax Slab:</span>
                {isEditing ? (
                  <select
                    name="taxSlab"
                    value={editedItem.taxSlab || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                  >
                    <option value="">Select Tax Slab</option>
                    {TAX_SLABS.map((slab, index) => (
                      <option key={index} value={slab.value}>
                        {slab.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="detail-value">{item.taxSlab}%</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Price:</span>
                {isEditing ? (
                  <input
                    type="number"
                    name="price"
                    value={editedItem.price || ''}
                    onChange={handleInputChange}
                    className="edit-input"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <span className="detail-value">₹{item.price?.toFixed(2)}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Created At:</span>
                <span className="detail-value">
                  {new Date(item.createdAt || item._id?.getTimestamp()).toLocaleDateString()}
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

        {showDeleteConfirm && (
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete {item.productName}? This action cannot be undone.</p>
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
                    onDelete(item.productId);
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

  const BulkUploadModal = ({ onClose, onUpload, onDownloadTemplate, isUploading }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const handleFileSelect = (file) => {
      if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel')) {
        const event = { target: { files: [file] } };
        onUpload(event);
      } else {
        toast.error("Please select a valid Excel file (.xlsx)");
      }
    };

    return (
      <div className="modal-overlay" onClick={isUploading ? undefined : onClose}>
        <div className="modal-content bulk-upload-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">Bulk Upload Products</div>
            {!isUploading && (
              <button className="modal-close" onClick={onClose}>
                &times;
              </button>
            )}
          </div>

          <div className="modal-body">
            <div className="upload-instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>Download the template file to ensure proper formatting</li>
                <li>Your Excel file should include these columns: Product Name, Category, Barcode, HSN Code, Tax Slab, Price</li>
                <li>Ensure all required fields are filled (Product Name and Category are required)</li>
                <li>Tax Slab should be a number (e.g., 5, 18)</li>
                <li>Price should be numeric values</li>
                <li>Category should be text (e.g., Electronics, Clothing)</li>
              </ul>
            </div>

            {!isUploading && (
              <div className="template-download">
                <button onClick={onDownloadTemplate}>
                  <FaFileDownload /> Download Template
                </button>
              </div>
            )}

            <div
              className={`file-dropzone ${isDragging ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={isUploading ? undefined : handleDrop}
              onClick={isUploading ? undefined : () => document.getElementById('file-input').click()}
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner large"></div>
                  <p>Processing your file, please wait...</p>
                </>
              ) : (
                <>
                  <FaUpload size={40} color="#7366ff" />
                  <p>Drag & drop your Excel file here or <span className="browse-link">browse</span></p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => onUpload(e)}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Unsaved Changes Alert Modal
  // Unsaved Changes Alert Modal
  const UnsavedChangesAlert = () => {
    if (!showUnsavedAlert) return null;

    const changedCount = Object.keys(editingPrices).filter(
      productId => editingPrices[productId] !== originalPrices[productId]
    ).length;

    return (
      <div className="modal-overlay unsaved-alert-overlay">
        <div className="modal-content unsaved-alert">
          <div className="modal-header">
            <div className="modal-title">Unsaved Changes</div>
          </div>
          <div className="modal-body">
            <p>You have {changedCount} unsaved price change(s). What would you like to do?</p>
          </div>
          <div className="modal-footer">
            <button
              className="save-all-btn"
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
              className="cancel-changes-btn"
              onClick={() => handleUnsavedAlertAction('cancel')}
            >
              Discard
            </button>
            <button
              className="continue-editing-btn"
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
          {/* <h2>Product List {hasUnsavedChanges && <span className="unsaved-badge">Unsaved Changes</span>}</h2>  */}
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
                className="save-all-btn"
                onClick={saveAllPrices}
                disabled={isSavingAll || !hasUnsavedChanges}
              >
                {isSavingAll ? (
                  <div className="loading-spinner small"></div>
                ) : (
                  <FaSave />
                )}
                {isSavingAll ? "Saving..." : "Save All"}
              </button>
              <button className="export-all-btn" onClick={exportAllAsExcel}>
                <FaFileExcel /> Export
              </button>
              <button className="bulk-upload-btn" onClick={() => setShowBulkUpload(true)}>
                <FaUpload /> Bulk
              </button>
              <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                <FaPlus /> {showForm ? "Close" : "Add"}
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="form-container premium">
            <h2>Add Product</h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              <Form>
                <div className="form-row">
                  <div className="form-field">
                    <label><FaCubes /> Product Name *</label>
                    <Field name="productName" type="text" />
                    <ErrorMessage name="productName" component="div" className="error" />
                  </div>


                  <div className="form-field">
                    <label>Category *</label>
                    <Field as="select" name="category" className="select-field">
                      <option value="">Select Category</option>
                      {categories.map((category, index) => (
                        <option key={category.categoryId || index} value={category.name}>
                          {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="category" component="div" className="error" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label><FaBarcode /> Barcode *</label>
                    <Field name="barcode" type="text" />
                    <ErrorMessage name="barcode" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaHashtag /> HSN Code *</label>
                    <Field name="hsnCode" type="text" />
                    <ErrorMessage name="hsnCode" component="div" className="error" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label><FaRupeeSign /> Price *</label>
                    <Field name="price" type="number" step="0.01" />
                    <ErrorMessage name="price" component="div" className="error" />
                  </div>
                  <div className="form-field">
                    <label><FaPercent /> Tax Slab *</label>
                    <Field as="select" name="taxSlab" className="select-field">
                      <option value="">Select Tax Slab</option>
                      {TAX_SLABS.map((slab, index) => (
                        <option key={index} value={slab.value}>
                          {slab.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="taxSlab" component="div" className="error" />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                  {isSubmitting && <span className="loading-spinner"></span>}
                </button>
              </Form>
            </Formik>
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
                    <th>Category</th>
                    <th>Barcode</th>
                    <th>HSN Code</th>
                    <th>Tax Slab</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, index) => (
                    <tr
                      key={item.productId || index}
                      className={selectedItem === item.productId ? 'selected' : ''}
                      onClick={(e) => {
                        // Don't open modal if clicking on price input or save button
                        if (e.target.closest('.price-edit-container') || e.target.closest('.save-price-btn')) {
                          return;
                        }
                        selectItem(item.productId);
                      }}
                    >
                      <td>{item.productName}</td>
                      <td>{item.category}</td>
                      <td>{item.barcode}</td>
                      <td>{item.hsnCode}</td>
                      <td>{item.taxSlab}%</td>
                      <td>
                        <div
                          className="price-edit-container"
                          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking on price container
                        >
                          <span className="currency-symbol">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingPrices[item.productId] || 0}
                            onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                            className="price-input"
                            placeholder="0.00"
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking on input
                          />
                        </div>
                      </td>
                      <td>
                        <button
                          className="save-price-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click when clicking save button
                            savePrice(item.productId);
                          }}
                          disabled={isSaving || editingPrices[item.productId] === originalPrices[item.productId]}
                          title="Save price"
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
              {hasMoreItems && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMoreItems}>
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedItem && (
          <ItemModal
            item={items.find(i => i.productId === selectedItem)}
            onClose={() => setSelectedItem(null)}
            onExport={exportSelectedAsPDF}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        )}

        {showBulkUpload && (
          <BulkUploadModal
            onClose={() => setShowBulkUpload(false)}
            onUpload={handleBulkUpload}
            onDownloadTemplate={downloadTemplate}
            isUploading={isBulkUploading}
          />
        )}

        <UnsavedChangesAlert />
      </div>
    </Navbar>
  );
};

export default Items;