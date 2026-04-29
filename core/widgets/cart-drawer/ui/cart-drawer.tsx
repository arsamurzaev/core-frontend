"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartDrawerContent } from "@/core/widgets/cart-drawer/ui/cart-drawer-content";
import { CartDrawerFooter } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer";
import { CartDrawerHeader } from "@/core/widgets/cart-drawer/ui/cart-drawer-header";
import { ProductDrawer } from "@/core/widgets/product-drawer/ui/product-drawer";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { useIsIOS } from "@/shared/lib/use-ios-scroll-fix";
import { cn, getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { confirm } from "@/shared/ui/confirmation";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { usePathname } from "next/navigation";
import React from "react";
import { toast } from "sonner";

const SNAP_POINTS = ["111px", 1] as const;
const IOS_SCROLL_IDLE_DELAY_MS = 220;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось обновить корзину.";
}

interface CartDrawerProps {
  actionRenderer?: (productId: string) => React.ReactNode;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ actionRenderer }) => {
  const {
    autoExpandPublicCartAccessKey,
    canShare,
    clearCart,
    completeManagedOrder,
    detachPublicCart,
    isBusy,
    isLoading,
    isManagedPublicCart,
    isPublicMode,
    items,
    prepareShareOrder,
    publicAccess,
    status,
    statusMessage,
    shouldUseCartUi,
    totals,
  } = useCart();
  const isIOS = useIsIOS();
  const catalog = useCatalog();
  const pathname = usePathname();
  const currency = items[0]?.currency ?? getCatalogCurrency(catalog, "RUB");
  const [comment, setComment] = React.useState("");
  const [snapPoint, setSnapPoint] = React.useState<string | number | null>(
    SNAP_POINTS[0],
  );
  const autoExpandedPublicCartRef = React.useRef<string | null>(null);
  const scrollIdleTimerRef = React.useRef<number | null>(null);
  const hasMountedVisibleDrawerRef = React.useRef(false);
  const [isPageScrolling, setIsPageScrolling] = React.useState(false);
  const [hasMountedVisibleDrawer, setHasMountedVisibleDrawer] =
    React.useState(false);
  const [selectedProduct, setSelectedProduct] =
    React.useState<ProductWithDetailsDto | null>(null);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = React.useState(false);

  const hasItems = items.length > 0;
  const shouldHideDrawer = !shouldUseCartUi || (!hasItems && !isPublicMode);
  const shouldHideCartWhileProductRouteOpen =
    pathname?.startsWith("/product/") ?? false;
  const isFullyExpanded = snapPoint === 1;
  const publicAccessPublicKey = publicAccess?.publicKey ?? null;
  const publicAccessCheckoutKey = publicAccess?.checkoutKey ?? null;
  const publicCartAccessKey =
    isPublicMode && publicAccessPublicKey && publicAccessCheckoutKey
      ? `${publicAccessPublicKey}:${publicAccessCheckoutKey}`
      : null;
  const shouldAutoExpandPublicCart =
    Boolean(publicCartAccessKey) &&
    autoExpandPublicCartAccessKey === publicCartAccessKey;

  React.useEffect(() => {
    hasMountedVisibleDrawerRef.current = hasMountedVisibleDrawer;
  }, [hasMountedVisibleDrawer]);

  React.useEffect(() => {
    if (!publicCartAccessKey) {
      autoExpandedPublicCartRef.current = null;
      return;
    }

    if (!shouldAutoExpandPublicCart) {
      return;
    }

    if (autoExpandedPublicCartRef.current === publicCartAccessKey) {
      return;
    }

    setSnapPoint(1);
    autoExpandedPublicCartRef.current = publicCartAccessKey;
  }, [publicCartAccessKey, shouldAutoExpandPublicCart]);

  React.useEffect(() => {
    if (!isIOS) {
      return;
    }

    const handleScroll = () => {
      if (hasMountedVisibleDrawerRef.current) {
        return;
      }

      setIsPageScrolling(true);

      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }

      scrollIdleTimerRef.current = window.setTimeout(() => {
        scrollIdleTimerRef.current = null;
        setIsPageScrolling(false);
      }, IOS_SCROLL_IDLE_DELAY_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = null;
      }
    };
  }, [isIOS]);

  React.useEffect(() => {
    if (shouldHideDrawer) {
      setHasMountedVisibleDrawer(false);
      return;
    }

    if (isIOS && isPageScrolling) {
      return;
    }

    setHasMountedVisibleDrawer(true);
  }, [isIOS, isPageScrolling, shouldHideDrawer]);

  const handleHeaderAction = React.useCallback(async () => {
    if (isManagedPublicCart) {
      return;
    }

    if (isPublicMode) {
      const isConfirmed = await confirm({
        title: "Открепить публичную корзину?",
        description:
          "Ссылка останется рабочей, но эта корзина перестанет быть привязанной к текущей сессии.",
        confirmText: "Открепить",
        cancelText: "Отмена",
      });

      if (!isConfirmed) {
        return;
      }

      detachPublicCart();
      setSnapPoint(SNAP_POINTS[0]);
      toast.success("Публичная корзина откреплена.");
      return;
    }

    if (!hasItems) {
      return;
    }

    const isConfirmed = await confirm({
      title: "Очистить корзину?",
      description: "Все товары будут удалены из текущей корзины.",
      confirmText: "Очистить",
      cancelText: "Отмена",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      setSnapPoint(SNAP_POINTS[0]);
      await clearCart();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [
    clearCart,
    detachPublicCart,
    hasItems,
    isManagedPublicCart,
    isPublicMode,
  ]);

  const handleCompleteOrder = React.useCallback(async () => {
    const isConfirmed = await confirm({
      title: "Завершить заказ?",
      description:
        "После подтверждения корзина будет переведена в завершенный заказ.",
      confirmText: "Завершить",
      cancelText: "Отмена",
    });

    if (!isConfirmed) {
      return;
    }

    await completeManagedOrder();
    toast.success("Заказ завершен.");
  }, [completeManagedOrder]);

  const handleOpenProduct = React.useCallback(
    (product: ProductWithDetailsDto) => {
      setSelectedProduct(product);
      setIsProductDrawerOpen(true);
    },
    [],
  );

  const handleProductDrawerOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setIsProductDrawerOpen(nextOpen);
    },
    [],
  );

  const handleProductDrawerAfterClose = React.useCallback(() => {
    setSelectedProduct(null);
  }, []);

  if (shouldHideDrawer || (isIOS && !hasMountedVisibleDrawer)) {
    return null;
  }

  return (
    <>
      {!shouldHideCartWhileProductRouteOpen ? (
        <AppDrawer
          open
          handleOnly
          modal={false}
          noBodyStyles
          onClose={() => setSnapPoint(1)}
          snapPoints={SNAP_POINTS as unknown as (string | number)[]}
          activeSnapPoint={snapPoint}
          setActiveSnapPoint={setSnapPoint}
          snapToSequentialPoint
        >
          <AppDrawer.Content
            hideOverlay
            handleWrapperClassName="pt-0"
            handleClassName="mx-auto mt-2 h-1 w-[50px] rounded-full bg-muted"
            className={cn(
              "shadow-custom bg-background fixed inset-x-0 bottom-0 z-30 mx-auto mt-24 flex h-full max-h-[94%] max-w-180 flex-col rounded-t-2xl border pb-0 focus:outline-none",
              "max-h-[calc(100%-25px)] w-[98%] transition-all",
              snapPoint === 1 && "w-full",
            )}
          >
            <CartDrawerHeader
              currency={currency}
              hasAction={!isManagedPublicCart && (isPublicMode || hasItems)}
              hasDiscount={totals.hasDiscount}
              onActionClick={() => void handleHeaderAction()}
              price={totals.subtotal}
              setSnapPoint={setSnapPoint}
              snapPoint={snapPoint}
              totalPrice={totals.originalSubtotal}
              totalQuantity={totals.itemsCount}
            />

            <DrawerScrollArea>
              <CartDrawerContent
                comment={comment}
                isLoading={isLoading}
                isManagedPublicCart={isManagedPublicCart}
                isPublicMode={isPublicMode}
                items={items}
                actionRenderer={actionRenderer}
                onCommentChange={setComment}
                onItemClick={handleOpenProduct}
                status={status}
                statusMessage={statusMessage}
              />
            </DrawerScrollArea>

            <CartDrawerFooter
              canShare={canShare}
              currency={currency}
              hasDiscount={totals.hasDiscount}
              hasItems={hasItems}
              isBusy={isBusy}
              isManagedPublicCart={isManagedPublicCart}
              onCollapse={!canShare && !isManagedPublicCart && isFullyExpanded ? () => setSnapPoint(SNAP_POINTS[0]) : undefined}
              onCompleteOrder={handleCompleteOrder}
              onShareClick={() => prepareShareOrder(comment)}
              price={totals.subtotal}
              totalPrice={totals.originalSubtotal}
            />
          </AppDrawer.Content>
        </AppDrawer>
      ) : null}

      {selectedProduct ? (
        <ProductDrawer
          open={isProductDrawerOpen}
          product={selectedProduct}
          productSlug={selectedProduct.slug}
          onOpenChange={handleProductDrawerOpenChange}
          onAfterClose={handleProductDrawerAfterClose}
        />
      ) : null}
    </>
  );
};
