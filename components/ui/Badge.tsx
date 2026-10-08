import { View, Text, StyleSheet } from "react-native";
import type { BookingStatus, PaymentMethod, PaymentStatus } from "@/types";
import { tk } from "@/lib/i18n/core";
import { useT } from "@/lib/i18n/I18nProvider";

type Variant = "status" | "payment" | "method";

const STATUS_STYLES: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: "#fef9c3", text: "#92400e", label: tk("Pending")   },
  CONFIRMED: { bg: "#dcfce7", text: "#14532d", label: tk("Confirmed") },
  COMPLETED: { bg: "#dbeafe", text: "#1e3a8a", label: tk("Completed") },
  CANCELLED: { bg: "#fee2e2", text: "#7f1d1d", label: tk("Cancelled") },
  NO_SHOW:   { bg: "#ffedd5", text: "#9a3412", label: tk("No-Show")   },
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  PENDING:  { bg: "#fef9c3", text: "#92400e", label: tk("Unpaid")    },
  RECEIPT_SUBMITTED: { bg: "#ffedd5", text: "#9a3412", label: tk("Receipt to review") },
  REJECTED: { bg: "#fee2e2", text: "#7f1d1d", label: tk("Receipt rejected") },
  PAID:     { bg: "#dcfce7", text: "#14532d", label: tk("Paid")      },
  FAILED:   { bg: "#fee2e2", text: "#7f1d1d", label: tk("Failed")    },
  REFUNDED: { bg: "#dbeafe", text: "#1e3a8a", label: tk("Refunded")  },
};

const METHOD_STYLES: Record<PaymentMethod, { bg: string; text: string; label: string }> = {
  ONLINE:     { bg: "#ede9fe", text: "#4c1d95", label: tk("Bank transfer") },
  ON_ARRIVAL: { bg: "#f1f5f9", text: "#334155", label: tk("On Arrival") },
};

interface Props {
  status?:  BookingStatus;
  paymentStatus?: PaymentStatus;
  method?:  PaymentMethod;
  small?:   boolean;
}

export default function Badge({ status, paymentStatus, method, small }: Props) {
  const { t } = useT();
  let style: { bg: string; text: string; label: string } | undefined;

  if (status)        style = STATUS_STYLES[status];
  else if (paymentStatus) style = PAYMENT_STATUS_STYLES[paymentStatus];
  else if (method)   style = METHOD_STYLES[method];

  if (!style) return null;

  return (
    <View style={[s.badge, { backgroundColor: style.bg }, small && s.small]}>
      <Text style={[s.text, { color: style.text }, small && s.smallText]}>
        {t(style.label)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  text:      { fontSize: 12, fontWeight: "600" },
  small:     { paddingHorizontal: 6, paddingVertical: 2 },
  smallText: { fontSize: 11 },
});
