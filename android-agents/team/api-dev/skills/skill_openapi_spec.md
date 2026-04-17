# Skill: openapi_spec

Use this to write or update the OpenAPI specification for an endpoint.

## Phase 1: Plan — Locate and prepare the spec

1. Find the project OpenAPI file (e.g., `openapi.yaml` or `docs/api.yaml`).
   If it does not exist, create it with the base structure at the bottom of this file.
2. Identify all fields that need documenting:
   - Path, method, summary, operationId
   - Request body schema (all fields, types, required/optional)
   - Query parameters and path parameters
   - All response schemas (success + every error from the endpoint design)
3. Cross-check against the endpoint design in the RD — they must match exactly.

---

## Phase 2: Write — Add the path entry

```yaml
paths:
  /api/v1/users/login:
    post:
      summary: Authenticate a user and return a JWT
      operationId: loginUser
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  minLength: 8
                  maxLength: 128
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: Signed JWT, expires in 1 hour
                  user:
                    $ref: '#/components/schemas/UserSummary'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
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
    Unauthorized:
      description: Authentication required or credentials invalid
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
        code:
          type: string
```

---

## Phase 3: Verify — Validate the spec

```bash
# Validate with Redocly CLI (recommended)
npx @redocly/cli lint openapi.yaml

# Or with swagger-cli
npx swagger-cli validate openapi.yaml
```

Checklist:
- [ ] Path, method, summary, and operationId present
- [ ] Request body schema matches the RD exactly
- [ ] All response codes from the endpoint design are documented
- [ ] All field types are explicit — no `{}` or untyped objects
- [ ] Reusable error schemas use `$ref`, not inline duplication
- [ ] Security requirement specified (`security: []` for public endpoints)
- [ ] Validator reports zero errors

---

## Phase 4: Iterate — Keep spec in sync with implementation

1. Any time the implementation changes the request or response shape, update the spec first.
2. Use the spec as the source of truth — if spec and code disagree, the spec wins.
3. Note the spec update in `memory.md` with the date and what changed.

## Base spec structure (create if missing)

```yaml
openapi: "3.1.0"
info:
  title: "API"
  version: "1.0.0"
  description: "Auto-generated from team/api-dev"
servers:
  - url: http://localhost:3000
    description: Local development
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
