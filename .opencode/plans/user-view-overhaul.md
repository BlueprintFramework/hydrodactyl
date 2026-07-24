# Plan: Full Overhaul of /admin/users/view/:id

## Goal
Completely redesign the user view page to match the modern admin design patterns (icon cards, read-only info tiles, enhanced danger zone) used in the Nodes, Buckets, and Database Hosts view pages.

## Scope

### Frontend Only (no backend changes needed)
The Application API already returns all needed data. The `?include=servers` query parameter can fetch a user's servers through the existing `UserTransformer`. No new backend endpoints are required.

---

## File Changes

### 1. `resources/scripts/api/admin/users.ts` — Add servers include support

- Extend the `AdminUser` interface with an optional `servers` array:
  ```ts
  export interface AdminServerSummary {
      id: number;
      name: string;
      uuid: string;
      nodeId: number;
      // any other summary fields from ServerTransformer
  }
  ```
- Update `rawToUser` to parse `relationships?.servers?.data` if present
- Update `getUser` to accept an optional `include` parameter (e.g., `?include=servers`)

### 2. `resources/scripts/components/admin/users/AdminUsersContainer.tsx` — Rewrite AdminUserView

Replace the current `AdminUserView` component entirely. The new design follows the Nodes view pattern:

#### Layout Structure

```
MainPageHeader (title=username, headChildren=Back link, children=Save+Delete buttons)
Tab bar (Details | Servers | Manage)
Tab content
```

#### Tab 1: "Details" (default)

**User Profile Card** (enhanced icon card):
- Left side: Gravatar avatar (via `https://www.gravatar.com/avatar/{md5(email)}?d=identicon&s=96`)
  - Fallback: Initials circle if gravatar is disabled
- Right side: Username (large), email, badges (Admin if `rootAdmin`, 2FA Enabled/Disabled)

**Account Info Card** (read-only info tiles, edit-toggle pattern from Node Overview):
- Toggle between read-only view and edit form via an "Edit" button
- **Read-only mode**: Grid of `bg-mocha-600/50 rounded-lg p-4` tiles:
  - User ID, UUID, External ID, Language, Created, Updated
- **Edit mode**: Form with inputs for:
  - First Name, Last Name, Email, Language
  - Root Admin checkbox
- Save / Cancel buttons

#### Tab 2: "Servers"

- Fetch user with `?include=servers` via SWR
- Table of user's servers with columns: Name, Node, Status, Created
  - Each name links to `/admin/servers/view/{id}`
- Empty state: "This user has no servers."

#### Tab 3: "Manage"

**Enhanced Danger Zone Card** (matching Node Settings pattern):
- Icon header with warning triangle
- `border-2 border-red-800/50 rounded-xl`
- Description text + Delete User button
- Delete confirmation via `Dialog.Confirm`
- On success: navigate to `..` (user list)

#### Delete/Save via MainPageHeader

- Save button in `MainPageHeader` children — only visible on the Details tab when editing
- Delete button in `MainPageHeader` children — opens a confirm dialog (same as Manage tab delete)

---

## Design Tokens Used (from Node view pattern)

| Element | Classes |
|---|---|
| Enhanced card | `bg-mocha-500 border border-mocha-400 rounded-xl p-6` |
| Icon container | `w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center` |
| Info tile | `bg-mocha-600/50 rounded-lg p-4` |
| Tile label | `text-mocha-200 text-xs uppercase tracking-wider` |
| Tile value | `text-cream-400 font-medium mt-1` |
| Read-only card | `bg-mocha-500/50 border border-mocha-400/50 rounded-xl p-6` |
| Danger zone | `bg-mocha-500 border-2 border-red-800/50 rounded-xl p-6` |
| Tab active | `text-cream-400 border-cream-400` (matching Node view) |
| Tab inactive | `text-mocha-200 hover:text-mocha-100 border-transparent` |
| Form input | existing `inputClass` constant |
| Status badge | `bg-green-900/50 text-green-400 border border-green-700/50` (enhanced) |
| Admin badge | `bg-red-900/50 text-red-400` (enhanced with border) |

---

## Verification
1. Run `pnpm run ship` to build
2. Navigate to `http://localhost:3000/admin/users/view/1`
3. Verify: Details tab shows profile card with avatar, info tiles, edit toggle
4. Verify: Servers tab shows user's servers (or empty state)
5. Verify: Manage tab shows danger zone with delete
6. Verify: Save, edit toggle, and delete all work without console errors
7. Verify: No React hooks errors (error #310)
