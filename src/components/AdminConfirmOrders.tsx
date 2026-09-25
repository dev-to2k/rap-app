"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Price,
  Spinner,
} from "@/kit";

type AdminOrder = {
  id: string;
  amountVnd: number;
  status: string;
  sku?: string | null;
  createdAt?: string;
  beat?: { id: string; title: string } | null;
  buyer?: { id: string; email: string; name: string } | null;
};

function statusBadgeVariant(status: string): "warning" | "accent" | "default" {
  if (status === "pending_confirm") return "warning";
  if (status === "pending_ck") return "accent";
  return "default";
}

function statusLabel(status: string): string {
  if (status === "pending_confirm") return "Chờ xác nhận CK";
  if (status === "pending_ck") return "Chờ chuyển CK";
  return status;
}

export function AdminConfirmOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders?status=all_pending", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 403) {
        setError("Forbidden");
        setOrders([]);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Lỗi tải đơn (${res.status})`);
        setOrders([]);
        return;
      }
      const data = (await res.json()) as { orders?: AdminOrder[] };
      setOrders(data.orders ?? []);
    } catch {
      setError("Không tải được danh sách đơn");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirm(orderId: string) {
    setBusyId(orderId);
    setActionMsg("");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.code || `Confirm thất bại (${res.status})`);
        return;
      }
      setActionMsg(
        data.idempotent
          ? `Đơn ${orderId} đã mở khóa sẵn (idempotent).`
          : `Đã xác nhận & mở khóa đơn ${orderId}.`,
      );
      await load();
    } catch {
      setError("Confirm thất bại — kiểm tra mạng / session");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <PageHeader
        title="Chờ xác nhận CK"
        description="Danh sách pending_confirm + pending_ck. Xác nhận → paid → unlock PDF."
        icon="ticket"
        action={
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading || !!busyId}>
            Làm mới
          </Button>
        }
      />

      {error ? (
        <Alert variant="danger">
          {error === "Forbidden" ? (
            <p>
              Forbidden — cần role admin.{" "}
              <Link href="/login?next=/admin" className="underline">
                Đăng nhập
              </Link>
            </p>
          ) : (
            <p>{error}</p>
          )}
        </Alert>
      ) : null}

      {actionMsg ? <Alert variant="success">{actionMsg}</Alert> : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
          <Spinner /> Đang tải…
        </div>
      ) : orders.length === 0 && !error ? (
        <EmptyState
          icon="ticket"
          title="Không có đơn chờ CK"
          description="Khi buyer báo đã chuyển khoản, đơn hiện ở đây."
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Card className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-semibold text-foreground">
                      {o.beat?.title || "(không có beat)"}
                    </p>
                    <p className="truncate text-sm text-muted">{o.buyer?.email || "—"}</p>
                    <p className="font-mono text-xs text-muted">{o.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusBadgeVariant(o.status)}>{statusLabel(o.status)}</Badge>
                    <Price amount={o.amountVnd} tone="seller" />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!!busyId}
                  onClick={() => void confirm(o.id)}
                >
                  {busyId === o.id ? (
                    <>
                      <Spinner /> Đang xác nhận…
                    </>
                  ) : (
                    "Xác nhận & mở khóa"
                  )}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
