# Prisma Accelerate Query Optimizations

This document outlines the optimizations made to reduce database queries and improve performance with Prisma Accelerate.

## Summary of Optimizations

### 1. Dashboard Page (`app/dashboard/page.tsx` & `app/[locale]/dashboard/page.tsx`)

**Before:**
- 7+ sequential queries for statistics
- Duplicate quiz results queries (2 separate queries)
- N+1 problem: For each course, 2 additional queries (completedChapters + completedQuizResults)
- **Total: ~7 + (N courses × 2) queries**

**After:**
- All initial queries batched with `Promise.all` (7 queries → 1 parallel batch)
- Single quiz results query (replaces 2 duplicate queries)
- Batch all progress queries: 2 queries total instead of N×2 queries
- **Total: ~5 queries regardless of course count**

**Impact:** 
- Reduced from ~15-25 queries to ~5 queries per page load
- **60-80% reduction in database operations**

### 2. Courses API Route (`app/api/courses/route.ts`)

**Before:**
- N+1 problem: For each course with progress, 2 queries (completedChapters + completedQuizResults)
- **Total: 1 + (N courses × 2) queries**

**After:**
- Batch all progress queries: 2 queries total for all courses
- **Total: 3 queries regardless of course count**

**Impact:**
- Reduced from ~1 + (N×2) queries to 3 queries
- **~85% reduction for 10 courses**

### 3. Public Courses Route (`app/api/courses/public/route.ts`)

**Status:** Already optimized
- Uses `select` instead of `include` (minimal data)
- Has caching headers (5 minutes)
- Uses `_count` for enrollment count

## Key Optimization Techniques Used

### 1. Query Batching with Promise.all
```typescript
// Before: Sequential queries
const user = await db.user.findUnique(...);
const stats = await db.purchase.count(...);
const chapters = await db.userProgress.count(...);

// After: Parallel queries
const [user, stats, chapters] = await Promise.all([
  db.user.findUnique(...),
  db.purchase.count(...),
  db.userProgress.count(...)
]);
```

### 2. Eliminating N+1 Queries
```typescript
// Before: N queries (one per course)
courses.map(async (course) => {
  const completed = await db.userProgress.count({
    where: { chapterId: { in: course.chapters.map(...) } }
  });
});

// After: 1 query for all courses
const allChapterIds = courses.flatMap(c => c.chapters.map(ch => ch.id));
const completed = await db.userProgress.findMany({
  where: { chapterId: { in: allChapterIds } }
});
```

### 3. Using Select Instead of Include
```typescript
// Only fetch needed fields
select: {
  id: true,
  title: true,
  chapters: { select: { id: true } }
}
```

### 4. Deduplicating Queries
```typescript
// Before: 2 separate queries for quiz results
const completedQuizzes = await db.quizResult.findMany({ select: { quizId: true } });
const quizResults = await db.quizResult.findMany({ select: { quizId: true, percentage: true } });

// After: 1 query that provides both
const allQuizResults = await db.quizResult.findMany({
  select: { quizId: true, percentage: true }
});
```

## Expected Impact

### Query Reduction
- **Dashboard page:** 60-80% reduction (15-25 queries → 5 queries)
- **Courses API:** 85% reduction for typical usage (21 queries → 3 queries for 10 courses)

### Performance Improvements
- **Faster page loads:** Parallel queries reduce total wait time
- **Lower Accelerate costs:** Fewer operations = lower costs
- **Better scalability:** Performance doesn't degrade with more courses

### Cost Savings
If you were doing 15,000 operations/day:
- **Before optimizations:** ~15,000 operations/day
- **After optimizations:** ~5,000-7,000 operations/day (estimated)
- **Savings:** ~50-60% reduction in Accelerate operations

## Monitoring

To monitor the impact:
1. Check Prisma Accelerate dashboard for operation counts
2. Monitor page load times
3. Check database query logs

## Future Optimizations

Consider these additional optimizations:

1. **Add Redis caching** for frequently accessed data (course lists, user stats)
2. **Use database views** for complex aggregations
3. **Implement query result caching** for public course data
4. **Add database indexes** on frequently queried fields (already have some)

## Files Modified

- `app/dashboard/page.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/api/courses/route.ts`

