export const cartQueryKeys = {
  current: ["cart", "current"] as const,
  public: (publicKey: string) => ["cart", "public", publicKey] as const,
};
