# Negative Test Matrix

| Case | Expected Status | Notes |
|---|---|---|
| POST /booking — missing required field 'firstname' | 500 |  |
| POST /booking — missing required field 'lastname' | 500 |  |
| POST /booking — missing required field 'totalprice' | 500 |  |
| POST /booking — missing required field 'depositpaid' | 500 |  |
| POST /booking — missing required field 'bookingdates' | 500 |  |
| POST /booking — 'totalprice' as string | 200 |  |
| POST /booking — 'firstname' as number | 500 |  |
| POST /booking — invalid date format for 'checkin' | 200 |  |
| POST /booking — 'totalprice' less than minimum (0) | 200 |  |
| PATCH /booking — wrong HTTP method | 404 |  |
| GET /booking/{id} — non-existent resource ID | 404 |  |
| PUT /booking/{id} — missing required field 'firstname' | 400 |  |
| PUT /booking/{id} — missing required field 'lastname' | 400 |  |
| PUT /booking/{id} — missing required field 'totalprice' | 400 |  |
| PUT /booking/{id} — missing required field 'depositpaid' | 400 |  |
| PUT /booking/{id} — missing required field 'bookingdates' | 400 |  |
| PUT /booking/{id} — 'totalprice' as string | 200 |  |
| PUT /booking/{id} — 'firstname' as number | 500 |  |
| PUT /booking/{id} — missing auth token | 403 |  |
| PUT /booking/{id} — invalid auth token | 403 |  |
| PUT /booking/{id} — non-existent resource ID | 405 |  |
| PATCH /booking/{id} — 'totalprice' as string | 200 |  |
| PATCH /booking/{id} — 'firstname' as number | 200 |  |
| PATCH /booking/{id} — missing auth token | 403 |  |
| PATCH /booking/{id} — invalid auth token | 403 |  |
| PATCH /booking/{id} — non-existent resource ID | 405 |  |
| DELETE /booking/{id} — missing auth token | 403 |  |
| DELETE /booking/{id} — invalid auth token | 403 |  |
| DELETE /booking/{id} — non-existent resource ID | 405 |  |
