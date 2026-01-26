// core/schemas/validator.ts
import { z } from "zod";
import { CardSchema } from "./types";

const slotConfigSchema = z.object({
  id: z.string().min(1),
  component: z.string().min(1),
  position: z.number(),
  visible: z.boolean(),
  props: z.record(z.string(), z.any()).optional(),
});

const cardSchemaValidator = z.object({
  id: z.string(),
  version: z.string(),
  layout: z.enum(["grid", "list", "compact"]),
  slots: z.array(slotConfigSchema),
  styles: z.record(z.string(), z.string()).optional(),
});

export function validateSchema(schema: unknown): CardSchema | null {
  const result = cardSchemaValidator.safeParse(schema);

  if (!result.success) {
    console.error("[SchemaValidation] Invalid schema:", result.error.issues);
    return null;
  }

  return { ...result.data, styles: result.data.styles || {} };
}

export function validateSchemaOrThrow(schema: unknown): CardSchema {
  const result = cardSchemaValidator.parse(schema);
  return { ...result, styles: result.styles || {} };
}
