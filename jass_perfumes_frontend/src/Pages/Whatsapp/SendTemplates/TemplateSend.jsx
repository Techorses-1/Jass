import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    Send, Users, Search, X, Loader, Image as ImageIcon, Video, Upload, FileSpreadsheet, Download, UserPlus, Database, AlertCircle, CheckCircle,
    XCircle, Filter
} from "lucide-react";
import * as XLSX from "xlsx";
import "./TemplateSend.scss";
import Navbar from "../../../Components/Sidebar/Navbar";

const TemplateSend = () => {
    // Customer states
    const [customers, setCustomers] = useState([]);
    const [whatsappUsers, setWhatsappUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [templateParams, setTemplateParams] = useState([]);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, show: false, success: 0, failed: 0, skipped: 0 });
    const [headerParameter, setHeaderParameter] = useState(null);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
    const [mediaType, setMediaType] = useState(null);

    // Excel upload states
    const [showExcelModal, setShowExcelModal] = useState(false);
    const [excelData, setExcelData] = useState([]);
    const [selectedExcelRows, setSelectedExcelRows] = useState(new Set());
    const [parsingExcel, setParsingExcel] = useState(false);
    const [savingToDb, setSavingToDb] = useState(false);

    // Import Summary Modal states
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [importSummary, setImportSummary] = useState({
        saved: [],
        skipped: [],
        errors: []
    });

    // Send Summary Modal states
    const [showSendSummaryModal, setShowSendSummaryModal] = useState(false);
    const [sendSummary, setSendSummary] = useState({
        success: [],
        failed: [],
        skipped: []
    });

    // User filter state
    const [userFilter, setUserFilter] = useState("both"); // "both", "customers", "whatsapp"

    useEffect(() => {
        fetchCustomers();
        fetchWhatsappUsers();
        fetchTemplates();
    }, []);

    useEffect(() => {
        const combined = [
            ...customers.map(c => ({
                ...c,
                uniqueId: `customer_${c.customerId}`,
                source: "customer"
            })),
            ...whatsappUsers.map(w => ({
                ...w,
                uniqueId: `whatsapp_${w.customerId}`,
                source: "whatsapp"
            }))
        ];
        setAllUsers(combined);
    }, [customers, whatsappUsers]);

    // Filter users based on search term and user filter type
    useEffect(() => {
        let filtered = allUsers;

        // Apply source filter
        if (userFilter === "customers") {
            filtered = allUsers.filter(user => user.source === "customer");
        } else if (userFilter === "whatsapp") {
            filtered = allUsers.filter(user => user.source === "whatsapp");
        }

        // Apply search filter
        filtered = filtered.filter(user =>
            user.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.contactNumber?.includes(searchTerm)
        );

        setFilteredUsers(filtered);
    }, [searchTerm, allUsers, userFilter]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/get-customers`);
            const customersData = Array.isArray(response.data) ? response.data : response.data.data || [];
            const customersWithPhone = customersData.filter(c => c.contactNumber);
            setCustomers(customersWithPhone);
            toast.success(`Loaded ${customersWithPhone.length} customers`);
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to fetch customers");
        } finally {
            setLoading(false);
        }
    };

    const fetchWhatsappUsers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/whatsapp/send/get-whatsapp-users`);
            const usersData = response.data.data || [];
            setWhatsappUsers(usersData);
            console.log(`Loaded ${usersData.length} WhatsApp users`);
        } catch (error) {
            console.error("Error fetching WhatsApp users:", error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/whatsapp/send/get-approved-templates`);
            console.log("Templates response:", response.data);

            let templatesData = [];
            if (Array.isArray(response.data)) {
                templatesData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                templatesData = response.data.data;
            } else {
                templatesData = [];
            }

            setTemplates(templatesData);

            if (templatesData.length > 0) {
                setSelectedTemplate(templatesData[0]);
                checkForMediaHeader(templatesData[0]);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast.error("Failed to fetch templates");
        }
    };

    const checkForMediaHeader = (template) => {
        console.log("Checking template for header:", template);

        const headerComponent = template.components?.find(c => c.type === "HEADER");

        if (headerComponent && (headerComponent.format === "IMAGE" || headerComponent.format === "VIDEO")) {
            const detectedMediaType = headerComponent.format;
            setMediaType(detectedMediaType);

            if (template.mediaId) {
                setHeaderParameter(template.mediaId);
                console.log(`✅ Auto-loaded ${detectedMediaType} mediaId for sending:`, template.mediaId);
                toast.success(`${detectedMediaType} Media ID loaded automatically`);
            } else {
                setHeaderParameter(null);
                console.warn(`⚠️ No mediaId found in template for ${detectedMediaType}`);
                toast.warning(`This template has a ${detectedMediaType} header but no Media ID found.`);
            }

            if (template.imageUrl) {
                setMediaPreviewUrl(template.imageUrl);
                console.log(`✅ ${detectedMediaType} preview URL:`, template.imageUrl);
            } else {
                setMediaPreviewUrl(null);
            }
        } else {
            setHeaderParameter(null);
            setMediaPreviewUrl(null);
            setMediaType(null);
        }
    };

    const downloadSampleExcel = () => {
        const sampleData = [
            { Name: "John Doe", Number: "9876543210" },
            { Name: "Jane Smith", Number: "9876543211" },
            { Name: "Robert Johnson", Number: "9876543212" },
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "WhatsAppUsers");
        XLSX.writeFile(wb, "sample_whatsapp_users.xlsx");
        toast.info("Sample Excel file downloaded!");
    };

    const downloadErrorReport = (data, filename) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, filename);
        toast.info(`${filename} downloaded!`);
    };

    const downloadSendReport = (results, filename) => {
        const reportData = results.map(r => ({
            Name: r.name || r.Name,
            Phone: r.phone || r.Phone,
            Source: r.source || r.Source || "",
            Status: r.status || r.Status,
            Error: r.error || r.Error || ""
        }));
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SendReport");
        XLSX.writeFile(wb, filename);
        toast.info("Send report downloaded!");
    };

    const downloadSendCompleteReport = (successList, failedList, skippedList) => {
        const allResults = [
            ...successList.map(s => ({
                Name: s.name,
                Phone: s.phone,
                Status: "Success",
                Error: ""
            })),
            ...failedList.map(f => ({
                Name: f.name,
                Phone: f.phone,
                Status: "Failed",
                Error: f.error || f.reason || "Unknown error"
            })),
            ...skippedList.map(s => ({
                Name: s.name,
                Phone: s.phone,
                Status: "Skipped",
                Error: s.reason || "User unsubscribed"
            }))
        ];

        const ws = XLSX.utils.json_to_sheet(allResults);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SendReport");
        XLSX.writeFile(wb, `send_report_${Date.now()}.xlsx`);
        toast.success("Send report downloaded!");
    };

    const openExcelModal = () => {
        setShowExcelModal(true);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv"
        ];

        if (!validTypes.includes(file.type)) {
            toast.error("Please upload Excel file (.xlsx, .xls, .csv)");
            return;
        }

        setParsingExcel(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                console.log("Parsed Excel data:", jsonData);

                const allRows = [];
                const validationErrors = [];

                jsonData.forEach((row, idx) => {
                    const nameKey = Object.keys(row).find(key =>
                        key.toLowerCase().includes("name") || key.toLowerCase() === "name"
                    );
                    const phoneKey = Object.keys(row).find(key =>
                        key.toLowerCase().includes("number") ||
                        key.toLowerCase().includes("phone") ||
                        key.toLowerCase() === "mobile" ||
                        key.toLowerCase() === "contact"
                    );

                    let name = nameKey ? row[nameKey]?.toString().trim() : "";
                    let phone = phoneKey ? row[phoneKey]?.toString().trim() : "";
                    let originalPhone = phone;

                    if (!name) {
                        validationErrors.push({
                            name: "Missing",
                            phone: originalPhone || "Missing",
                            reason: "Name is required",
                            rowNumber: idx + 1
                        });
                        allRows.push({
                            name: "Missing",
                            phone: originalPhone || "Missing",
                            isValid: false,
                            errorReason: "Name is required",
                            rowNumber: idx + 1
                        });
                    } else if (!phone) {
                        validationErrors.push({
                            name: name,
                            phone: "Missing",
                            reason: "Phone number is required",
                            rowNumber: idx + 1
                        });
                        allRows.push({
                            name: name,
                            phone: "Missing",
                            isValid: false,
                            errorReason: "Phone number is required",
                            rowNumber: idx + 1
                        });
                    } else {
                        phone = phone.replace(/\D/g, '');

                        if (phone.length === 10) {
                            allRows.push({
                                name: name,
                                phone: phone,
                                isValid: true,
                                errorReason: null,
                                rowNumber: idx + 1
                            });
                        } else {
                            validationErrors.push({
                                name: name,
                                phone: phone,
                                reason: "Phone number must be exactly 10 digits",
                                rowNumber: idx + 1
                            });
                            allRows.push({
                                name: name,
                                phone: phone,
                                isValid: false,
                                errorReason: "Phone number must be exactly 10 digits",
                                rowNumber: idx + 1
                            });
                        }
                    }
                });

                if (allRows.length === 0) {
                    toast.error("No data found in Excel file!");
                    setParsingExcel(false);
                    return;
                }

                setExcelData(allRows);
                const allIndices = new Set(allRows.map((_, idx) => idx));
                setSelectedExcelRows(allIndices);

                const validCount = allRows.filter(r => r.isValid).length;
                const invalidCount = allRows.filter(r => !r.isValid).length;

                toast.success(`Loaded ${allRows.length} rows (${validCount} valid, ${invalidCount} invalid). Invalid rows will show as errors.`);

            } catch (error) {
                console.error("Error parsing Excel:", error);
                toast.error("Failed to parse Excel file");
            } finally {
                setParsingExcel(false);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = "";
    };

    const saveExcelDataToDatabase = async () => {
        const selectedContacts = Array.from(selectedExcelRows).map(idx => ({
            name: excelData[idx].name,
            phone: excelData[idx].phone,
            rowNumber: excelData[idx].rowNumber,
            isValid: excelData[idx].isValid,
            errorReason: excelData[idx].errorReason
        }));

        if (selectedContacts.length === 0) {
            toast.warning("No contacts selected to save");
            return;
        }

        setSavingToDb(true);

        try {
            const validRows = selectedContacts.filter(c => c.isValid === true);
            const invalidRows = selectedContacts.filter(c => c.isValid === false);

            let saved = [];
            let skipped = [];
            let errors = [];

            for (const invalidRow of invalidRows) {
                errors.push({
                    name: invalidRow.name,
                    phone: invalidRow.phone,
                    reason: invalidRow.errorReason || "Validation failed",
                    rowNumber: invalidRow.rowNumber
                });
            }

            if (validRows.length > 0) {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/whatsapp/send/save-excel-users`, {
                    users: validRows.map(r => ({ name: r.name, phone: r.phone }))
                });

                if (response.data.success) {
                    saved = response.data.data?.saved || [];
                    skipped = response.data.data?.skipped || [];
                    if (response.data.data?.errors) {
                        errors.push(...response.data.data.errors);
                    }
                }
            }

            setImportSummary({
                saved: saved,
                skipped: skipped,
                errors: errors,
                totalRows: selectedContacts.length
            });

            setShowExcelModal(false);
            setShowSummaryModal(true);

            setExcelData([]);
            setSelectedExcelRows(new Set());

            await fetchWhatsappUsers();

        } catch (error) {
            console.error("Error saving users:", error);
            toast.error("Failed to save users to database");
        } finally {
            setSavingToDb(false);
        }
    };

    const toggleExcelRow = (index) => {
        const newSelected = new Set(selectedExcelRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedExcelRows(newSelected);
    };

    const selectAllExcelRows = () => {
        if (selectedExcelRows.size === excelData.length) {
            setSelectedExcelRows(new Set());
        } else {
            const allIndices = new Set(excelData.map((_, idx) => idx));
            setSelectedExcelRows(allIndices);
        }
    };

    const downloadCompleteReport = (saved, skipped, errors) => {
        const allResults = [
            ...saved.map(s => ({
                Name: s.name,
                Phone: s.phone,
                Status: "Saved",
                Error: ""
            })),
            ...skipped.map(s => ({
                Name: s.name,
                Phone: s.phone,
                Status: "Skipped",
                Error: s.reason || "Duplicate phone number"
            })),
            ...errors.map(e => ({
                Name: e.name,
                Phone: e.phone,
                Status: "Error",
                Error: e.reason || e.message || "Validation failed"
            }))
        ];

        const ws = XLSX.utils.json_to_sheet(allResults);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ImportReport");
        XLSX.writeFile(wb, `import_report_${Date.now()}.xlsx`);
        toast.success("Complete report downloaded!");
    };

    useEffect(() => {
        console.log("=== SELECTION CHANGED ===");
        console.log("Selected users count:", selectedUsers.size);
        console.log("Selected users:", Array.from(selectedUsers));
        console.log("Filtered users count:", filteredUsers.length);
    }, [selectedUsers, filteredUsers]);

    // ─── UPDATED: sendToExcelContacts — single API call, no frontend batching ───
    const sendToExcelContacts = async () => {
        if (selectedExcelRows.size === 0) {
            toast.warning("Please select at least one contact");
            return;
        }

        if (!selectedTemplate) {
            toast.warning("Please select a template");
            return;
        }

        const headerComponent = selectedTemplate.components?.find(c => c.type === "HEADER");
        if (headerComponent && (headerComponent.format === "IMAGE" || headerComponent.format === "VIDEO") && !headerParameter) {
            toast.warning(`Please provide the ${headerComponent.format} Media ID for this template`);
            const mediaIdInput = prompt(`Enter the ${headerComponent.format} Media ID (numeric ID from Facebook):`);
            if (mediaIdInput && /^\d+$/.test(mediaIdInput)) {
                setHeaderParameter(mediaIdInput);
            } else {
                return;
            }
        }

        const placeholders = getPlaceholders();
        if (placeholders.length > 0 && templateParams.length !== placeholders.length) {
            toast.warning(`Please fill all ${placeholders.length} template variable(s)`);
            return;
        }

        setShowExcelModal(false);
        setSending(true);

        const selectedContacts = Array.from(selectedExcelRows).map(idx => ({
            phone: excelData[idx].phone,
            name: excelData[idx].name,
            source: "excel"
        }));

        setSendProgress({ current: 0, total: selectedContacts.length, show: true, success: 0, failed: 0, skipped: 0 });

        try {
            let parameters = [];
            const hasPlaceholders = selectedTemplate.components?.some(
                comp => comp.type === "BODY" && comp.text?.includes("{{")
            );

            if (hasPlaceholders && templateParams.length > 0) {
                parameters = templateParams.map(p => ({
                    type: "text",
                    text: p
                }));
            }

            // Single API call — backend handles 1-by-1 with random delays
            const payload = {
                customers: selectedContacts,
                templateName: selectedTemplate.name,
                language: "en",
                parameters: parameters
            };

            if (headerParameter) {
                payload.headerParameter = headerParameter;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/whatsapp/send/send-to-customers`,
                payload
            );

            let successCount = 0;
            let failCount = 0;
            const allResults = [];

            if (response.data.success) {
                successCount = response.data.data?.success || 0;
                failCount = response.data.data?.failed || 0;

                if (response.data.data?.details) {
                    allResults.push(...response.data.data.details);
                }
            } else {
                failCount = selectedContacts.length;
                allResults.push(...selectedContacts.map(c => ({ ...c, status: "failed", error: response.data.message })));
            }

            toast.success(`Sent: ${successCount}, Failed: ${failCount}`);

            const reportData = allResults.map(r => ({
                Name: r.name,
                Phone: r.phone,
                Status: r.success === true ? "Success" : (r.success === false ? "Failed" : (r.status === "success" ? "Success" : "Unknown")),
                Error: r.error || r.reason || ""
            }));

            if (reportData.length > 0) {
                downloadSendReport(reportData, `send_report_${Date.now()}.xlsx`);
            }

            setExcelData([]);
            setSelectedExcelRows(new Set());
            setTemplateParams([]);
            // setHeaderParameter(null);

        } catch (error) {
            console.error("Error sending templates:", error);
            toast.error(error.message || "Failed to send templates");
        } finally {
            setSending(false);
            setSendProgress({ current: 0, total: 0, show: false, success: 0, failed: 0, skipped: 0 });
        }
    };

    const toggleSelectUser = (uniqueId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(uniqueId)) {
            newSelected.delete(uniqueId);
        } else {
            newSelected.add(uniqueId);
        }
        setSelectedUsers(newSelected);
    };

    const selectAllUsers = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        } else {
            const allIds = new Set(filteredUsers.map(u => u.uniqueId));
            setSelectedUsers(allIds);
        }
    };

    const getSelectedUsersData = () => {
        const selected = allUsers
            .filter(user => selectedUsers.has(user.uniqueId))
            .map(user => ({
                phone: user.contactNumber,
                name: user.customerName,
                source: user.source,
                originalId: user.customerId
            }));

        console.log("Selected users data (from allUsers):", selected);
        return selected;
    };

    const handleSendClick = () => {
        if (selectedUsers.size === 0) {
            toast.warning("Please select at least one user");
            return;
        }
        if (!selectedTemplate) {
            toast.warning("Please select a template");
            return;
        }

        const headerComponent = selectedTemplate.components?.find(c => c.type === "HEADER");
        if (headerComponent && (headerComponent.format === "IMAGE" || headerComponent.format === "VIDEO") && !headerParameter) {
            toast.warning(`Please provide the ${headerComponent.format} Media ID for this template`);
            const mediaIdInput = prompt(`Enter the ${headerComponent.format} Media ID (numeric ID from Facebook):`);
            if (mediaIdInput && /^\d+$/.test(mediaIdInput)) {
                setHeaderParameter(mediaIdInput);
            } else {
                return;
            }
        }

        const placeholders = getPlaceholders();
        if (placeholders.length > 0 && templateParams.length !== placeholders.length) {
            toast.warning(`Please fill all ${placeholders.length} template variable(s)`);
            return;
        }

        setShowConfirmModal(true);
    };

    // ─── UPDATED: handleSendConfirm — single API call, no frontend batching ───
    const handleSendConfirm = async () => {
        setShowConfirmModal(false);
        setSending(true);

        const usersToSend = getSelectedUsersData();

        console.log("=== DEBUG ===");
        console.log("Selected Users Set size:", selectedUsers.size);
        console.log("Users to send:", usersToSend);

        setSendProgress({ current: 0, total: usersToSend.length, show: true, success: 0, failed: 0, skipped: 0 });

        const successList = [];
        const failedList = [];
        const skippedList = [];

        try {
            let parameters = [];
            const hasPlaceholders = selectedTemplate.components?.some(
                comp => comp.type === "BODY" && comp.text?.includes("{{")
            );

            if (hasPlaceholders && templateParams.length > 0) {
                parameters = templateParams.map(p => ({
                    type: "text",
                    text: p
                }));
            }

            // Single API call — backend handles 1-by-1 with random delays
            const payload = {
                customers: usersToSend,
                templateName: selectedTemplate.name,
                language: "en",
                parameters: parameters
            };

            if (headerParameter) {
                payload.headerParameter = headerParameter;
            }

            console.log(`📦 Sending all ${usersToSend.length} users in one API call`);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/whatsapp/send/send-to-customers`,
                payload
            );

            console.log("Response:", response.data);

            const allResults = [];

            if (response.data.success) {
                if (response.data.data?.details) {
                    allResults.push(...response.data.data.details);
                }
            } else {
                allResults.push(...usersToSend.map(c => ({ ...c, status: "failed", error: response.data.message })));
            }

            // Separate results into success, failed, skipped
            for (const result of allResults) {
                if (result.success === true) {
                    successList.push({
                        name: result.name || result.customerName,
                        phone: result.phone || result.customerPhone,
                    });
                } else if (result.skipped === true) {
                    skippedList.push({
                        name: result.name,
                        phone: result.phone,
                        reason: result.reason || "User unsubscribed"
                    });
                } else {
                    failedList.push({
                        name: result.name,
                        phone: result.phone,
                        error: result.error || result.reason || "Unknown error"
                    });
                }
            }

            // Store summary for modal
            setSendSummary({
                success: successList,
                failed: failedList,
                skipped: skippedList,
                total: usersToSend.length,
                successCount: successList.length,
                failedCount: failedList.length,
                skippedCount: skippedList.length
            });

            // Hide progress and show summary modal
            setSendProgress({ current: 0, total: 0, show: false, success: 0, failed: 0, skipped: 0 });
            setShowSendSummaryModal(true);

            // Clear selections
            setSelectedUsers(new Set());
            setTemplateParams([]);
            // setHeaderParameter(null);
            // setMediaPreviewUrl(null);
            // setMediaType(null);

        } catch (error) {
            console.error("Error sending templates:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to send templates";
            toast.error(errorMsg);
            setSendProgress({ current: 0, total: 0, show: false, success: 0, failed: 0, skipped: 0 });
        } finally {
            setSending(false);
        }
    };

    const getPlaceholders = () => {
        if (!selectedTemplate) return [];
        const bodyComponent = selectedTemplate.components?.find(c => c.type === "BODY");
        if (!bodyComponent?.text) return [];
        const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g);
        if (!matches) return [];
        return matches.map(m => parseInt(m.match(/\d+/)[0])).sort((a, b) => a - b);
    };

    const placeholders = getPlaceholders();

    const updateParameter = (index, value) => {
        const newParams = [...templateParams];
        newParams[index] = value;
        setTemplateParams(newParams);
    };

    const ImportSummaryModal = () => {
        const { saved, skipped, errors } = importSummary;
        const totalSaved = saved?.length || 0;
        const totalSkipped = skipped?.length || 0;
        const totalErrors = errors?.length || 0;

        return (
            <div className="whatsapp-send-modal-overlay" onClick={() => setShowSummaryModal(false)}>
                <div className="whatsapp-send-summary-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="whatsapp-send-modal-header">
                        <h2>📊 Import Summary</h2>
                        <button className="whatsapp-send-close-btn" onClick={() => setShowSummaryModal(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="whatsapp-send-modal-body">
                        <div className="whatsapp-send-summary-stats">
                            <div className="whatsapp-send-summary-stat success">
                                <CheckCircle size={24} />
                                <div className="stat-number">{totalSaved}</div>
                                <div className="stat-label">Saved</div>
                            </div>
                            <div className="whatsapp-send-summary-stat warning">
                                <AlertCircle size={24} />
                                <div className="stat-number">{totalSkipped}</div>
                                <div className="stat-label">Skipped (Duplicate)</div>
                            </div>
                            <div className="whatsapp-send-summary-stat error">
                                <XCircle size={24} />
                                <div className="stat-number">{totalErrors}</div>
                                <div className="stat-label">Errors</div>
                            </div>
                        </div>

                        <div className="whatsapp-send-summary-details">
                            {/* Saved Section */}
                            <div className="summary-section">
                                <h4>✅ Saved ({totalSaved})</h4>
                                {totalSaved > 0 ? (
                                    <div className="summary-list">
                                        {(saved || []).slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="summary-item success-item">
                                                <span className="name">{item.name}</span>
                                                <span className="phone">{item.phone}</span>
                                                <span className="status">✓ Saved</span>
                                            </div>
                                        ))}
                                        {(saved || []).length > 10 && (
                                            <div className="summary-more">+{(saved || []).length - 10} more...</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No records saved</p>
                                )}
                            </div>

                            {/* Skipped Section */}
                            <div className="summary-section">
                                <h4>⚠️ Skipped ({totalSkipped})</h4>
                                {totalSkipped > 0 ? (
                                    <div className="summary-list">
                                        {(skipped || []).slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="summary-item warning-item">
                                                <span className="name">{item.name}</span>
                                                <span className="phone">{item.phone}</span>
                                                <span className="reason">{item.reason}</span>
                                            </div>
                                        ))}
                                        {(skipped || []).length > 10 && (
                                            <div className="summary-more">+{(skipped || []).length - 10} more...</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No records skipped</p>
                                )}
                            </div>

                            {/* Errors Section */}
                            <div className="summary-section">
                                <h4>❌ Errors ({totalErrors})</h4>
                                {totalErrors > 0 ? (
                                    <div className="summary-list">
                                        {(errors || []).slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="summary-item error-item">
                                                <span className="name">{item.name}</span>
                                                <span className="phone">{item.phone}</span>
                                                <span className="reason">{item.reason}</span>
                                            </div>
                                        ))}
                                        {(errors || []).length > 10 && (
                                            <div className="summary-more">+{(errors || []).length - 10} more...</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No errors</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="whatsapp-send-modal-footer">
                        <button
                            className="whatsapp-send-download-report-btn"
                            onClick={() => downloadCompleteReport(saved || [], skipped || [], errors || [])}
                        >
                            <Download size={16} />
                            Download Complete Report
                        </button>
                        <button
                            className="whatsapp-send-close-summary-btn"
                            onClick={() => setShowSummaryModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const SendSummaryModal = () => {
        const { success, failed, skipped } = sendSummary;
        const totalSuccess = success?.length || 0;
        const totalFailed = failed?.length || 0;
        const totalSkipped = skipped?.length || 0;

        return (
            <div className="whatsapp-send-modal-overlay" onClick={() => setShowSendSummaryModal(false)}>
                <div className="whatsapp-send-summary-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="whatsapp-send-modal-header">
                        <h2>📤 Send Summary</h2>
                        <button className="whatsapp-send-close-btn" onClick={() => setShowSendSummaryModal(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="whatsapp-send-modal-body">
                        <div className="whatsapp-send-summary-stats">
                            <div className="whatsapp-send-summary-stat success">
                                <CheckCircle size={24} />
                                <div className="stat-number">{totalSuccess}</div>
                                <div className="stat-label">Success</div>
                            </div>
                            <div className="whatsapp-send-summary-stat error">
                                <XCircle size={24} />
                                <div className="stat-number">{totalFailed}</div>
                                <div className="stat-label">Failed</div>
                            </div>
                            <div className="whatsapp-send-summary-stat warning">
                                <AlertCircle size={24} />
                                <div className="stat-number">{totalSkipped}</div>
                                <div className="stat-label">Skipped (Unsubscribed)</div>
                            </div>
                        </div>

                        <div className="whatsapp-send-summary-details">
                            {/* Success Section */}
                            <div className="summary-section">
                                <h4>✅ Success ({totalSuccess})</h4>
                                {totalSuccess > 0 ? (
                                    <div className="summary-list">
                                        {(success || []).slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="summary-item success-item">
                                                <span className="name">{item.name}</span>
                                                <span className="phone">{item.phone}</span>
                                                <span className="status">✓ Delivered</span>
                                            </div>
                                        ))}
                                        {(success || []).length > 10 && (
                                            <div className="summary-more">+{(success || []).length - 10} more...</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No successful messages</p>
                                )}
                            </div>

                            {/* Failed Section */}
                            <div className="summary-section">
                                <h4>❌ Failed ({totalFailed})</h4>
                                {totalFailed > 0 ? (
                                    <div className="summary-list">
                                        {(failed || []).slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="summary-item error-item">
                                                <span className="name">{item.name}</span>
                                                <span className="phone">{item.phone}</span>
                                                <span className="reason">{item.error}</span>
                                            </div>
                                        ))}
                                        {(failed || []).length > 10 && (
                                            <div className="summary-more">+{(failed || []).length - 10} more...</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No failures</p>
                                )}
                            </div>

                            {/* Skipped Section (Unsubscribed) */}
                            <div className="summary-section">
                                <h4>⚠️ Skipped - Unsubscribed ({totalSkipped})</h4>
                                {totalSkipped > 0 ? (
                                    <div className="summary-list">
                                        {(skipped || []).slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="summary-item warning-item">
                                                <span className="name">{item.name}</span>
                                                <span className="phone">{item.phone}</span>
                                                <span className="reason">{item.reason || "User unsubscribed"}</span>
                                            </div>
                                        ))}
                                        {(skipped || []).length > 10 && (
                                            <div className="summary-more">+{(skipped || []).length - 10} more...</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">No skipped users</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="whatsapp-send-modal-footer">
                        <button
                            className="whatsapp-send-download-report-btn"
                            onClick={() => downloadSendCompleteReport(success || [], failed || [], skipped || [])}
                        >
                            <Download size={16} />
                            Download Complete Report
                        </button>
                        <button
                            className="whatsapp-send-close-summary-btn"
                            onClick={() => setShowSendSummaryModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const hasMediaHeader = selectedTemplate?.components?.some(
        comp => comp.type === "HEADER" && (comp.format === "IMAGE" || comp.format === "VIDEO")
    );

    const headerFormat = selectedTemplate?.components?.find(c => c.type === "HEADER")?.format;

    const totalCustomers = customers.length;
    const totalWhatsappUsers = whatsappUsers.length;
    const totalAllUsers = totalCustomers + totalWhatsappUsers;

    const customersCount = allUsers.filter(u => u.source === "customer").length;
    const whatsappCount = allUsers.filter(u => u.source === "whatsapp").length;

    return (
        <Navbar>
            <div className="whatsapp-send-container">
                <ToastContainer position="top-center" autoClose={3000} />

                <div className="whatsapp-send-page-header">
                    <div className="whatsapp-send-header-left">
                        <h1>Send WhatsApp Template</h1>
                        <p>Send approved templates to your customers</p>
                    </div>
                    <div className="whatsapp-send-header-buttons">
                        <button className="whatsapp-send-btn-excel" onClick={openExcelModal}>
                            <FileSpreadsheet size={18} />
                            Upload Excel
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="whatsapp-send-stats-grid">
                    <div className="whatsapp-send-stat-card">
                        <div className="whatsapp-send-stat-value">{totalAllUsers}</div>
                        <div className="whatsapp-send-stat-label">Total Users</div>
                    </div>
                    <div className="whatsapp-send-stat-card">
                        <div className="whatsapp-send-stat-value">{totalCustomers}</div>
                        <div className="whatsapp-send-stat-label">Customers</div>
                    </div>
                    <div className="whatsapp-send-stat-card">
                        <div className="whatsapp-send-stat-value">{totalWhatsappUsers}</div>
                        <div className="whatsapp-send-stat-label">WhatsApp Users</div>
                    </div>
                </div>

                <div className="whatsapp-send-two-column-layout">
                    {/* Left Column - Combined Users List */}
                    <div className="whatsapp-send-customers-section">
                        <div className="whatsapp-send-section-header">
                            <h2><Users size={18} /> Select Users</h2>
                            <div className="whatsapp-send-search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filter Buttons */}
                        <div className="whatsapp-send-filter-buttons">
                            <button
                                className={`whatsapp-send-filter-btn ${userFilter === "both" ? "active" : ""}`}
                                onClick={() => setUserFilter("both")}
                            >
                                <Users size={16} />
                                Both ({totalAllUsers})
                            </button>
                            <button
                                className={`whatsapp-send-filter-btn ${userFilter === "customers" ? "active" : ""}`}
                                onClick={() => setUserFilter("customers")}
                            >
                                <UserPlus size={16} />
                                Customers ({customersCount})
                            </button>
                            <button
                                className={`whatsapp-send-filter-btn ${userFilter === "whatsapp" ? "active" : ""}`}
                                onClick={() => setUserFilter("whatsapp")}
                            >
                                <Database size={16} />
                                WhatsApp Users ({whatsappCount})
                            </button>
                        </div>

                        <div className="whatsapp-send-customers-list">
                            <div className="whatsapp-send-list-header">
                                <div className="whatsapp-send-checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={selectAllUsers}
                                    />
                                </div>
                                <div className="whatsapp-send-name-cell">Name</div>
                                <div className="whatsapp-send-phone-cell">Phone Number</div>
                                <div className="whatsapp-send-source-cell">Source</div>
                            </div>

                            {loading ? (
                                <div className="whatsapp-send-loading-state">
                                    <Loader className="whatsapp-send-spinning" size={32} />
                                    <p>Loading users...</p>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="whatsapp-send-empty-state">
                                    <Users size={48} />
                                    <p>No users found</p>
                                    <button className="whatsapp-send-btn-excel-small" onClick={openExcelModal}>
                                        <Upload size={16} />
                                        Import from Excel
                                    </button>
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user.uniqueId}
                                        className={`whatsapp-send-customer-row ${selectedUsers.has(user.uniqueId) ? "whatsapp-send-selected" : ""}`}
                                        onClick={() => toggleSelectUser(user.uniqueId)}
                                    >
                                        <div className="whatsapp-send-checkbox-cell">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(user.uniqueId)}
                                                onChange={() => { }}
                                            />
                                        </div>
                                        <div className="whatsapp-send-name-cell">{user.customerName}</div>
                                        <div className="whatsapp-send-phone-cell">{user.contactNumber}</div>
                                        <div className="whatsapp-send-source-cell">
                                            <span className={`whatsapp-send-source-badge ${user.source}`}>
                                                {user.source === "customer" ? "Customer" : "WhatsApp User"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="whatsapp-send-selection-info">
                            <span>
                                Selected: <strong>{selectedUsers.size}</strong> users
                            </span>
                            {selectedUsers.size > 0 && (
                                <button className="whatsapp-send-clear-btn" onClick={() => setSelectedUsers(new Set())}>
                                    <X size={16} />
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Template Selection */}
                    <div className="whatsapp-send-template-section">
                        <div className="whatsapp-send-section-header">
                            <h2>Select Template</h2>
                        </div>

                        <div className="whatsapp-send-template-selector">
                            <label>Choose Template</label>
                            <select
                                value={selectedTemplate?.name || ""}
                                onChange={(e) => {
                                    const template = templates.find(t => t.name === e.target.value);
                                    setSelectedTemplate(template);
                                    setTemplateParams([]);
                                    setHeaderParameter(null);
                                    setMediaPreviewUrl(null);
                                    setMediaType(null);
                                    checkForMediaHeader(template);
                                }}
                            >
                                {templates.length === 0 ? (
                                    <option value="">No approved templates available</option>
                                ) : (
                                    templates.map((template) => {
                                        const headerComp = template.components?.find(c => c.type === "HEADER");
                                        const isImage = headerComp?.format === "IMAGE";
                                        const isVideo = headerComp?.format === "VIDEO";
                                        return (
                                            <option key={template.name} value={template.name}>
                                                {template.name} ({template.category})
                                                {isImage ? " 📷" : isVideo ? " 🎥" : ""}
                                                {template.status ? ` - ${template.status}` : ""}
                                            </option>
                                        );
                                    })
                                )}
                            </select>
                        </div>

                        {hasMediaHeader && !headerParameter && (
                            <div className="whatsapp-send-image-warning">
                                {headerFormat === "VIDEO" ? <Video size={20} /> : <ImageIcon size={20} />}
                                <div>
                                    <strong>{headerFormat} Media ID Required</strong>
                                    <p>This template has a {headerFormat} header. You need to provide the Media ID.</p>
                                </div>
                                <button onClick={() => {
                                    const mediaIdInput = prompt(`Enter the numeric ${headerFormat} Media ID:`);
                                    if (mediaIdInput && /^\d+$/.test(mediaIdInput)) {
                                        setHeaderParameter(mediaIdInput);
                                        toast.success(`${headerFormat} Media ID added`);
                                    } else if (mediaIdInput) {
                                        toast.error("Media ID must be numeric");
                                    }
                                }}>
                                    Add {headerFormat} Media ID
                                </button>
                            </div>
                        )}

                        {hasMediaHeader && headerParameter && (
                            <div className="whatsapp-send-image-success">
                                <div>
                                    <strong>✅ {headerFormat} Media ID Ready</strong>
                                    <p className="whatsapp-send-media-id-display">ID: {headerParameter}</p>
                                    <small>Type: {headerFormat}</small>
                                </div>
                                <button className="whatsapp-send-change-btn" onClick={() => setHeaderParameter(null)}>
                                    Change
                                </button>
                            </div>
                        )}

                        {hasMediaHeader && mediaPreviewUrl && (
                            <div className="whatsapp-send-image-preview-section">
                                <label>{headerFormat === "VIDEO" ? "Video Preview:" : "Image Preview:"}</label>
                                <div className="whatsapp-send-image-preview-container">
                                    {headerFormat === "VIDEO" ? (
                                        <video src={mediaPreviewUrl} controls style={{ maxWidth: "100%", maxHeight: "300px" }} />
                                    ) : (
                                        <img src={mediaPreviewUrl} alt="Template header preview" />
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedTemplate && (
                            <div className="whatsapp-send-template-preview">
                                <h3>Template Preview</h3>
                                <div className="whatsapp-send-preview-bubble">
                                    {selectedTemplate.components?.map((comp, idx) => (
                                        <div key={idx} className={`whatsapp-send-preview-${comp.type.toLowerCase()}`}>
                                            {comp.type === "HEADER" && comp.format === "IMAGE" && (
                                                <div className="whatsapp-send-preview-image-badge">
                                                    <ImageIcon size={16} />
                                                    <span>Image Header</span>
                                                </div>
                                            )}
                                            {comp.type === "HEADER" && comp.format === "VIDEO" && (
                                                <div className="whatsapp-send-preview-image-badge">
                                                    <Video size={16} />
                                                    <span>Video Header</span>
                                                </div>
                                            )}
                                            {comp.type === "HEADER" && comp.format === "TEXT" && (
                                                <div className="whatsapp-send-preview-header">{comp.text}</div>
                                            )}
                                            {comp.type === "BODY" && (
                                                <div className="whatsapp-send-preview-body">
                                                    {(() => {
                                                        let text = comp.text;
                                                        const placeholderValues = [...templateParams];
                                                        text = text.replace(/\{\{(\d+)\}\}/g, (match, num) => {
                                                            const idx = parseInt(num) - 1;
                                                            if (placeholderValues[idx]) {
                                                                return `<span class="whatsapp-send-placeholder-value">${placeholderValues[idx]}</span>`;
                                                            }
                                                            return match;
                                                        });
                                                        return <div dangerouslySetInnerHTML={{ __html: text }} />;
                                                    })()}
                                                </div>
                                            )}
                                            {comp.type === "FOOTER" && <div className="whatsapp-send-preview-footer">{comp.text}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {placeholders.length > 0 && (
                            <div className="whatsapp-send-placeholder-inputs">
                                <h3>Template Variables {placeholders.length > 0 && `(${placeholders.length} required)`}</h3>
                                {placeholders.map((num, idx) => (
                                    <div key={num} className="whatsapp-send-input-group">
                                        <label>{`{{${num}}}`}</label>
                                        <input
                                            type="text"
                                            placeholder={`Enter value for placeholder ${num}`}
                                            value={templateParams[idx] || ""}
                                            onChange={(e) => updateParameter(idx, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="whatsapp-send-send-btn"
                            onClick={handleSendClick}
                            disabled={
                                selectedUsers.size === 0 ||
                                !selectedTemplate ||
                                sending ||
                                (hasMediaHeader && !headerParameter) ||
                                (placeholders.length > 0 && templateParams.length !== placeholders.length)
                            }
                        >
                            {sending ? (
                                <>
                                    <Loader className="whatsapp-send-spinning" size={18} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send to {selectedUsers.size} User{selectedUsers.size !== 1 ? "s" : ""}
                                </>
                            )}
                        </button>

                        {hasMediaHeader && headerParameter && (
                            <p className="whatsapp-send-info-text">
                                ℹ️ {headerFormat} will be sent using Media ID: {headerParameter}
                            </p>
                        )}
                    </div>
                </div>

                {sendProgress.show && (
                    <div className="whatsapp-send-progress-overlay">
                        <div className="whatsapp-send-progress-modal">

                            <div className="whatsapp-send-progress-title">
                                <div className="whatsapp-send-spinner" />
                                Sending messages... Please wait, this may take a while.
                            </div>

                            <div className="whatsapp-send-progress-track">
                                <div
                                    className="whatsapp-send-progress-fill"
                                    style={{ width: `${sendProgress.total > 0 ? Math.round((sendProgress.current / sendProgress.total) * 100) : 0}%` }}
                                />
                            </div>
                            <div className="whatsapp-send-progress-label">
                                <span>Processing {sendProgress.total} messages...</span>
                                <span>Backend is handling delivery</span>
                            </div>

                            <div className="whatsapp-send-batch-info">
                                <div className="whatsapp-send-dot" />
                                <span>Sending with smart delays to avoid rate limits...</span>
                            </div>

                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmModal && (
                    <div className="whatsapp-send-modal-overlay" onClick={() => setShowConfirmModal(false)}>
                        <div className="whatsapp-send-confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="whatsapp-send-modal-header">
                                <h2>Confirm Send</h2>
                                <button className="whatsapp-send-close-btn" onClick={() => setShowConfirmModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="whatsapp-send-modal-body">
                                <p>
                                    You are about to send <strong>"{selectedTemplate?.name}"</strong> template to
                                </p>
                                <div className="whatsapp-send-recipient-count">
                                    <Users size={24} />
                                    <span>{selectedUsers.size} user(s)</span>
                                </div>
                                <div className="whatsapp-send-recipient-breakdown">
                                    <small>
                                        Customers: {getSelectedUsersData().filter(u => u.source === "customer").length} |
                                        WhatsApp Users: {getSelectedUsersData().filter(u => u.source === "whatsapp").length}
                                    </small>
                                </div>
                                {hasMediaHeader && headerParameter && (
                                    <div className="whatsapp-send-image-confirm-info">
                                        {headerFormat === "VIDEO" ? <Video size={16} /> : <ImageIcon size={16} />}
                                        <span>{headerFormat} will be included using Media ID</span>
                                    </div>
                                )}
                                {placeholders.length > 0 && (
                                    <div className="whatsapp-send-placeholders-confirm-info">
                                        <strong>Variables:</strong>
                                        <ul>
                                            {placeholders.map((num, idx) => (
                                                <li key={num}>{"{{"}{num}{"}}"} = {templateParams[idx] || "(empty)"}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <p className="whatsapp-send-warning-text">
                                    This action cannot be undone. Messages will be sent immediately.
                                </p>
                            </div>
                            <div className="whatsapp-send-modal-footer">
                                <button className="whatsapp-send-cancel-btn" onClick={() => setShowConfirmModal(false)}>
                                    Cancel
                                </button>
                                <button className="whatsapp-send-confirm-btn" onClick={handleSendConfirm}>
                                    <Send size={16} />
                                    Send Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Excel Upload Modal */}
                {showExcelModal && (
                    <div className="whatsapp-send-modal-overlay" onClick={() => setShowExcelModal(false)}>
                        <div className="whatsapp-send-excel-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="whatsapp-send-modal-header">
                                <h2>Import from Excel</h2>
                                <button className="whatsapp-send-close-btn" onClick={() => setShowExcelModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="whatsapp-send-modal-body">
                                <div className="whatsapp-send-sample-excel-info">
                                    <button className="whatsapp-send-btn-sample" onClick={downloadSampleExcel}>
                                        <Download size={16} />
                                        Download Sample Excel
                                    </button>
                                    <small>Format: Name (required) | Number (required)</small>
                                </div>

                                <div className="whatsapp-send-file-upload-area">
                                    <label className="whatsapp-send-file-upload-label">
                                        <Upload size={20} />
                                        Click to Upload Excel File
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileSelect}
                                            style={{ display: "none" }}
                                        />
                                    </label>
                                    {parsingExcel && <p className="whatsapp-send-parsing-text"><Loader className="whatsapp-send-spinning" size={16} /> Parsing file...</p>}
                                </div>

                                {excelData.length > 0 && (
                                    <>
                                        <div className="whatsapp-send-excel-data-preview">
                                            <div className="whatsapp-send-preview-header">
                                                <div className="whatsapp-send-checkbox-cell">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedExcelRows.size === excelData.length && excelData.length > 0}
                                                        onChange={selectAllExcelRows}
                                                    />
                                                </div>
                                                <div className="whatsapp-send-name-header">Name</div>
                                                <div className="whatsapp-send-phone-header">Phone Number</div>
                                            </div>
                                            <div className="whatsapp-send-excel-rows">
                                                {excelData.map((contact, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`whatsapp-send-excel-row ${selectedExcelRows.has(idx) ? "whatsapp-send-selected" : ""}`}
                                                        onClick={() => toggleExcelRow(idx)}
                                                    >
                                                        <div className="whatsapp-send-checkbox-cell">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedExcelRows.has(idx)}
                                                                onChange={() => { }}
                                                            />
                                                        </div>
                                                        <div className="whatsapp-send-name-cell">{contact.name}</div>
                                                        <div className="whatsapp-send-phone-cell">{contact.phone}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="whatsapp-send-excel-selection-info">
                                            <span>Selected: <strong>{selectedExcelRows.size}</strong> contacts</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="whatsapp-send-modal-footer">
                                <button className="whatsapp-send-cancel-btn" onClick={() => setShowExcelModal(false)}>
                                    Cancel
                                </button>
                                {excelData.length > 0 && (
                                    <>
                                        <button
                                            className="whatsapp-send-confirm-btn"
                                            onClick={saveExcelDataToDatabase}
                                            disabled={savingToDb || selectedExcelRows.size === 0}
                                        >
                                            {savingToDb ? (
                                                <><Loader className="whatsapp-send-spinning" size={16} /> Saving...</>
                                            ) : (
                                                <><UserPlus size={16} /> Save to Database</>
                                            )}
                                        </button>
                                        <button
                                            className="whatsapp-send-send-direct-btn"
                                            onClick={sendToExcelContacts}
                                            disabled={sending || selectedExcelRows.size === 0}
                                        >
                                            <Send size={16} />
                                            Send Directly
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Import Summary Modal */}
                {showSummaryModal && <ImportSummaryModal />}

                {/* Send Summary Modal */}
                {showSendSummaryModal && <SendSummaryModal />}
            </div>
        </Navbar>
    );
};

export default TemplateSend;