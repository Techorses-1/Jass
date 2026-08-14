const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import your Inventory model
const Inventory = require('../models/inventory');

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(
            "mongodb://admin:Admin%402025@93.127.167.226:27017/jassperfumes?authSource=admin&authMechanism=SCRAM-SHA-256",
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Function to reset single product by ID
const resetSingleProduct = async (productId) => {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const logFileName = `single_product_reset_${dateStr}.log`;
    const logFilePath = path.join(logsDir, logFileName);

    let logContent = [];
    logContent.push("=".repeat(80));
    logContent.push(`📅 SINGLE PRODUCT RESET TEST`);
    logContent.push(`📅 Date & Time: ${timestamp.toLocaleString()}`);
    logContent.push(`🎯 Target: Single product only (by Product ID)`);
    logContent.push("=".repeat(80));
    logContent.push("");

    try {
        // Find the product by productId
        const product = await Inventory.findOne({ productId: productId });

        if (!product) {
            console.log(`❌ Product not found with ID: ${productId}`);
            logContent.push(`❌ Product not found with ID: ${productId}`);
            fs.writeFileSync(logFilePath, logContent.join('\n'), 'utf8');
            return null;
        }

        // Log BEFORE state
        logContent.push("📋 BEFORE RESET:");
        logContent.push("-".repeat(40));
        logContent.push(`Product Name: ${product.productName}`);
        logContent.push(`Product ID: ${product.productId}`);
        logContent.push(`Category: ${product.category}`);
        logContent.push(`Total Quantity: ${product.totalQuantity}`);
        logContent.push(`Number of Batches: ${product.batches?.length || 0}`);
        logContent.push(`Price History Entries: ${product.priceHistory?.length || 0}`);

        if (product.batches?.length > 0) {
            logContent.push(`\n📦 Current Batches:`);
            product.batches.forEach((batch, idx) => {
                logContent.push(`   ${idx + 1}. Batch: ${batch.batchNumber} | Qty: ${batch.quantity}`);
            });
        }

        logContent.push("");
        logContent.push("🔄 PERFORMING RESET...");
        logContent.push("");

        // Store old data for log
        const oldBatches = [...product.batches];
        const oldTotalQuantity = product.totalQuantity;
        const oldPriceHistory = [...product.priceHistory];

        // RESET THE PRODUCT
        product.batches = [];
        product.totalQuantity = 0;
        product.priceHistory = [];
        product.updatedAt = new Date();

        await product.save();

        // Log AFTER state
        logContent.push("✅ AFTER RESET:");
        logContent.push("-".repeat(40));
        logContent.push(`Product Name: ${product.productName}`);
        logContent.push(`Product ID: ${product.productId}`);
        logContent.push(`Total Quantity: ${product.totalQuantity} (was ${oldTotalQuantity})`);
        logContent.push(`Number of Batches: ${product.batches?.length || 0} (was ${oldBatches.length})`);
        logContent.push(`Price History Entries: ${product.priceHistory?.length || 0} (was ${oldPriceHistory.length})`);
        logContent.push("");
        logContent.push("✅ Product successfully reset!");
        logContent.push("");
        logContent.push("=".repeat(80));
        logContent.push(`✅ RESET COMPLETED - ${timestamp.toLocaleString()}`);
        logContent.push(`📁 Log file: ${logFileName}`);
        logContent.push("=".repeat(80));

        // Write to log file
        fs.writeFileSync(logFilePath, logContent.join('\n'), 'utf8');

        // Console output
        console.log("\n" + "=".repeat(80));
        console.log("✅ SINGLE PRODUCT RESET COMPLETED");
        console.log("=".repeat(80));
        console.log(`📦 Product: ${product.productName}`);
        console.log(`🆔 Product ID: ${product.productId}`);
        console.log(`📊 Total Quantity: ${oldTotalQuantity} → 0`);
        console.log(`📦 Batches: ${oldBatches.length} → 0`);
        console.log(`💰 Price History: ${oldPriceHistory.length} → 0`);
        console.log(`📁 Log file: ${logFilePath}`);
        console.log("=".repeat(80));

        return {
            productName: product.productName,
            productId: product.productId,
            oldQuantity: oldTotalQuantity,
            oldBatchesCount: oldBatches.length,
            oldPriceHistoryCount: oldPriceHistory.length
        };

    } catch (error) {
        console.error("❌ Error resetting product:", error);
        logContent.push(`❌ ERROR: ${error.message}`);
        fs.writeFileSync(logFilePath, logContent.join('\n'), 'utf8');
        throw error;
    }
};

// Main function
const runTest = async () => {
    try {
        await connectDB();

        console.log("\n🎯 SINGLE PRODUCT RESET TEST (by Product ID)");
        console.log("⚠️  This will MODIFY the database for ONE product only!");
        console.log("");

        // ==============================================
        // EDIT THIS LINE - PASTE YOUR PRODUCT ID HERE
        // ==============================================

        const productIdToReset = "b9caee96-1a00-4094-9cea-8a46e34bc3ae";

        // Other example Product IDs from your log:
        // "be395163-cc45-47ae-bd64-b52824c46a3b"  (PETAL HARMONY)
        // "57e3c563-9e95-439c-9f27-cd9084e049cb"  (STRAWBERRY CRAZY)
        // "7fda94f4-c473-4218-8acc-7f6dc647c36f"  (AQUA RUSH)

        // ==============================================

        console.log(`🎯 Target Product ID: ${productIdToReset}`);
        console.log("");

        // First, show product details before asking confirmation
        const product = await Inventory.findOne({ productId: productIdToReset });
        if (product) {
            console.log(`📦 Product Name: ${product.productName}`);
            console.log(`📊 Current Stock: ${product.totalQuantity} units`);
            console.log(`📦 Current Batches: ${product.batches?.length || 0}`);
            console.log(`💰 Price History: ${product.priceHistory?.length || 0} entries`);
            console.log("");
        } else {
            console.log(`❌ Product ID not found: ${productIdToReset}`);
            await mongoose.disconnect();
            process.exit(1);
        }

        // Ask for confirmation
        console.log("⚠️  WARNING: This will reset this product's inventory to ZERO!");
        console.log("⚠️  All batches and price history will be DELETED!");
        console.log("");
        console.log("Type 'YES' to continue or anything else to cancel: ");

        // For Windows PowerShell/CMD, we'll use a simple readline
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Your choice: ', async (answer) => {
            if (answer.trim().toUpperCase() === 'YES') {
                console.log("\n🚀 Starting reset...\n");
                const result = await resetSingleProduct(productIdToReset);
                if (result) {
                    console.log("\n✅ Reset successful!");
                }
            } else {
                console.log("\n❌ Reset cancelled by user.");
            }
            rl.close();
            await mongoose.disconnect();
            console.log("\n🔌 Database disconnected");
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ Test failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

// Run the test
runTest();