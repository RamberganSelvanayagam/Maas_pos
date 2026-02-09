-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "quantity" INTEGER NOT NULL,
    "purchasePrice" DECIMAL NOT NULL,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockBatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockBatch" ("createdAt", "expiryDate", "id", "productId", "purchasePrice", "quantity") SELECT "createdAt", "expiryDate", "id", "productId", "purchasePrice", "quantity" FROM "StockBatch";
DROP TABLE "StockBatch";
ALTER TABLE "new_StockBatch" RENAME TO "StockBatch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
