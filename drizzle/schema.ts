import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";

export const patients = pgTable("patient", {
  id: text("id").primaryKey(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const docs = pgTable("doc", {
  id: text("id").notNull().primaryKey(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  patientId: text("patient_id").references(() => patients.id, {
    onDelete: "cascade",
  }),
});

export const docsRelations = relations(docs, ({ one }) => ({
  patient: one(patients, {
    fields: [docs.patientId],
    references: [patients.id],
  }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  docs: many(docs),
}));
