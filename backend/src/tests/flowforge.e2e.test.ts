import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://flowforge:flowforge_dev@localhost:5432/flowforge";
process.env.JWT_ACCESS_SECRET = "super-secret-access-key-change-in-production";
process.env.JWT_REFRESH_SECRET = "super-secret-refresh-key-change-in-production";

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  createUser: jest.fn(),
};

const mockTransactionsService = {
  createTransaction: jest.fn(),
  getTransaction: jest.fn(),
  submitApproval: jest.fn(),
  approveTransaction: jest.fn(),
  rejectTransaction: jest.fn(),
};

const mockReconciliationService = {
  processSatement: jest.fn(),
  getStatements: jest.fn(),
  getStatementDetails: jest.fn(),
  manualMatch: jest.fn(),
};

jest.mock("../modules/auth/auth.service", () => ({
  AuthService: jest.fn(() => mockAuthService),
}));

jest.mock("../modules/transactions/transactions.service", () => ({
  TransactionsService: jest.fn(() => mockTransactionsService),
}));

jest.mock("../modules/reconciliation/reconciliation.service", () => ({
  ReconciliationService: jest.fn(() => mockReconciliationService),
}));

jest.mock("../middleware/idempotency.middleware", () => ({
  enforceIdempotency: (
    _req: any,
    _res: any,
    next: (err?: unknown) => void
  ) => next(),
}));

import authRoutes from "../modules/auth/auth.routes";
import transactionRoutes from "../modules/transactions/transactions.routes";
import reconciliationRoutes from "../modules/reconciliation/reconcilation.routes";

type JwtTokenPayload = {
  userId: string;
  organizationId: string;
  role: string;
};

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/reconciliation", reconciliationRoutes);

const signToken = (payload: JwtTokenPayload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "1h" });

