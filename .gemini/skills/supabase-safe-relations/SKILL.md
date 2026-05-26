---
name: supabase-safe-relations
description: >
  Enforces safe access patterns for Supabase relationship data in this project.
  Use this skill whenever editing files that access Supabase .select() queries
  with nested relationships (e.g., courses(id, slug), modules(course_id), 
  instructors(name, bio)). Prevents the "This page didn't load" crash caused
  by Supabase returning relationships as arrays instead of objects (or vice versa).
---

# Supabase Safe Relations Skill

## Problem

When using Supabase's `.select()` with relationship joins like:

```ts
supabase.from("enrollments").select("course_id, courses(id, slug, title)")
```

Supabase may return the `courses` field as:
- A **single object**: `{ id: "...", slug: "...", title: "..." }`
- An **array**: `[{ id: "...", slug: "...", title: "..." }]`
- **null** or **undefined**

This depends on the relationship cardinality, RLS policies, and query context.
Accessing properties directly (e.g., `row.courses.slug`) will crash the app
with a fatal error when the data comes back as an array or null.

## Solution

This project uses two utility functions from `@/lib/supabase-utils`:

### `unwrapRelation<T>(value)`

Safely extracts a single record from a Supabase relationship that may be an 
object, array, null, or undefined.

```ts
import { unwrapRelation } from "@/lib/supabase-utils";

// WRONG — will crash if courses is an array or null:
const slug = row.courses.slug;

// CORRECT — always safe:
const course = unwrapRelation(row.courses);
const slug = course?.slug ?? "fallback";
```

### `safeSlug(value, fallback)`

Safely converts a value to a string slug for use in route parameters.

```ts
import { safeSlug } from "@/lib/supabase-utils";

// WRONG — will crash if slug is undefined:
<Link params={{ slug: course.slug }}>

// CORRECT — always safe:
<Link params={{ slug: safeSlug(course?.slug, course?.id) }}>
```

## Rules to Follow

When editing any file under `src/routes/` or `src/components/` that queries 
Supabase with relationship joins:

### 1. Always unwrap relationships before accessing properties

```ts
// For every .select() that includes relationships like:
//   courses(...), modules(...), instructors(...), lessons(...), profiles(...)
// Unwrap them before use:

const course = unwrapRelation(row.courses);
const instructor = unwrapRelation(course?.instructors);
const module = unwrapRelation(lesson?.modules);
```

### 2. Always use optional chaining after unwrapping

```ts
// WRONG:
course.title

// CORRECT:
course?.title ?? "Default"
```

### 3. Always use safeSlug for route params

```ts
// WRONG:
params={{ slug: course.slug }}

// CORRECT:
params={{ slug: safeSlug(course?.slug, course?.id) }}
```

### 4. Wrap queryFn in try/catch

```ts
queryFn: async () => {
  try {
    // ... supabase queries
    return data;
  } catch (err) {
    console.error("[ComponentName] queryFn error:", err);
    return fallbackValue; // e.g., [], null, { items: [] }
  }
}
```

### 5. Use ErrorBoundary for page-level protection

The `RouteErrorBoundary` component from `@/components/route-error-boundary` 
is already wrapped around the student dashboard `<Outlet />` in `app.tsx`.
If adding new layout routes, wrap them too:

```tsx
import { RouteErrorBoundary } from "@/components/route-error-boundary";

<main>
  <RouteErrorBoundary>
    <Outlet />
  </RouteErrorBoundary>
</main>
```

## Files to Check

When this skill is triggered, audit these files for unsafe patterns:

- `src/routes/app.index.tsx` — Student dashboard
- `src/routes/app.cursos.tsx` — My courses list  
- `src/routes/app.curso.$slug.tsx` — Course detail page (instructors relation)
- `src/routes/app.player.$lessonId.tsx` — Video player (modules/courses relations)
- `src/routes/app.catalogo.tsx` — Course catalog
- `src/routes/app.blog.tsx` — Blog listing
- `src/routes/app.blog.$slug.tsx` — Blog article
- `src/routes/admin.*.tsx` — Admin pages with course/module/lesson relations

## Quick Grep to Find Violations

Search for direct property access on relationship fields:

```bash
# Find potential unsafe accesses (look for .courses. .modules. .instructors. without unwrapRelation)
grep -rn "\.courses\." src/routes/ --include="*.tsx" | grep -v "unwrapRelation" | grep -v "from("
grep -rn "\.instructors\." src/routes/ --include="*.tsx" | grep -v "unwrapRelation"
grep -rn "\.modules\." src/routes/ --include="*.tsx" | grep -v "unwrapRelation" | grep -v "from(" | grep -v "module_id"
```
