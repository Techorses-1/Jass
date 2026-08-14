import React from "react";
import "./Salesprint.scss";
import logo from "../../Assets/logo/jass_logo1.png";

const SalesPrint = ({ invoice }) => {
  if (!invoice) return null;

  const {
    invoiceNumber,
    date,
    customer,
    items,
    paymentType,
    subtotal,
    baseValue,
    discount,
    cgst,
    sgst,
    tax,
    hasMixedTaxRates,
    total,
    promoDiscount, // Add this
    loyaltyDiscount,
    appliedPromoCode,
  } = invoice;

  const termsAndConditions = `
Items once sold will not be taken back.<br />
Only manufacturing defects are eligible for replacement<br /> within 1 day of purchase.
`;

  const declaration = `
  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
  `;

  // Corrected function to convert numbers to words
  const numberToWords = (num) => {
    if (num === 0) return 'Zero Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
      'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    // Handle integer part (rupees)
    let integerPart = Math.floor(num);
    let words = '';

    if (integerPart >= 10000000) {
      words += numberToWords(Math.floor(integerPart / 10000000)) + ' Crore ';
      integerPart %= 10000000;
    }

    if (integerPart >= 100000) {
      words += numberToWords(Math.floor(integerPart / 100000)) + ' Lakh ';
      integerPart %= 100000;
    }

    if (integerPart >= 1000) {
      words += numberToWords(Math.floor(integerPart / 1000)) + ' Thousand ';
      integerPart %= 1000;
    }

    if (integerPart >= 100) {
      words += numberToWords(Math.floor(integerPart / 100)) + ' Hundred ';
      integerPart %= 100;
    }

    if (integerPart > 0) {
      if (words !== '') words += ' ';

      if (integerPart < 20) {
        words += ones[integerPart];
      } else {
        words += tens[Math.floor(integerPart / 10)];
        if (integerPart % 10 > 0) {
          words += ' ' + ones[integerPart % 10];
        }
      }
    }

    // Handle decimal part (paise)
    const decimalPart = Math.round((num - Math.floor(num)) * 100);
    if (decimalPart > 0) {
      if (words !== '') words += ' and ';
      if (decimalPart < 20) {
        words += ones[decimalPart] + ' Paise';
      } else {
        words += tens[Math.floor(decimalPart / 10)];
        if (decimalPart % 10 > 0) {
          words += ' ' + ones[decimalPart % 10] + ' Paise';
        }
      }
    }

    return words;
  };

  // Calculate discounted total for each item
  const calculateItemDiscountedTotal = (item) => {
    const quantity = item.quantity || 1;
    const price = item.price || 0;
    const discountPercentage = item.discount || 0;

    const itemTotal = price * quantity;
    const discountAmount = itemTotal * (discountPercentage / 100);
    return itemTotal - discountAmount;
  };

  // Safe number formatting
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "₹0.00";
    return `₹${Number(value).toFixed(2)}`;
  };

  // Safe number formatting without symbol
  const formatNumber = (value) => {
    if (value === undefined || value === null) return "0.00";
    return Number(value).toFixed(2);
  };

  return (
    <div id="sales-pdf">
      <div className="invoice-container">

        {/* Top Logo and Address - Company name left top, GST right top, logo & address centered */}
        <div className="invoice-header">
          <div className="company-top-info">
            <div className="company-name-left">
              <p><strong>SFP SONS (INDIA) PRIVATE LIMITED</strong></p>
            </div>
            <div className="gst-number-right">
              <p>24AAICS9235N1ZS</p>
            </div>
          </div>

          <div className="logo-address-center">
            <div className="invoice-logo">
              <img src={logo} alt="Company Logo" />
            </div>
            <div className="company-address">
              <div className="address-details">
                <p>Shop no 4, Siddharth Complex, RC Dutt Rd, Aradhana Society,</p>
                <p>Vishwas Colony, Alkapuri, Vadodara, Gujarat 390023</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Invoice Heading */}
        <div className="tax-invoice-heading">
          <h1>TAX INVOICE</h1>
        </div>

        {/* Invoice + Billing Section */}
        <div className="invoice-details-section">
          <div className="customer-info">
            <h3>Billing Details</h3>
            <table className="details-table">
              <tbody>
                <tr>
                  <td>Customer Name:</td>
                  <td>{customer?.name || "N/A"}</td>
                </tr>
                {customer?.email && (
                  <tr>
                    <td>Email:</td>
                    <td>{customer.email}</td>
                  </tr>
                )}
                {customer?.mobile && (
                  <tr>
                    <td>Mobile:</td>
                    <td>{customer.mobile}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="invoice-info">
            <h3>Invoice Details</h3>
            <table className="details-table">
              <tbody>
                <tr>
                  <td>Invoice Number:</td>
                  <td>{invoiceNumber || "N/A"}</td>
                </tr>
                <tr>
                  <td>Date:</td>
                  <td>{date || "N/A"}</td>
                </tr>
                <tr>
                  <td>Payment Type:</td>
                  <td>{(paymentType || "N/A").toUpperCase()}</td>
                </tr>
                {appliedPromoCode && (
                  <tr>
                    <td>Promo Code:</td>
                    <td>{appliedPromoCode.code} ({appliedPromoCode.discount}% off)</td>
                  </tr>
                )}
                {loyaltyDiscount > 0 && (
                  <tr>
                    <td>Coins Used:</td>
                    <td>{invoice.loyaltyCoinsUsed || 0} coins</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <div className="items-section">
          <h3>Items Details</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Barcode</th>
                <th>Product Name</th>
                <th>Item Code</th>
                <th>Qty</th>
                <th>Price (Incl. Tax)</th>
                <th>Disc %</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items && items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.barcode || "N/A"}</td>
                  <td>{item.name || "N/A"}</td>
                  <td>{item.hsn || "N/A"}</td>
                  <td>{item.quantity || 1}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatNumber(item.discount)}</td>
                  <td>{formatCurrency(calculateItemDiscountedTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="totals-section">
          <div className="amount-details">
            <table>
              <tbody>
                <tr>
                  <td>Subtotal (Incl. Tax):</td>
                  <td>{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td>Discount:</td>
                  <td>{formatCurrency(discount)}</td>
                </tr>
                {promoDiscount > 0 && (
                  <tr>
                    <td>Promo Discount:</td>
                    <td>{formatCurrency(promoDiscount)}</td>
                  </tr>
                )}

                {/* Loyalty Coins Discount - NEW SECTION */}
                {loyaltyDiscount > 0 && (
                  <tr>
                    <td>Loyalty Coins Discount:</td>
                    <td>{formatCurrency(loyaltyDiscount)}</td>
                  </tr>
                )}

                {/* Show CGST/SGST only if no mixed tax rates */}
                {!hasMixedTaxRates && cgst > 0 && sgst > 0 && (
                  <>
                    <tr>
                      <td>CGST ({invoice.taxPercentages && invoice.taxPercentages[0] ? invoice.taxPercentages[0] / 2 : 9}%):</td>
                      <td>{formatCurrency(cgst)}</td>
                    </tr>
                    <tr>
                      <td>SGST ({invoice.taxPercentages && invoice.taxPercentages[0] ? invoice.taxPercentages[0] / 2 : 9}%):</td>
                      <td>{formatCurrency(sgst)}</td>
                    </tr>
                  </>
                )}

                {/* Show GST only if mixed tax rates */}
                {hasMixedTaxRates && tax > 0 && (
                  <tr>
                    <td>GST:</td>
                    <td>{formatCurrency(tax)}</td>
                  </tr>
                )}

                <tr className="grand-total">
                  <td>Grand Total:</td>
                  <td>{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount in Words - Corrected format */}
        <div className="amount-in-words">
          <p><strong>Amount in Words:</strong> {numberToWords(total)} Only</p>
        </div>

        {/* Declaration and Terms Section */}
        <div className="declaration-terms-section">
          <div className="declaration-section">
            <h3>Declaration</h3>
            <p>{declaration}</p>
          </div>
          <div className="terms-section">
            <h3>Terms & Conditions</h3>
            <p dangerouslySetInnerHTML={{ __html: termsAndConditions }}></p>
          </div>
        </div>

        {/* Normal Footer Section */}
        <div className="invoice-footer">
          <div className="thank-you">
            <p>Thank you for your business!</p>
          </div>
          <div className="signature">
            <p>Authorized Signature</p>
            <div className="signature-line"></div>
          </div>
          <div className="developer-note">
            <p>
              Developed by <a href="https://techorses.com" target="_blank" rel="noopener noreferrer">Techorses</a>
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default SalesPrint;