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
        console.log("🧪 TEST MODE - No changes will be made to database\n");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Function to generate log file
const generateLogFile = async () => {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const logFileName = `inventory_reset_test_${dateStr}.log`;
    const logFilePath = path.join(logsDir, logFileName);

    let logContent = [];
    logContent.push("=".repeat(80));
    logContent.push(`📅 INVENTORY RESET TEST REPORT`);
    logContent.push(`📅 Date & Time: ${timestamp.toLocaleString()}`);
    logContent.push(`🔧 Mode: TEST MODE (No actual changes made)`);
    logContent.push(`🎯 Target: ALL products (every inventory document)`);
    logContent.push("=".repeat(80));
    logContent.push("");

    try {
        // Get all inventory items
        console.log("📊 Fetching all inventory items...");
        const allInventory = await Inventory.find({}).sort({ createdAt: -1 });

        // Initialize variables HERE (outside the loop)
        let totalProductsWithBatches = 0;
        let totalBatchesCount = 0;
        let totalQuantitySum = 0;
        let productsWithPriceHistory = 0;
        let totalPriceHistoryEntries = 0;

        logContent.push(`📊 TOTAL INVENTORY ITEMS FOUND: ${allInventory.length}`);
        logContent.push("");

        if (allInventory.length === 0) {
            logContent.push("⚠️ No inventory items found in database!");
            logContent.push("");
        } else {
            // Detailed list
            logContent.push("📋 DETAILED PRODUCT LIST:");
            logContent.push("-".repeat(80));

            for (const item of allInventory) {
                const batchCount = item.batches?.length || 0;
                const totalQty = item.totalQuantity || 0;
                const priceHistoryCount = item.priceHistory?.length || 0;

                if (batchCount > 0) totalProductsWithBatches++;
                totalBatchesCount += batchCount;
                totalQuantitySum += totalQty;
                if (priceHistoryCount > 0) productsWithPriceHistory++;
                totalPriceHistoryEntries += priceHistoryCount;

                // Show products that WILL be affected
                if (batchCount > 0 || totalQty > 0 || priceHistoryCount > 0) {
                    logContent.push("");
                    logContent.push(`📦 Product: ${item.productName}`);
                    logContent.push(`   ├─ Product ID: ${item.productId}`);
                    logContent.push(`   ├─ Category: ${item.category}`);
                    logContent.push(`   ├─ Current Batches: ${batchCount}`);
                    logContent.push(`   ├─ Current Total Quantity: ${totalQty}`);
                    logContent.push(`   ├─ Price History Entries: ${priceHistoryCount}`);
                    logContent.push(`   └─ 🔄 WILL BE RESET TO: 0 batches, 0 quantity, empty price history`);

                    // Show current batches details
                    if (batchCount > 0) {
                        logContent.push(`      📋 Current Batches:`);
                        item.batches.forEach((batch, idx) => {
                            logContent.push(`         ${idx + 1}. Batch: ${batch.batchNumber} | Qty: ${batch.quantity}`);
                        });
                    }
                }
            }

            logContent.push("");
            logContent.push("=".repeat(80));
            logContent.push("📊 SUMMARY STATISTICS:");
            logContent.push("-".repeat(80));
            logContent.push(`📌 Total Products in Inventory: ${allInventory.length}`);
            logContent.push(`📌 Products WITH batches/quantity: ${totalProductsWithBatches}`);
            logContent.push(`📌 Products WITHOUT any stock: ${allInventory.length - totalProductsWithBatches}`);
            logContent.push(`📌 Total batches across all products: ${totalBatchesCount}`);
            logContent.push(`📌 Total quantity across all products: ${totalQuantitySum}`);
            logContent.push(`📌 Products with price history: ${productsWithPriceHistory}`);
            logContent.push(`📌 Total price history entries: ${totalPriceHistoryEntries}`);
            logContent.push("");
            logContent.push("🔄 WHAT WILL HAPPEN IN ACTUAL RESET:");
            logContent.push(`   ✓ ${totalProductsWithBatches} products will have their batches cleared`);
            logContent.push(`   ✓ ${totalBatchesCount} batches will be removed`);
            logContent.push(`   ✓ ${totalQuantitySum} units will be set to 0`);
            logContent.push(`   ✓ ${totalPriceHistoryEntries} price history entries will be cleared`);
            logContent.push("");

            // Sample of NEW PRODUCT structure
            logContent.push("=".repeat(80));
            logContent.push("✅ HOW PRODUCTS WILL LOOK AFTER RESET:");
            logContent.push("-".repeat(80));
            logContent.push(JSON.stringify({
                productId: "example-uuid",
                productName: "EXAMPLE PRODUCT",
                category: "example category",
                batches: [],           // ← Empty array
                totalQuantity: 0,      // ← ZERO
                priceHistory: [],      // ← Empty array
                createdAt: "unchanged",
                updatedAt: "will be updated",
                __v: "unchanged"
            }, null, 2));
            logContent.push("");

            // List of products that would be affected
            logContent.push("=".repeat(80));
            logContent.push("📋 PRODUCTS THAT WILL BE RESET (with current stock > 0):");
            logContent.push("-".repeat(80));
            const productsWithStock = allInventory.filter(item => (item.totalQuantity || 0) > 0);
            if (productsWithStock.length > 0) {
                productsWithStock.forEach((item, index) => {
                    logContent.push(`${index + 1}. ${item.productName} (${item.productId}) - Current Qty: ${item.totalQuantity}`);
                });
            } else {
                logContent.push("No products with current stock found.");
            }
            logContent.push("");

            // List of products with price history
            if (productsWithPriceHistory > 0) {
                logContent.push("=".repeat(80));
                logContent.push("💰 PRODUCTS WITH PRICE HISTORY (will be cleared):");
                logContent.push("-".repeat(80));
                const productsWithPH = allInventory.filter(item => (item.priceHistory?.length || 0) > 0);
                productsWithPH.forEach((item, index) => {
                    logContent.push(`${index + 1}. ${item.productName} (${item.productId}) - ${item.priceHistory.length} price entries`);
                });
                logContent.push("");
            }
        }

        logContent.push("=".repeat(80));
        logContent.push(`✅ TEST COMPLETED - ${timestamp.toLocaleString()}`);
        logContent.push(`📁 Log file: ${logFileName}`);
        logContent.push(`🔧 MODE: TEST ONLY - No database changes were made`);
        logContent.push("=".repeat(80));

        // Write to log file
        fs.writeFileSync(logFilePath, logContent.join('\n'), 'utf8');

        // Also print to console
        console.log("\n" + "=".repeat(80));
        console.log("✅ TEST REPORT GENERATED");
        console.log("=".repeat(80));
        console.log(`📁 Log file saved at: ${logFilePath}`);
        console.log(`📊 Total inventory items: ${allInventory.length}`);
        console.log(`🔄 Products to reset: ${totalProductsWithBatches}`);
        console.log(`📦 Total batches to remove: ${totalBatchesCount}`);
        console.log(`🔢 Total quantity to zero: ${totalQuantitySum}`);
        console.log(`💰 Price history entries to clear: ${totalPriceHistoryEntries}`);
        console.log("");
        console.log("⚠️  REMEMBER: This was a TEST only!");
        console.log("⚠️  No changes were made to your database.");
        console.log("=".repeat(80));

        return {
            logFilePath,
            totalProducts: allInventory.length,
            productsToReset: totalProductsWithBatches,
            totalBatches: totalBatchesCount,
            totalQuantity: totalQuantitySum,
            priceHistoryEntries: totalPriceHistoryEntries
        };

    } catch (error) {
        console.error("❌ Error generating test report:", error);
        logContent.push(`❌ ERROR: ${error.message}`);
        fs.writeFileSync(logFilePath, logContent.join('\n'), 'utf8');
        throw error;
    }
};

// Main function
const runTest = async () => {
    try {
        await connectDB();

        console.log("🧪 Starting inventory reset TEST...\n");

        const results = await generateLogFile();

        console.log("\n✅ Test completed successfully!");
        console.log(`📄 Check the log file for full details: ${results.logFilePath}`);

    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Database disconnected");
        process.exit(0);
    }
};

// Run the test
runTest();