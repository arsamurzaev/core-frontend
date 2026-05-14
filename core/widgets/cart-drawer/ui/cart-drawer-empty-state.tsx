"use client";

import React from "react";

interface CartDrawerEmptyStateProps {
  isPublicMode: boolean;
}

export const CartDrawerEmptyState: React.FC<CartDrawerEmptyStateProps> = ({
  isPublicMode,
}) => {
  return (
    <div className="space-y-2 text-center">
      <p className="text-xl font-bold sm:text-2xl">
        {isPublicMode
          ? "Публичная корзина пуста"
          : "Новая корзина пуста"}
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
  );
};
