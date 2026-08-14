/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,name]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Account_organizationId_name_key" ON "Account"("organizationId", "name");
