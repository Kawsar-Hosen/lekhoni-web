import type { Metadata } from "next";
import DeleteForm from "./DeleteForm";

export const metadata: Metadata = {
  title: "Delete My Data",
  description: "Request deletion of your Lekhoni Kahini account and personal data.",
  alternates: { canonical: "/delete-request" },
};

export default function DeleteRequestPage() {
  return <DeleteForm />;
}
