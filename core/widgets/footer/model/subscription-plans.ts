import { Flame, Heart, type LucideIcon, Zap } from "lucide-react";

export type SubscriptionPlan = {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  oldPrice?: string;
  price: string;
  Icon: LucideIcon;
  iconClassName: string;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "comfortable",
    title: "Удобный",
    description: "Подключение на 10 месяцев + 2 месяца в подарок.",
    benefits: [
      "Выгода 17 %",
      "Один ежегодный платёж и 2 месяца в подарок",
      "Всё включено",
    ],
    oldPrice: "34 800 ₽",
    price: "29 000 ₽ / год",
    Icon: Flame,
    iconClassName: "fill-[#4F6DE1] text-transparent",
  },
  {
    id: "best",
    title: "Самый выгодный",
    description: "Подключение на 12 месяцев\n+ 3 месяца в подарок.",
    benefits: [
      "Выгода 20 %",
      "Один ежегодный платёж и 3 месяца в подарок",
      "Всё включено",
    ],
    oldPrice: "43 500 ₽",
    price: "34 800 ₽ / год",
    Icon: Zap,
    iconClassName: "fill-violet-600 text-transparent",
  },
  {
    id: "base",
    title: "Базовый",
    description: "Подключение на 1 месяц,\nежемесячная оплата.",
    benefits: [
      "Помесячный тариф без привязки",
      "Удобно тестировать",
      "Всё включено",
    ],
    price: "2 900 ₽ / мес",
    Icon: Heart,
    iconClassName: "fill-[#38C3F5] text-transparent",
  },
] as const;