describe("FlowForge API integration suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Auth endpoints", () => {
    it("registers a new organization admin", async () => {
      mockAuthService.register.mockResolvedValue({
        user: { id: "user_1", email: "admin@flowforge.dev", name: "Admin User" },
        organization: { id: "org_1", name: "FlowForge" },
        membership: { role: "ORG_ADMIN" },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const response = await request(app).post("/api/v1/auth/register").send({
        name: "Admin User",
        email: "admin@flowforge.dev",
        password: "Passw0rd!",
        organizationName: "FlowForge",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.organization.name).toBe("FlowForge");
      expect(mockAuthService.register).toHaveBeenCalledWith({
        name: "Admin User",
        email: "admin@flowforge.dev",
        password: "Passw0rd!",
        organizationName: "FlowForge",
      });
    });

    it("logs in an existing user", async () => {
      mockAuthService.login.mockResolvedValue({
        user: { id: "user_1", email: "admin@flowforge.dev", name: "Admin User" },
        organizationId: "org_1",
        role: "ORG_ADMIN",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "admin@flowforge.dev",
        password: "Passw0rd!",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe("ORG_ADMIN");
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: "admin@flowforge.dev",
        password: "Passw0rd!",
      });
    });

    it("returns the current profile for an authenticated user", async () => {
      const token = signToken({
        userId: "user_1",
        organizationId: "org_1",
        role: "ORG_ADMIN",
      });

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        userId: "user_1",
        organizationId: "org_1",
        role: "ORG_ADMIN",
      });
    });

    it("refreshes access tokens", async () => {
      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });

      const response = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken: "existing-refresh-token",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe("new-access-token");
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith("existing-refresh-token");
    });

    it("logs out a user using a refresh token", async () => {
      mockAuthService.logout.mockResolvedValue({ success: true });

      const response = await request(app).post("/api/v1/auth/logout").send({
        refreshToken: "existing-refresh-token",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Logged out successfully.");
      expect(mockAuthService.logout).toHaveBeenCalledWith("existing-refresh-token");
    });
  });

  describe("Transactions endpoints", () => {
    const token = signToken({
      userId: "user_1",
      organizationId: "org_1",
      role: "ORG_ADMIN",
    });

    it("creates a valid double-entry transaction", async () => {
      mockTransactionsService.createTransaction.mockResolvedValue({
        id: "txn_1",
        organizationId: "org_1",
        createdById: "user_1",
        description: "Vendor invoice",
        currency: "INR",
        status: "COMPLETED",
      });

      const response = await request(app)
        .post("/api/v1/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          description: "Vendor invoice",
          currency: "INR",
          entries: [
            { accountId: "11111111-1111-4111-8111-111111111111", entryType: "DEBIT", amount: 750 },
            { accountId: "22222222-2222-4222-8222-222222222222", entryType: "CREDIT", amount: 750 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe("Vendor invoice");
      expect(mockTransactionsService.createTransaction).toHaveBeenCalledWith(
        "org_1",
        "user_1",
        expect.objectContaining({
          description: "Vendor invoice",
          currency: "INR",
        })
      );
    });

    it("lists all transaction records for an organization", async () => {
      mockTransactionsService.getTransaction.mockResolvedValue([
        { id: "txn_1", description: "Vendor invoice", amount: 750 },
        { id: "txn_2", description: "Payroll", amount: 1200 },
      ]);

      const response = await request(app)
        .get("/api/v1/transactions")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(mockTransactionsService.getTransaction).toHaveBeenCalledWith("org_1");
    });

    it("submits a transaction for approval", async () => {
      mockTransactionsService.submitApproval.mockResolvedValue({
        id: "txn_3",
        status: "PENDING_APPROVAL",
      });

      const response = await request(app)
        .post("/api/v1/transactions/submit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          description: "Travel expenses",
          amount: 900,
          currency: "INR",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("PENDING_APPROVAL");
      expect(mockTransactionsService.submitApproval).toHaveBeenCalledWith("org_1", "user_1", {
        description: "Travel expenses",
        amount: 900,
        currency: "INR",
      });
    });

    it("approves a pending transaction", async () => {
      mockTransactionsService.approveTransaction.mockResolvedValue({
        id: "txn_3",
        status: "COMPLETED",
      });

      const response = await request(app)
        .post("/api/v1/transactions/txn_3/approve")
        .set("Authorization", `Bearer ${token}`)
        .send({
          entries: [
            { accountId: "11111111-1111-4111-8111-111111111111", entryType: "DEBIT", amount: 450 },
            { accountId: "22222222-2222-4222-8222-222222222222", entryType: "CREDIT", amount: 450 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("COMPLETED");
      expect(mockTransactionsService.approveTransaction).toHaveBeenCalledWith(
        "org_1",
        "user_1",
        "txn_3",
        expect.any(Array),
        undefined
      );
    });

    it("rejects a pending transaction", async () => {
      mockTransactionsService.rejectTransaction.mockResolvedValue({
        id: "txn_3",
        status: "REJECTED",
      });

      const response = await request(app)
        .post("/api/v1/transactions/txn_3/reject")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("REJECTED");
      expect(mockTransactionsService.rejectTransaction).toHaveBeenCalledWith("org_1", "user_1", "txn_3");
    });
  });

  describe("Reconciliation endpoints", () => {
    const token = signToken({
      userId: "user_1",
      organizationId: "org_1",
      role: "ORG_ADMIN",
    });

    it("imports a bank statement", async () => {
      mockReconciliationService.processSatement.mockResolvedValue({
        statementId: "stmt_1",
        totalItems: 2,
        matchedCount: 1,
        unmatchedCount: 1,
      });

      const response = await request(app)
        .post("/api/v1/reconciliation/import")
        .set("Authorization", `Bearer ${token}`)
        .send({
          filename: "statement.csv",
          items: [
            { transactionDate: "2026-08-18T00:00:00.000Z", description: "Invoice 1", amount: 750, referenceNo: "INV-001" },
            { transactionDate: "2026-08-18T00:00:00.000Z", description: "Invoice 2", amount: 400, referenceNo: "INV-002" },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalItems).toBe(2);
      expect(mockReconciliationService.processSatement).toHaveBeenCalledWith("org_1", "statement.csv", expect.any(Array));
    });

    it("lists reconciliation statements for the organization", async () => {
      mockReconciliationService.getStatements.mockResolvedValue([
        { id: "stmt_1", filename: "statement.csv" },
      ]);

      const response = await request(app)
        .get("/api/v1/reconciliation/statements")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(mockReconciliationService.getStatements).toHaveBeenCalledWith("org_1");
    });

    it("returns details for a specific statement", async () => {
      mockReconciliationService.getStatementDetails.mockResolvedValue({
        id: "stmt_1",
        filename: "statement.csv",
        items: [{ id: "item_1", status: "MATCHED" }],
      });

      const response = await request(app)
        .get("/api/v1/reconciliation/statements/stmt_1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("stmt_1");
      expect(mockReconciliationService.getStatementDetails).toHaveBeenCalledWith("org_1", "stmt_1");
    });

    it("matches a reconciliation item to a ledger entry", async () => {
      mockReconciliationService.manualMatch.mockResolvedValue({
        id: "item_1",
        status: "MATCHED",
      });

      const response = await request(app)
        .get("/api/v1/reconciliation/items/item_1/match")
        .set("Authorization", `Bearer ${token}`)
        .send({ ledgerEntryId: "entry_1" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("MATCHED");
      expect(mockReconciliationService.manualMatch).toHaveBeenCalledWith("org_1", "item_1", "entry_1");
    });
  });
});