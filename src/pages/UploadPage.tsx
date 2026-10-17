import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { decodeNotice } from '../services/extractionClient';
import { noticeRepository } from '../services/noticeRepository';
import { validateUploadFile } from '../services/documentExtractor';
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
  Presentation,
  Lock,
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login?redirect=/notices/new');
    }
  }, [user, authLoading, navigate]);

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);
    setWarningMessage(null);

    const validation = validateUploadFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid file format.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    if (validation.format === 'pptx') {
      setWarningMessage(
        'PowerPoint presentation (.pptx) detected. Slide text will be extracted automatically.'
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
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
    if (!user) {
      navigate('/auth/login?redirect=/notices/new');
      return;
    }

    setErrorMessage(null);
    setWarningMessage(null);

    if (activeTab === 'upload' && !selectedFile) {
      setErrorMessage('Please select or drag a valid notice file (PDF, PPTX, PNG, JPG) first.');
      return;
    }

    if (activeTab === 'paste' && !pastedText.trim()) {
      setErrorMessage('Please paste the notice or circular text before proceeding.');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('1. Ingesting document & preparing content payload...');

    const timer1 = setTimeout(() => {
      setProcessingStage('2. Parsing timetable, schedules, venues & eligibility...');
    }, 700);

    const timer2 = setTimeout(() => {
      setProcessingStage('3. Verifying deadlines, clashing dates & required actions...');
    }, 1500);

    try {
      const result = await decodeNotice({
        file: activeTab === 'upload' ? selectedFile : null,
        text: activeTab === 'paste' ? pastedText : undefined,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (result.success && result.data) {
        // Save to repository scoped strictly to authenticated user
        await noticeRepository.save(result.data, user.id);

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

  if (!user && !authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Authentication Required</h1>
        <p className="text-xs text-slate-600">
          Please sign in with your Google account to upload and decode college notices.
        </p>
        <button
          onClick={() => navigate('/auth/login?redirect=/notices/new')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
        >
          Continue with Google
        </button>
      </div>
    );
  }

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
          Upload an official circular PDF, PowerPoint (.pptx), notice board photo, or paste raw text to extract a verified timetable and task checklist.
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
          <span>Upload Document / Image / Slides</span>
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

      {/* Warning Banner */}
      {warningMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>{warningMessage}</p>
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
              accept=".pdf,.pptx,.png,.jpg,.jpeg,.webp,.txt"
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
                Supported: PDF, PowerPoint (.pptx), PNG, JPG, WEBP, Plain Text (Max size: 10MB)
              </p>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-sky-100 text-sky-800 flex items-center justify-center">
                  {selectedFile.name.toLowerCase().endsWith('.pptx') ? (
                    <Presentation className="w-4 h-4" />
                  ) : (
                    <File className="w-4 h-4" />
                  )}
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
                  setWarningMessage(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
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
              onChange={(e) => {
                setPastedText(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Paste the full text of the circular, announcement, or exam instructions here..."
              className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-600 leading-relaxed"
            />
          </div>

          {/* Quick Paste Presets */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">
              Or load sample academic notice for testing:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFillSample(0)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Mid-Term Exam Schedule Notice
              </button>
              <button
                type="button"
                onClick={() => handleFillSample(1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                National Hackathon 2026 Circular
              </button>
              <button
                type="button"
                onClick={() => handleFillSample(2)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Merit Scholarship Renewal Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            Extracts multi-paper exam dates, action checklists, venues, and checks for timetable clashes.
          </span>
        </div>

        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
              <span>{processingStage || 'Processing document...'}</span>
            </>
          ) : (
            <>
              <span>Decode & Extract Schedule</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
