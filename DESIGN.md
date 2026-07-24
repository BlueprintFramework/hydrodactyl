# Hydrodactyl Admin Dashboard Design

## Overview

This document outlines the design system, architecture, and UI/UX patterns used in the Hydrodactyl admin dashboard and user-facing pages. The design focuses on a modern, dark-themed interface with consistent patterns across all admin and user views.

---

## Design System

### Color Palette

The admin dashboard uses a custom "mocha" color scheme designed for reduced eye strain and improved readability:

#### Background Colors
- **`mocha-500`** (`#3a3a3a`) - Primary card/panel backgrounds
- **`mocha-600`** (`#2d2d2d`) - Input fields and elevated surfaces
- **`mocha-400`** (`#4a4a4a`) - Borders and dividers
- **`mocha-300`** (`#5a5a5a`) - Hover states and focus rings

#### Text Colors
- **`cream-400`** (`#f5f5f5`) - Primary text, headings, and important content
- **`cream-500`** (`#e8e8e8`) - Secondary text and hover states
- **`mocha-200`** (`#b0b0b0`) - Labels and muted text
- **`mocha-100`** (`#c0c0c0`) - Tertiary text

#### Semantic Colors
- **`brand`** - Primary accent color for active states and CTAs
- **`red-400`** / **`red-600`** - Error states and danger zones
- **`red-900/50`** - Danger zone backgrounds
- **`green-400`** / **`green-900/50`** - Success states
- **`yellow-400`** / **`yellow-600`** - Warning states
- **`yellow-900/50`** - Suspended/warning backgrounds

### Typography

- **Font Family**: System fonts (default sans-serif stack)
- **Base Size**: 14px (0.875rem)
- **Line Height**: 1.5 (default)
- **Font Weights**:
  - `font-medium` (500) - Buttons, tabs, and interactive elements
  - `font-semibold` (600) - Headings and emphasis

### Spacing

- **Base Unit**: 4px
- **Common Spacing**: 4, 8, 12, 16, 24, 32, 48, 64px
- **Component Padding**: 16px (p-4), 24px (p-6)
- **Grid Gaps**: 16px (gap-4), 24px (gap-6)

### Border Radius

- **Small**: `rounded` (4px) - Inputs, small elements
- **Medium**: `rounded-lg` (8px) - Cards and panels
- **Large**: `rounded-xl` (12px) - Buttons and modals

---

## Component Patterns

### 1. Page Layout

All admin pages follow a consistent layout structure:

```
┌─────────────────────────────────────────┐
│  MainPageHeader (Title + Actions)       │
├─────────────────────────────────────────┤
│                                         │
│  Content Area (cards, tables, forms)    │
│                                         │
└─────────────────────────────────────────┘
```

#### MainPageHeader
- **Purpose**: Page title with optional action buttons
- **Props**: `title` (string), optional children (action buttons)
- **Usage**:
  ```tsx
  <MainPageHeader title='Servers'>
    <button className='px-4 py-2 bg-mocha-400 ...'>
      Create Server
    </button>
  </MainPageHeader>
  ```

### 2. Card/Panel Pattern

Cards are used to group related content:

```tsx
<div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6'>
  <h3 className='text-cream-400 font-medium mb-4'>Section Title</h3>
  {/* Content */}
</div>
```

**Variants**:
- **Default**: `bg-mocha-500 border border-mocha-400`
- **Danger Zone**: `bg-mocha-500 border border-red-900/50`
- **Success**: `bg-green-900/20 border border-green-800`

### 3. Tab Navigation

Tabs are used for multi-section pages (e.g., server details, user view):

```tsx
const tabs = ['details', 'build', 'startup', 'databases', 'manage'] as const;
const [activeTab, setActiveTab] = useState<'details' | 'build' | ...>('details');

<div className='flex items-center space-x-1 border-b border-mocha-400 overflow-x-auto'>
  {tabs.map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
        activeTab === tab
          ? 'border-brand text-cream-400'
          : 'border-transparent text-mocha-200 hover:text-cream-400 hover:border-mocha-300'
      }`}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  ))}
</div>
```

**Key Features**:
- Horizontal scrolling for overflow
- Active state with brand color underline
- Hover states for better UX
- Responsive padding

### 4. Form Elements

#### Input Fields
```tsx
const inputClass = 'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';

<input
  type='text'
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className={inputClass}
  placeholder='Enter value...'
/>
```

**States**:
- **Default**: `border-mocha-400`
- **Focus**: `focus:border-mocha-300`
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`

