import { redirect } from "next/navigation";

export default function HomePage() {
  // Automatically redirect the root domain to the login page
  redirect("/auth/login");
}
