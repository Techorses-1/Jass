const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import your Inventory model
const Inventory = require('../models/inventory');

// Create logs and backups directories if not exists
const logsDir = path.join(__dirname, '../logs');
const backupsDir = path.join(__dirname, '../backups');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
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

// Function to create backup before reset
const createBackup = async () => {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const backupFileName = `inventory_backup_${dateStr}.json`;
    const backupFilePath = path.join(backupsDir, backupFileName);
    
    console.log("📦 Creating backup before reset...");
    
    try {
        const allInventory = await Inventory.find({}).lean();
        
        const backupData = {
            backupDate: timestamp,
            totalProducts: allInventory.length,
            products: allInventory
        };
        
        fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
        
        console.log(`✅ Backup created: ${backupFilePath}`);
        console.log(`📊 Backup contains: ${allInventory.length} products`);
        
        return backupFilePath;
    } catch (error) {
        console.error("❌ Backup failed:", error);
        throw error;
    }
};

// Function to reset all inventory
const resetAllInventory = async () => {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const logFileName = `full_inventory_reset_${dateStr}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    
    let logContent = [];
    logContent.push("=".repeat(80));
    logContent.push(`📅 FULL INVENTORY RESET REPORT`);
    logContent.push(`📅 Date & Time: ${timestamp.toLocaleString()}`);
    logContent.push(`🎯 Target: ALL products (every inventory document)`);
    logContent.push("=".repeat(80));
    logContent.push("");
    
    try {
        // Get all inventory items BEFORE reset
        console.log("📊 Fetching all inventory items...");
        const allInventory = await Inventory.find({});
        
        // Calculate statistics
        let totalProductsWithBatches = 0;
        let totalBatchesCount = 0;
        let totalQuantitySum = 0;
        let productsWithPriceHistory = 0;
        let totalPriceHistoryEntries = 0;
        
        for (const item of allInventory) {
            const batchCount = item.batches?.length || 0;
            const totalQty = item.totalQuantity || 0;
            const priceHistoryCount = item.priceHistory?.length || 0;
            
            if (batchCount > 0) totalProductsWithBatches++;
            totalBatchesCount += batchCount;
            totalQuantitySum += totalQty;
            if (priceHistoryCount > 0) productsWithPriceHistory++;
            totalPriceHistoryEntries += priceHistoryCount;
        }
        
        // Log statistics BEFORE reset
        logContent.push("📊 BEFORE RESET STATISTICS:");
        logContent.push("-".repeat(40));
        logContent.push(`📌 Total Products in Inventory: ${allInventory.length}`);
        logContent.push(`📌 Products WITH batches/quantity: ${totalProductsWithBatches}`);
        logContent.push(`📌 Products WITHOUT any stock: ${allInventory.length - totalProductsWithBatches}`);
        logContent.push(`📌 Total batches across all products: ${totalBatchesCount}`);
        logContent.push(`📌 Total quantity across all products: ${totalQuantitySum}`);
        logContent.push(`📌 Products with price history: ${productsWithPriceHistory}`);
        logContent.push(`📌 Total price history entries: ${totalPriceHistoryEntries}`);
        logContent.push("");
        
        // Perform the reset
        console.log("🔄 Resetting all inventory...");
        
        const result = await Inventory.updateMany(
            {}, // Empty filter = all products
            {
                $set: {
                    batches: [],
                    totalQuantity: 0,
                    priceHistory: []
                },
                $currentDate: {
                    updatedAt: true
                }
            }
        );
        
        // Get products AFTER reset for verification
        const afterInventory = await Inventory.find({});
        let afterTotalQuantity = 0;
        let afterTotalBatches = 0;
        let afterPriceHistory = 0;
        
        for (const item of afterInventory) {
            afterTotalQuantity += item.totalQuantity || 0;
            afterTotalBatches += item.batches?.length || 0;
            afterPriceHistory += item.priceHistory?.length || 0;
        }
        
        // Log statistics AFTER reset
        logContent.push("📊 AFTER RESET STATISTICS:");
        logContent.push("-".repeat(40));
        logContent.push(`📌 Total Products in Inventory: ${afterInventory.length}`);
        logContent.push(`📌 Products WITH batches/quantity: 0`);
        logContent.push(`📌 Products WITHOUT any stock: ${afterInventory.length}`);
        logContent.push(`📌 Total batches across all products: 0 (was ${totalBatchesCount})`);
        logContent.push(`📌 Total quantity across all products: 0 (was ${totalQuantitySum})`);
        logContent.push(`📌 Products with price history: 0 (was ${productsWithPriceHistory})`);
        logContent.push(`📌 Total price history entries: 0 (was ${totalPriceHistoryEntries})`);
        logContent.push("");
        
        // Summary of what was done
        logContent.push("✅ RESET SUMMARY:");
        logContent.push("-".repeat(40));
        logContent.push(`✓ ${result.matchedCount} products matched`);
        logContent.push(`✓ ${result.modifiedCount} products modified`);
        logContent.push(`✓ ${totalBatchesCount} batches removed`);
        logContent.push(`✓ ${totalQuantitySum} units set to 0`);
        logContent.push(`✓ ${totalPriceHistoryEntries} price history entries cleared`);
        logContent.push("");
        
        logContent.push("=".repeat(80));
        logContent.push(`✅ RESET COMPLETED - ${timestamp.toLocaleString()}`);
        logContent.push(`📁 Log file: ${logFileName}`);
        logContent.push("=".repeat(80));
        
        // Write to log file
        fs.writeFileSync(logFilePath, logContent.join('\n'), 'utf8');
        
        // Console output
        console.log("\n" + "=".repeat(80));
        console.log("✅ FULL INVENTORY RESET COMPLETED");
        console.log("=".repeat(80));
        console.log(`📊 Products matched: ${result.matchedCount}`);
        console.log(`📊 Products modified: ${result.modifiedCount}`);
        console.log(`📦 Total batches removed: ${totalBatchesCount}`);
        console.log(`🔢 Total quantity set to zero: ${totalQuantitySum}`);
        console.log(`💰 Price history entries cleared: ${totalPriceHistoryEntries}`);
        console.log(`📁 Log file: ${logFilePath}`);
        console.log("=".repeat(80));
        
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            batchesRemoved: totalBatchesCount,
            quantityZeroed: totalQuantitySum,
            priceHistoryCleared: totalPriceHistoryEntries,
            logFilePath: logFilePath
        };
        
    } catch (error) {
        console.error("❌ Error resetting inventory:", error);
        logContent.push(`❌ ERROR: ${error.message}`);
        fs.writeFileSync(logFilePath, logContent.join('\n'), 'utf8');
        throw error;
    }
};

// Main function
const runReset = async () => {
    try {
        await connectDB();
        
        console.log("\n" + "=".repeat(80));
        console.log("🚨 FULL INVENTORY RESET SCRIPT");
        console.log("=".repeat(80));
        console.log("⚠️  WARNING: This will reset ALL products in inventory!");
        console.log("⚠️  This action will:");
        console.log("     • Clear ALL batches from ALL products");
        console.log("     • Set ALL quantities to ZERO");
        console.log("     • Clear ALL price history");
        console.log("     • Update timestamps for ALL products");
        console.log("");
        
        // Get statistics before asking confirmation
        console.log("📊 Fetching current inventory statistics...");
        const allInventory = await Inventory.find({});
        let totalQty = 0;
        let totalBatches = 0;
        let totalPriceHistory = 0;
        
        for (const item of allInventory) {
            totalQty += item.totalQuantity || 0;
            totalBatches += item.batches?.length || 0;
            totalPriceHistory += item.priceHistory?.length || 0;
        }
        
        console.log("");
        console.log("📊 CURRENT INVENTORY STATISTICS:");
        console.log("-".repeat(40));
        console.log(`📌 Total Products: ${allInventory.length}`);
        console.log(`📌 Total Quantity: ${totalQty} units`);
        console.log(`📌 Total Batches: ${totalBatches}`);
        console.log(`📌 Price History Entries: ${totalPriceHistory}`);
        console.log("");
        console.log("⚠️  AFTER RESET, ALL WILL BE ZERO!");
        console.log("");
        
        // Ask for confirmation with typed YES
        console.log("⚠️  Type 'YES I AM SURE' to confirm full reset, or anything else to cancel: ");
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Your choice: ', async (answer) => {
            if (answer.trim() === 'YES I AM SURE') {
                console.log("\n📦 Creating backup before reset...");
                const backupPath = await createBackup();
                console.log(`✅ Backup saved to: ${backupPath}`);
                console.log("");
                
                console.log("🚀 Starting full inventory reset...\n");
                const result = await resetAllInventory();
                
                console.log("\n✅ FULL RESET COMPLETED SUCCESSFULLY!");
                console.log(`📁 Check log file: ${result.logFilePath}`);
                console.log(`📦 Backup saved at: ${backupPath}`);
            } else {
                console.log("\n❌ Reset cancelled by user. No changes were made.");
            }
            rl.close();
            await mongoose.disconnect();
            console.log("\n🔌 Database disconnected");
            process.exit(0);
        });
        
    } catch (error) {
        console.error("❌ Reset failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

// Run the reset
runReset();