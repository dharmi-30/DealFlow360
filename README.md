# DealFlow360 — Real B2B Sales Operations SaaS

**DealFlow360** is a high-density, production-ready B2B Sales Operations SaaS frontend built for sales operations teams, finance controllers, and enterprise account executives.

Designed with operational clarity, restrained design aesthetics, and multi-tier governance controls, DealFlow360 bridges the gap between sales proposal creation, automated discount approvals, warehouse fulfillment, recurring subscription contracts, and customer negotiation.

---

## ✨ Core Product Purpose & Capabilities

- **Quotation Lifecycle & Discount Control Guardrails**: Create commercial proposals with real-time margin calculation, COGS visibility, and automatic discount threshold validation (>15% discount triggers automated approval routing).
- **Automated Approval Router**: Governance engine routing high-discount or low-margin deals across Tier 1 Manager, Tier 2 Executive, and Tier 3 Finance Controller queues with audit rationale logging.
- **Cross-Sell & Upsell Recommendation Engine**: Recommends high-margin service and hardware add-ons (Extended Warranty, Care Plan 2yr, Onsite Setup, Docking Station) dynamically during quote creation.
- **Warehouse Fulfillment Operations**: Logistics board coordinating multi-hub dispatch across Dallas (HUB-01), Chicago (HUB-02), and Frankfurt (HUB-03) with freight carrier tracking sync.
- **Subscriptions & Recurring Contracts**: Manage contracted MRR/ARR, seat counts, renewal timelines (Next 30/60 Days), and 1-click expansion quote generation.
- **Invoices & Accounts Receivable**: Net 30/60 ledger management, payment collections tracking, payment reminders, and printable **Tax Invoice Document PDF preview modal**.
- **Deal Health Risk Diagnostics**: Algorithmic deal diagnostic index scoring deals across 4 vectors (Margin, Velocity, Engagement, Overall) paired with recommended sales playbooks.
- **Isolated Customer Negotiation Portal**: Separate customer-facing portal hiding internal profit margins, COGS, warehouse internals, and internal audit logs while enabling buyers to review proposals, submit counter-discount requests, comment, and execute digital contract signatures.

---

## 🎨 Visual Design Philosophy

Built following strict enterprise B2B SaaS visual guidelines:
- **Dark Charcoal Application Shell**: `#0f172a` / `#1e293b` header shell with active organization selector and module badges.
- **Slate Operational Canvas**: High-legibility `#f8fafc` workspace background, crisp white card containers, restrained solid blue (`#2563eb`) primary actions, and explicit status badges.
- **Zero AI Cliché**: Zero glassmorphism, zero purple-blue AI gradients, zero decorative sparkles, zero floating elements.

---

## 🚀 Tech Stack

- **Core**: React 18 / 19, TypeScript, Vite
- **Icons**: Lucide React
- **Styling**: Pure CSS Custom Properties Design Tokens System (`src/index.css`)

---

## 🛠️ Local Development & Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/jaimit-thummar/dealflow360.git
   cd dealflow360
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Local Dev Server**:
   ```bash
   npm run dev
   ```

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Privacy Rules

The Customer Portal view strictly isolates customer data:
- Hides COGS, internal profit margin %, approval router rules, warehouse hub picking details, and internal audit trails.
- Exposes only customer line items, public list/unit pricing, customer comments, counter-discount submission form, and digital execution receipts.
