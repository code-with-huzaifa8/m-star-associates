import { z } from "zod";
const plain = z.string().trim();
export const leadSchema = z
  .object({
    name: plain.min(2).max(100),
    email: plain.email().max(160),
    phone: plain.regex(/^[+\d\s().-]{7,25}$/),
    kind: z.enum([
      "General inquiry",
      "Consultation",
      "Property valuation",
      "Property submission",
      "Property requirement",
      "Construction quotation",
      "Property inquiry",
      "Viewing request",
    ]),
    message: plain.min(10).max(3000),
    interest: plain.max(100).optional().default(""),
    date: plain
      .regex(/^$|^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .default(""),
    property: plain.max(100).optional().default(""),
    location: plain.max(300).optional().default(""),
    propertyType: plain.max(80).optional().default(""),
    area: plain.max(30).optional().default(""),
    unit: plain.max(60).optional().default(""),
    consent: z.literal(true),
    source: plain.max(200).optional().default("/contact"),
    website: plain.max(0).optional().default(""),
    elapsed: z.number().min(1500),
  })
  .superRefine((d, ctx) => {
    if (
      ["Property valuation", "Property submission"].includes(d.kind) &&
      !d.location
    )
      ctx.addIssue({
        code: "custom",
        message: "Property location is required",
        path: ["location"],
      });
    if (
      d.date &&
      d.date <
        new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
          new Date(),
        )
    )
      ctx.addIssue({
        code: "custom",
        message: "Please choose today or a future date",
        path: ["date"],
      });
  });
export const safeImage = z
  .string()
  .trim()
  .max(1500)
  .refine(
    (s) =>
      !s ||
      s.startsWith("/api/media/") ||
      s.startsWith("/assets/") ||
      /^https:\/\//.test(s),
    "Use a hosted image or HTTPS URL",
  );
export const propertySchema = z
  .object({
    id: plain.min(1).max(100),
    title: plain.min(3).max(150),
    area: plain.min(2).max(150),
    city: plain.default("Karachi"),
    type: z.enum(["House", "Apartment", "Plot", "Office"]),
    purpose: z.enum(["Buy", "Rent"]),
    price: z.number().min(0).max(1e13),
    beds: z.number().int().min(0).max(100),
    baths: z.number().int().min(0).max(100),
    sqyd: z.number().min(0).max(1e8),
    gallery: z.array(safeImage).max(20).optional().default([]),
    panorama: safeImage.optional().default(""),
    model: safeImage.optional().default(""),
    video: safeImage.optional().default(""),
    image: safeImage.refine((s) => !!s, "An image is required"),
    featured: z.boolean(),
    status: z.enum([
      "Draft",
      "Ready",
      "Under construction",
      "Plot",
      "Archived",
    ]),
    furnished: z.boolean(),
    amenities: z.array(plain.max(70)).max(30),
    description: plain.min(20).max(10000),
    published: z.boolean(),
  })
  .transform((d) => ({ ...d, demo: false }));
export const contentSchema = z.object({
  id: plain.min(1).max(100),
  type: z.enum([
    "blog",
    "project",
    "faq",
    "service",
    "homepage",
    "banner",
    "testimonial",
    "offer",
  ]),
  title: plain.min(3).max(200),
  slug: plain.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150),
  body: plain.min(5).max(20000),
  link: z
    .string()
    .trim()
    .max(250)
    .refine(
      (s) =>
        !s || (s.startsWith("/") && !s.startsWith("//") && !/[\\\s]/.test(s)),
      "Choose a same-site destination",
    )
    .optional()
    .default(""),
  image: safeImage.optional().default(""),
  published: z.boolean(),
});
export const leadUpdateSchema = z.object({
  id: plain.max(100),
  status: z.enum([
    "New",
    "Contacted",
    "Qualified",
    "Scheduled",
    "Closed",
    "Archived",
  ]),
  notes: plain.max(10000).optional().default(""),
  assigned: plain.max(150).optional().default(""),
  followUp: plain
    .regex(/^$|^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .default(""),
});
export const rolePermissions = {
  owner: ["inventory", "leads", "content", "media", "settings", "users"],
  admin: ["inventory", "leads", "content", "media", "settings"],
  editor: ["inventory", "content", "media"],
  agent: ["leads"],
};
export const can = (role, permission) =>
  rolePermissions[role]?.includes(permission) || false;
