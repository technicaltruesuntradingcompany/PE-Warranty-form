import React, { useState } from 'react';
import { Search, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, AlertCircle, Edit2 } from 'lucide-react';
// Firebase interactions moved to backend

import trusunlogo from "../assets/Images/Trusunlogo.png";

const TrackRequest = () => {
    const [requestId, setRequestId] = useState('');
    const [status, setStatus] = useState(null); // 'pending', 'accepted', 'rejected', or null
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!requestId.trim()) return;

        setLoading(true);
        setError('');
        setStatus(null);
        setSearched(false);

        try {
            const response = await fetch(`https://pe-warranty-backend.onrender.com/api/requests/${requestId.trim()}`);

            if (response.ok) {
                const data = await response.json();
                setStatus(data.status || 'pending');
                setRejectionReason(data.rejectionReason || '');
            } else {
                setError("Request ID not found. Please check and try again.");
            }
        } catch (err) {
            console.error("Error fetching status:", err);
            setError("Failed to fetch status. Please check your connection.");
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    const getStatusConfig = (status) => {
        const normalizedStatus = status?.toLowerCase() || '';

        if (['accepted', 'approved', 'verified', 'completed'].includes(normalizedStatus)) {
            return {
                icon: <CheckCircle className="w-16 h-16 text-green-500" />,
                title: "Request Accepted by True Sun Trading Company",
                desc: "Your request has been forwarded to Premier Energies, Kindly wait for the approval from Premier Energies.",
                color: "bg-green-50 border-green-200 text-green-700"
            };
        }

        if (['rejected', 'declined', 'denied'].includes(normalizedStatus)) {
            return {
                icon: <XCircle className="w-16 h-16 text-red-500" />,
                title: "Request Rejected by True Sun Trading Company",
                desc: rejectionReason ? `Your request was declined due to: ${rejectionReason}` : "Your request was declined. Please check your email for more details.",
                color: "bg-red-50 border-red-200 text-red-700"
            };
        }

        if (['pending', 'in review', 'processing'].includes(normalizedStatus)) {
            return {
                icon: <Clock className="w-16 h-16 text-amber-500" />,
                title: "Request Pending with True Sun Trading Company",
                desc: "We are currently reviewing your request. Please check back later.",
                color: "bg-amber-50 border-amber-200 text-amber-700"
            };
        }

        // Default / Unknown Status
        return {
            icon: <Clock className="w-16 h-16 text-blue-500" />,
            title: status || "Unknown Status",
            desc: "Current status: " + (status || "Unknown"),
            color: "bg-blue-50 border-blue-200 text-blue-700"
        };
    };

    const statusConfig = getStatusConfig(status);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col relative overflow-hidden">

            {/* Background Decorations (Shared with Home) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-indigo-100/50 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob animation-delay-2000"></div>
            </div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
                    <img src={trusunlogo} alt="TRUE Brand" className="h-12 w-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => window.location.href = '/'} />
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex items-center text-slate-500 hover:text-[#0F40C5] transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="w-full max-w-lg bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 border border-white/50 animate-in slide-in-from-bottom-8 fade-in duration-700">
                    <div className="text-center mb-8 sm:mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-500/30 mb-6">
                            <Search className="text-white w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-extrabold mb-3 text-slate-900 tracking-tight">Track Status</h2>
                        <p className="text-slate-500">Enter your Request ID to verify current status</p>
                    </div>

                    <form onSubmit={handleSearch} className="relative mb-8 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative">
                            <input
                                type="text"
                                value={requestId}
                                onChange={(e) => setRequestId(e.target.value)}
                                placeholder="Request ID (e.g. WR_1677)"
                                className="w-full h-14 pl-5 pr-14 rounded-2xl border-2 border-white/50 bg-white/80 focus:bg-white focus:border-[#0F40C5] focus:ring-4 focus:ring-[#0F40C5]/10 outline-none text-lg transition-all shadow-sm placeholder:text-slate-400 font-medium"
                            />
                            <button
                                type="submit"
                                disabled={loading || !requestId.trim()}
                                className="absolute right-2 top-2 h-10 w-10 bg-[#0F40C5] hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>

                    {searched && !error && (
                        <div className={`rounded-3xl p-6 sm:p-8 border text-center animate-in zoom-in duration-500 ${statusConfig.color} shadow-lg shadow-gray-200/50 backdrop-blur-sm`}>
                            <div className="flex justify-center mb-4 sm:mb-6 bg-white w-20 h-20 rounded-full items-center mx-auto shadow-sm ring-4 ring-white/50">
                                {statusConfig.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-2 tracking-tight">{statusConfig.title}</h3>
                            <p className="opacity-90 leading-relaxed text-sm font-medium">{statusConfig.desc}</p>

                            {/* Edit Button for Rejected Requests */}
                            {['rejected', 'declined', 'denied'].includes(status?.toLowerCase()) && (
                                <button
                                    onClick={() => window.location.href = `/?form&edit=${requestId}`}
                                    className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                                >
                                    <Edit2 size={18} />
                                    Edit & Resubmit Request
                                </button>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 flex items-start gap-3 animate-in shake duration-300">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TrackRequest;


