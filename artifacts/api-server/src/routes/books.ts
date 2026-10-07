import { getAuth } from "@clerk/express";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetMyBookInteractionsResponse,
  GetTrendingBooksResponse,
  RateBookBody,
  RateBookParams,
  RateBookResponse,
  RemoveBookFavoriteParams,
  RemoveBookFavoriteResponse,
  SaveBookFavoriteParams,
  SaveBookFavoriteResponse,
} from "@workspace/api-zod";
import { bookFavoritesTable, bookRatingsTable, db } from "@workspace/db";

const router: IRouter = Router();

router.get("/books/trending", async (_req, res): Promise<void> => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [ratingRows, favoriteRows] = await Promise.all([
    db
      .select({
        bookId: bookRatingsTable.bookId,
        averageRating: sql<string>`avg(${bookRatingsTable.rating})`,
        ratingCount: count(),
      })
      .from(bookRatingsTable)
      .where(gte(bookRatingsTable.updatedAt, since))
      .groupBy(bookRatingsTable.bookId),
    db
      .select({
        bookId: bookFavoritesTable.bookId,
        favoriteCount: count(),
      })
      .from(bookFavoritesTable)
      .where(gte(bookFavoritesTable.createdAt, since))
      .groupBy(bookFavoritesTable.bookId),
  ]);

  const metrics = new Map<
    string,
    { bookId: string; averageRating: number; ratingCount: number; favoriteCount: number }
  >();

  for (const row of ratingRows) {
    metrics.set(row.bookId, {
      bookId: row.bookId,
      averageRating: Number(row.averageRating) || 0,
      ratingCount: Number(row.ratingCount),
      favoriteCount: 0,
    });
  }

  for (const row of favoriteRows) {
    const current = metrics.get(row.bookId) ?? {
      bookId: row.bookId,
      averageRating: 0,
      ratingCount: 0,
      favoriteCount: 0,
    };
    current.favoriteCount = Number(row.favoriteCount);
    metrics.set(row.bookId, current);
  }

  const trending = [...metrics.values()].sort(
    (a, b) =>
      b.favoriteCount * 2 + b.ratingCount - (a.favoriteCount * 2 + a.ratingCount) ||
      b.averageRating - a.averageRating,
  );

  res.json(GetTrendingBooksResponse.parse(trending));
});

router.get("/me/interactions", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [favorites, ratings] = await Promise.all([
    db
      .select({ bookId: bookFavoritesTable.bookId })
      .from(bookFavoritesTable)
      .where(eq(bookFavoritesTable.userId, userId)),
    db
      .select({ bookId: bookRatingsTable.bookId, rating: bookRatingsTable.rating })
      .from(bookRatingsTable)
      .where(eq(bookRatingsTable.userId, userId)),
  ]);

  res.json(
    GetMyBookInteractionsResponse.parse({
      favorites: favorites.map((favorite) => favorite.bookId),
      ratings,
    }),
  );
});

router.put("/me/favorites/:bookId", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const params = SaveBookFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .insert(bookFavoritesTable)
    .values({ userId, bookId: params.data.bookId })
    .onConflictDoNothing();

  res.json(
    SaveBookFavoriteResponse.parse({
      bookId: params.data.bookId,
      saved: true,
    }),
  );
});

router.delete("/me/favorites/:bookId", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const params = RemoveBookFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(bookFavoritesTable)
    .where(
      and(
        eq(bookFavoritesTable.userId, userId),
        eq(bookFavoritesTable.bookId, params.data.bookId),
      ),
    );

  res.json(
    RemoveBookFavoriteResponse.parse({
      bookId: params.data.bookId,
      saved: false,
    }),
  );
});

router.put("/me/ratings/:bookId", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const params = RateBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = RateBookBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  await db
    .insert(bookRatingsTable)
    .values({
      userId,
      bookId: params.data.bookId,
      rating: body.data.rating,
    })
    .onConflictDoUpdate({
      target: [bookRatingsTable.userId, bookRatingsTable.bookId],
      set: { rating: body.data.rating, updatedAt: new Date() },
    });

  res.json(
    RateBookResponse.parse({
      bookId: params.data.bookId,
      rating: body.data.rating,
    }),
  );
});

export default router;
