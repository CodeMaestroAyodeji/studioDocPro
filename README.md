# DocuPro - Business Document Generator

This is a Next.js application built using Firebase Studio to streamline the creation and management of essential business documents. The app currently supports generating Purchase Orders and Payment Vouchers with professional formatting and automated calculations.

## Features Implemented

So far, we have built out two core modules:

### 1. Purchase Order (PO) Management

- **Automated PO Numbering**: Generates sequential PO numbers in the format `PO-BSL-YEAR-0001`, which automatically resets at the beginning of each year.
- **Dynamic Form**: An intuitive form to create new Purchase Orders, including fields for Vendor, Project Name, and multiple line items (Description, Quantity, Unit Price).
- **Advanced Tax Calculation**:
    - A per-item checkbox to apply a 5% Withholding Tax (WHT).
    - The calculation logic "grosses up" the unit price for taxable items. This ensures the final amount paid to the vendor matches the agreed-upon price, while the tax is properly accounted for and displayed.
- **Selectable Signatories**: Allows for the selection of up to two authorized signatories from a managed list.
- **Save & Preview Workflow**: Purchase Orders can be saved, automatically redirecting the user to a clean, print-ready preview page.
- **Print & Edit**: The preview page includes options to **Edit** the document or **Print** it to a standard A4 format. The print layout is optimized for a professional appearance.
- **Branded Footer**: All documents include a centered footer with the company's name, address, and contact details.

### 2. Payment Voucher (PV) Management

- **Automated Voucher Numbering**: Generates sequential voucher numbers in the format `PV-BSL-YEAR-0001`, also resetting annually.
- **Comprehensive Form**: A detailed form for creating payment vouchers, capturing payee details, payment method, bank information, and descriptions.
- **Amount in Words**: Automatically converts the numerical amount into words (e.g., "One hundred and fifty thousand naira only").
- **Selectable Signatories**: Features "Prepared By" and "Approved By" dropdowns for clear authorization.
- **Save & Preview Workflow**: Vouchers are saved locally and presented on a polished preview page.
- **Dynamic Filename for Saving**: When printing/saving as a PDF, the filename is automatically suggested in the format `Receivers_name_voucher_number_voucher_date` for easy organization.
- **Refined Print Layout**: The final printout is designed for clarity, with adjusted spacing and clean signature lines.

### 3. Centralized Company Profile

- **Profile Management**: A dedicated page to manage core company information, including name, address, contact details, and logo.
- **Bank & Signatory Lists**: Easily add, edit, or remove company bank accounts and authorized signatories. This information is then available in dropdowns across the application.

## Next Steps & Future Recommendations

While the core functionality is robust, here are some recommendations for what we can work on next to enhance the application:

1.  **Dashboard & Document Listing**:
    - **What**: Create a central dashboard that lists all saved Purchase Orders and Payment Vouchers in sortable and filterable tables.
    - **Why**: This will provide a quick overview of all documents, making it much easier to find, view, or delete existing records without relying on browser history or manually entering URLs.

2.  **Cloud Persistence with Firestore**:
    - **What**: Integrate Firestore to save all documents (POs, Vouchers) and the company profile to the cloud instead of relying on the browser's local storage.
    - **Why**: This is the most critical next step. It will ensure data is persistent, secure, and accessible across different devices and browsers. Local storage is temporary and can be easily cleared.

3.  **User Authentication**:
    - **What**: Add Firebase Authentication to require users to log in.
    - **Why**: This will secure your company's data. Once implemented, each user's documents could be tied to their account, paving the way for multi-user collaboration.

4.  **Advanced AI Features**:
    - **What**: Use Genkit to implement features like "Invoice to PO" or "Email to Voucher" conversion, where the AI can parse an uploaded document or pasted text to pre-fill the form fields automatically.
    - **Why**: This would dramatically speed up the data entry process and reduce manual errors.

I am ready to proceed with any of these enhancements when you are.