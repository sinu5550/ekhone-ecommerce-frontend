// lib/invoicePDF.js — Clean Invoice PDF Generator

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export const getInvoiceNumber = (data) => {
    if (!data) return "INV-N/A";

    const ordNum = typeof data === "string" ? data : (data.orderNumber || data.order?.orderNumber);
    if (ordNum) {
        const clean = String(ordNum).trim();
        if (/^ORD[-_]?/i.test(clean)) {
            return clean.replace(/^ORD[-_]?/i, "INV");
        }
        return `INV${clean}`;
    }

    const invNum = data.invoiceNumber;
    if (invNum) {
        const clean = String(invNum).trim();
        if (/^ORD[-_]?/i.test(clean)) {
            return clean.replace(/^ORD[-_]?/i, "INV");
        }
        if (!/^INV/i.test(clean)) {
            return `INV${clean}`;
        }
        return clean;
    }

    if (data.id || data._id) {
        return `INV${String(data.id || data._id).slice(-6).toUpperCase()}`;
    }

    return "INV-N/A";
};

class ClientPDFGenerator {
    constructor() {
        // Brand colours
        this.brand = [244, 81, 22]; // #F45116 (Ekhone Primary)     
        this.tableHead = [61, 61, 61];  
        this.summHead = [74, 74, 74];    // #4A4A4A - dark gray
        this.primary = [26, 26, 26];     // #1A1A1A
        this.secondary = [102, 102, 102]; // #666666
        this.rowAlt = [245, 245, 245];   // #F5F5F5
        this.border = [222, 222, 222];   // #DEDEDE
        this.success = [46, 125, 50];    // #2E7D32
        this.warning = [200, 75, 0];     // #C84B00
        this.white = [255, 255, 255];

        // Page metrics (mm)
        this.pw = 210;      // A4 width
        this.ph = 297;      // A4 height
        this.mx = 14;       // margin
        this.cw = 182;      // content width

        this.logo = null;
        this.contactData = null;
    }

    normalizeInvoiceData(data) {
        if (!data) return {};
        const invoiceNumber = getInvoiceNumber(data);
        const order = data.order || data;
        const customer = data.customer || data.order?.customer || {};
        const shippingAddress = data.shippingAddress || data.order?.shippingAddress || {};

        const extractVariantLabel = (item) => {
            const v = item.productVariant || item.orderItem?.productVariant || item.variant || item.orderItem?.variant;
            if (v) {
                if (v.attributes) {
                    let attrs = v.attributes;
                    if (typeof attrs === "string") {
                        try { attrs = JSON.parse(attrs); } catch (_) {}
                    }
                    if (typeof attrs === "object" && attrs !== null) {
                        const vals = Object.values(attrs).filter(Boolean);
                        if (vals.length > 0) return vals.join(", ");
                    }
                }
                if (v.variantName) return v.variantName;
                if (v.name) return v.name;
                if (v.color || v.size) return [v.color, v.size].filter(Boolean).join(", ");
            }
            if (item.variantType) return item.variantType;
            if (item.variantTitle) return item.variantTitle;
            if (item.attributes) {
                let attrs = item.attributes;
                if (typeof attrs === "string") {
                    try { attrs = JSON.parse(attrs); } catch (_) {}
                }
                if (typeof attrs === "object" && attrs !== null) {
                    const vals = Object.values(attrs).filter(Boolean);
                    if (vals.length > 0) return vals.join(", ");
                }
            }
            return "";
        };

        const rawItems = data.invoiceItems || data.orderItems || data.order?.orderItems || [];
        const invoiceItems = rawItems.map(item => {
            const baseName = item.productName || item.product?.productName || item.product?.name || item.orderItem?.product?.productName || "Product";
            const variantLabel = extractVariantLabel(item);
            let finalName = baseName;
            if (variantLabel && !baseName.toLowerCase().includes(variantLabel.toLowerCase())) {
                finalName = `${baseName} (${variantLabel})`;
            }

            return {
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice ?? item.price ?? 0,
                discount: item.discount ?? 0,
                tax: item.tax ?? 0,
                lineTotal: item.lineTotal ?? ((item.quantity || 1) * (item.unitPrice ?? item.price ?? 0) - (item.discount ?? 0) + (item.tax ?? 0)),
                productName: finalName,
                sku: item.sku || item.productVariant?.sku || item.orderItem?.productVariant?.sku || item.product?.sku || item.orderItem?.product?.sku || "—",
                orderItem: item.orderItem || item
            };
        });

        const totalAmount = data.totalAmount ?? data.subTotal ?? data.order?.subTotal ?? order.totalAmount ?? 0;
        const discount = data.discount ?? data.order?.discount ?? order.discount ?? 0;
        const voucher_promo = data.voucher_promo ?? data.voucherDiscount ?? data.order?.voucherDiscount ?? order.voucher_promo ?? 0;
        const tax = data.tax ?? data.order?.tax ?? order.tax ?? 0;
        const shippingCost = data.shippingCost ?? data.order?.shippingCost ?? order.shippingCost ?? 0;
        const grandTotal = data.grandTotal ?? data.order?.grandTotal ?? order.grandTotal ?? (totalAmount - discount - voucher_promo + tax + shippingCost);
        const paidAmount = data.paidAmount ?? data.order?.paidAmount ?? order.paidAmount ?? 0;
        const dueAmount = data.dueAmount ?? data.order?.dueAmount ?? order.dueAmount ?? (grandTotal - paidAmount);

        return {
            ...data,
            order,
            orderNumber: data.orderNumber || data.order?.orderNumber || data.id || invoiceNumber || "",
            invoiceNumber,
            createdAt: data.createdAt || data.orderDate || data.order?.orderDate || new Date().toISOString(),
            paymentMethod: data.paymentMethod || data.orderPaymentMethod || data.order?.paymentMethod || "COD",
            paymentStatus: data.paymentStatus || data.order?.paymentStatus || data.orderPaymentStatus || "",
            customer,
            shippingAddress: {
                ...shippingAddress,
                address: shippingAddress.address || shippingAddress.addressLine1 || "",
                recipientName: shippingAddress.recipientName || customer.fullName || "",
                phoneNumber: shippingAddress.phoneNumber || customer.phone || ""
            },
            invoiceItems,
            totalAmount,
            discount,
            voucher_promo,
            tax,
            shippingCost,
            grandTotal,
            paidAmount,
            dueAmount,
            note: data.note || data.orderNote || data.order?.orderNote || "",
            remarks: data.remarks || data.order?.remarks || ""
        };
    }

