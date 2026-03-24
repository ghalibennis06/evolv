# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Backend guide (non-technical)

This section explains how the studio logic works in plain language.

### 1) Black Card purchase flow

- **Cash on site**:
  1. Client fills the Black Card form on frontend.
  2. Frontend calls `create-blackcard-request`.
  3. A request is created in `code_creation_requests` with status `pending`.
  4. Admin can approve it from Admin Packs.
  5. On approval, a real pack code is generated and visible in Packs/Codes.

- **Online (Payzone)**:
  1. Frontend starts payment using `create-payzone-session`.
  2. A request row is linked to the payment/order.
  3. After successful payment return, frontend calls `verify-payment`.
  4. Backend validates and generates the pack code automatically.

### 2) Key backend functions

- `supabase/functions/create-blackcard-request/index.ts`
  - Creates manual/cash requests from frontend.
- `supabase/functions/create-payzone-session/index.ts`
  - Creates payment session and links request/order metadata.
- `supabase/functions/verify-payment/index.ts`
  - Confirms payment and creates pack/code when valid.
- `supabase/functions/admin-data/index.ts`
  - Central admin actions: planning, packs, CRM, dashboard, approvals.
- `supabase/functions/use-pack-credit/index.ts`
  - Consumes one credit when a pack is used and logs usage.

### 3) Main database tables

- `code_creation_requests`: all code-generation requests (pending/approved/rejected/auto).
- `packs`: generated codes and credit balances.
- `blackcard_usage`: history of each credit usage.
- `activity_log`: audit trail for admin/frontend actions.
- `client_tags`, `retention_offers`, `client_followups`: CRM retention features.

### 4) Admin planning behavior

- **Week view** is for quick schedule control.
- **Click a session** in week grid opens action popup (edit/details/add participant/cancel).
- **Vertical/list view** is split by day so operations are easier to read.

### 5) Troubleshooting quick checks

- If cash request fails: verify `create-blackcard-request` logs and `code_creation_requests` insert permissions.
- If online code is missing: verify `verify-payment` call includes `order_id`/`request_id`.
- If code is generated but not visible: check `packs` row status and admin filters.
