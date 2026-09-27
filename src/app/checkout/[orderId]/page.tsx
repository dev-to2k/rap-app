import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  const showPayosNotConfigured = process.env.VERCEL_ENV !== "production";
  return <CheckoutClient showPayosNotConfigured={showPayosNotConfigured} />;
}