#### Labels
```tsx
const labelClass = 'block text-sm text-mocha-200 mb-1';

<label className={labelClass}>Field Label</label>
```

#### Select Dropdowns
```tsx
<select
  value={selectedValue}
  onChange={(e) => setSelectedValue(Number(e.target.value))}
  className={inputClass}
>
  <option value={0}>Select an option</option>
  {options.map((option) => (
    <option key={option.id} value={option.id}>
      {option.name}
    </option>
  ))}
</select>
```

### 5. Buttons

#### Primary Button
```tsx
<button
  onClick={handleClick}
  disabled={disabled}
  className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 border border-mocha-300 disabled:opacity-50 disabled:cursor-not-allowed text-cream-400 text-sm font-medium rounded-xl transition-colors'
>
  {loading ? 'Saving...' : 'Save Changes'}
</button>
```

#### Danger Button
```tsx
<button
  onClick={handleDelete}
  className='px-4 py-2 bg-red-600 hover:bg-red-500 text-cream-400 text-sm rounded transition-colors'
>
  Delete
</button>
```

#### Warning Button
```tsx
<button
  onClick={handleAction}
  className='px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-cream-400 text-sm rounded transition-colors'
>
  Suspend
</button>
```

### 6. Tables

Tables display list data with consistent styling:

```tsx
<div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
  <table className='w-full text-sm'>
    <thead>
      <tr className='border-b border-mocha-400'>
        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>
          Column Name
        </th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr
          key={item.id}
          className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
        >
          <td className='px-4 py-3 text-cream-400'>{item.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Features**:
- Hover states on rows
- Border separators
- Responsive text sizing
- Overflow handling with container

### 7. Status Badges

Status indicators use colored badges:

```tsx
{status ? (
  <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-400'>
    Active
  </span>
) : (
  <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-400'>
    Suspended
  </span>
)}
```

### 8. Information Display

#### Info Cards (Read-only Data)
```tsx
<div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
  <div>
    <span className='text-mocha-200'>Label</span>
    <p className='text-cream-400'>{value}</p>
  </div>
</div>
```

#### Success/Error Messages
```tsx
{error && <div className='text-red-400 text-sm mb-3'>Error: {error}</div>}
{success && <div className='text-green-400 text-sm mb-3'>Operation successful.</div>}
```

### 9. Modals and Dialogs

#### Confirmation Dialog
```tsx
<Dialog.Confirm
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirmed={handleConfirm}
  title='Confirm Action'
  confirm='Confirm'
>
  Are you sure you want to proceed?
</Dialog.Confirm>
```

#### Form Modal
```tsx
<Dialog open={isOpen} onClose={onClose} title='Create Resource'>
  <div className='space-y-4 max-h-[60vh] overflow-y-auto pr-2'>
    {/* Form fields */}
  </div>
  <Dialog.Footer>
    <div className='flex items-center gap-3 p-6'>
      <button className='px-4 py-2 bg-mocha-400 ...'>
        Submit
      </button>
      <button className='px-4 py-2 bg-mocha-500 ...'>
        Cancel
      </button>
    </div>
  </Dialog.Footer>
</Dialog>
```

### 10. Toast Notifications

Sonner toasts provide feedback for async operations:

```tsx
import { toast } from 'sonner';

// Success
toast.success('Operation completed successfully');

