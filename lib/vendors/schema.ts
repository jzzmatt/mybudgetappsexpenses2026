import { z } from "zod";

export const vendorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vendor name is required.")
    .max(100, "Vendor name must be 100 characters or fewer."),
  contact_info: z
    .string()
    .trim()
    .max(200, "Contact info must be 200 characters or fewer.")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type VendorSchemaInput = z.infer<typeof vendorSchema>;
