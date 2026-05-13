jest.mock("@/db", () => ({
  prisma: {
    openSourceEntry: {},
    userPartnership: {},
    partnership: {},
  },
}));

jest.mock("@/app/lib/api-user-helper", () => ({
  canMutateUserDataForRequest: jest.fn(),
  getUserIdForRequest: jest.fn(),
}));

import { GET as openSourceGET } from "@/app/api/open_source/route";
import {
  GET as partnershipGET,
  POST as partnershipPOST,
  PUT as partnershipPUT,
  DELETE as partnershipDELETE,
} from "@/app/api/users/partnership/route";

describe("Smoke tests - route/module wiring", () => {
  it("exposes open_source GET handler", () => {
    expect(typeof openSourceGET).toBe("function");
  });

  it("exposes partnership route handlers", () => {
    expect(typeof partnershipGET).toBe("function");
    expect(typeof partnershipPOST).toBe("function");
    expect(typeof partnershipPUT).toBe("function");
    expect(typeof partnershipDELETE).toBe("function");
  });
});

