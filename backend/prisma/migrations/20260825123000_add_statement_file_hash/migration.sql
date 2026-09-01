ALTER TABLE "BankStatement" ADD COLUMN "fileHash" TEXT;

CREATE INDEX "BankStatement_organizationId_fileHash_idx"
ON "BankStatement" ("organizationId", "fileHash");