// Error
toast.error('An error occurred: ' + errorMessage);
```

**Usage**:
- Success toasts after CRUD operations
- Error toasts for API failures
- Auto-dismiss after 3-5 seconds

---

## Page-Specific Patterns

### Admin Servers Page

#### Server List
- Paginated table with server information
- Columns: Name, Owner, Node, Egg, Memory, Disk, Status, Actions
- Inline actions: View, Suspend/Unsuspend, Delete
- Status badges for suspended/running states

#### Create Server Modal
- Multi-step form with conditional fields
- Fields appear based on previous selections (Nest → Egg → Node → Details)
- User dropdown (first 10 users with pagination notice)
- Domain selection dropdown
- Resource inputs with 0 = unlimited semantics
- Environment variables with add/remove functionality
- Feature limits (databases, allocations, backups)

#### Server View (Tabs)
- **Details Tab**: Server information + edit form
- **Build Tab**: Resource configuration (memory, disk, CPU, etc.)
- **Startup Tab**: Startup command, docker image, environment variables
- **Databases Tab**: Database list + create form
- **Manage Tab**: Actions (reinstall, suspend, delete)

### Admin Users Page

#### User List
- Paginated table with user information
- Columns: ID, Username, Email, Name, Admin, 2FA, Actions
- View and Delete actions

#### User View (Tabs)
- **Details Tab**: User information display + edit form
  - Read-only fields: User ID, Username, Email, 2FA status
  - Editable fields: First name, last name, email, language, root admin
  - Server count display
- **Manage Tab**: Danger zone with delete action

---

## State Management

### React State (useState)
- Local component state for forms and UI
- Example: `const [name, setName] = useState('')`

### SWR (Data Fetching)
- Server state management with SWR
- Pattern: `useSWR(key, fetcherFunction)`
- Example:
  ```tsx
  const { data, error, mutate } = useSWR(
    ['admin:servers', page],
    () => getServers({ page })
  );
  ```

### Form State
- Simple forms use individual useState hooks
- Complex forms use a single state object:
  ```tsx
  const [form, setForm] = useState({
    name_first: '',
    name_last: '',
    email: '',
  });
  ```

---

## API Integration

### HTTP Client
- Axios-based HTTP client with base URL configuration
- Error handling via `httpErrorToHuman()` utility

### API Functions
- Located in `resources/scripts/api/admin/`
- Return promises with typed responses
- Example:
  ```tsx
  export const getUsers = (params: { page: number }): Promise<PaginatedResponse<AdminUser>> =>
    http.get('/api/application/users', { params }).then(({ data }) => data);
  ```

---

## Responsive Design

### Breakpoints
- **Mobile**: Default (< 768px)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)

### Grid Systems
- **2 columns**: `grid-cols-2`
- **3 columns**: `grid-cols-3`
- **Responsive**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Table Handling
- Horizontal scroll for overflow
- Responsive text sizing
- Hidden columns on mobile (future enhancement)

---

## Accessibility

### Semantic HTML
- Proper heading hierarchy (h1, h2, h3)
- Form labels associated with inputs
- Button elements for actions (not divs)

### Keyboard Navigation
- All interactive elements are focusable
- Tab order follows visual layout
- Enter/Space activates buttons

### Color Contrast
- Text meets WCAG AA standards
- Important information not conveyed by color alone
- Focus indicators visible

---

## Performance

### Million.js Optimization
- Automatic component optimization via Million.js
- Compiler-time React optimization
- No manual memoization needed for most components

### Code Splitting
- Route-based code splitting via React Router
- Dynamic imports for large components (future)

### Build Optimization
- Vite for fast development and optimized production builds
- Tree shaking for unused code elimination
- Gzip compression for assets

---

## Future Improvements

### Planned Enhancements
1. **Search and Filtering**: Add search bars to list pages
2. **Bulk Actions**: Select multiple items for batch operations
3. **Advanced Tables**: Sorting, filtering, column visibility
4. **Dark/Light Mode**: Theme toggle (currently dark-only)
5. **Keyboard Shortcuts**: Power user shortcuts
6. **Real-time Updates**: WebSocket integration for live data
7. **Export Functionality**: CSV/PDF export for tables
8. **Audit Logging**: Track admin actions

### Technical Debt
- Migrate remaining inline styles to Tailwind classes
- Add comprehensive error boundaries
- Implement proper form validation library
- Add unit and integration tests
- Document API endpoints with OpenAPI

---

## File Structure

```
resources/scripts/
├── components/
│   ├── admin/
│   │   ├── servers/
│   │   │   └── AdminServersContainer.tsx
│   │   ├── users/
│   │   │   └── AdminUsersContainer.tsx
│   │   ├── nests/
│   │   ├── nodes/
│   │   ├── databases/
│   │   └── AdminDashboardContainer.tsx
│   ├── elements/
│   │   ├── Dialog.tsx
│   │   ├── MainPageHeader.tsx
│   │   ├── Pagination.tsx
│   │   └── Spinner.tsx
│   └── layout/
│       └── Sidebar.tsx
├── api/
│   └── admin/
│       ├── servers.ts
│       ├── users.ts
│       ├── nodes.ts
│       └── settings.ts
└── routers/
    └── AdminRouter.tsx
```

---

## Contributing

When adding new pages or components:

1. **Follow the established patterns** in this document
2. **Use the mocha color scheme** for consistency
3. **Implement tab navigation** for multi-section pages
4. **Add proper TypeScript types** for all data structures
5. **Use SWR for data fetching** with proper cache keys
6. **Handle loading and error states** appropriately
7. **Test on mobile and desktop** viewports
8. **Rebuild frontend** after changes: `pnpm build`

---

## Contact

For questions or clarifications about the design system, please refer to the codebase or contact the development team.