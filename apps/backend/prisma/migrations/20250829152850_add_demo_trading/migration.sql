-- CreateTable
CREATE TABLE "DemoAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 1000000,
    "initialBalance" REAL NOT NULL DEFAULT 1000000,
    "equity" REAL NOT NULL DEFAULT 1000000,
    "margin" REAL NOT NULL DEFAULT 0,
    "freeMargin" REAL NOT NULL DEFAULT 1000000,
    "marginLevel" REAL,
    "leverage" INTEGER NOT NULL DEFAULT 25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DemoAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "volume" REAL NOT NULL,
    "openPrice" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "profit" REAL NOT NULL DEFAULT 0,
    "swap" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "Position_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "DemoAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "volume" REAL NOT NULL,
    "price" REAL,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" DATETIME,
    "cancelledAt" DATETIME,
    CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "DemoAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "positionId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "volume" REAL NOT NULL,
    "openPrice" REAL NOT NULL,
    "closePrice" REAL,
    "profit" REAL NOT NULL DEFAULT 0,
    "swap" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "openedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "DemoAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "bid" REAL NOT NULL,
    "ask" REAL NOT NULL,
    "spread" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TradingSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "defaultLeverage" INTEGER NOT NULL DEFAULT 10,
    "defaultVolume" REAL NOT NULL DEFAULT 0.01,
    "riskPercentage" REAL NOT NULL DEFAULT 2,
    "notifyOnFill" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnSL" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnTP" BOOLEAN NOT NULL DEFAULT true,
    "notifyMarginCall" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoAccount_userId_key" ON "DemoAccount"("userId");

-- CreateIndex
CREATE INDEX "MarketData_symbol_timestamp_idx" ON "MarketData"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TradingSettings_userId_key" ON "TradingSettings"("userId");
