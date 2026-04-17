# Skill: openapi_spec

Use this to write or update the OpenAPI specification for any HTTP interface.

---

## Phase 1: Plan — Locate and prepare the spec

1. Find the project OpenAPI file (e.g., `openapi.yaml`, `docs/api.yaml`, `api/openapi.yaml`).
   If it does not exist, create it using the base structure at the bottom of this file.
2. Identify all fields that need documenting:
   - Path, method, summary, operationId, tags
   - Request body schema (all fields, types, required/optional, format constraints)
   - Query parameters, path parameters, headers
   - All response schemas (success + every error from the endpoint design)
3. Cross-check against the endpoint contract in the RD — they must match exactly.

---

## Phase 2: Write — Add the path entry

```yaml
paths:
  /api/v1/resources:
    post:
      summary: Create a new resource
      operationId: createResource
      tags: [resources]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, categoryId]
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 255
                  example: My Resource
                categoryId:
                  type: integer
                  example: 1
                description:
                  type: string
                  maxLength: 2000
      responses:
        '201':
          description: Resource created successfully
          headers:
            Location:
              schema:
                type: string
              description: URL of the newly created resource
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Resource'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          $ref: '#/components/responses/Conflict'
        '429':
          $ref: '#/components/responses/RateLimited'
        '500':
          $ref: '#/components/responses/InternalError'
```

### Reusable error response components (add once, reference everywhere)

```yaml
components:
  responses:
    ValidationError:
      description: Request validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "name is required and must be 1-255 characters"
            code: "VALIDATION_ERROR"
    Unauthorized:
      description: Missing or invalid authentication token
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Forbidden:
      description: Authenticated but insufficient permissions
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Requested resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Conflict:
      description: Conflict with existing data
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    RateLimited:
      description: Too many requests
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    InternalError:
      description: Unexpected server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
  schemas:
    Error:
      type: object
      required: [error, code]
      properties:
        error:
          type: string
          description: Human-readable error message
        code:
          type: string
          description: Machine-readable error code in SCREAMING_SNAKE_CASE
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## Phase 3: Verify — Validate the spec

```bash
# Recommended: Redocly CLI
npx @redocly/cli lint openapi.yaml

# Alternative: swagger-cli
npx swagger-cli validate openapi.yaml
```

Checklist:
- [ ] Path, method, summary, operationId, and tags present on every operation
- [ ] Request body schema matches the RD endpoint contract exactly
- [ ] All response codes from the endpoint design are documented
- [ ] All field types are explicit — no bare `{}` or untyped objects
- [ ] Reusable error schemas use `$ref`, not inline duplication
- [ ] `security` specified on every operation (`security: []` for intentionally public endpoints)
- [ ] Validator reports zero errors and zero warnings

---

## Phase 4: Iterate — Keep spec in sync with implementation

1. Any time the implementation changes a request or response shape, update the spec first.
2. The spec is the source of truth — if spec and code disagree, the spec wins and code is fixed.
3. Note the spec update in `memory.md` with what changed and why.

---

## Base spec structure (create if missing)

```yaml
openapi: "3.1.0"
info:
  title: "Project API"
  version: "1.0.0"
  description: "API specification for the project"
servers:
  - url: http://localhost:3000
    description: Local development
  - url: https://api-dev.example.com
    description: Development environment
paths: {}
components:
  schemas: {}
  responses: {}
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
