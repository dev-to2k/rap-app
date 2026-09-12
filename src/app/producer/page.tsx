import { redirect } from "next/navigation";

/** Design route alias — producer home → upload for now (sales list later). */
export default function ProducerHome() {
  redirect("/producer/upload");
}
