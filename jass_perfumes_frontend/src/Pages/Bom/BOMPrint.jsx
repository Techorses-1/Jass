import React from "react";
import "./BOMPrint.scss";

const BOMPrint = ({ bom }) => {
  if (!bom) return null;

  const {
    productName,
    description,
    hsnCode,
    items,
  } = bom;

  return (
    <div id="bom-pdf" className="bom-print">
      <h2 className="title">Bill of Materials (BOM)</h2>

      <div className="details-columns">
        <div className="label">Product Name:</div>
        <div className="value">{productName}</div>

        <div className="label">Description:</div>
        <div className="value">{description}</div>

        <div className="label">HSN/SAC Code:</div>
        <div className="value">{hsnCode}</div>
      </div>

      <table className="items-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Description</th>
            <th>Required Qty</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, index) => (
            <tr key={index}>
              <td>{item.itemName}</td>
              <td>{item.itemDescription}</td>
              <td>{item.requiredQty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="footer-right">
        <p><strong>For Techorses</strong></p>
        <p><strong>Authorised Signatory</strong></p>
      </div>
    </div>
  );
};

export default BOMPrint;