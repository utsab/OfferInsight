jest.mock("@/db", () => ({
  prisma: {
    openSourceEntry: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/app/lib/api-user-helper", () => ({
  canMutateUserDataForRequest: jest.fn(),
  getUserIdForRequest: jest.fn(),
}));

import { GET } from "@/app/api/open_source/route";
import { prisma } from "@/db";
import { getUserIdForRequest } from "@/app/lib/api-user-helper";

const mockFindMany = prisma.openSourceEntry.findMany as jest.Mock;
const mockGetUserId = getUserIdForRequest as jest.Mock;

describe("GET /api/open_source", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns stored open source rows for the authenticated user", async () => {
    mockGetUserId.mockResolvedValue({ userId: "user-1", error: null });
    mockFindMany.mockResolvedValue([
      { id: 11, partnershipName: "Kevin M.", status: "plan", userId: "user-1" },
      { id: 12, partnershipName: "Kevin M.", status: "done", userId: "user-1" },
    ]);

    const response = await GET(new Request("http://localhost/api/open_source") as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: { dateCreated: "desc" },
      })
    );
    expect(body).toHaveLength(2);
    expect(body.map((r: any) => r.id)).toEqual([11, 12]);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUserId.mockResolvedValue({ userId: null, error: "Unauthorized" });

    const response = await GET(new Request("http://localhost/api/open_source") as any);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
