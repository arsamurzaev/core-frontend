export const cartQueryKeys = {
  current: ["cart", "current"] as const,
  public: (publicKey: string, checkoutKey: string) =>
    ["cart", "public", publicKey, checkoutKey] as const,
};
