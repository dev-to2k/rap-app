import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const updateManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      updateMany: (...args: unknown[]) => updateManyMock(...args),
    },
  },
}));

import { promoteBuyerToProducer, roleAfterBuyerPromote } from "@/lib/promote-producer";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("roleAfterBuyerPromote", () => {
  it("promotes buyer and leaves producer and admin unchanged", () => {
    expect(roleAfterBuyerPromote("buyer")).toBe("producer");
    expect(roleAfterBuyerPromote("producer")).toBe("producer");
    expect(roleAfterBuyerPromote("admin")).toBe("admin");
  });
});

describe("promoteBuyerToProducer", () => {
  it("updates a buyer row to producer with a role guard", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u1",
      email: "qc-upload-1002@rap.app",
      name: "QC",
      role: "buyer",
    });
    updateManyMock.mockResolvedValue({ count: 1 });

    const result = await promoteBuyerToProducer("u1");
    expect(result).toEqual({
      id: "u1",
      email: "qc-upload-1002@rap.app",
      name: "QC",
      role: "producer",
    });
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "u1", role: "buyer" },
      data: { role: "producer" },
    });
  });

  it("does not write when the user is already a producer", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u2",
      email: "prod@rap.app",
      name: "Prod",
      role: "producer",
    });
    const result = await promoteBuyerToProducer("u2");
    expect(result?.role).toBe("producer");
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("does not overwrite admin", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u3",
      email: "admin@rap.app",
      name: "Admin",
      role: "admin",
    });
    const result = await promoteBuyerToProducer("u3");
    expect(result).toEqual({
      id: "u3",
      email: "admin@rap.app",
      name: "Admin",
      role: "admin",
    });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("returns null when the user is missing", async () => {
    findUniqueMock.mockResolvedValue(null);
    expect(await promoteBuyerToProducer("missing")).toBeNull();
    expect(updateManyMock).not.toHaveBeenCalled();
  });
});
