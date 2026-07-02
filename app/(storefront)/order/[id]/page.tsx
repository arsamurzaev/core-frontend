import { OrderPageContent } from "@/core/views/order";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  return <OrderPageContent orderId={id} />;
}
