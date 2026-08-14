import React from "react";
import {
  FaTags, FaTimes, FaCalendarAlt, FaClock, FaSave, FaEdit, FaTrash
} from "react-icons/fa";

const PromoCodeModal = ({
  show,
  onClose,
  promoCodes,
  isLoadingPromos,
  newPromoCode,
  newPromoDiscount,
  newPromoStartDate,
  newPromoEndDate,
  isSavingPromo,
  editingPromo,
  handlePromoCodeChange,
  handlePromoDiscountChange,
  handleStartDateChange,
  handleEndDateChange,
  savePromoCode,
  handleEditPromo,
  togglePromoStatus,
  deletePromoCode,
  getPromoStatus,
  isPromoCurrentlyActive,
  formatDate,
  promoCodeInputRef,
  promoDiscountInputRef,
  startDateInputRef,
  endDateInputRef,
}) => {
  if (!show) return null;

  return (
    <div className="discount-modal-overlay" onClick={onClose}>
      <div className="discount-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="discount-modal-header">
          <div className="discount-modal-title">
            <FaTags /> {editingPromo ? "Edit Promo Code" : "Add New Promo Code"}
          </div>
          <button className="discount-close-btn" onClick={onClose} type="button">
            <FaTimes />
          </button>
        </div>

        <div className="discount-modal-body">
          {/* Promo Code Form */}
          <div className="discount-promo-form">
            <div className="discount-form-group">
              <div className="discount-field-half">
                <label>Promo Code *</label>
                <input
                  ref={promoCodeInputRef}
                  type="text"
                  value={newPromoCode}
                  onChange={handlePromoCodeChange}
                  placeholder="Enter promo code (e.g., SUMMER20)"
                  maxLength={20}
                />
              </div>
              <div className="discount-field-half">
                <label>Discount (%) *</label>
                <input
                  ref={promoDiscountInputRef}
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  value={newPromoDiscount}
                  onChange={handlePromoDiscountChange}
                  placeholder="1-100"
                />
              </div>
            </div>

            <div className="discount-form-group">
              <div className="discount-field-half">
                <label><FaCalendarAlt /> Start Date *</label>
                <input
                  ref={startDateInputRef}
                  type="date"
                  value={newPromoStartDate}
                  onChange={handleStartDateChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="discount-field-half">
                <label><FaClock /> End Date *</label>
                <input
                  ref={endDateInputRef}
                  type="date"
                  value={newPromoEndDate}
                  onChange={handleEndDateChange}
                  min={newPromoStartDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="discount-form-actions">
              <button className="discount-cancel-btn" onClick={onClose} type="button">
                Cancel
              </button>
              <button
                className="discount-save-promo-btn"
                onClick={savePromoCode}
                disabled={
                  isSavingPromo ||
                  !newPromoCode.trim() ||
                  !newPromoDiscount ||
                  !newPromoStartDate ||
                  !newPromoEndDate
                }
                type="button"
              >
                {isSavingPromo ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    {editingPromo ? "Update Promo Code" : "Save Promo Code"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Promo Codes List */}
          <div className="discount-promo-codes-list">
            <h3>Existing Promo Codes</h3>
            {isLoadingPromos ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading promo codes...</p>
              </div>
            ) : promoCodes.length === 0 ? (
              <div className="discount-no-promos">
                <FaTags />
                <p>No promo codes found</p>
              </div>
            ) : (
              <div className="discount-promo-codes-table">
                <table>
                  <thead>
                    <tr>
                      <th>Promo Code</th>
                      <th>Discount</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((promo) => {
                      const statusInfo = getPromoStatus(promo);
                      return (
                        <tr key={promo.promoId} className={`discount-${statusInfo.status}`}>
                          <td className="discount-promo-code">{promo.code}</td>
                          <td className="discount-discount">{promo.discount}%</td>
                          <td className="discount-date">{formatDate(promo.startDate)}</td>
                          <td className="discount-date">{formatDate(promo.endDate)}</td>
                          <td>
                            <span className={`discount-status-badge discount-${statusInfo.status}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="discount-actions">
                            <button
                              className="discount-edit-btn"
                              onClick={() => handleEditPromo(promo)}
                              title="Edit"
                              type="button"
                              disabled={promo.isExpired}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="discount-toggle-btn"
                              onClick={() => togglePromoStatus(promo)}
                              title={isPromoCurrentlyActive(promo) ? "Deactivate" : "Activate"}
                              type="button"
                              disabled={promo.isExpired}
                            >
                              {isPromoCurrentlyActive(promo) ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              className="discount-delete-btn"
                              onClick={() => deletePromoCode(promo.promoId)}
                              title="Delete"
                              type="button"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeModal;
