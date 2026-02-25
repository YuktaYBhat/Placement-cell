import { redirect } from "next/navigation";

export default function AdminDasboardPage() {
  // Redirect to the main admin dashboard
  redirect("/admin/dashboard");
}
