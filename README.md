# DocuPro - Business Document Generator

This is a Next.js application built using Firebase Studio to streamline the creation and management of essential business documents. The app currently supports generating Purchase Orders, Payment Vouchers, Sales Invoices, and more, with a focus on professional formatting and automated calculations.

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

## Next Steps & Future Recommendations

While the core functionality is robust, here are some recommendations for what we can work on next to enhance the application:

1.  **Full Database Integration with Firestore**:
    - **What**: Migrate all data (documents, profiles, users) from the browser's local storage to a secure Firestore database.
    - **Why**: This is the most critical next step. It will ensure data is persistent, secure, and accessible across different devices. Local storage is temporary and not suitable for a production application.

2.  **Activate User Management**:
    - **What**: Connect the User Management UI to a backend service (using Genkit and Firebase Admin SDK) to allow Admins to actually invite, edit roles for, and delete users.
    - **Why**: This will enable true multi-user collaboration and role-based access control, which is essential for team-based workflows.

3.  **Role-Based Dashboards & Access Control**:
    - **What**: Customize the dashboard and restrict access to certain pages or features based on the logged-in user's role (e.g., an 'Accountant' might not see 'Purchase Orders').
    - **Why**: This will tailor the user experience to each role, improving efficiency and security.

4.  **Advanced AI Features**:
    - **What**: Use Genkit to implement features like "Invoice to PO" or "Email to Voucher" conversion, where the AI can parse an uploaded document or pasted text to pre-fill form fields automatically.
    - **Why**: This would dramatically speed up the data entry process and reduce manual errors.

I am ready to proceed with any of these enhancements when you are.
