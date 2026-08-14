// models/invoiceModel.js
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: String,
      required: true,
    },
    customer: {
      customerId: String,
      customerNumber: String,
      name: String,
      email: String,
      mobile: String,
    },
    items: [
      {
        productId: String,
        name: String,
        barcode: String,
        hsn: String,
        category: String,
        price: Number,
        taxSlab: Number,
        quantity: Number,
        discount: Number,
        batchNumber: String,
        expiryDate: String,
        baseValue: Number,
        discountAmount: Number,
        taxAmount: Number,
        cgstAmount: Number,
        sgstAmount: Number,
        totalAmount: Number,
      },
    ],
    paymentType: {
      type: String,
      enum: ["cash", "card", "upi"],
      default: "cash",
    },
    subtotal: Number,
    baseValue: Number,
    discount: Number,
    promoDiscount: Number,
    appliedPromoCode: {
      promoId: String,
      code: String,
      discount: Number,
      description: String,
      appliedAt: Date,
    },
    loyaltyDiscount: Number,
    loyaltyCoinsUsed: Number,
    tax: Number,
    cgst: Number,
    sgst: Number,
    hasMixedTaxRates: Boolean,
    taxPercentages: [Number],
    total: Number,
    remarks: String,
    loyaltyCoinsEarned: Number,
  },
  {
    timestamps: true,
  }
);

// ========== ADD INDEXES FOR PERFORMANCE ==========
// Single field indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ date: -1 });
invoiceSchema.index({ paymentType: 1 });

// Compound indexes for common queries
invoiceSchema.index({ createdAt: -1, invoiceNumber: 1 });
invoiceSchema.index({ "customer.name": 1 });
invoiceSchema.index({ "customer.mobile": 1 });

// Index for category filtering (items.category is an array field)
invoiceSchema.index({ "items.category": 1 });

// Index for time-based queries
invoiceSchema.index({ createdAt: -1, "customer.name": 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);