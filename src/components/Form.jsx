import React, { useState } from "react";
import {
    CheckCircle,
    XCircle,
    Plus,
    Trash2,
    Upload,
    Save,
    ArrowRight,
    Loader2,
    Copy,
    Check,
    ArrowLeft
} from "lucide-react";
import { serverTimestamp, doc, getDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

import * as XLSX from "xlsx";
import trusunlogo from "../assets/Images/Trusunlogo.png";
import premier from "../assets/Images/premier.png";

import { uploadToCloudinary } from "../utils/cloudinary";

// --- Constants ---
const PRIMARY_COLOR = "#0F40C5"; // Coral

// --- Helper Components ---

// Moved Input outside to prevent re-mounting (and focus loss) on every render
const Input = ({ label, name, type = "text", required = false, value, onChange, disabled, autoComplete, onFocus, onBlur, showTooltip, tooltipText }) => (
    <div className="flex flex-col">
        <label className="text-sm font-medium text-slate-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative flex flex-col">
            {showTooltip && (
                <div className="absolute bottom-full left-0 mb-3 bg-[#0F40C5] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 whitespace-nowrap border border-blue-400">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs pb-[1px]">!</span>
                    {tooltipText}
                    <div className="absolute -bottom-1.5 left-5 w-3 h-3 bg-[#0F40C5] rotate-45 border-b border-r border-blue-400"></div>
                </div>
            )}
            <input
                type={type}
                name={name}
                required={required}
                value={value}
                onChange={onChange}
                disabled={disabled}
                onFocus={onFocus}
                onBlur={onBlur}
                className="rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F40C5]/20 focus:border-[#0F40C5] transition-all disabled:bg-gray-50 disabled:text-gray-400 w-full"
                placeholder={label}
                autoComplete={autoComplete}
            />
        </div>
    </div>
);

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, isSubmitting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Save size={32} className="text-[#0F40C5]" />
                </div>

                <h3 className="text-2xl font-bold text-slate-800 text-center mb-3">Confirm Submission</h3>
                <p className="text-slate-500 text-center mb-6 px-2 text-sm leading-relaxed">
                    Please ensure that all the details provided are correct and that you have uploaded a <span className="font-bold text-orange-600">geotagged</span> site picture.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="w-full bg-[#0F40C5] text-white py-3 rounded-xl font-semibold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Yes, Submit Form
                            </>
                        )}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="w-full bg-white text-slate-600 py-3 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                        No, Go Back and Edit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function FormPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [addressHints, setAddressHints] = useState({ office: false, site: false });

    // --- Form State ---
    const [formData, setFormData] = useState({
        integratorName: "",
        officeAddress: "",
        contactPerson: "",
        contactNo: "",
        email: "",
        customerProjectSite: "",
        customerContact: "",
        customerAlternate: "",
        customerEmail: "",
        customerAlternateEmail: ""
    });

    const [serialNumbers, setSerialNumbers] = useState([""]);
    const [previewImages, setPreviewImages] = useState([]);
    const [files, setFiles] = useState([]);
    const [requestId, setRequestId] = useState("");
    const [copied, setCopied] = useState(false);
    const [editModeId, setEditModeId] = useState(null);

    // --- Effects ---
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const editId = params.get("edit");
        if (editId) {
            setEditModeId(editId);
            fetchRequestData(editId);
        }
    }, []);

    const fetchRequestData = async (id) => {
        try {
            const docRef = doc(db, "requests", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    integratorName: data.integratorName || "",
                    officeAddress: data.officeAddress || "",
                    contactPerson: data.contactPerson || "",
                    contactNo: data.contactNo || "",
                    email: data.email || "",
                    customerProjectSite: data.customerProjectSite || "",
                    customerContact: data.customerContact || "",
                    customerAlternate: data.customerAlternate || "",
                    customerEmail: data.customerEmail || "",
                    customerAlternateEmail: data.customerAlternateEmail || ""
                });
                if (data.serialNumbers && data.serialNumbers.length > 0) {
                    setSerialNumbers(data.serialNumbers);
                }
                if (data.sitePictures && data.sitePictures.length > 0) {
                    setPreviewImages(data.sitePictures);
                    // Start with existing images. We'll handle mixing new files + existing URLs in submit
                }
            } else {
                alert("Request not found for editing.");
            }
        } catch (error) {
            console.error("Error fetching request:", error);
            alert("Failed to load request data.");
        }
    };

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;

        // Validation: Only numbers for integrator phone
        if (name === "contactNo") {
            sanitizedValue = value.replace(/[^0-9]/g, "");
        }

        // Validation: Alphanumeric + standard email symbols for email fields
        if (["email", "customerEmail", "customerAlternateEmail"].includes(name)) {
            sanitizedValue = value.replace(/[^a-zA-Z0-9@._-]/g, "");
        }

        // Validation: Project Site Address - Restrict special characters (e.g. links)
        if (name === "customerProjectSite") {
            // Allow letters, numbers, spaces, and common address punctuation (., - / #)
            const addressRegex = /^[a-zA-Z0-9\s,.\-/#]*$/;
            if (!addressRegex.test(value)) {
                alert("Invalid Data: Special characters are not allowed in the Project Site Address.");
                return; // Do not accept the input
            }
        }

        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    };

    const addSerialNumber = () => {
        setSerialNumbers([...serialNumbers, ""]);
    };

    const updateSerialNumber = (index, value) => {
        // Validation: No whitespace or commas allowed
        if (/[\s,]/.test(value)) {
            alert("Invalid Data: Serial numbers should not contain whitespace or commas.");
            return;
        }

        const trimmedValue = value.trim();
        // Check for duplicates
        if (trimmedValue && serialNumbers.some((sn, i) => i !== index && sn.trim() === trimmedValue)) {
            alert("Invalid Data: This serial number has already been entered.");
        }

        const updated = [...serialNumbers];
        updated[index] = value;
        setSerialNumbers(updated);
    };

    const removeSerialNumber = (index) => {
        if (serialNumbers.length > 1) {
            setSerialNumbers(serialNumbers.filter((_, i) => i !== index));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
            setFiles(prev => [...prev, ...selectedFiles]);
            setPreviewImages(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Extract serial numbers from the first column, filtering out empty values
                const newSerialNumbers = jsonData
                    .map(row => row[0])
                    .filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== "");

                if (newSerialNumbers.length > 0) {
                    setSerialNumbers(prev => {
                        // Create a set of existing serial numbers (trimmed and lowercase for case-insensitive check if needed, but let's stick to exact match for now)
                        const existingSet = new Set(prev.map(s => String(s).trim()));

                        // Filter out serial numbers with whitespace or commas
                        const validNewBatch = newSerialNumbers.filter(s => {
                            if (/[\s,]/.test(String(s))) return false;
                            return true;
                        });

                        if (validNewBatch.length < newSerialNumbers.length) {
                            alert(`Filtered out ${newSerialNumbers.length - validNewBatch.length} serial number(s) containing invalid characters (whitespace or commas).`);
                        }

                        // Deduplicate within the new batch itself first, then filter against existing
                        const uniqueNew = [...new Set(validNewBatch.map(String).map(s => s.trim()))]
                            .filter(s => s && !existingSet.has(s)); // Filter out empty strings and duplicates

                        // If all new numbers were duplicates
                        if (uniqueNew.length < validNewBatch.length) {
                            alert(`Filtered out ${validNewBatch.length - uniqueNew.length} duplicate serial number(s).`);
                        }

                        if (prev.length === 1 && prev[0] === "") {
                            // If the current list is empty/placeholder, just return the unique new ones
                            return uniqueNew.length > 0 ? uniqueNew : [""];
                        }

                        return [...prev, ...uniqueNew];
                    });
                } else {
                    alert("No valid serial numbers found in the first column of the Excel file.");
                }
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                alert("Error parsing Excel file. Please ensure it is a valid Excel file.");
            }
        };
        reader.readAsArrayBuffer(file);
        // Reset file input value to allow uploading the same file again if needed
        e.target.value = "";
    };

    const handleCopy = () => {
        if (!requestId) return;
        navigator.clipboard.writeText(requestId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // VALIDATION: Check if at least one image is uploaded (new files OR existing previews)
        if (files.length === 0 && previewImages.length === 0) {
            alert("Please upload at least one site picture to proceed.");
            return;
        }

        // VALIDATION: Check for placeholder keys
        const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
        if (!apiKey || apiKey.includes("your_")) {
            alert("CRITICAL ERROR: Missing API Keys.\n\nPlease update your .env file with valid Firebase and Cloudinary credentials.");
            return;
        }

        // Show confirmation modal instead of submitting directly
        setShowConfirmation(true);
    };

    const processSubmission = async () => {
        setIsSubmitting(true);

        try {
            // 1. Upload Images to Cloudinary
            const uploadPromises = files.map(file => uploadToCloudinary(file));
            const uploadedImageUrls = await Promise.all(uploadPromises);

            // 2. Save Data to Firestore
            let finalDocId;
            const requestData = {
                ...formData,
                serialNumbers: [...new Set(serialNumbers.map(s => s.trim()).filter(Boolean))], // Remove duplicates and empty strings
                // Combine existing URLs (strings) with new uploaded URLs
                sitePictures: [...previewImages.filter(url => typeof url === 'string' && url.startsWith('http')), ...uploadedImageUrls],
                status: "pending", // Reset status to pending on edit
                updatedAt: serverTimestamp()
            };

            if (editModeId) {
                // UPDATE existing document
                const docRef = doc(db, "requests", editModeId);
                await updateDoc(docRef, { ...requestData, warrantyCertificateNo: editModeId });
                finalDocId = editModeId;
                console.log("Form Updated Successfully. ID:", finalDocId);
            } else {
                // CREATE new document with custom ID from counter
                requestData.createdAt = serverTimestamp();

                await runTransaction(db, async (transaction) => {

                    const counterRef = doc(db, "counters", "warranty_cert");
                    const counterDoc = await transaction.get(counterRef);

                    // Determine starting point
                    let nextId;
                    if (!counterDoc.exists()) {
                        nextId = 1677; // Start at 1677 if counter doesn't exist
                    } else {
                        // Ensure we jump to at least 1677 if the current counter is lower
                        const currentVal = Number(counterDoc.data().currentValue);
                        nextId = currentVal < 1677 ? 1677 : currentVal + 1;
                    }

                    // Collision Detection Loop: Find the first available ID
                    // We'll try up to 10 consecutive IDs to find a free slot.
                    // This handles cases where manual DB edits or race conditions might have taken an ID.
                    let availableId = null;
                    let attempts = 0;
                    const maxAttempts = 10;

                    while (attempts < maxAttempts) {
                        const candidateId = `WR_${String(nextId)}`; // Format: WR_1677
                        const candidateRef = doc(db, "requests", candidateId);
                        const candidateDoc = await transaction.get(candidateRef);

                        if (!candidateDoc.exists()) {
                            availableId = candidateId;
                            break;
                        }

                        // ID taken, try next
                        nextId++;
                        attempts++;
                    }

                    if (!availableId) {
                        throw new Error("Unable to generate a unique Request ID after multiple attempts. Please try again.");
                    }

                    finalDocId = availableId;
                    const newRequestRef = doc(db, "requests", finalDocId);

                    // Writes
                    transaction.set(counterRef, { currentValue: nextId }, { merge: true });
                    transaction.set(newRequestRef, { ...requestData, warrantyCertificateNo: finalDocId });
                });

                console.log("Form Submitted Successfully. ID:", finalDocId);
            }

            setRequestId(finalDocId);
            setIsSubmitting(false);
            setIsSubmitted(true);
            setShowConfirmation(false); // Close modal on success
        } catch (error) {
            console.error("Error submitted form:", error);
            alert("Submission failed: " + error.message);
            setIsSubmitting(false);
            // We keep the modal open so user can try again or go back
        }
    };

    const handleReset = () => {
        setFormData({
            integratorName: "",
            officeAddress: "",
            contactPerson: "",
            contactNo: "",
            email: "",
            customerProjectSite: "",
            customerContact: "",
            customerAlternate: "",
            customerEmail: "",
            customerAlternateEmail: ""
        });
        setSerialNumbers([""]);
        setPreviewImages([]);
        setFiles([]);
        setIsSubmitted(false);
        setRequestId("");
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-800">

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmation}
                onConfirm={processSubmission}
                onCancel={() => setShowConfirmation(false)}
                isSubmitting={isSubmitting}
            />

            {/* --- Main Content --- */}
            {/* Dynamic styles removed in favor of Tailwind utility classes */}

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
                    <img
                        src={trusunlogo}
                        alt="TRUE Brand"
                        className="h-12 w-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => window.location.href = '/'}
                    />
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex items-center text-slate-500 hover:text-[#0F40C5] transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">

                {isSubmitted ? (
                    // --- Success State ---
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Request Submitted!</h2>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Your warranty request has been successfully submitted and is now under review.
                        </p>

                        {requestId && (
                            <div className="bg-blue-50/50 rounded-xl p-6 mb-8 border border-blue-100 max-w-sm mx-auto text-left relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#0F40C5]"></div>
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    Your Request ID is
                                </p>

                                <div className="flex items-center justify-between gap-1 bg-white border border-blue-200 rounded-lg p-4 shadow-sm mb-4 group hover:border-blue-300 transition-colors">
                                    <div className="flex-1 text-center font-mono font-black text-2xl sm:text-2xl text-[#0F40C5] tracking-tight break-all select-all">
                                        {requestId}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="flex-shrink-0 p-2.5 text-slate-400 hover:text-[#0F40C5] bg-slate-50 hover:bg-blue-50 rounded-lg transition-all border border-slate-100 hover:border-blue-200"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <div className="flex items-start gap-3 text-slate-600 bg-white/50 p-3 rounded-lg border border-blue-100/50">
                                    <span className="text-2xl leading-none text-blue-300 font-serif">"</span>
                                    <p className="text-sm font-medium italic">
                                        Please save this ID to track the status of your request.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold shadow-lg hover:brightness-110 transition-all"
                                style={{ backgroundColor: PRIMARY_COLOR }}
                            >
                                {editModeId ? "Edit Another Request" : "Submit Another Request"}
                                <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-slate-700 bg-white border border-slate-200 font-semibold shadow-lg hover:bg-slate-50 transition-all"
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- Form State ---
                    <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-100">
                        {/* Logos Header */}
                        <div className="flex flex-row justify-between items-center mb-12 gap-4">
                            <img
                                src={premier}
                                alt="Premier Energies"
                                className="h-10 sm:h-12 w-auto object-contain"
                            />
                            <img
                                src={trusunlogo}
                                alt="TRUE Brand"
                                className="h-10 sm:h-12 w-auto object-contain"
                            />
                        </div>

                        <div className="text-center mb-8 border-b border-gray-100 pb-6">
                            <h1 className="text-2xl font-bold mb-2 text-slate-800">
                                {editModeId ? "Edit Verification Request" : "Premier Energies Warranty Certificate Request"}
                            </h1>
                            <p className="text-slate-500 text-sm">
                                {editModeId
                                    ? "Update your details below to resubmit for verification."
                                    : "Please fill out the details below to verify your installation site."}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Integrator Section */}
                            <div className="md:col-span-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 mb-2">
                                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">1</span>
                                Integrator Details
                            </div>
                            <Input
                                label="Integrator / EPC Name"
                                name="integratorName"
                                required
                                value={formData.integratorName}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <Input
                                label="Office Address"
                                name="officeAddress"
                                required
                                value={formData.officeAddress}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                onFocus={() => setAddressHints(prev => ({ ...prev, office: true }))}
                                onBlur={() => setAddressHints(prev => ({ ...prev, office: false }))}
                                showTooltip={addressHints.office}
                                tooltipText="A full address is required, including the pincode."
                            />
                            <Input
                                label="Contact Person"
                                name="contactPerson"
                                required
                                value={formData.contactPerson}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <Input
                                label="Contact Number"
                                name="contactNo"
                                required
                                value={formData.contactNo}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <div className="md:col-span-2">
                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Customer Section */}
                            <div className="md:col-span-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 mb-2 mt-6">
                                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">2</span>
                                Customer Details
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="Project Site Address"
                                    name="customerProjectSite"
                                    required
                                    value={formData.customerProjectSite}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    onFocus={() => setAddressHints(prev => ({ ...prev, site: true }))}
                                    onBlur={() => setAddressHints(prev => ({ ...prev, site: false }))}
                                    showTooltip={addressHints.site}
                                    tooltipText="A full address is required, including the pincode."
                                />
                            </div>
                            <Input
                                label="Contact Number"
                                name="customerContact"
                                required
                                value={formData.customerContact}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <Input
                                label="Alternate Number"
                                name="customerAlternate"
                                value={formData.customerAlternate}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                autoComplete="off"
                            />
                            <Input
                                label="Customer Email"
                                name="customerEmail"
                                type="email"
                                required
                                value={formData.customerEmail}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <Input
                                label="Alternate Email"
                                name="customerAlternateEmail"
                                type="email"
                                value={formData.customerAlternateEmail}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                autoComplete="off"
                            />

                            {/* Serial Numbers */}
                            <div className="md:col-span-2 mt-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Serial Number List <span className="text-red-500">*</span>
                                </label>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                    {serialNumbers.map((sn, index) => (
                                        <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                                            <input
                                                type="text"
                                                required
                                                value={sn}
                                                disabled={isSubmitting}
                                                onChange={(e) => updateSerialNumber(index, e.target.value)}
                                                placeholder={`e.g. SN-2024-${100 + index}`}
                                                className="flex-grow rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F40C5]/20 focus:border-[#0F40C5] bg-white transition-all"
                                            />
                                            {serialNumbers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSerialNumber(index)}
                                                    className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex gap-4 mt-2">
                                        <button
                                            type="button"
                                            onClick={addSerialNumber}
                                            disabled={isSubmitting}
                                            className="text-sm hover:underline font-medium flex items-center gap-1 transition-colors"
                                            style={{ color: PRIMARY_COLOR }}
                                        >
                                            <Plus size={16} /> Add another serial number
                                        </button>

                                        <label className="text-sm hover:underline font-medium flex items-center gap-1 transition-colors cursor-pointer" style={{ color: PRIMARY_COLOR }}>
                                            <Upload size={16} /> Upload Excel
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls"
                                                onChange={handleExcelUpload}
                                                className="hidden"
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Site Pictures */}
                            <div className="md:col-span-2 mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Site Pictures (Evidence) <span className="text-red-500">*</span>
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${isSubmitting ? 'bg-gray-50 border-gray-200' : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isSubmitting}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="flex flex-col items-center justify-center pointer-events-none">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                            <Upload size={24} className="text-slate-500" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                                        <p className="text-xs text-orange-600 font-semibold mt-1">Please upload geotagged photos</p>
                                        <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG or GIF (Max 3MB)</p>
                                    </div>
                                </div>

                                {/* Image Previews */}
                                {previewImages.length > 0 && (
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        {previewImages.map((src, index) => (
                                            <div key={index} className="relative group w-24 h-24 animate-in zoom-in duration-200">
                                                <img
                                                    src={src}
                                                    alt={`Preview ${index}`}
                                                    className="w-full h-full object-cover rounded-lg border border-slate-200 shadow-sm"
                                                />
                                                {!isSubmitting && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="md:col-span-2 pt-6 mt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full text-white px-6 py-4 rounded-xl shadow-lg hover:opacity-90 transition-all font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: PRIMARY_COLOR }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            {editModeId ? "Update Request" : "Submit Verification Request"}
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-slate-400 mt-4">
                                    By submitting this form, you certify that all information is accurate.
                                </p>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div >
    );
}
