import React from "react";
import "./WorkOrderPrint.scss";

const WorkOrderPrint = ({ workOrder }) => {
    if (!workOrder) return null;

    const {
        workOrderNumber,
        workOrderDate,
        poNumber,
        poDate,
        receiver,
        items,
        subtotal,
        cgst,
        sgst,
        igst,
        total,
        otherCharges
    } = workOrder;

    return (
        <div id="workorder-pdf">


            <div className="main-content">
                <div className="header">
                    <div className="header-left">
                        <p><strong>GSTIN:</strong> 24AAAFF2996A1..</p>
                    </div>
                    <div className="header-middle">
                        <h2>WORK ORDER</h2>
                    </div>
                    <div className="header-right">
                        <table className="header-info">
                            <tbody>
                                <tr>
                                    <td>WO No:</td>
                                    <td>{workOrderNumber}</td>
                                </tr>
                                <tr>
                                    <td>Date:</td>
                                    <td>{workOrderDate}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="party-section">
                    <div className="party-card">
                        <h3>Billed To:</h3>
                        <p><strong>{receiver?.name}</strong></p>
                        <p>{receiver?.address}</p>
                        <p>GSTIN: {receiver?.gstin}</p>
                        <p>Contact: {receiver?.contact}</p>
                        <p>Email: {receiver?.email}</p>
                    </div>
                </div>

                {poNumber && (
                    <div className="po-info">
                        <p><strong>PO Number:</strong> {poNumber}</p>
                        {poDate && <p><strong>PO Date:</strong> {poDate}</p>}
                    </div>
                )}


                <div className="items-container">
                    <table className="items-table">
                        <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "20%" }} />
                            <col style={{ width: "25%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>HSN</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.name}</td>
                                    <td>{item.description || '-'}</td>
                                    <td>{item.hsn || '-'}</td>
                                    <td>{item.quantity}</td>
                                    <td>₹{item.unitPrice.toFixed(2)}</td>
                                    <td>₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="summary-section">
                    <div className="amount-details">
                        <table>
                            <tbody>
                                <tr>
                                    <td>Subtotal:</td>
                                    <td>₹{subtotal?.toFixed(2)}</td>
                                </tr>
                                {cgst > 0 && (
                                    <tr>
                                        <td>CGST (9%):</td>
                                        <td>₹{cgst?.toFixed(2)}</td>
                                    </tr>
                                )}
                                {sgst > 0 && (
                                    <tr>
                                        <td>SGST (9%):</td>
                                        <td>₹{sgst?.toFixed(2)}</td>
                                    </tr>
                                )}
                                {igst > 0 && (
                                    <tr>
                                        <td>IGST (18%):</td>
                                        <td>₹{igst?.toFixed(2)}</td>
                                    </tr>
                                )}
                                {otherCharges > 0 && (
                                    <tr>
                                        <td>Other Charges:</td>
                                        <td>₹{otherCharges?.toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr className="total-row">
                                    <td><strong>Total:</strong></td>
                                    <td><strong>₹{total?.toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="terms-section">
                    <h4>Terms & Conditions</h4>
                    <ul>
                        <li>Payment due within 15 days from date of invoice</li>
                        <li>Interest @18% p.a. will be charged on overdue payments</li>
                    </ul>
                </div>

                <div className="signature-section">
                    <div className="signature-box">
                        <p>For Techorses</p>
                        <div className="signature-line"></div>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default WorkOrderPrint;