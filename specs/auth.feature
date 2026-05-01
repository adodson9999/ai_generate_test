Feature: Auth Token Lifecycle
  As an API consumer
  I want to obtain an auth token using valid credentials
  So that I can access protected endpoints

  Scenario: Generate token with valid credentials
    When I send a POST request to "/auth" with valid credentials
    Then the response status should be 200
    And the response body should contain a valid token

  Scenario: Reject invalid credentials
    When I send a POST request to "/auth" with invalid credentials
    Then the response status should be 200
    And the response body should indicate bad credentials

  Scenario: Reject missing credentials
    When I send a POST request to "/auth" with an empty body
    Then the response status should be 200
    And the response body should indicate bad credentials
