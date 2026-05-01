# Negative Test Matrix

| Case | Expected Status | Notes |
|---|---|---|
| POST /booking — missing required field 'firstname' | 500 | Quirk: API returns 500 instead of 400 for missing required fields on POST |
| POST /booking — missing required field 'lastname' | 500 | Quirk: API returns 500 instead of 400 for missing required fields on POST |
| POST /booking — missing required field 'totalprice' | 500 | Quirk: API returns 500 instead of 400 for missing required fields on POST |
| POST /booking — missing required field 'depositpaid' | 500 | Quirk: API returns 500 instead of 400 for missing required fields on POST |
| POST /booking — missing required field 'bookingdates' | 500 | Quirk: API returns 500 instead of 400 for missing required fields on POST |
| POST /booking — 'totalprice' as string | 200 | Quirk: API silently accepts string where number is expected |
| POST /booking — 'firstname' as number | 500 | Quirk: API returns 500 instead of 400 when firstname is a number |
| POST /booking — invalid date format for 'checkin' | 200 | Quirk: API silently accepts invalid date strings |
| POST /booking — 'totalprice' less than minimum (0) | 200 | Quirk: API silently accepts negative totalprice |
| PATCH /booking — wrong HTTP method | 404 | Quirk: API returns 404 instead of 405 for wrong HTTP method |
| GET /booking/{id} — non-existent resource ID | 404 |  |
| PUT /booking/{id} — missing required field 'firstname' | 400 |  |
| PUT /booking/{id} — missing required field 'lastname' | 400 |  |
| PUT /booking/{id} — missing required field 'totalprice' | 400 |  |
| PUT /booking/{id} — missing required field 'depositpaid' | 400 |  |
| PUT /booking/{id} — missing required field 'bookingdates' | 400 |  |
| PUT /booking/{id} — 'totalprice' as string | 200 | Quirk: API silently accepts string where number is expected |
| PUT /booking/{id} — 'firstname' as number | 500 | Quirk: API returns 500 instead of 400 when firstname is a number |
| PUT /booking/{id} — missing auth token | 403 |  |
| PUT /booking/{id} — invalid auth token | 403 |  |
| PUT /booking/{id} — non-existent resource ID | 405 | Quirk: API returns 405 instead of 404 for non-existent resource on protected endpoints |
| PATCH /booking/{id} — 'totalprice' as string | 200 | Quirk: API silently accepts string where number is expected |
| PATCH /booking/{id} — 'firstname' as number | 200 | Quirk: API silently accepts number where string is expected |
| PATCH /booking/{id} — missing auth token | 403 |  |
| PATCH /booking/{id} — invalid auth token | 403 |  |
| PATCH /booking/{id} — non-existent resource ID | 405 | Quirk: API returns 405 instead of 404 for non-existent resource on protected endpoints |
| DELETE /booking/{id} — missing auth token | 403 |  |
| DELETE /booking/{id} — invalid auth token | 403 |  |
| DELETE /booking/{id} — non-existent resource ID | 405 | Quirk: API returns 405 instead of 404 for non-existent resource on protected endpoints |
