import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    Plus,
    Trash2,
    RefreshCw,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    MessageSquare,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    FileText,
    Image as ImageIcon,
    Video,
    File,
    Upload,
    Loader,
    Link,
    Phone,
    MessageCircle
} from "lucide-react";
import "./WhatsAppTemplates.scss";
import Navbar from "../../../Components/Sidebar/Navbar";

const WhatsAppTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [uploadedMedia, setUploadedMedia] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "UTILITY",
        language: "en",
        bodyText: "",
        footerText: "",
        headerText: "",
        headerType: "NONE",
        headerMediaHandle: null,
        headerMediaId: null,
        headerImageUrl: null,
        buttons: [],
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [templatesPerPage] = useState(10);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/whatsapp/templates/get-templates`
            );
            setTemplates(response.data.data || []);
            toast.success(`Loaded ${response.data.data?.length || 0} templates`);
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast.error("Failed to fetch templates");
        } finally {
            setLoading(false);
        }
    };

    const handleMediaUpload = async (file) => {
        if (!file) return;

        const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
        const validVideoTypes = ["video/mp4"];
        const isImage = validImageTypes.includes(file.type);
        const isVideo = validVideoTypes.includes(file.type);

        if (!isImage && !isVideo) {
            toast.error("Only JPEG, PNG images and MP4 videos are allowed");
            return;
        }

        if (isImage && file.size > 1.6 * 1024 * 1024) {
            toast.error("Image size must be less than 1.6MB");
            return;
        }
        if (isVideo && file.size > 16 * 1024 * 1024) {
            toast.error("Video size must be less than 16MB");
            return;
        }

        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("type", isImage ? "image" : "video");

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/whatsapp/templates/upload-media`,
                formDataUpload,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (response.data.success) {
                const { media_handle, media_id, media_url, media_type } = response.data.data;
                setUploadedMedia({
                    localUrl: URL.createObjectURL(file),
                    mediaHandle: media_handle,
                    mediaId: media_id,
                    mediaUrl: media_url,
                    mediaType: media_type,
                    name: file.name,
                });
                setFormData(prev => ({
                    ...prev,
                    headerMediaHandle: media_handle,
                    headerMediaId: media_id,
                    headerImageUrl: media_url,
                }));
                toast.success(`${media_type === "image" ? "Image" : "Video"} uploaded and ready for template!`);
            }
        } catch (error) {
            console.error("Error uploading media:", error);
            toast.error(error.response?.data?.message || "Failed to upload media");
        } finally {
            setUploading(false);
        }
    };

    const addButton = () => {
        if (formData.buttons.length >= 10) {
            toast.warning("Maximum 10 buttons allowed per template");
            return;
        }
        setFormData({
            ...formData,
            buttons: [...formData.buttons, { type: "QUICK_REPLY", text: "", phone_number: "" }]
        });
    };

    const removeButton = (index) => {
        const newButtons = formData.buttons.filter((_, i) => i !== index);
        setFormData({ ...formData, buttons: newButtons });
    };

    const updateButton = (index, field, value) => {
        const newButtons = [...formData.buttons];

        // Special handling for phone_number field - ensure +91 prefix is preserved
        if (field === "phone_number") {
            // Remove any existing +91 or 91 from the input value
            let cleanedValue = value.replace(/^\+91/, '').replace(/^91/, '');
            // Only allow digits
            cleanedValue = cleanedValue.replace(/\D/g, '');
            // Store only the digits (without +91)
            newButtons[index][field] = cleanedValue;
        } else {
            newButtons[index][field] = value;
        }

        setFormData({ ...formData, buttons: newButtons });
    };

    const getButtonTypeIcon = (type) => {
        if (type === "URL") return <Link size={14} />;
        if (type === "PHONE_NUMBER") return <Phone size={14} />;
        return <MessageCircle size={14} />;
    };

    // Get display phone number with +91 prefix for preview
    const getDisplayPhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return "";
        // Remove any existing +91 or 91 prefix
        let cleaned = phoneNumber.replace(/^\+91/, '').replace(/^91/, '');
        return `+91 ${cleaned}`;
    };

    // VALIDATION FUNCTIONS
    const validateTemplateName = (name) => {
        const validPattern = /^[a-z0-9_]+$/;
        if (!name) {
            return { valid: false, message: "Template name is required" };
        }
        if (!validPattern.test(name)) {
            return { valid: false, message: "Template name must contain only lowercase letters (a-z), numbers (0-9), and underscores (_). No spaces, hyphens, or special characters allowed." };
        }
        return { valid: true, message: "" };
    };

    const validateBodyText = (bodyText) => {
        if (!bodyText) {
            return { valid: false, message: "Body text is required" };
        }

        const threeOrMoreNewlines = /(\n){3,}/;
        if (threeOrMoreNewlines.test(bodyText)) {
            return { valid: false, message: "Body text cannot have more than 2 consecutive newline characters. Please remove extra line breaks." };
        }

        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const emojiCount = (bodyText.match(emojiRegex) || []).length;
        if (emojiCount > 10) {
            return { valid: false, message: `Body text cannot have more than 10 emojis. Current count: ${emojiCount}` };
        }

        return { valid: true, message: "" };
    };

    const handleCreateTemplate = async () => {
        // FRONTEND VALIDATIONS
        const nameValidation = validateTemplateName(formData.name);
        if (!nameValidation.valid) {
            toast.error(nameValidation.message);
            return;
        }

        const bodyValidation = validateBodyText(formData.bodyText);
        if (!bodyValidation.valid) {
            toast.error(bodyValidation.message);
            return;
        }

        if ((formData.headerType === "IMAGE" || formData.headerType === "VIDEO") && !formData.headerMediaHandle) {
            toast.warning(`Please upload a ${formData.headerType.toLowerCase()} for the header`);
            return;
        }

        // Validate buttons
        for (let i = 0; i < formData.buttons.length; i++) {
            const btn = formData.buttons[i];
            if (!btn.text || btn.text.trim() === "") {
                toast.warning(`Button ${i + 1}: Text is required`);
                return;
            }
            if (btn.type === "URL" && (!btn.url || btn.url.trim() === "")) {
                toast.warning(`Button ${i + 1}: URL is required for URL button`);
                return;
            }
            if (btn.type === "PHONE_NUMBER") {
                // Validate phone number: must have at least 10 digits
                const phoneDigits = btn.phone_number?.replace(/\D/g, '') || "";
                if (phoneDigits.length < 10) {
                    toast.warning(`Button ${i + 1}: Valid phone number with at least 10 digits is required`);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            const effectiveCategory =
                (formData.headerType === "IMAGE" || formData.headerType === "VIDEO") ? "MARKETING" : formData.category;

            let buttonsToSend = formData.buttons.map(btn => {
                const buttonObj = { type: btn.type, text: btn.text };
                if (btn.type === "URL") buttonObj.url = btn.url;
                if (btn.type === "PHONE_NUMBER") {
                    // Add +91 prefix before sending to backend
                    const cleanPhone = btn.phone_number?.replace(/\D/g, '') || "";
                    buttonObj.phone_number = `+91${cleanPhone}`;
                }
                return buttonObj;
            });

            const payload = {
                name: formData.name.toLowerCase().replace(/\s/g, "_"),
                category: effectiveCategory,
                language: formData.language,
                bodyText: formData.bodyText,
                footerText: formData.footerText || null,
                headerType: formData.headerType,
                headerText: formData.headerType === "TEXT" ? formData.headerText : null,
                headerMediaHandle: (formData.headerType === "IMAGE" || formData.headerType === "VIDEO") ? formData.headerMediaHandle : null,
                headerMediaId: (formData.headerType === "IMAGE" || formData.headerType === "VIDEO") ? formData.headerMediaId : null,
                headerImageUrl: (formData.headerType === "IMAGE" || formData.headerType === "VIDEO") ? formData.headerImageUrl : null,
                buttons: buttonsToSend,
            };

            console.log("📤 Sending payload:", payload);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/whatsapp/templates/create-template`,
                payload
            );

            if (response.data.success) {
                toast.success("Template created successfully! Waiting for approval.");
                setShowModal(false);
                resetForm();
                fetchTemplates();
            }
        } catch (error) {
            console.error("Error creating template:", error);
            toast.error(error.response?.data?.message || "Failed to create template");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (templateName) => {
        setTemplateToDelete(templateName);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        setShowDeleteConfirm(false);
        setLoading(true);
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/whatsapp/templates/delete-template/${templateToDelete}`
            );
            if (response.data.success) {
                toast.success("Template deleted successfully");
                fetchTemplates();
            }
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Failed to delete template");
        } finally {
            setLoading(false);
            setTemplateToDelete(null);
        }
    };

    const handleViewDetails = async (templateName) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/whatsapp/templates/get-template/${templateName}`
            );
            if (response.data.success) {
                setSelectedTemplate(response.data.data);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error("Error fetching template details:", error);
            toast.error("Failed to fetch template details");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            category: "UTILITY",
            language: "en",
            bodyText: "",
            footerText: "",
            headerText: "",
            headerType: "NONE",
            headerMediaHandle: null,
            headerMediaId: null,
            headerImageUrl: null,
            buttons: [],
        });
        setUploadedMedia(null);
    };

    const getStatusIcon = (status) => {
        const s = status?.toUpperCase();
        if (s === "APPROVED") return <CheckCircle size={18} color="#10b981" />;
        if (s === "PENDING") return <Clock size={18} color="#f59e0b" />;
        if (s === "REJECTED") return <XCircle size={18} color="#ef4444" />;
        return <AlertCircle size={18} color="#6b7280" />;
    };

    const getStatusText = (status) => {
        const s = status?.toUpperCase();
        if (s === "APPROVED") return "Approved";
        if (s === "PENDING") return "Pending Review";
        if (s === "REJECTED") return "Rejected";
        return status || "Unknown";
    };

    const getCategoryLabel = (category) => {
        if (category === "UTILITY") return "Utility";
        if (category === "MARKETING") return "Marketing";
        if (category === "AUTHENTICATION") return "Authentication";
        return category;
    };

    const getHeaderTypeIcon = (type) => {
        if (type === "IMAGE") return <ImageIcon size={14} />;
        if (type === "VIDEO") return <Video size={14} />;
        if (type === "DOCUMENT") return <File size={14} />;
        return null;
    };

    const indexOfLastTemplate = currentPage * templatesPerPage;
    const indexOfFirstTemplate = indexOfLastTemplate - templatesPerPage;
    const currentTemplates = templates.slice(indexOfFirstTemplate, indexOfLastTemplate);
    const totalPages = Math.ceil(templates.length / templatesPerPage);

    return (
        <Navbar>
            <div className="whatsapp-templates-container">
                <ToastContainer position="top-center" autoClose={3000} />

                <div className="whatsapp-templates-header">
                    <div className="whatsapp-templates-header-left">
                        <MessageSquare size={28} />
                        <h1>WhatsApp Templates</h1>
                    </div>
                    <button className="whatsapp-templates-btn-primary" onClick={() => setShowModal(true)} disabled={loading}>
                        <Plus size={18} />
                        Create Template
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="whatsapp-templates-stats-grid">
                    <div className="whatsapp-templates-stat-card">
                        <div className="whatsapp-templates-stat-value">{templates.length}</div>
                        <div className="whatsapp-templates-stat-label">Total Templates</div>
                    </div>
                    <div className="whatsapp-templates-stat-card">
                        <div className="whatsapp-templates-stat-value">{templates.filter(t => t.status === "APPROVED").length}</div>
                        <div className="whatsapp-templates-stat-label">Approved</div>
                    </div>
                    <div className="whatsapp-templates-stat-card">
                        <div className="whatsapp-templates-stat-value">{templates.filter(t => t.status === "PENDING").length}</div>
                        <div className="whatsapp-templates-stat-label">Pending</div>
                    </div>
                    <div className="whatsapp-templates-stat-card">
                        <div className="whatsapp-templates-stat-value">{templates.filter(t => t.status === "REJECTED").length}</div>
                        <div className="whatsapp-templates-stat-label">Rejected</div>
                    </div>
                </div>

                {/* Templates Table */}
                <div className="whatsapp-templates-table-container">
                    {loading && templates.length === 0 ? (
                        <div className="whatsapp-templates-loading-state">
                            <RefreshCw className="whatsapp-templates-spinning" size={32} />
                            <p>Loading templates...</p>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="whatsapp-templates-empty-state">
                            <FileText size={48} />
                            <h3>No Templates Yet</h3>
                            <p>Create your first WhatsApp message template</p>
                            <button className="whatsapp-templates-btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={18} />
                                Create Template
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="whatsapp-templates-table">
                                <thead>
                                    <tr>
                                        <th>Template Name</th>
                                        <th>Category</th>
                                        <th>Header</th>
                                        <th>Status</th>
                                        <th>Language</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTemplates.map(template => (
                                        <tr key={template.id || template.name}>
                                            <td className="whatsapp-templates-name">
                                                <span className="whatsapp-templates-name-text">{template.name}</span>
                                            </td>
                                            <td>
                                                <span className="whatsapp-templates-category-badge">{getCategoryLabel(template.category)}</span>
                                            </td>
                                            <td>
                                                {template.components?.find(c => c.type === "HEADER")?.format !== "TEXT" &&
                                                    template.components?.find(c => c.type === "HEADER")?.format ? (
                                                    <span className="whatsapp-templates-header-badge">
                                                        {getHeaderTypeIcon(template.components.find(c => c.type === "HEADER")?.format)}
                                                        {template.components.find(c => c.type === "HEADER")?.format}
                                                    </span>
                                                ) : (
                                                    <span className="whatsapp-templates-header-badge none">Text</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="whatsapp-templates-status-badge">
                                                    {getStatusIcon(template.status)}
                                                    {getStatusText(template.status)}
                                                </span>
                                            </td>
                                            <td>{template.language?.toUpperCase() || "EN"}</td>
                                            <td>
                                                {template.created_at
                                                    ? new Date(template.created_at).toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td className="whatsapp-templates-actions">
                                                <button className="whatsapp-templates-icon-btn view" onClick={() => handleViewDetails(template.name)} title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                                <button className="whatsapp-templates-icon-btn delete" onClick={() => handleDeleteClick(template.name)} title="Delete Template">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </div>
                            {totalPages > 1 && (
                                <div className="whatsapp-templates-pagination">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Create Template Modal */}
                {showModal && (
                    <div className="whatsapp-templates-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="whatsapp-templates-modal-content" onClick={e => e.stopPropagation()}>
                            <div className="whatsapp-templates-modal-header">
                                <h2>Create WhatsApp Template</h2>
                                <button className="whatsapp-templates-close-btn" onClick={() => setShowModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="whatsapp-templates-modal-body">
                                <div className="whatsapp-templates-form-group">
                                    <label>Template Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., order_confirmation"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <small>Use lowercase, numbers, and underscores only (no spaces, no hyphens, no special characters)</small>
                                </div>
                                <div className="whatsapp-templates-form-row">
                                    <div className="whatsapp-templates-form-group">
                                        <label>Category *</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="UTILITY">Utility – Order updates</option>
                                            <option value="MARKETING">Marketing – Promotions</option>
                                            <option value="AUTHENTICATION">Authentication – OTP</option>
                                        </select>
                                        {(formData.headerType === "IMAGE" || formData.headerType === "VIDEO") && (
                                            <small style={{ color: "#f59e0b", display: "block", marginTop: 4 }}>
                                                Note: {formData.headerType} templates will be forced to MARKETING category (WhatsApp requirement).
                                            </small>
                                        )}
                                    </div>
                                    <div className="whatsapp-templates-form-group">
                                        <label>Language *</label>
                                        <select
                                            value={formData.language}
                                            onChange={e => setFormData({ ...formData, language: e.target.value })}
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">Hindi</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="whatsapp-templates-form-group">
                                    <label>Header Type</label>
                                    <select
                                        value={formData.headerType}
                                        onChange={e => {
                                            setFormData({
                                                ...formData,
                                                headerType: e.target.value,
                                                headerMediaHandle: null,
                                                headerMediaId: null,
                                                headerImageUrl: null
                                            });
                                            setUploadedMedia(null);
                                        }}
                                    >
                                        <option value="NONE">No Header</option>
                                        <option value="TEXT">Text Header</option>
                                        <option value="IMAGE">Image Header</option>
                                        <option value="VIDEO">Video/GIF Header</option>
                                    </select>
                                </div>

                                {formData.headerType === "TEXT" && (
                                    <div className="whatsapp-templates-form-group">
                                        <label>Header Text</label>
                                        <input
                                            type="text"
                                            placeholder="Header text here"
                                            value={formData.headerText}
                                            onChange={e => setFormData({ ...formData, headerText: e.target.value })}
                                        />
                                    </div>
                                )}

                                {(formData.headerType === "IMAGE" || formData.headerType === "VIDEO") && (
                                    <div className="whatsapp-templates-form-group">
                                        <label>{formData.headerType === "IMAGE" ? "Header Image" : "Header Video/GIF"}</label>
                                        <div className="whatsapp-templates-image-upload-area">
                                            {!uploadedMedia ? (
                                                <div className="whatsapp-templates-upload-box">
                                                    <input
                                                        type="file"
                                                        accept={formData.headerType === "IMAGE" ? "image/jpeg,image/png,image/jpg" : "video/mp4"}
                                                        onChange={e => handleMediaUpload(e.target.files[0])}
                                                        disabled={uploading}
                                                        style={{ display: "none" }}
                                                        id="media-upload-input"
                                                    />
                                                    <div
                                                        className="whatsapp-templates-upload-content"
                                                        onClick={() => document.getElementById("media-upload-input").click()}
                                                    >
                                                        {uploading ? (
                                                            <>
                                                                <Loader className="whatsapp-templates-spinning" size={32} />
                                                                <p>Uploading...</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload size={32} />
                                                                <p>Click to upload {formData.headerType === "IMAGE" ? "image" : "video"}</p>
                                                                <small>
                                                                    {formData.headerType === "IMAGE"
                                                                        ? "JPEG/PNG, max 1.6MB"
                                                                        : "MP4 video, max 16MB (GIFs: upload as MP4)"}
                                                                </small>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="whatsapp-templates-uploaded-preview">
                                                    {uploadedMedia.mediaType === "image" ? (
                                                        <img src={uploadedMedia.localUrl} alt="Header preview" />
                                                    ) : (
                                                        <video src={uploadedMedia.localUrl} controls style={{ maxWidth: "100%", maxHeight: "200px" }} />
                                                    )}
                                                    <button
                                                        className="whatsapp-templates-remove-image"
                                                        onClick={() => {
                                                            setUploadedMedia(null);
                                                            setFormData({
                                                                ...formData,
                                                                headerMediaHandle: null,
                                                                headerMediaId: null,
                                                                headerImageUrl: null
                                                            });
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="whatsapp-templates-form-group">
                                    <label>Body Text *</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Use {{1}}, {{2}} for variables. Example: Your order #{{1}} has been {{2}}"
                                        value={formData.bodyText}
                                        onChange={e => setFormData({ ...formData, bodyText: e.target.value })}
                                    />
                                    <small>Use {'{{1}}'}, {'{{2}}'} for dynamic values. Maximum 2 consecutive line breaks allowed.</small>
                                </div>

                                <div className="whatsapp-templates-form-group">
                                    <label>Footer Text (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Footer text here"
                                        value={formData.footerText}
                                        onChange={e => setFormData({ ...formData, footerText: e.target.value })}
                                    />
                                </div>

                                {/* BUTTONS SECTION */}
                                <div className="whatsapp-templates-form-group">
                                    <label>Buttons (Optional)</label>
                                    <div className="whatsapp-templates-buttons-builder">
                                        {formData.buttons.map((btn, idx) => (
                                            <div key={idx} className="whatsapp-templates-button-item">
                                                <div className="whatsapp-templates-button-type-select">
                                                    {getButtonTypeIcon(btn.type)}
                                                    <select
                                                        value={btn.type}
                                                        onChange={(e) => updateButton(idx, "type", e.target.value)}
                                                    >
                                                        <option value="QUICK_REPLY">Quick Reply</option>
                                                        <option value="URL">URL Link</option>
                                                        <option value="PHONE_NUMBER">Phone Number</option>
                                                    </select>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="whatsapp-templates-button-text-input"
                                                    placeholder="Button Text"
                                                    value={btn.text}
                                                    onChange={(e) => updateButton(idx, "text", e.target.value)}
                                                    maxLength={20}
                                                />
                                                {btn.type === "URL" && (
                                                    <input
                                                        type="url"
                                                        className="whatsapp-templates-button-url-input"
                                                        placeholder="https://example.com"
                                                        value={btn.url || ""}
                                                        onChange={(e) => updateButton(idx, "url", e.target.value)}
                                                    />
                                                )}
                                                {btn.type === "PHONE_NUMBER" && (
                                                    <div className="whatsapp-templates-phone-input-wrapper">
                                                        <span className="whatsapp-templates-phone-prefix">+91</span>
                                                        <input
                                                            type="tel"
                                                            className="whatsapp-templates-button-phone-input"
                                                            placeholder="XXXXXXXXXX"
                                                            value={btn.phone_number || ""}
                                                            onChange={(e) => updateButton(idx, "phone_number", e.target.value)}
                                                            maxLength={10}
                                                        />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className="whatsapp-templates-remove-btn"
                                                    onClick={() => removeButton(idx)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.buttons.length < 10 && (
                                            <button
                                                type="button"
                                                className="whatsapp-templates-add-btn"
                                                onClick={addButton}
                                            >
                                                <Plus size={16} />
                                                Add Button ({formData.buttons.length}/10)
                                            </button>
                                        )}
                                        {formData.category === "MARKETING" && formData.buttons.length === 0 && (
                                            <small className="whatsapp-templates-info-text warning">
                                                ⚠️ WhatsApp requires a "Stop Promotions" button for MARKETING templates.
                                                It will be added automatically if not present.
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div className="whatsapp-templates-template-preview">
                                    <h4>Preview:</h4>
                                    <div className="whatsapp-templates-preview-bubble">
                                        {formData.headerType === "IMAGE" && uploadedMedia && uploadedMedia.mediaType === "image" && (
                                            <div className="whatsapp-templates-preview-image">
                                                <img src={uploadedMedia.localUrl} alt="Preview" />
                                            </div>
                                        )}
                                        {formData.headerType === "VIDEO" && uploadedMedia && uploadedMedia.mediaType === "video" && (
                                            <div className="whatsapp-templates-preview-video">
                                                <video src={uploadedMedia.localUrl} controls style={{ maxWidth: "100%", maxHeight: "200px" }} />
                                            </div>
                                        )}
                                        {formData.headerType === "TEXT" && formData.headerText && (
                                            <div className="whatsapp-templates-preview-header">{formData.headerText}</div>
                                        )}
                                        <div className="whatsapp-templates-preview-body">{formData.bodyText}</div>
                                        {formData.footerText && <div className="whatsapp-templates-preview-footer">{formData.footerText}</div>}
                                        {formData.buttons.length > 0 && (
                                            <div className="whatsapp-templates-preview-buttons">
                                                {formData.buttons.map((btn, idx) => (
                                                    <div key={idx} className="whatsapp-templates-preview-button">
                                                        {btn.type === "URL" && <Link size={12} />}
                                                        {btn.type === "PHONE_NUMBER" && <Phone size={12} />}
                                                        {btn.type === "QUICK_REPLY" && <MessageCircle size={12} />}
                                                        <span>
                                                            {btn.text || `Button ${idx + 1}`}
                                                            {btn.type === "PHONE_NUMBER" && btn.phone_number && (
                                                                <span className="whatsapp-templates-preview-phone">
                                                                    (+91 {btn.phone_number})
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="whatsapp-templates-modal-footer">
                                <button className="whatsapp-templates-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="whatsapp-templates-btn-primary" onClick={handleCreateTemplate} disabled={loading || uploading}>
                                    {loading ? "Creating..." : "Create Template"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Template Details Modal */}
                {showDetailModal && selectedTemplate && (
                    <div className="whatsapp-templates-modal-overlay" onClick={() => setShowDetailModal(false)}>
                        <div className="whatsapp-templates-modal-content detail-modal" onClick={e => e.stopPropagation()}>
                            <div className="whatsapp-templates-modal-header">
                                <h2>{selectedTemplate.name}</h2>
                                <button className="whatsapp-templates-close-btn" onClick={() => setShowDetailModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="whatsapp-templates-modal-body">
                                <div className="whatsapp-templates-detail-row">
                                    <span className="whatsapp-templates-detail-label">Status:</span>
                                    <span className="whatsapp-templates-status-badge">
                                        {getStatusIcon(selectedTemplate.status)}
                                        {getStatusText(selectedTemplate.status)}
                                    </span>
                                </div>
                                <div className="whatsapp-templates-detail-row">
                                    <span className="whatsapp-templates-detail-label">Category:</span>
                                    <span className="whatsapp-templates-detail-value">{getCategoryLabel(selectedTemplate.category)}</span>
                                </div>
                                <div className="whatsapp-templates-detail-row">
                                    <span className="whatsapp-templates-detail-label">Language:</span>
                                    <span className="whatsapp-templates-detail-value">{selectedTemplate.language?.toUpperCase() || "EN"}</span>
                                </div>
                                <div className="whatsapp-templates-detail-row">
                                    <span className="whatsapp-templates-detail-label">Created:</span>
                                    <span className="whatsapp-templates-detail-value">
                                        {selectedTemplate.created_at ? new Date(selectedTemplate.created_at).toLocaleString() : "-"}
                                    </span>
                                </div>
                                <div className="whatsapp-templates-detail-components">
                                    <h4>Template Content:</h4>
                                    {selectedTemplate.components?.map((comp, idx) => (
                                        <div key={idx} className="whatsapp-templates-component-item">
                                            <strong>{comp.type}:</strong>
                                            {comp.type === "BUTTONS" ? (
                                                <div className="whatsapp-templates-buttons-list">
                                                    {comp.buttons?.map((btn, btnIdx) => (
                                                        <div key={btnIdx} className="whatsapp-templates-button-detail">
                                                            {btn.type === "URL" && <Link size={14} />}
                                                            {btn.type === "PHONE_NUMBER" && <Phone size={14} />}
                                                            <span>{btn.text}</span>
                                                            {btn.url && <small className="whatsapp-templates-button-url">{btn.url}</small>}
                                                            {btn.phone_number && <small className="whatsapp-templates-button-phone">{btn.phone_number}</small>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>{comp.text || comp.example?.body_text?.[0] || comp.example?.header_handle?.[0] || "—"}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {selectedTemplate.status === "REJECTED" && (
                                    <div className="whatsapp-templates-rejection-reason">
                                        <strong>Rejection Reason:</strong>
                                        <p>{selectedTemplate.rejection_reason || "No reason provided"}</p>
                                    </div>
                                )}
                            </div>
                            <div className="whatsapp-templates-modal-footer">
                                <button className="whatsapp-templates-btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="whatsapp-templates-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="whatsapp-templates-confirm-modal" onClick={e => e.stopPropagation()}>
                            <div className="whatsapp-templates-modal-header">
                                <h2>Confirm Deletion</h2>
                                <button className="whatsapp-templates-close-btn" onClick={() => setShowDeleteConfirm(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="whatsapp-templates-modal-body">
                                <p>Are you sure you want to delete template <strong>"{templateToDelete}"</strong>?</p>
                                <p className="whatsapp-templates-warning-text">This action cannot be undone.</p>
                            </div>
                            <div className="whatsapp-templates-modal-footer">
                                <button className="whatsapp-templates-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="whatsapp-templates-btn-danger" onClick={handleDeleteConfirm}>
                                    <Trash2 size={16} />
                                    Delete Template
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Navbar>
    );
};

export default WhatsAppTemplates;