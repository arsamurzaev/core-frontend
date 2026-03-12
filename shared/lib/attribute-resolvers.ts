import type {
  ParseOptions,
  ParsedAttribute,
  ParsedAttributeValue,
  ParsedAttributeValueEntry,
} from "@/shared/lib/attribute-parsers";
import {
  parseAttributes,
  parseAttributeValuesByKey,
  toNonEmptyString,
  toNumberValue,
} from "@/shared/lib/attribute-parsers";
import type {
  AttributeDataType,
} from "@/shared/lib/attribute-parsers";
import type {
  ProductAttributeDto,
  ProductAttributeValueDto,
} from "@/shared/api/generated";

type Resolver<T, Raw> = {
  fallback: T;
  map?: (value: ParsedAttributeValue, raw: Raw | null) => T | null | undefined;
};

type ResolverResult<R> = {
  [K in keyof R]: R[K] extends Resolver<infer T, unknown> ? T : never;
};

type ResolveOptions<Raw> = {
  parsed?: Record<string, Raw>;
  parseOptions?: ParseOptions<Raw>;
};

export type NormalizedAttributeValue = string | number | boolean | undefined;

const normalizeParsedAttributeValue = (
  value: ParsedAttributeValue,
): NormalizedAttributeValue => {
  if (typeof value === "string") {
    return toNonEmptyString(value) ?? undefined;
  }

  if (typeof value === "number") {
    return toNumberValue(value) ?? undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return undefined;
};

export function resolveAttributes<
  T extends Record<string, unknown> = Record<string, undefined>,
>(
  attrs: ProductAttributeDto[] | null | undefined,
  resolvers?: undefined,
  options?: ResolveOptions<ParsedAttribute>,
): T;
export function resolveAttributes<
  const R extends Record<string, Resolver<unknown, ParsedAttribute>>,
>(
  attrs: ProductAttributeDto[] | null | undefined,
  resolvers: R,
  options?: ResolveOptions<ParsedAttribute>,
): ResolverResult<R>;
export function resolveAttributes(
  attrs: ProductAttributeDto[] | null | undefined,
  resolvers?: Record<string, Resolver<unknown, ParsedAttribute>>,
  options?: ResolveOptions<ParsedAttribute>,
): Record<string, NormalizedAttributeValue> | Record<string, unknown> {
  if (!resolvers) {
    const result: Record<string, NormalizedAttributeValue> = {};
    if (!attrs) {
      return result;
    }

    const parsed =
      options?.parsed ?? parseAttributes(attrs, options?.parseOptions);
    for (const key of Object.keys(parsed)) {
      const value = parsed[key]?.value ?? null;
      result[key] = normalizeParsedAttributeValue(value);
    }

    return result;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(resolvers)) {
    const resolver = resolvers[key];
    result[key] = resolver.fallback;
  }

  if (!attrs) {
    return result;
  }

  const parsed =
    options?.parsed ?? parseAttributes(attrs, options?.parseOptions);
  for (const key of Object.keys(resolvers)) {
    const resolver = resolvers[key];
    const raw = parsed[key] ?? null;
    const value = raw?.value ?? null;
    const mapped = resolver.map ? resolver.map(value, raw) : value;
    result[key] = mapped ?? resolver.fallback;
  }

  return result;
}

export function resolveAttributesFromValues<
  const R extends Record<string, Resolver<unknown, ParsedAttributeValueEntry>>,
>(
  attrs: ProductAttributeValueDto[] | null | undefined,
  resolvers: R,
  keyById: Record<string, string> | null | undefined,
  dataTypeById?: Record<string, AttributeDataType>,
  options?: ResolveOptions<ParsedAttributeValueEntry>,
): ResolverResult<R> {
  const result = {} as ResolverResult<R>;

  for (const key of Object.keys(resolvers)) {
    const resolver = resolvers[key];
    result[key as keyof R] = resolver.fallback as ResolverResult<R>[keyof R];
  }

  if (!attrs || !keyById) {
    return result;
  }

  const parsed =
    options?.parsed ??
    parseAttributeValuesByKey(
      attrs,
      keyById,
      dataTypeById,
      options?.parseOptions,
    );

  for (const key of Object.keys(resolvers)) {
    const resolver = resolvers[key];
    const raw = parsed[key] ?? null;
    const value = raw?.value ?? null;
    const mapped = resolver.map ? resolver.map(value, raw) : value;
    result[key as keyof R] =
      (mapped ?? resolver.fallback) as ResolverResult<R>[keyof R];
  }

  return result;
}
