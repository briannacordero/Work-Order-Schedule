# Work Order Timeline (Angular 17)

A production-scheduling style timeline UI for managing work orders across work centers, with Day/Week/Month zoom levels, drag-free placement via click-to-create, and CRUD actions (create/edit/delete) with overlap validation.

---

## Tech Stack
- **Angular 17** (standalone components)
- **TypeScript**
- **SCSS** (design tokens + mixins)
- **@ng-bootstrap/ng-bootstrap** (date picker)
- **@ng-select/ng-select** (status dropdown)

---

## Setup

### Prerequisites
- Node.js (LTS recommended)
- Angular CLI installed globally (optional but helpful)

### Install
```bash
npm install

Run
ng serve


Then open:

http://localhost:4200

Notes / Configuration

No external services required.

Sample data is loaded locally (and persisted locally if you implemented localStorage persistence).

If the UI looks unstyled, confirm styles.scss includes global style imports:

@use "./styles/tokens";

@use "./styles/base";

How It Works (Approach)
1) Column/window model (Day/Week/Month)

The timeline is driven by a “window” of columns. Each zoom level generates a different set of time columns:

Day: daily columns

Week: week buckets

Month: month buckets

The viewport renders a left “work center” column and a right scrollable grid. The bar positions are computed from:

dateToX(date) → maps a date to an x-position within the current window

getLeft(order) / getWidth(order) → uses order start/end dates and current column scale

2) Current marker

A “Today / Current week / Current month” tag and vertical line are computed by determining which column contains “now” and converting that to x-position.

3) Work order bars + menu

Each work order renders as an absolute-positioned bar component:

Status styling uses global CSS variables (tokens) and SCSS mixins

Three-dot menu is click-to-open, stays open until clicking elsewhere

Only one menu can be open at a time (managed by the parent)

4) Create / Edit / Delete + validation

Create: click an empty cell area → open side panel with form

Edit: open bar menu → Edit → populate form with existing values

Delete: open bar menu → Delete → remove from local list

Overlap validation prevents two work orders from overlapping on the same work center (inclusive range overlap check). When overlap is detected, the form shows an error state and blocks save.

5) Styling approach (tokens + mixins)

Global styling is centralized using:

src/styles/_tokens.scss → CSS variables for colors, radius, typography, shadows

src/styles/_mixins.scss → reusable patterns (pills, dropdown, hover reveal, etc.)

component SCSS files apply those mixins for consistent UI while keeping styles scoped.

Libraries Used (and why)

@ng-bootstrap/ng-bootstrap
Used for the datepicker UI and quick, reliable date selection without building a calendar from scratch.

@ng-select/ng-select
Used for the status dropdown to match the desired “pill in select” interaction and styling control.

SCSS
Used to support mixins, variables, and scalable UI styling patterns.