    async loadLogo() {
        if (this.logo) return this.logo;
        try {
            const res = await fetch("/ekhone.png");
            const blob = await res.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => { this.logo = reader.result; resolve(this.logo); };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    }

    async loadContact() {
        if (this.contactData) return this.contactData;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${apiUrl}/api/contact`);
            if (res.ok) {
                const data = await res.json();
                this.contactData = data?.data || data;
                return this.contactData;
            }
        } catch (e) {
            console.warn("[invoicePDF] Could not fetch contact details from backend:", e?.message);
        }
        return null;
    }

    getContactStrings() {
        const c = this.contactData || {};
        const phone = c.phone_number || c.telephone || c.phone || "+880 1969-957888";
        const email = c.primary_email || c.secondary_email || c.email || "support@ekhone.com";
        const address = c.address || "Dhaka, Bangladesh";
        const title = c.title || "Ekhone Online Shop";
        return { phone, email, address, title };
    }

    async generateInvoice(rawInvoiceData) {
        const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
        const invoiceData = this.normalizeInvoiceData(rawInvoiceData);

        await Promise.all([this.loadLogo(), this.loadContact()]);
        const qrDataURL = await this.buildQRDataURL(invoiceData);

        let y = this.addHeader(doc, invoiceData);
        y = this.addBillingSection(doc, invoiceData, y, qrDataURL);
        y = this.addItemsTable(doc, invoiceData, y);
        this.addSummaryAndNotes(doc, invoiceData, y + 5);
        this.addFooter(doc);

        return doc.output("blob");
    }

    async generateAllInvoices(invoicesOrOrdersList) {
        if (!invoicesOrOrdersList || invoicesOrOrdersList.length === 0) {
            throw new Error("No orders or invoices found to generate.");
        }
        const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
        await Promise.all([this.loadLogo(), this.loadContact()]);

        for (let i = 0; i < invoicesOrOrdersList.length; i++) {
            if (i > 0) {
                doc.addPage("a4", "portrait");
            }
            const invoiceData = this.normalizeInvoiceData(invoicesOrOrdersList[i]);
            const qrDataURL = await this.buildQRDataURL(invoiceData);

            let y = this.addHeader(doc, invoiceData);
            y = this.addBillingSection(doc, invoiceData, y, qrDataURL);
            y = this.addItemsTable(doc, invoiceData, y);
            this.addSummaryAndNotes(doc, invoiceData, y + 5);
            this.addFooter(doc);
        }

        return doc.output("blob");
    }

    addHeader(doc, invoiceData) {
        const { pw, mx, brand, primary, secondary, white } = this;
        const rightX = pw - mx;
        const HEADER_H = 36;

        doc.setFillColor(...white);
        doc.rect(0, 0, pw, HEADER_H, "F");

        if (this.logo) {
            doc.addImage(this.logo, "PNG", mx, 6, 0, 15);
        } else {
            doc.setFillColor(...brand);
            doc.rect(mx, 4, 1.2, 16, "F");
            doc.setFontSize(14);
            doc.setFont(undefined, "bold");
            doc.setTextColor(...primary);
            doc.text("Ekhone", mx + 3, 14);
            doc.setFillColor(...brand);
            doc.circle(mx + 22, 9, 1.4, "F");
            doc.setFontSize(6);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...secondary);
            doc.text("Authentic Online Shopping", mx + 3, 19);
        }

        doc.setFontSize(20);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text("INVOICE", rightX, 11, { align: "right" });

        const LBL_X = rightX - 50;
        const VAL_X = rightX;

        const metaRows = [
            { lbl: "Invoice No:", val: invoiceData.invoiceNumber || "N/A" },
            { lbl: "Date:", val: this.formatDate(invoiceData.createdAt) },
            { lbl: "Payment :", val: invoiceData.paymentMethod || invoiceData.orderPaymentMethod || "N/A" },
        ];

        let metaY = 17;
        metaRows.forEach((r) => {
            doc.setFontSize(8);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...secondary);
            doc.text(r.lbl, LBL_X, metaY);

            doc.setFont(undefined, "bold");
            doc.setTextColor(...primary);
            doc.text(r.val, VAL_X, metaY, { align: "right" });

            metaY += 4.8;
        });

        doc.setFillColor(...brand);
        doc.rect(0, HEADER_H, pw, 3, "F");

        return HEADER_H + 3;
    }

    addBillingSection(doc, invoiceData, startY, qrDataURL) {
        const { pw, mx, cw, primary, secondary, border } = this;
        const customer = invoiceData.customer || {};
        const shipping = invoiceData.shippingAddress || {};
        const rightX = pw - mx;

        const COL_W = cw / 3;
        const COL2_X = mx + COL_W;
        const TOP = startY + 5;

        // BILL TO
        doc.setFontSize(7.5);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text("BILL TO", mx, TOP);

        let leftY = TOP + 5;
        const custName = String(customer.fullName || "N/A");
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text(custName, mx, leftY);
        leftY += 5;

        doc.setFontSize(7.5);
        doc.setFont(undefined, "normal");
        doc.setTextColor(...secondary);
        if (customer.email) { doc.text(String(customer.email), mx, leftY); leftY += 4; }
        if (customer.phone) { doc.text(String(customer.phone), mx, leftY); leftY += 4; }

        // SHIP TO
        doc.setFontSize(7.5);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text("SHIP TO", COL2_X, TOP);

        let shipY = TOP + 5;
        const recipientName = String(shipping.recipientName || customer.fullName || "N/A");
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text(recipientName, COL2_X + 3, shipY);
        shipY += 5;

        doc.setFontSize(7.5);
        doc.setFont(undefined, "normal");
        doc.setTextColor(...secondary);

        const MAX_LINE_W = COL_W - 8;
        const rawShipLines = [
            shipping.address?.trim() || "",
            [shipping.city, shipping.upazila].filter(Boolean).join(", "),
            [shipping.district, shipping.postalCode].filter(Boolean).join(" - "),
            shipping.division?.trim() || "",
            shipping.country?.trim() || "Bangladesh",
            shipping.phoneNumber?.trim() ? `Phone: ${shipping.phoneNumber.trim()}` : "",
        ].filter(l => l.trim());

        rawShipLines.forEach((line) => {
            const wrapped = doc.splitTextToSize(line, MAX_LINE_W);
            wrapped.forEach((wline) => {
                doc.text(wline, COL2_X + 3, shipY);
                shipY += 4;
            });
        });

        // QR Code
        const QR_SIZE = 22;
        const QR_X = rightX - QR_SIZE;
        const QR_Y = TOP + 8;

        if (qrDataURL) {
            doc.setDrawColor(...border);
            doc.setLineWidth(0.2);
            doc.rect(QR_X - 1, QR_Y - 1, QR_SIZE + 2, QR_SIZE + 2);
            doc.addImage(qrDataURL, "PNG", QR_X, QR_Y, QR_SIZE, QR_SIZE);
            doc.setFontSize(5.5);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...secondary);
            doc.text("Scan to verify", QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + 3.5, { align: "center" });
        }

        const sectionBottom = Math.max(leftY, shipY, QR_Y + QR_SIZE + 6) + 4;
        doc.setDrawColor(...border);
        doc.setLineWidth(0.3);
        doc.line(mx, sectionBottom, pw - mx, sectionBottom);

        return sectionBottom + 3;
    }

    addItemsTable(doc, invoiceData, startY) {
        const { mx, cw, tableHead, primary, rowAlt } = this;
        const items = invoiceData.invoiceItems || [];

        doc.setFontSize(8.5);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text("Order Items", mx, startY + 1);

        const tableData = items.map((item, i) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.unitPrice || 0);
            const discount = Number(item.discount || 0);
            const tax = Number(item.tax || 0);
            const total = Number(item.lineTotal || (qty * price - discount + tax));

            const productName = item.productName || item.orderItem?.product?.productName || "Product";
            const sku = item.sku || item.orderItem?.product?.sku || "—";

            return [i + 1, productName, sku, qty, this.formatCurrency(price), discount ? this.formatCurrency(discount) : "—", tax ? this.formatCurrency(tax) : "—", this.formatCurrency(total)];
        });

        autoTable(doc, {
            startY: startY + 5,
            head: [["#", "Product Name", "SKU", "Qty", "Unit Price", "Discount", "Tax", "Total"]],
            body: tableData,
            theme: "plain",
            headStyles: {
                fillColor: tableHead,
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7.5,
                halign: "center",
                cellPadding: 2.2,
            },
            bodyStyles: {
                fontSize: 7.5,
                textColor: primary,
                fillColor: [255, 255, 255],
                cellPadding: 1.8,
            },
            alternateRowStyles: { fillColor: rowAlt },
            columnStyles: {
                0: { halign: "center", cellWidth: 8 },
                1: { halign: "left", cellWidth: 56 },
                2: { halign: "left", cellWidth: 22 },
                3: { halign: "center", cellWidth: 10 },
                4: { halign: "right", cellWidth: 24 },
                5: { halign: "right", cellWidth: 22 },
                6: { halign: "right", cellWidth: 16 },
                7: { halign: "right", cellWidth: 24, fontStyle: "bold" },
            },
            margin: { left: mx, right: mx },
            tableWidth: cw,
        });

        return doc.lastAutoTable.finalY;
    }

    addSummaryAndNotes(doc, invoiceData, startY) {
        const { pw, mx, cw, primary, secondary, success, warning, summHead, border } = this;

        const BOX_W = cw / 2;
        const BOX_X = pw - mx - BOX_W;

        const priceRows = [
            { lbl: "Subtotal", val: this.formatCurrency(invoiceData.totalAmount || 0) },
            ...(Number(invoiceData.discount) > 0 ? [{ lbl: "Discount", val: `-${this.formatCurrency(invoiceData.discount)}` }] : []),
            ...(Number(invoiceData.voucher_promo) > 0 ? [{ lbl: "Voucher/Promo", val: `-${this.formatCurrency(invoiceData.voucher_promo)}` }] : []),
            { lbl: "Tax", val: this.formatCurrency(invoiceData.tax || 0) },
            { lbl: "Shipping", val: invoiceData.shippingCost === 0 ? "Free" : this.formatCurrency(invoiceData.shippingCost || 0) },
        ];

        const hasDue = Number(invoiceData.dueAmount) > 0;
        const ROW_H = 5.5;
        const HDR_H = 6.5;
        const PAD = 3.5;
        const GRAND_H = 8;
        const PAID_H = 5;
        const DUE_H = hasDue ? 5 : 0;
        const WORDS_H = 8;
        const BOX_H = HDR_H + PAD + (priceRows.length * ROW_H) + 3 + GRAND_H + PAID_H + DUE_H + WORDS_H + PAD;

        doc.setDrawColor(...border);
        doc.setLineWidth(0.3);
        doc.rect(BOX_X, startY, BOX_W, BOX_H);

        doc.setFillColor(...summHead);
        doc.rect(BOX_X, startY, BOX_W, HDR_H, "F");
        doc.setFontSize(7.5);
        doc.setFont(undefined, "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("PRICE SUMMARY", BOX_X + 3, startY + 4.5);

        let psY = startY + HDR_H + PAD;

        priceRows.forEach((row) => {
            doc.setFontSize(7.5);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...secondary);
            doc.text(row.lbl, BOX_X + 3, psY);
            doc.setTextColor(...primary);
            doc.text(row.val, BOX_X + BOX_W - 3, psY, { align: "right" });
            psY += ROW_H;
        });

        doc.setDrawColor(...border);
        doc.setLineWidth(0.2);
        doc.line(BOX_X + 2, psY + 1, BOX_X + BOX_W - 2, psY + 1);
        psY += 4;

        doc.setFontSize(9.5);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text("GRAND TOTAL:", BOX_X + 3, psY + 4);
        const grandTotal = invoiceData.grandTotal || 0;
        doc.text(this.formatCurrency(grandTotal), BOX_X + BOX_W - 3, psY + 4, { align: "right" });
        psY += GRAND_H;

        doc.setFontSize(7.5);
        doc.setFont(undefined, "normal");
        doc.setTextColor(...secondary);
        doc.text("Paid:", BOX_X + 3, psY);
        doc.setTextColor(...success);
        doc.setFont(undefined, "bold");
        doc.text(this.formatCurrency(invoiceData.paidAmount || 0), BOX_X + BOX_W - 3, psY, { align: "right" });
        psY += PAID_H;

        if (hasDue) {
            doc.setFontSize(7.5);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...secondary);
            doc.text("Due:", BOX_X + 3, psY);
            doc.setTextColor(...warning);
            doc.setFont(undefined, "bold");
            doc.text(this.formatCurrency(invoiceData.dueAmount), BOX_X + BOX_W - 3, psY, { align: "right" });
            psY += DUE_H;
        }

        doc.setFontSize(6.5);
        doc.setFont(undefined, "italic");
        doc.setTextColor(...secondary);
        const amountInWords = this.numberToWords(grandTotal);
        const wordsLines = doc.splitTextToSize(`${amountInWords} taka only`, BOX_W - 6);
        doc.text(wordsLines, BOX_X + 3, psY + 2);

        // Notes & Terms
        const note = invoiceData.note || invoiceData.orderNote || "";
        const remarks = invoiceData.remarks || "";

        if (note || remarks) {
            const summaryBottom = startY + BOX_H + 6;

            doc.setFontSize(8);
            doc.setFont(undefined, "bold");
            doc.setTextColor(...primary);
            doc.text("NOTES & TERMS", mx, summaryBottom + 5);

            let noteY = summaryBottom + 11;

            if (remarks.trim()) {
                const remarkLines = doc.splitTextToSize(remarks.trim(), cw);
                doc.setFontSize(7.5);
                doc.setFont(undefined, "normal");
                doc.setTextColor(...secondary);
                doc.text(remarkLines, mx, noteY);
                noteY += remarkLines.length * 4 + 3;
            }

            if (note.trim()) {
                const noteLines = doc.splitTextToSize(note.trim(), cw);
                doc.setFontSize(7.5);
                doc.setFont(undefined, "normal");
                doc.setTextColor(...secondary);
                doc.text(noteLines, mx, noteY);
            }
        }
    }

    addFooter(doc) {
        const { pw, ph, mx, primary, secondary, brand } = this;
        const FY = ph - 12;

        doc.setDrawColor(...brand);
        doc.setLineWidth(0.3);
        doc.line(mx, FY - 2, pw - mx, FY - 2);

        doc.setFontSize(7.5);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...primary);
        doc.text("Thank you for your purchase!", pw / 2, FY + 2, { align: "center" });

        const contact = this.getContactStrings();
        const contactLine = `${contact.address} | Phone: ${contact.phone} | Email: ${contact.email}`;

        doc.setFontSize(6.5);
        doc.setFont(undefined, "normal");
        doc.setTextColor(...secondary);
        doc.text(
            contactLine,
            pw / 2, FY + 6.5, { align: "center" }
        );
    }

    async buildQRDataURL(invoiceData) {
        try {
            const payload = JSON.stringify({
                invoice: invoiceData.invoiceNumber || "N/A",
                amount: invoiceData.grandTotal || 0,
                customer: invoiceData.customer?.fullName || "N/A",
                date: invoiceData.createdAt || new Date().toISOString(),
            });
            return await QRCode.toDataURL(payload, {
                errorCorrectionLevel: "M",
                margin: 1,
                color: { dark: "#1A1A1A", light: "#FFFFFF" },
            });
        } catch {
            return null;
        }
    }

    formatDate(date) {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
        });
    }

    formatCurrency(amount) {
        const num = parseFloat(amount || 0);
        return `BDT ${num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    numberToWords(num) {
        if (num === 0) return "zero";

        const [wholePart, decimalPart] = parseFloat(num).toFixed(2).split('.');
        const wholeNumber = parseInt(wholePart);
        const decimalNumber = parseInt(decimalPart);

        let words = this.convertWholeNumber(wholeNumber);
        if (decimalNumber > 0) {
            words += ` and ${this.convertDecimal(decimalNumber)} paisa`;
        }
        return words;
    }

    convertWholeNumber(num) {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
            'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
            'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        const convertLessThanThousand = (n) => {
            if (n === 0) return '';
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
        };

        if (num === 0) return '';

        const crore = Math.floor(num / 10000000);
        let remainder = num % 10000000;
        const lakh = Math.floor(remainder / 100000);
        remainder = remainder % 100000;
        const thousand = Math.floor(remainder / 1000);
        remainder = remainder % 1000;

        let result = '';
        if (crore > 0) result += convertLessThanThousand(crore) + ' crore ';
        if (lakh > 0) result += convertLessThanThousand(lakh) + ' lakh ';
        if (thousand > 0) result += convertLessThanThousand(thousand) + ' thousand ';
        if (remainder > 0) result += convertLessThanThousand(remainder);

        return result.trim().replace(/\s+/g, ' ');
    }

    convertDecimal(num) {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
            'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
            'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        if (num < 20) return ones[num];
        return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    }

    async generatePOSReceipt(rawInvoiceData) {
        const invoiceData = this.normalizeInvoiceData(rawInvoiceData);
        await this.loadContact();
        const contact = this.getContactStrings();

        const items = invoiceData.invoiceItems || invoiceData.order?.orderItems || invoiceData.orderItems || [];
        const height = Math.max(150, 100 + (items.length * 12));
        const doc = new jsPDF({ unit: "mm", format: [80, height] });

        const mx = 5;
        const w = 70;
        let y = 10;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("EKHONE", 40, y, { align: "center" });
        y += 5;

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Online Shopping Platform", 40, y, { align: "center" });
        y += 4;
        doc.setFontSize(7);
        doc.text(`${contact.phone} | ${contact.email}`, 40, y, { align: "center" });
        y += 5;

        doc.setDrawColor(200, 200, 200);
        doc.line(mx, y, mx + w, y);
        y += 5;

        doc.setFontSize(8);
        doc.setFont("Helvetica", "bold");
        doc.text(`INVOICE: ${invoiceData.invoiceNumber || "—"}`, mx, y);
        y += 4;
        doc.setFont("Helvetica", "normal");
        doc.text(`Order No: ${invoiceData.orderNumber || invoiceData.order?.orderNumber || "—"}`, mx, y);
        y += 4;
        doc.text(`Date: ${invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, mx, y);
        y += 5;

        const customer = invoiceData.customer || invoiceData.order?.customer || {};
        doc.setFont("Helvetica", "bold");
        doc.text("CUSTOMER INFO:", mx, y);
        y += 4;
        doc.setFont("Helvetica", "normal");
        doc.text(`Name: ${customer.fullName || "Guest"}`, mx, y);
        y += 4;
        doc.text(`Phone: ${customer.phone || "—"}`, mx, y);
        y += 5;

        doc.line(mx, y, mx + w, y);
        y += 5;

        doc.setFont("Helvetica", "bold");
        doc.text("Item Description", mx, y);
        doc.text("Qty", mx + 38, y);
        doc.text("Price", mx + 48, y);
        doc.text("Total", mx + w - 2, y, { align: "right" });
        y += 4;
        doc.line(mx, y, mx + w, y);
        y += 4;

        doc.setFont("Helvetica", "normal");
        items.forEach((item) => {
            const pName = item.productName || item.product?.productName || item.product?.name || "Product";
            const qty = item.quantity || 1;
            const price = item.unitPrice ?? item.price ?? 0;
            const total = item.lineTotal ?? (qty * price);

            const splitName = doc.splitTextToSize(pName, 35);
            doc.text(splitName, mx, y);
            doc.text(`${qty}`, mx + 38, y);
            doc.text(`${price}`, mx + 48, y);
            doc.text(`${total}`, mx + w - 2, y, { align: "right" });
            
            y += (splitName.length * 4) + 1;
        });

        doc.line(mx, y, mx + w, y);
        y += 5;

        const order = invoiceData.order || {};
        const subtotal = invoiceData.totalAmount || order.subTotal || invoiceData.subTotal || 0;
        const discount = invoiceData.discount || order.discount || 0;
        const shipping = invoiceData.shippingCost || order.shippingCost || 0;
        const grandTotal = invoiceData.grandTotal || order.grandTotal || 0;
        const paid = invoiceData.paidAmount || order.paidAmount || 0;
        const due = invoiceData.dueAmount || order.dueAmount || 0;

        doc.text("Sub Total:", mx + 30, y);
        doc.text(`TK ${subtotal}`, mx + w - 2, y, { align: "right" });
        y += 4;

        if (discount > 0) {
            doc.text("Discount:", mx + 30, y);
            doc.text(`-TK ${discount}`, mx + w - 2, y, { align: "right" });
            y += 4;
        }

        if (shipping > 0) {
            doc.text("Shipping:", mx + 30, y);
            doc.text(`TK ${shipping}`, mx + w - 2, y, { align: "right" });
            y += 4;
        }

        doc.setFont("Helvetica", "bold");
        doc.text("Grand Total:", mx + 30, y);
        doc.text(`TK ${grandTotal}`, mx + w - 2, y, { align: "right" });
        y += 5;

        doc.setFont("Helvetica", "normal");
        doc.text("Paid Amount:", mx + 30, y);
        doc.text(`TK ${paid}`, mx + w - 2, y, { align: "right" });
        y += 4;

        doc.setFont("Helvetica", "bold");
        doc.text("Due Amount:", mx + 30, y);
        doc.text(`TK ${due}`, mx + w - 2, y, { align: "right" });
        y += 8;

        doc.setFont("Helvetica", "italic");
        doc.setFontSize(8);
        doc.text("Thank you for shopping with us!", 40, y, { align: "center" });
        y += 4;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Powered by Ekhone", 40, y, { align: "center" });

        return doc.output("blob");
    }

    generatePosReceipt(rawInvoiceData) {
        return this.generatePOSReceipt(rawInvoiceData);
    }

    async generateShippingLabel(rawInvoiceData) {
        const invoiceData = this.normalizeInvoiceData(rawInvoiceData);
        await this.loadContact();
        const contact = this.getContactStrings();

        const doc = new jsPDF({ unit: "mm", format: [105, 148] });
        const mx = 8;
        const w = 89;
        let y = 12;

        doc.setLineWidth(0.5);
        doc.setDrawColor(60, 60, 60);
        doc.rect(4, 4, 97, 140);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(13);
        doc.text("SHIPPING LABEL", 52.5, y, { align: "center" });
        y += 6;

        doc.setLineWidth(0.3);
        doc.line(mx, y, mx + w, y);
        y += 5;

        doc.setFontSize(8);
        doc.setFont("Helvetica", "bold");
        doc.text("SENDER:", mx, y);
        y += 4;
        doc.setFont("Helvetica", "normal");
        doc.text(contact.title || "Ekhone Online Shop", mx, y);
        y += 4;
        doc.text(`${contact.address} | Hotline: ${contact.phone}`, mx, y);
        y += 5;

        doc.line(mx, y, mx + w, y);
        y += 5;

        const order = invoiceData.order || rawInvoiceData?.order || rawInvoiceData || {};
        const customer = order.customer || invoiceData.customer || rawInvoiceData?.customer || {};
        const address = order.shippingAddress || invoiceData.shippingAddress || rawInvoiceData?.shippingAddress || {};
        
        let addrStr = "—";
        if (address) {
            if (typeof address === "string") {
                addrStr = address;
            } else {
                const parts = [
                    address.address || address.addressLine1,
                    address.addressLine2,
                    address.upazila,
                    address.city,
                    address.district,
                    address.division || address.state,
                    address.postalCode,
                    address.country
                ].filter(Boolean);
                addrStr = parts.length > 0 ? parts.join(", ") : (address.address || "—");
            }
        }

        const recipientName = address.recipientName || customer.fullName || customer.name || order.customerName || "Guest Customer";
        const recipientPhone = address.phoneNumber || customer.phone || customer.phoneNumber || order.customerPhone || "—";

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text("RECIPIENT / SHIP TO:", mx, y);
        y += 5;
        doc.setFontSize(11);
        doc.text(recipientName, mx, y);
        y += 5;

        doc.setFontSize(10);
        doc.text(`Phone: ${recipientPhone}`, mx, y);
        y += 5;

        doc.setFontSize(8);
        doc.setFont("Helvetica", "normal");
        const splitAddress = doc.splitTextToSize(`Address: ${addrStr}`, w);
        doc.text(splitAddress, mx, y);
        y += (splitAddress.length * 4) + 4;

        doc.line(mx, y, mx + w, y);
        y += 5;

        const orderNumber = order.orderNumber || invoiceData.orderNumber || rawInvoiceData.orderNumber || invoiceData.invoiceNumber || order.id || "—";
        doc.setFontSize(9);
        doc.setFont("Helvetica", "bold");
        doc.text(`ORDER NO: ${orderNumber}`, mx, y);
        y += 5;

        // Payment and COD calculation
        const paymentMethod = (order.paymentMethod || invoiceData.paymentMethod || rawInvoiceData.paymentMethod || "COD").toString();
        const paymentStatus = (order.paymentStatus || invoiceData.paymentStatus || rawInvoiceData.paymentStatus || "").toString();

        const grandTotal = Number(invoiceData.grandTotal ?? order.grandTotal ?? rawInvoiceData.grandTotal ?? 0);
        const paidAmount = Number(invoiceData.paidAmount ?? order.paidAmount ?? rawInvoiceData.paidAmount ?? 0);
        const dueAmount = Number(invoiceData.dueAmount ?? order.dueAmount ?? rawInvoiceData.dueAmount ?? (grandTotal - paidAmount));

        // Determine COD amount to collect
        let codAmt = 0;
        if (paymentStatus && String(paymentStatus).toLowerCase() === "paid") {
            codAmt = 0;
        } else if (rawInvoiceData?.codAmount !== undefined && rawInvoiceData?.codAmount !== null) {
            codAmt = Number(rawInvoiceData.codAmount);
        } else if (order.dueAmount !== undefined && order.dueAmount !== null && Number(order.dueAmount) > 0) {
            codAmt = Number(order.dueAmount);
        } else if (dueAmount > 0) {
            codAmt = dueAmount;
        } else if (/cod|cash/i.test(paymentMethod)) {
            codAmt = grandTotal > 0 ? (grandTotal - paidAmount) : 0;
        } else {
            codAmt = 0;
        }

        doc.setFontSize(12);
        doc.text(`COD AMOUNT: TK ${codAmt.toLocaleString()}`, mx, y);
        y += 6;

        doc.setFontSize(8);
        doc.setFont("Helvetica", "normal");
        const payStatusDisplay = paymentStatus ? ` (${paymentStatus})` : (codAmt > 0 ? " (Unpaid)" : " (Paid)");
        doc.text(`Payment: ${paymentMethod}${payStatusDisplay}`, mx, y);
        y += 4;
        doc.text(`Date: ${invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, mx, y);

        if (order.note || invoiceData.note) {
            y += 4;
            const noteText = doc.splitTextToSize(`Note: ${order.note || invoiceData.note}`, w);
            doc.text(noteText, mx, y);
        }

        try {
            const qrDataURL = await this.buildQRDataURL(invoiceData);
            if (qrDataURL) {
                doc.addImage(qrDataURL, "JPEG", mx + w - 24, y - 16, 24, 24);
            }
        } catch (e) {}

        return doc.output("blob");
    }

    async generateAllShippingLabels(invoicesOrOrdersList) {
        if (!invoicesOrOrdersList || invoicesOrOrdersList.length === 0) {
            throw new Error("No orders found to generate shipping labels.");
        }
        await this.loadContact();
        const contact = this.getContactStrings();

        const doc = new jsPDF({ unit: "mm", format: [105, 148] });
        const mx = 8;
        const w = 89;

        for (let i = 0; i < invoicesOrOrdersList.length; i++) {
            if (i > 0) {
                doc.addPage([105, 148], "portrait");
            }
            const rawInvoiceData = invoicesOrOrdersList[i];
            const invoiceData = this.normalizeInvoiceData(rawInvoiceData);
            let y = 12;

            doc.setLineWidth(0.5);
            doc.setDrawColor(60, 60, 60);
            doc.rect(4, 4, 97, 140);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(13);
            doc.text("SHIPPING LABEL", 52.5, y, { align: "center" });
            y += 6;

            doc.setLineWidth(0.3);
            doc.line(mx, y, mx + w, y);
            y += 5;

            doc.setFontSize(8);
            doc.setFont("Helvetica", "bold");
            doc.text("SENDER:", mx, y);
            y += 4;
            doc.setFont("Helvetica", "normal");
            doc.text(contact.title || "Ekhone Online Shop", mx, y);
            y += 4;
            doc.text(`${contact.address} | Hotline: ${contact.phone}`, mx, y);
            y += 5;

            doc.line(mx, y, mx + w, y);
            y += 5;

            const order = invoiceData.order || rawInvoiceData?.order || rawInvoiceData || {};
            const customer = order.customer || invoiceData.customer || rawInvoiceData?.customer || {};
            const address = order.shippingAddress || invoiceData.shippingAddress || rawInvoiceData?.shippingAddress || {};
            
            let addrStr = "—";
            if (address) {
                if (typeof address === "string") {
                    addrStr = address;
                } else {
                    const parts = [
                        address.address || address.addressLine1,
                        address.addressLine2,
                        address.upazila,
                        address.city,
                        address.district,
                        address.division || address.state,
                        address.postalCode,
                        address.country
                    ].filter(Boolean);
                    addrStr = parts.length > 0 ? parts.join(", ") : (address.address || "—");
                }
            }

            const recipientName = address.recipientName || customer.fullName || customer.name || order.customerName || "Guest Customer";
            const recipientPhone = address.phoneNumber || customer.phone || customer.phoneNumber || order.customerPhone || "—";

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(8);
            doc.text("RECIPIENT / SHIP TO:", mx, y);
            y += 5;
            doc.setFontSize(11);
            doc.text(recipientName, mx, y);
            y += 5;

            doc.setFontSize(10);
            doc.text(`Phone: ${recipientPhone}`, mx, y);
            y += 5;

            doc.setFontSize(8);
            doc.setFont("Helvetica", "normal");
            const splitAddress = doc.splitTextToSize(`Address: ${addrStr}`, w);
            doc.text(splitAddress, mx, y);
            y += (splitAddress.length * 4) + 4;

            doc.line(mx, y, mx + w, y);
            y += 5;

            const orderNumber = order.orderNumber || invoiceData.orderNumber || rawInvoiceData.orderNumber || invoiceData.invoiceNumber || order.id || "—";
            doc.setFontSize(9);
            doc.setFont("Helvetica", "bold");
            doc.text(`ORDER NO: ${orderNumber}`, mx, y);
            y += 5;

            const paymentMethod = (order.paymentMethod || invoiceData.paymentMethod || rawInvoiceData.paymentMethod || "COD").toString();
            const paymentStatus = (order.paymentStatus || invoiceData.paymentStatus || rawInvoiceData.paymentStatus || "").toString();

            const grandTotal = Number(invoiceData.grandTotal ?? order.grandTotal ?? rawInvoiceData.grandTotal ?? 0);
            const paidAmount = Number(invoiceData.paidAmount ?? order.paidAmount ?? rawInvoiceData.paidAmount ?? 0);
            const dueAmount = Number(invoiceData.dueAmount ?? order.dueAmount ?? rawInvoiceData.dueAmount ?? (grandTotal - paidAmount));

            let codAmt = 0;
            if (paymentStatus && String(paymentStatus).toLowerCase() === "paid") {
                codAmt = 0;
            } else if (rawInvoiceData?.codAmount !== undefined && rawInvoiceData?.codAmount !== null) {
                codAmt = Number(rawInvoiceData.codAmount);
            } else if (order.dueAmount !== undefined && order.dueAmount !== null && Number(order.dueAmount) > 0) {
                codAmt = Number(order.dueAmount);
            } else if (dueAmount > 0) {
                codAmt = dueAmount;
            } else if (/cod|cash/i.test(paymentMethod)) {
                codAmt = grandTotal > 0 ? (grandTotal - paidAmount) : 0;
            } else {
                codAmt = 0;
            }

            doc.setFontSize(12);
            doc.text(`COD AMOUNT: TK ${codAmt.toLocaleString()}`, mx, y);
            y += 6;

            doc.setFontSize(8);
            doc.setFont("Helvetica", "normal");
            const payStatusDisplay = paymentStatus ? ` (${paymentStatus})` : (codAmt > 0 ? " (Unpaid)" : " (Paid)");
            doc.text(`Payment: ${paymentMethod}${payStatusDisplay}`, mx, y);
            y += 4;
            doc.text(`Date: ${invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, mx, y);

            if (order.note || invoiceData.note) {
                y += 4;
                const noteText = doc.splitTextToSize(`Note: ${order.note || invoiceData.note}`, w);
                doc.text(noteText, mx, y);
            }

            try {
                const qrDataURL = await this.buildQRDataURL(invoiceData);
                if (qrDataURL) {
                    doc.addImage(qrDataURL, "JPEG", mx + w - 24, y - 16, 24, 24);
                }
            } catch (e) {}
        }

        return doc.output("blob");
    }

    async generateAllPOSReceipts(invoicesOrOrdersList) {
        if (!invoicesOrOrdersList || invoicesOrOrdersList.length === 0) {
            throw new Error("No orders found to generate POS receipts.");
        }
        await this.loadContact();
        const contact = this.getContactStrings();
        
        let doc = null;

        for (let i = 0; i < invoicesOrOrdersList.length; i++) {
            const rawInvoiceData = invoicesOrOrdersList[i];
            const invoiceData = this.normalizeInvoiceData(rawInvoiceData);
            const items = invoiceData.invoiceItems || invoiceData.order?.orderItems || invoiceData.orderItems || [];
            const reqHeight = Math.max(160, 100 + (items.length * 12));

            if (i === 0) {
                doc = new jsPDF({ unit: "mm", format: [80, reqHeight] });
            } else {
                doc.addPage([80, reqHeight], "portrait");
            }

            const mx = 5;
            const w = 70;
            let y = 10;

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(12);
            doc.text("EKHONE", 40, y, { align: "center" });
            y += 5;

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.text("Online Shopping Platform", 40, y, { align: "center" });
            y += 4;
            doc.setFontSize(7);
            doc.text(`${contact.phone} | ${contact.email}`, 40, y, { align: "center" });
            y += 5;

            doc.setDrawColor(200, 200, 200);
            doc.line(mx, y, mx + w, y);
            y += 5;

            doc.setFontSize(8);
            doc.setFont("Helvetica", "bold");
            doc.text(`INVOICE: ${invoiceData.invoiceNumber || "—"}`, mx, y);
            y += 4;
            doc.setFont("Helvetica", "normal");
            doc.text(`Order No: ${invoiceData.orderNumber || invoiceData.order?.orderNumber || "—"}`, mx, y);
            y += 4;
            doc.text(`Date: ${invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, mx, y);
            y += 5;

            const customer = invoiceData.customer || invoiceData.order?.customer || {};
            doc.setFont("Helvetica", "bold");
            doc.text("CUSTOMER INFO:", mx, y);
            y += 4;
            doc.setFont("Helvetica", "normal");
            doc.text(`Name: ${customer.fullName || "Guest"}`, mx, y);
            y += 4;
            doc.text(`Phone: ${customer.phone || "—"}`, mx, y);
            y += 5;

            doc.line(mx, y, mx + w, y);
            y += 5;

            doc.setFont("Helvetica", "bold");
            doc.text("Item Description", mx, y);
            doc.text("Qty", mx + 38, y);
            doc.text("Price", mx + 48, y);
            doc.text("Total", mx + w - 2, y, { align: "right" });
            y += 4;
            doc.line(mx, y, mx + w, y);
            y += 4;

            doc.setFont("Helvetica", "normal");
            items.forEach((item) => {
                const pName = item.productName || item.product?.productName || item.product?.name || "Product";
                const qty = item.quantity || 1;
                const price = item.unitPrice ?? item.price ?? 0;
                const total = item.lineTotal ?? (qty * price);

                const splitName = doc.splitTextToSize(pName, 35);
                doc.text(splitName, mx, y);
                doc.text(`${qty}`, mx + 38, y);
                doc.text(`${price}`, mx + 48, y);
                doc.text(`${total}`, mx + w - 2, y, { align: "right" });
                
                y += (splitName.length * 4) + 1;
            });

            doc.line(mx, y, mx + w, y);
            y += 5;

            const order = invoiceData.order || {};
            const subtotal = invoiceData.totalAmount || order.subTotal || invoiceData.subTotal || 0;
            const discount = invoiceData.discount || order.discount || 0;
            const shipping = invoiceData.shippingCost || order.shippingCost || 0;
            const grandTotal = invoiceData.grandTotal || order.grandTotal || 0;
            const paid = invoiceData.paidAmount || order.paidAmount || 0;
            const due = invoiceData.dueAmount || order.dueAmount || 0;

            doc.text("Sub Total:", mx + 30, y);
            doc.text(`TK ${subtotal}`, mx + w - 2, y, { align: "right" });
            y += 4;

            if (discount > 0) {
                doc.text("Discount:", mx + 30, y);
                doc.text(`-TK ${discount}`, mx + w - 2, y, { align: "right" });
                y += 4;
            }

            if (shipping > 0) {
                doc.text("Shipping:", mx + 30, y);
                doc.text(`TK ${shipping}`, mx + w - 2, y, { align: "right" });
                y += 4;
            }

            doc.setFont("Helvetica", "bold");
            doc.text("Grand Total:", mx + 30, y);
            doc.text(`TK ${grandTotal}`, mx + w - 2, y, { align: "right" });
            y += 5;

            doc.setFont("Helvetica", "normal");
            doc.text("Paid Amount:", mx + 30, y);
            doc.text(`TK ${paid}`, mx + w - 2, y, { align: "right" });
            y += 4;

            doc.setFont("Helvetica", "bold");
            doc.text("Due Amount:", mx + 30, y);
            doc.text(`TK ${due}`, mx + w - 2, y, { align: "right" });
            y += 8;

            doc.setFont("Helvetica", "italic");
            doc.setFontSize(8);
            doc.text("Thank you for shopping with us!", 40, y, { align: "center" });
            y += 4;
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(7);
            doc.text("Powered by Ekhone", 40, y, { align: "center" });
        }

        return doc ? doc.output("blob") : null;
    }

    generateAllPosReceipts(invoicesOrOrdersList) {
        return this.generateAllPOSReceipts(invoicesOrOrdersList);
    }
}

export const printPDFBlob = (blob) => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.error("Iframe print fallback to window:", e);
                const printWin = window.open(blobUrl, "_blank");
                if (printWin) {
                    printWin.focus();
                }
            }
            setTimeout(() => {
                try {
                    document.body.removeChild(iframe);
                } catch (e) {}
                URL.revokeObjectURL(blobUrl);
            }, 60000);
        }, 250);
    };
};

export const clientPDFGenerator = new ClientPDFGenerator();