import React from "react";
import "./PurchaseOrderPrint.scss";

const PurchaseOrderPrint = ({ po }) => {
  if (!po) return null;

  const isIntraState = po.vendorGST?.startsWith("24");
  const taxSlab = po.taxSlab || 18;
  const hasDiscount = po.discount !== undefined && po.discount > 0;

  return (
    <div className="print-container" id="po-pdf">
      {/* EMPTY HEADER SPACE FOR PRE-PRINTED STATIONERY */}
      <div className="header-space"></div>

      <div className="main-content">
        {/* Company GST and LUT details - fixed alignment */}
        <div className="company-details">
          <div className="left-details">
            <p><strong>GSTIN :</strong> 24AAAFF2996A1ZS</p>
            <p><strong>State :</strong> Gujarat, Code: 24</p>
            <p><strong>PAN No :</strong> AAAFF2996A</p>
          </div>
          <div className="middle-details">
            <h3>PURCHASE ORDER</h3>
          </div>
          <div className="right-details">
            <p><strong>LUT ARN No :&nbsp;&nbsp;</strong> AD240224050202C</p>
            <p><strong>From:</strong> 01/04/2025 <strong>To:</strong> 31/03/2026</p>
          </div>
        </div>

        {/* PO details section - fixed alignment */}
        <div className="invoice-po-section">
          <div className="po-details">
            <p><strong>PO Number:</strong> {po.poNumber}</p>
          </div>
          <div className="po-date">
            <p><strong>PO Date:</strong> {po.date}</p>
          </div>
        </div>

        {/* Vendor and Shipping details - same content, new style */}
        <div className="party-section">
          <div className="party-card">
            <h3>Vendor Details:</h3>
            <p><strong>{po.companyName}</strong></p>
            <p>{po.vendorAddress}</p>
            <p>Name: {po.vendorName}</p>
            <p>GSTIN: {po.vendorGST}</p>
            <p>Contact: {po.vendorContact}</p>
            <p>Email: {po.vendorEmail}</p>
          </div>
          <div className="party-card">
            <h3>Shipping Details:</h3>
            <p><strong>{po.shipCompany || "Ferro Tube And Forge Industries"}</strong></p>
            <p>{po.shipName || po.vendorName}</p>
            <p>{po.deliveryAddress || "547, G.I.D.C. Estate, Vaghodia, Vadodara - 391760, Gujarat (India)"}</p>
            <p>Contact: {po.shipPhone || po.vendorContact}</p>
          </div>
        </div>

        {/* Items table - same content, new style */}
        <div className="items-container">
          <table className="items-table">
            <colgroup>
              <col style={{ width: "5%" }} />   {/* SR No */}
              <col style={{ width: "15%" }} />  {/* Item */}
              <col style={{ width: "30%" }} />  {/* Description */}
              <col style={{ width: "10%" }} />  {/* HSN */}
              <col style={{ width: "8%" }} />   {/* Qty */}
              <col style={{ width: "12%" }} />  {/* Rate */}
              <col style={{ width: "10%" }} />  {/* Units */}
              <col style={{ width: "10%" }} />  {/* Total */}
            </colgroup>
            <thead>
              <tr>
                <th className="sr-no">SR NO.</th>
                <th>ITEM</th>
                <th>DESCRIPTION</th>
                <th>HSN CODE</th>
                <th>QTY</th>
                <th>UNIT RATE (₹)</th>
                <th>UNITS</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="sr-no">{idx + 1}</td>
                  <td>{item.name}</td>
                  <td className="description-cell">{item.description || '-'}</td>
                  <td>{item.hsn || '-'}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.rate.toFixed(2)}</td>
                  <td>{item.unit}</td>
                  <td>₹{(item.qty * item.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Combined Notes and Summary Section - same content, new style */}
        <div className="notes-summary-section">
          {/* Notes on the left */}
          <div className="notes-column">
            {po.extraNote && (
              <div className="notes-section">
                <h4>Additional Notes:</h4>
                <p>{po.extraNote}</p>
              </div>
            )}

            {/* Terms & Conditions section */}
            {po.terms && (
              <div className="terms-section">
                <h4>Terms & Conditions:</h4>
                <pre>{po.terms}</pre>
              </div>
            )}
          </div>

          {/* Summary on the right */}
          <div className="summary-column">
            <div className="amount-details">
              <table>
                <tbody>
                  <tr><td>Subtotal:</td><td>₹{po.subtotal.toFixed(2)}</td></tr>

                  {hasDiscount && (
                    <>
                      <tr><td>Discount ({po.discount}%):</td><td>-₹{po.discountAmount.toFixed(2)}</td></tr>
                      <tr><td>Discounted Subtotal:</td><td>₹{po.discountedSubtotal.toFixed(2)}</td></tr>
                    </>
                  )}

                  {isIntraState ? (
                    <>
                      <tr><td>CGST ({taxSlab / 2}%):</td><td>₹{po.cgst.toFixed(2)}</td></tr>
                      <tr><td>SGST ({taxSlab / 2}%):</td><td>₹{po.sgst.toFixed(2)}</td></tr>
                    </>
                  ) : (
                    <tr><td>IGST ({taxSlab}%):</td><td>₹{po.igst?.toFixed(2) || ((po.total - po.subtotal).toFixed(2))}</td></tr>
                  )}

                  <tr className="total-row">
                    <td><strong>Total:</strong></td>
                    <td><strong>₹{po.total.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer section - same content, new style */}
        <div className="certification-section">
          {/* Contact note on the left */}
          <div className="contact-note">
            <p>If you have any questions about this purchase order, please contact</p>
          </div>

          {/* Signature on the right */}
          <div className="signature-box">
            <p>For Ferro Tube & Forge Industries</p>
            <div className="signature-line"></div>
            <p>Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderPrint;