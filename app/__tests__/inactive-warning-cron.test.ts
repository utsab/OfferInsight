jest.mock("@/db", () => ({
  prisma: {
    user: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/app/lib/email", () => ({
  sendEmail: jest.fn(),
  buildInactivityWarningEmail: jest.fn(() => ({ subject: "first", text: "first", html: "<p>first</p>" })),
  buildSecondWarningEmail: jest.fn(() => ({ subject: "second", text: "second", html: "<p>second</p>" })),
  buildRemovalNoticeEmail: jest.fn(() => ({ subject: "removal", text: "removal", html: "<p>removal</p>" })),
}));

import { GET } from "@/app/api/cron/inactive-warning/route";
import { prisma } from "@/db";
import { sendEmail } from "@/app/lib/email";

const mockUpdateMany = prisma.user.updateMany as jest.Mock;
const mockFindMany = prisma.user.findMany as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;

describe("GET /api/cron/inactive-warning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindMany.mockResolvedValue([]);
    mockUpdate.mockResolvedValue({});
    mockSendEmail.mockResolvedValue({});
  });

  it("resets warning state for reactivated users before warning send pass", async () => {
    const request = new Request("http://localhost:3000/api/cron/inactive-warning", {
      method: "GET",
      headers: { authorization: "Bearer test-cron-secret" },
    });

    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          inactivityWarningCount: { gt: 0 },
          removedFromResumeBook: false,
        }),
        data: {
          inactivityWarningCount: 0,
          lastInactivityWarningSent: null,
        },
      })
    );
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(body.warningsReset).toBe(1);
  });

  it("returns 401 when bearer token is missing or invalid", async () => {
    const request = new Request("http://localhost:3000/api/cron/inactive-warning", {
      method: "GET",
      headers: { authorization: "Bearer wrong-token" },
    });

    const response = await GET(request as any);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
