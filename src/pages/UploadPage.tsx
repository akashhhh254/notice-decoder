import React, { useState, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import { decodeNotice } from '../services/extractionClient';
import { noticeRepository } from '../services/noticeRepository';
import { SAMPLE_NOTICES } from '../data/sampleNotices';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  File,
  X,
  ArrowRight,
  Sparkles,
  Info,
  RotateCcw,
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'text/plain',
];

export const UploadPage: React.FC = () => {
  const { navigate } = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds the 10MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`;
    }
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);
    const hasAllowedExt = /\.(pdf|png|jpe?g|webp|txt)$/i.test(file.name);
    if (!isAllowedMime && !hasAllowedExt) {
      return `Unsupported file format "${file.name}". Please upload a PDF, PNG, JPG, or WEBP document.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);
      if (error) {
        setErrorMessage(error);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const error = validateFile(file);
      if (error) {
        setErrorMessage(error);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleKeyDownDropzone = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleFillSample = (sampleIndex: number) => {
    const sample = SAMPLE_NOTICES[sampleIndex];
    if (sample) {
      setPastedText(sample.rawText);
      setActiveTab('paste');
      setErrorMessage(null);
    }
  };

  const handleProcess = async () => {
    setErrorMessage(null);
    setWarningMessage(null);

    if (activeTab === 'upload' && !selectedFile) {
      setErrorMessage('Please select or drag a valid notice file (PDF, PNG, JPG) first.');
      return;
    }

    if (activeTab === 'paste' && !pastedText.trim()) {
      setErrorMessage('Please paste the notice or circular text before proceeding.');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('1. Ingesting document & preparing multimodal payload...');

    const timer1 = setTimeout(() => {
      setProcessingStage('2. Parsing timetable, schedules, venues & eligibility...');
    }, 700);

    const timer2 = setTimeout(() => {
      setProcessingStage('3. Auditing uncertainties, clashing dates & required actions...');
    }, 1500);

    try {
      const result = await decodeNotice({
        file: activeTab === 'upload' ? selectedFile : null,
        text: activeTab === 'paste' ? pastedText : undefined,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (result.success && result.data) {
        // Save to repository
        await noticeRepository.save(result.data);

        // Redirect directly to the results page
        navigate(`/notices/${result.data.id}`);
      } else {
        setErrorMessage(result.message || 'Failed to decode notice. Please check input.');
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setErrorMessage(err?.message || 'An unexpected error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <button onClick={() => navigate('/dashboard')} className="hover:underline">
            Dashboard
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-medium">New Notice Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Decode Official Notice
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload an official circular PDF, notice board photo, or paste raw text to extract a verified timetable and task checklist.
        </p>
      </div>

      {/* Input Mode Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg text-xs font-medium w-fit">
        <button
          onClick={() => {
            setActiveTab('upload');
            setErrorMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document / Image</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('paste');
            setErrorMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
            activeTab === 'paste'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Circular Text</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Notice Processing Error</span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={handleKeyDownDropzone}
            tabIndex={0}
            role="button"
            aria-label="Upload notice file dropzone"
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-600 ${
              dragOver
                ? 'border-sky-500 bg-sky-50/50'
                : selectedFile
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop notice here
              </p>
              <p className="text-xs text-slate-500">
                Supported: PDF, PNG, JPG, JPEG, WEBP (Max size: 10MB)
              </p>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-sky-100 text-sky-800 flex items-center justify-center">
                  <File className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'Document'}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Remove selected file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paste Text Zone */}
      {activeTab === 'paste' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label htmlFor="notice-textarea" className="font-semibold text-slate-700">
                Notice / Circular Raw Content
              </label>
              <span className="font-mono">
                {pastedText.length} characters · {pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0} words
              </span>
            </div>

            <textarea
              id="notice-textarea"
              rows={12}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the full text of the academic circular, exam timetable notice, hackathon guidelines, or scholarship notification here..."
              className="w-full p-4 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:border-transparent placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Quick Pre-fill Samples */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-700">
              Or test with realistic college notice fixtures:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFillSample(0)}
                className="px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Mid-Term Exam Schedule
              </button>
              <button
                type="button"
                onClick={() => handleFillSample(1)}
                className="px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                InnovateX Hackathon
              </button>
              <button
                type="button"
                onClick={() => handleFillSample(2)}
                className="px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Scholarship Fee Waiver
              </button>
              <button
                type="button"
                onClick={() => handleFillSample(3)}
                className="px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Final Project & Viva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing State Animation */}
      {isProcessing && (
        <div className="p-6 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-sky-700 animate-spin" />
            <span className="font-semibold text-sm text-sky-950">
              Decoding Academic Document...
            </span>
          </div>
          <p className="text-xs text-sky-900/80 font-mono pl-8">
            {processingStage}
          </p>
          <div className="w-full bg-sky-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-700 h-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          disabled={isProcessing}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Cancel & Return to Dashboard
        </button>

        <button
          onClick={handleProcess}
          disabled={isProcessing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedText.trim())}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Notice...</span>
            </>
          ) : (
            <>
              <span>Extract & Verify Notice</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
