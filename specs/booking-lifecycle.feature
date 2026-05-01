Feature: Booking CRUD Lifecycle
  As an API consumer
  I want to create, read, update, patch, and delete a booking
  So that I can verify the full lifecycle of a resource works correctly

  Scenario: Full lifecycle of a booking resource
    Given I create a new booking with random data
    Then the response should contain the generated booking ID and the booking details
    When I read the booking using the generated ID
    Then the response should match the created booking details
    When I fully update the booking with new data using PUT
    Then the response should reflect the updated values
    When I partially update the booking with a new firstname using PATCH
    Then the response should reflect the new firstname and preserve other fields
    When I delete the booking
    Then the response should confirm deletion
    And a subsequent read of the booking should return a 404 Not Found
