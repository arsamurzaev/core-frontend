import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { getCurrentSessionServer } from "@/shared/api/server/get-current-session";
import { redirect } from "next/navigation";
import { canViewIikoOrderTimeline } from "./order-page-access";
import { OrderExportTimelinePage } from "./order-export-timeline-page";

interface OrderPageContentProps {
  orderId: string;
}

export const OrderPageContent = async ({ orderId }: OrderPageContentProps) => {
  const catalog = await getCurrentCatalogServer();
  const session = catalog ? await getCurrentSessionServer(catalog.id) : null;

  if (
    !canViewIikoOrderTimeline({
      catalog,
      userRole: session?.authData?.user.role,
    })
  ) {
    redirect("/");
  }

  return <OrderExportTimelinePage orderId={orderId} />;
};
