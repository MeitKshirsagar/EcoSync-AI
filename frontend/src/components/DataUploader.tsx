import React, { useCallback, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

export default function DataUploader() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ message: string, records: number, columns: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        setError(null);
        setResult(null);
        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }
        setFile(selectedFile);
    };

    const uploadFile = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/upload/csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResult({
                message: response.data.message,
                records: response.data.records_processed,
                columns: response.data.detected_columns
            });
            setFile(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to upload and parse CSV.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-md transition-all">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="text-cyan-400" size={20} />
                Data Ingestion
            </h3>

            {!result ? (
                <>
                    <p className="text-sm text-slate-400 mb-5 leading-relaxed tracking-wide">
                        Upload your company's latest ERP or HR data exports (CSV) to continuously train and update the Focus Audit models.
                    </p>

                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragging
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : file
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('csv-upload')?.click()}
                    >
                        <input
                            type="file"
                            id="csv-upload"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-3">
                                <CheckCircle2 className="text-emerald-400 w-10 h-10" />
                                <div>
                                    <p className="text-sm font-bold text-slate-200">{file.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-cyan-400 animate-bounce' : 'text-slate-500'}`} />
                                <div>
                                    <p className="text-sm font-semibold text-slate-300">
                                        Drag and drop your CSV here
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        or click to browse files
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-400 text-sm font-medium">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <button
                        onClick={uploadFile}
                        disabled={!file || loading}
                        className="w-full mt-5 bg-slate-700 hover:bg-cyan-600 text-slate-100 font-bold uppercase tracking-widest py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? 'Processing...' : 'Upload & Sync Data'}
                    </button>
                </>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                    <CheckCircle2 className="text-emerald-400 w-12 h-12 mx-auto mb-3" />
                    <h4 className="text-emerald-400 font-black title-font text-lg mb-2">Sync Complete!</h4>
                    <p className="text-sm text-slate-300 font-medium mb-4">{result.message}</p>

                    <div className="bg-slate-900/60 rounded-lg p-4 text-left border border-slate-800">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700/50">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Records Parsed</span>
                            <span className="text-sm font-mono text-cyan-400">{result.records} rows</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Detected Columns</span>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {result.columns.map(col => (
                                    <span key={col} className="px-2 py-1 rounded bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setResult(null)}
                        className="mt-5 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider"
                    >
                        Upload Another File
                    </button>
                </div>
            )}
        </div>
    );
}
