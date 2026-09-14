<h1 align="center">Todolist</h1>

<br/>

A living roadmap of the features and improvements planned for Hydrodactyl. Checked items reflect the current state of the `main` branch.

> [!NOTE]
> Hydrodactyl is under active development. This list is not exhaustive — check [DEV.md](./DEV.md) and the open issues on GitHub for the latest status.

## Wings Automation

- [ ] Fully automate Wings configuration
  - [ ] Automate debug mode configuration
  - [ ] Automate machine-id configuration

## Auth Pages

- [x] Login Page
- [x] Password Reset Page
- [x] 2FA Page

## Homepage

- [x] Search Bar (server search, sorting & filtering)
  - [x] Design layout
  - [x] Keyboard shortcut integration (`Cmd + K`)
  - [x] Search functionality
- [x] Servers Page (server list)
- [x] API Keys Page
- [x] SSH Keys Page
- [x] Settings Page
- [x] Sidebar Navigation

## Server Pages

- [x] Sidebar Navigation

### Console

- [x] Console view
- [x] System resource graphs
- [x] Power actions
- [x] Server Features
  - [x] Minecraft EULA prompt
  - [x] Java version selector
  - [x] McLogs integration
  - [x] Hytale feature support
  - [x] Steam disk space meter

### Files

- [x] File Explorer System
  - [ ] Shift + Click range selection
  - [x] Improved path change handling (breadcrumbs)
  - [x] Context action menu
  - [x] File MIME-type icons
- [ ] File Editor
  - [ ] Reduce editor bundle size

### Databases

- [x] New database model
- [x] Redesigned database display UI
- [x] PostgreSQL support

### Backups

- [x] Redesigned, less cluttered backup list UI
- [ ] Admin panel setting for backup creation limits per time period
- [ ] Shift + Click range selection for backups

### Network

- [x] General UI fixes and color scheme updates
- [x] Subdomain Management (Cloudflare, Bunny.net, and more)

### Users

- [ ] Permission Groups
- [ ] Permission Presets
- [ ] Clean up / de-clutter interface

### Startup

- [x] One-click copy for environment variables
- [x] Redesigned "Startup Command" field
- [x] Improved Docker Image Selector

### Schedules

- [x] De-clutter "Create New Schedule" modal
- [ ] Custom Actions system (Admins & Users)
  - [ ] Send HTTP Request action
  - [ ] Interact with another owned server
    - [ ] Add "Actions Interactable" user permission
- [ ] Failure Alert Notifications
  - [ ] Email alerts
  - [ ] Discord webhooks
  - [ ] Slack integration
  - [ ] Mattermost integration

### Activity

- [x] Filter system
- [ ] Fix search restricted to current page (enable global search)
- [ ] Improve search/filter UX & overall feel

### Software

- [x] Redesigned page with verbose configuration options
- [x] Modularized code (split into ~200–400 line components)
- [x] Simplified component logic
- [ ] Optimize page performance

## Marketplace

- [x] Native plugin/mod installer (Modrinth, Hangar, Spiget)
- [x] Install history and management
- [x] Marketplace client API

## General Changes

- [x] Redesigned dropdown menus across pages
- [x] Backups Page
- [x] Files Page
- [x] Software / Shell Page
- [x] Startup Page

## In Progress

- [ ] Admin Panel Redesign
  - [ ] Convert Admin Panel pages to React (dashboard overview is done)
  - [ ] Redesign UI to match Client-side styling
