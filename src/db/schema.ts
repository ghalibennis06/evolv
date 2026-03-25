import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum, unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Admin users (replaces Supabase Auth) ──────────────────────────────────────

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role").notNull().default("admin"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Sessions (planning) ───────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull().default("Reformer"),
  level: text("level").notNull().default("Tous niveaux"),
  session_date: text("session_date").notNull(),
  session_time: text("session_time").notNull(),
  duration: integer("duration").notNull().default(50),
  capacity: integer("capacity").notNull().default(8),
  instructor: text("instructor").notNull(),
  price: integer("price").notNull().default(350),
  is_active: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessionParticipants = pgTable("session_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  session_id: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email").notNull(),
  payment_status: text("payment_status").notNull().default("En attente"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Pricing ───────────────────────────────────────────────────────────────────

export const pricing = pgTable("pricing", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  sessions: integer("sessions"),
  original_price: integer("original_price"),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  is_popular: boolean("is_popular").notNull().default(false),
  is_active: boolean("is_active").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  cta_text: text("cta_text").notNull().default("Réserver"),
  cta_link: text("cta_link").notNull().default("/planning"),
  description: text("description"),
  validity_days: integer("validity_days"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Packs (Carte Signature) ───────────────────────────────────────────────────

export const packs = pgTable("packs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pack_code: text("pack_code").notNull().unique(),
  client_name: text("client_name").notNull(),
  client_email: text("client_email").notNull(),
  client_phone: text("client_phone"),
  credits_total: integer("credits_total").notNull().default(10),
  credits_used: integer("credits_used").notNull().default(0),
  payment_status: text("payment_status").notNull().default("pending"),
  payment_method: text("payment_method").notNull().default("online"),
  offer_id: uuid("offer_id").references(() => pricing.id, { onDelete: "set null" }),
  offer_name: text("offer_name"),
  request_id: uuid("request_id"),
  is_active: boolean("is_active").notNull().default(true),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Code creation requests (payment flow) ────────────────────────────────────

export const codeCreationRequests = pgTable("code_creation_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  client_name: text("client_name"),
  client_email: text("client_email"),
  client_phone: text("client_phone"),
  offer_id: uuid("offer_id").references(() => pricing.id, { onDelete: "set null" }),
  offer_name: text("offer_name"),
  credits_total: integer("credits_total").notNull().default(10),
  payment_method: text("payment_method").notNull().default("online"),
  payment_status: text("payment_status").notNull().default("pending"),
  request_source: text("request_source").notNull().default("frontend"),
  request_status: text("request_status").notNull().default("pending"),
  payzone_order_id: text("payzone_order_id"),
  metadata: jsonb("metadata").notNull().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Pack usage log ────────────────────────────────────────────────────────────

export const packUsageLog = pgTable("pack_usage_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pack_id: uuid("pack_id").references(() => packs.id, { onDelete: "cascade" }).notNull(),
  pack_code: text("pack_code"),
  session_id: uuid("session_id"),
  session_title: text("session_title"),
  session_date: text("session_date"),
  session_time: text("session_time"),
  used_by_name: text("used_by_name"),
  used_by_phone: text("used_by_phone"),
  used_at: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Blackcard usage ───────────────────────────────────────────────────────────

export const blackcardUsage = pgTable("blackcard_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blackcard_id: uuid("blackcard_id").references(() => packs.id, { onDelete: "cascade" }).notNull(),
  client_id: text("client_id"),
  client_email: text("client_email"),
  session_id: uuid("session_id"),
  used_at: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Activity log ──────────────────────────────────────────────────────────────

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target_id: text("target_id"),
  metadata: jsonb("metadata").notNull().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Coaches ───────────────────────────────────────────────────────────────────

export const coaches = pgTable("coaches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role"),
  bio: text("bio"),
  image_url: text("image_url"),
  specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
  is_active: boolean("is_active").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Boutique products ─────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  image_url: text("image_url"),
  category: text("category"),
  in_stock: boolean("in_stock").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Admin drinks ──────────────────────────────────────────────────────────────

export const adminDrinks = pgTable("admin_drinks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Smoothie"),
  price: integer("price").notNull().default(0),
  is_available: boolean("is_available").notNull().default(true),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  image: text("image"),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Site content (CMS) ────────────────────────────────────────────────────────

export const siteContent = pgTable("site_content", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  section: text("section").notNull().unique(),
  content: jsonb("content").notNull().default({}),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Waitlist ──────────────────────────────────────────────────────────────────

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  session_id: uuid("session_id"),
  session_title: text("session_title"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Contact submissions ───────────────────────────────────────────────────────

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── CRM tables ────────────────────────────────────────────────────────────────

export const clientTags = pgTable("client_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  client_email: text("client_email").notNull(),
  tag: text("tag").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique().on(t.client_email, t.tag) }));

export const retentionOffers = pgTable("retention_offers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  client_email: text("client_email"),
  offer_type: text("offer_type").notNull(),
  discount_percent: integer("discount_percent"),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientFollowups = pgTable("client_followups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  client_email: text("client_email").notNull(),
  status: text("status").notNull().default("pending"),
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  session_id: uuid("session_id"),
  message: text("message"),
  send_at: timestamp("send_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
