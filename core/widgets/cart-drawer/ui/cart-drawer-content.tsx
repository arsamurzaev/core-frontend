"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { CartCardList } from "@/core/widgets/cart-drawer/ui/cart-card-list";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";
import React from "react";

const CART_DRAWER_SKELETON_ITEMS_COUNT = 3;

interface CartDrawerContentProps {
  comment: string;
  isLoading?: boolean;
  isManagedPublicCart: boolean;
  isCommentLocked?: boolean;
  isPublicMode: boolean;
  items: CartItemView[];
  actionRenderer?: (productId: string) => React.ReactNode;
  onCommentChange: (comment: string) => void;
  onItemClick: (product: ProductWithDetailsDto) => void;
  status: string | null;
  statusMessage: string | null;
}

const CartDrawerContentSkeleton: React.FC = () => {
  return (
    <>
      <ul className="space-y-4" aria-hidden>
        {Array.from(
          { length: CART_DRAWER_SKELETON_ITEMS_COUNT },
          (_, index) => (
            <li key={index}>
              <div className="shadow-custom relative grid grid-flow-col grid-cols-[auto_1fr] items-center gap-2 overflow-hidden rounded-lg pl-0 sm:grid-cols-[auto_1fr]">
                <Skeleton className="aspect-[3/4] h-25 rounded-none sm:h-[150px]" />
                <div className="flex h-full items-center p-2 pl-0">
                  <div className="flex h-full flex-1 flex-col justify-between space-y-2 py-1">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-11/12" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-26 rounded-full" />
                </div>
              </div>
            </li>
          ),
        )}
      </ul>

      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-[100px] w-full rounded-lg" />
      </div>
    </>
  );
};

export const CartDrawerContent: React.FC<CartDrawerContentProps> = ({
  comment,
  isLoading = false,
  isManagedPublicCart,
  isCommentLocked = false,
  isPublicMode,
  items,
  actionRenderer,
  onCommentChange,
  onItemClick,
  status,
  statusMessage,
}) => {
  const hasItems = items.length > 0;
  const normalizedComment = comment.trim();
  const shouldShowStatusMessage =
    !isManagedPublicCart &&
    status === "IN_PROGRESS" &&
    Boolean(statusMessage?.trim());
  const shouldShowCommentEditor = !isCommentLocked;
  const shouldShowReadonlyComment = isCommentLocked && Boolean(normalizedComment);

  return (
    <div className="my-2 space-y-6 overflow-y-auto px-2 py-2">
      {shouldShowStatusMessage ? (
        <div className="rounded-lg border border-[#F0D98A] bg-[#FFF8D9] px-4 py-3">
          <p className="text-sm font-medium">{statusMessage}</p>
        </div>
      ) : null}

      {isLoading ? (
        <CartDrawerContentSkeleton />
      ) : hasItems ? (
        <CartCardList
          items={items}
          actionRenderer={actionRenderer}
          onItemClick={(item) => {
            if (item.product) {
              onItemClick(item.product);
            }
          }}
        />
      ) : (
        <div className="space-y-2 text-center">
          <p className="text-xl font-bold sm:text-2xl">
            {isPublicMode ? "Публичная корзина пуста" : "Новая корзина пуста"}
          </p>
          <p className="text-xs sm:text-base">
            {isPublicMode ? (
              <>
                Вы можете открыть эту корзину позже по сохранённой ссылке.
                <br /> Сверните окно и выберите, что вам понравится.
              </>
            ) : (
              <>
                Вы можете посмотреть все ваши активные заказы <br /> и/или
                собрать новую корзину. Сверните <br /> окно и выберите, что вам
                понравится.
              </>
            )}
          </p>
        </div>
      )}

      {!isLoading && hasItems && shouldShowCommentEditor ? (
        <>
          <p className="text-sm">
            Пожалуйста, впишите в поле ваши пожелания или комментарий к заказу.
            Это нужно для того, чтобы мы лучше поняли, что нужно вам.
          </p>

          <div className="space-y-3">
            <h3 className="text-xl font-bold">Комментарий к заказу</h3>

            <Textarea
              minRows={4}
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              className="border-muted shadow-custom min-h-25 rounded-lg border p-3"
              placeholder="Укажите в этом поле желаемые характеристики или пожелания. Например: размер S футболки, серый цвет ковра, 38 размер балеток, чёрный пылесос"
            />
          </div>
        </>
      ) : null}

      {!isLoading && hasItems && shouldShowReadonlyComment ? (
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Комментарий:</h3>
          <p className="whitespace-pre-wrap text-sm">{normalizedComment}</p>
        </div>
      ) : null}
    </div>
  );
};
