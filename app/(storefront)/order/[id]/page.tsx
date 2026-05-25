import { OrderExportTimelinePage } from "./order-export-timeline-page";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  return <OrderExportTimelinePage orderId={id} />;
}
