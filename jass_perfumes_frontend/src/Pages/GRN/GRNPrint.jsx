import React from "react";
import "./GRNPrint.scss";

const GRNPrint = ({ grn }) => {
    if (!grn) return null;

    const {
        grnNumber,
        grnDate,
        poNumber,
        poDate,
        lrNumber,
        transporter,
        vehicleNo,
        vendorName,
        vendorGST,
        vendorAddress,
        vendorContact,
        vendorEmail,
        items,
        subtotal,
        cgst,
        sgst,
        igst,
        otherCharges,
        total,
        comments
    } = grn;

    const isIntraState = vendorGST?.startsWith("24");

    return (
        <div className="grn-print" id="grn-pdf">
            <div className="top-header">GSTIN: 24AAAFF2996A1...</div>
            <h2 className="title">GOODS RECEIVED NOTE (GRN)</h2>

            <div className="header-grid">
                <div className="vendor-details">
                    <h4>VENDOR</h4>
                    <p><strong>Name:</strong> {vendorName}</p>
                    <p><strong>GSTIN:</strong> {vendorGST}</p>
                    <p><strong>Address:</strong> {vendorAddress}</p>
                    <p><strong>Contact:</strong> {vendorContact}</p>
                    <p><strong>Email:</strong> {vendorEmail}</p>
                </div>

                <div className="meta-info">
                    <p><strong>GRN Number:</strong> {grnNumber}</p>
                    <p><strong>GRN Date:</strong> {grnDate}</p>
                    <p><strong>PO Number:</strong> {poNumber}</p>
                    <p><strong>PO Date:</strong> {poDate}</p>
                    <p><strong>LR Number:</strong> {lrNumber}</p>
                    <p><strong>Transporter:</strong> {transporter}</p>
                    <p><strong>Vehicle No.:</strong> {vehicleNo}</p>
                </div>
            </div>

            <table className="items-table">
                <thead>
                    <tr>
                        <th>SR NO.</th>
                        <th>ITEM #</th>
                        <th>DESCRIPTION</th>
                        <th>HSN/SAC</th>
                        <th>QTY</th>
                        <th>UNIT RATE</th>
                        <th>UNIT</th>
                        <th>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{item.name}</td>
                            <td>{item.description}</td>
                            <td>{item.hsn}</td>
                            <td>{item.qty}</td>
                            <td>{item.rate}</td>
                            <td>{item.unit}</td>
                            <td>₹{(item.qty * item.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grn-comments">
                <strong>Comments or Special Instructions:</strong>
                <p>{comments || "No"}</p>
            </div>

            <div className="bottom-section">
                <div className="totals-box">
                    <p><strong>SUBTOTAL:</strong> ₹{subtotal.toFixed(2)}</p>
                    {isIntraState ? (
                        <>
                            <p><strong>CGST @ 9%:</strong> ₹{cgst.toFixed(2)}</p>
                            <p><strong>SGST @ 9%:</strong> ₹{sgst.toFixed(2)}</p>
                        </>
                    ) : (
                        <p><strong>IGST @ 18%:</strong> ₹{igst?.toFixed(2) || "0.00"}</p>
                    )}
                    <p><strong>OTHER:</strong> ₹{Number(otherCharges || 0).toFixed(2)}</p>
                    <p><strong>TOTAL:</strong> ₹{total.toFixed(2)}</p>
                </div>

                <div className="footer-box">
                    <p className="right">For Techorses</p>
                    <p className="right"><strong>Authorised Signatory</strong></p>
                    <p className="left note">If you have any questions about this GRN, please contact</p>
                </div>
            </div>

        </div>
    );
};

export default GRNPrint;
