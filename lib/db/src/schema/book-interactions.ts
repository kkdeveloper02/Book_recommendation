import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const bookFavoritesTable = pgTable(
  "book_favorites",
  {
    userId: text("user_id").notNull(),
    bookId: text("book_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.bookId] })],
);

export const bookRatingsTable = pgTable(
  "book_ratings",
  {
    userId: text("user_id").notNull(),
    bookId: text("book_id").notNull(),
    rating: integer("rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.bookId] })],
);
