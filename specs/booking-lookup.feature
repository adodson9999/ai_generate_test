Feature: Booking lookup
  As an API consumer of the Restful-Booker service,
  I need to retrieve booking details by ID,
  so I can confirm reservation information for a guest.

  Acceptance criteria:
    - GET /booking/{id} with a valid ID returns 200 and a booking object
      containing firstname, lastname, totalprice, depositpaid, bookingdates,
      and additionalneeds (optional).
    - bookingdates contains checkin and checkout in YYYY-MM-DD format,
      and checkout must be on or after checkin.
    - totalprice is a non-negative number.
    - A non-existent ID returns 404.
    - P95 response time under 2000 ms for this environment.
