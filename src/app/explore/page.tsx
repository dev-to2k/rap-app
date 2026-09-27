import { redirect } from "next/navigation";

/** Nav / deep-link alias — marketplace home is `/`. */
export default function ExplorePage() {
  redirect("/");
}
