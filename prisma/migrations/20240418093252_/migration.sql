/*
  Warnings:

  - Added the required column `apiId` to the `UserConv` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserConv" ADD COLUMN     "apiId" TEXT NOT NULL;
