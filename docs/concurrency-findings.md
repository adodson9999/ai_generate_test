# Concurrency Findings

> **Findings to share with the API team:** The Restful-Booker sandbox has no concurrency controls (no optimistic locking, no ETags, no conflict detection). All mutations are accepted on a last-write-wins basis.

## Summary

| Scenario | Result | Trials | Errors |
|---|---|---|---|
| Two concurrent PUTs | Last-write-wins | 5/5 | 0 |
| Concurrent PATCHes to different fields | All patches merged | 5/5 | 0 |
| Concurrent DELETE + GET | Race: GET may return pre-delete state | 1/1 | 0 |
| Concurrent CREATEs (identical data) | Duplicates allowed, no dedup | 5/5 unique IDs | 0 |
| Concurrent reads during write | Consistent state (no partial reads) | 5/5 | 0 |

## Detailed Findings

### 1. PUT-PUT: Last-Write-Wins
- 5 concurrent PUT requests to the same booking ID, all returned 200.
- The final GET returned the state from one of the 5 PUT payloads.
- No error, no conflict detection. The API silently overwrites.

### 2. PATCH Different Fields: Merge Behavior
- 5 concurrent PATCH requests each modifying a different field.
- All returned 200. The final state showed all patches applied.
- This suggests serial processing despite concurrent arrival.

### 3. DELETE + GET Race
- DELETE returned 201, concurrent GET returned 200 (pre-delete snapshot).
- This is expected given the API processes requests serially at the database level.

### 4. Duplicate CREATEs
- 5 concurrent POST requests with identical booking data.
- All returned 200 with unique booking IDs.
- No deduplication mechanism exists.

### 5. Read During Write
- All concurrent GETs returned a valid, consistent booking shape.
- No partial reads observed. The API appears to be atomic at the record level.

## Recommendations (if this were a production API)
1. **Add ETag/If-Match headers** for optimistic locking on PUT/PATCH
2. **Add idempotency keys** on POST to prevent duplicate creation
3. **Return 409 Conflict** when concurrent writes are detected
4. **Add Last-Modified header** for conditional GETs
