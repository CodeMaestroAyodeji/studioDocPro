# DocuPro - Business Document Generator

This is a Next.js application built to streamline the creation and management of essential business documents. The app is fully containerized with Docker and uses a PostgreSQL database managed by Prisma.

## Core Features

### 1. Document Management
- **Purchase Orders (POs)**: Generate sequential POs (`PO-BSL-YEAR-0001`) with dynamic forms, line items, and advanced tax calculations.
- **Payment Vouchers (PVs)**: Create detailed vouchers (`PV-BSL-YEAR-0001`) with automatic amount-to-words conversion and clear authorization tracking.
- **Sales Invoices**: Issue professional client invoices with automated numbering, VAT calculations, and custom payment terms.
- **Payment Receipts**: Generate and manage receipts for client payments, with options to link them to specific invoices.
- **Vendor Invoices**: Onboard vendors and generate professional invoices on their behalf using one of five distinct, professional templates.
- **Document Listing**: All documents are saved and can be viewed, searched, and managed from centralized list pages.

### 2. User & Company Management
- **Central Dashboard**: A central landing page that provides key statistics and quick-action links to all major features.
- **Company Profile**: A dedicated page to manage company information, including name, address, logo, bank accounts, and authorized signatories. This data is used across all documents for consistency.
- **User Profile Management**: Users can view and edit their own profile, including their name, profile picture, email address, and password.
- **User Management (Mock)**: A complete UI for managing team members and their roles. It currently uses placeholder data and is ready for backend integration.

### 3. Professional Output
- **Save & Preview Workflow**: All documents follow a save-then-preview workflow, redirecting users to a clean, print-ready preview page.
- **Print & PDF**: All final documents are optimized for printing to A4 or saving as a PDF, with professional layouts and branding.
- **Branded Footer**: Documents include a centered footer with the company's name, address, and contact details.

## Technology Stack

- **Framework**: Next.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Containerization**: Docker & Docker Compose
- **Styling**: Tailwind CSS with shadcn/ui
- **Language**: TypeScript
- **AI**: Google Gemini (via Genkit)

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

### 1. Set up Environment Variables
Create a new file named `.env` in the root of the project directory and add the following line. This file is already in `.gitignore`, so it will not be committed.

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"
```

### 2. Build and Run the Application
Open your terminal in the project root and run the following command:

```bash
docker-compose up -d --build
```
This command will build the Docker images for the application and the database, and then start them in the background. The initial build may take a few minutes.

The application will be available at **[http://localhost:3000](http://localhost:3000)**.

## Development Workflow

This project is configured to run entirely within Docker containers. Follow these instructions when making changes.

### Making Code Changes
If you change the application's source code (e.g., in `.tsx` or `.ts` files), you must rebuild the `app` container to see your changes. Use the same command you used to start the app:
```bash
docker-compose up -d --build
```

### Updating the Database Schema
If you modify the `prisma/schema.prisma` file, you need to create a new database migration and apply it.
1.  Make your changes in `prisma/schema.prisma`.
2.  Run the following command in your terminal, replacing `<migration-name>` with a short, descriptive name for your changes (e.g., `add-product-table`).
```bash
docker-compose exec app npx prisma migrate dev --name <migration-name>
```

### Adding New Dependencies
If you add a new dependency to `package.json`, you need to rebuild the image to install it.
```bash
docker-compose up -d --build
```

## Useful Docker Commands

- **Stop the application:**
  ```bash
  docker-compose down
  ```
- **View running services:**
  ```bash
  docker-compose ps
  ```
- **View application logs in real-time:**
  ```bash
  docker-compose logs -f app
  ```