import React from "react";
import logo from "../../Assets/logo/logo.png";
import bg_logo from "../../Assets/logo/bg_logo.jpg";
import "./CustomerPDFTemplate.scss";

const CustomerPDFTemplate = ({ customer }) => {
  return (
    <div className="pdf-container">
      {/* Background Watermark */}
      <div className="pdf-watermark"></div>
      
      {/* Header that will repeat on each page */}
      <header className="pdf-header">
        <div className="header-content">
          <img 
            src={logo}
            alt="Company Logo" 
            className="logo"
          />
          <div className="company-info">
            <h2>Techorses</h2>
            <p>Sayajiganj, Vadodara</p>
            <p>Gujarat, 390005</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pdf-content">
        <h1 className="pdf-title">Customer Details</h1>
        
        <div className="customer-details">
          <h2>{customer.customerName}</h2>
          <hr />
          
          <div className="detail-item">
            <strong>Company Name:</strong> {customer.companyName || 'N/A'}
          </div>
          
          <div className="detail-item">
            <strong>GST Number:</strong> {customer.gstNumber || 'N/A'}
          </div>
          
          <div className="detail-item">
            <strong>Primary Email:</strong> {customer.email || 'N/A'}
          </div>
          
          {customer.email2 && (
            <div className="detail-item">
              <strong>Secondary Email:</strong> {customer.email2}
            </div>
          )}
          
          {customer.email3 && (
            <div className="detail-item">
              <strong>Tertiary Email:</strong> {customer.email3}
            </div>
          )}
          
          <div className="detail-item">
            <strong>Primary Contact:</strong> {customer.contactNumber || 'N/A'}
          </div>
          
          {customer.contactNumber2 && (
            <div className="detail-item">
              <strong>Secondary Contact:</strong> {customer.contactNumber2}
            </div>
          )}
          
          {customer.contactNumber3 && (
            <div className="detail-item">
              <strong>Tertiary Contact:</strong> {customer.contactNumber3}
            </div>
          )}
          
          <div className="detail-item">
            <strong>Address:</strong> {customer.address || 'N/A'}
          </div>
          
          <div className="detail-item">
            <strong>City:</strong> {customer.city || 'N/A'}
          </div>
          
          <div className="detail-item">
            <strong>Pincode:</strong> {customer.pincode || 'N/A'}
          </div>
        </div>
      </main>

      {/* Footer that will repeat on each page */}
      <footer className="pdf-footer">
        <div className="footer-content">
          <p>Techorses • Phone: (123) 456-7890 • Email: info@techorses.com</p>
          <p>Website: www.techorses.com</p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerPDFTemplate;