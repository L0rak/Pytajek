import { createAuthClient } from "better-auth/react"
// Bez baseURL klient odpytuje /api/auth pod tym samym adresem, z którego otwarto stronę.
export const authClient = createAuthClient()
