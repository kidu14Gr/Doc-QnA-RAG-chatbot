import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { uploadDocument } from '../lib/api';
import type { DocumentInfo } from '../types';

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete';

interface UploadSectionProps {
  onDocumentUpload: (doc: DocumentInfo) => void;
  token?: string | null;
}

export function UploadSection({ onDocumentUpload, token }: UploadSectionProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const isValidType =
      validTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.docx');

    if (!isValidType) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    setError(null);
    setFileName(file.name);
    setUploadState('uploading');
    setUploadProgress(8);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + 7));
    }, 140);

    try {
      await uploadDocument(file, token ?? undefined);
      setUploadProgress(100);
      setUploadState('processing');

      setTimeout(() => {
        setUploadState('complete');
        const newDoc: DocumentInfo = {
          id: crypto.randomUUID?.() ?? Date.now().toString(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          uploadedAt: new Date(),
        };

        setTimeout(() => {
          onDocumentUpload(newDoc);
          resetUploader();
        }, 800);
      }, 600);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
      setUploadProgress(0);
      setUploadState('idle');
    } finally {
      clearInterval(progressInterval);
    }
  };

  const resetUploader = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setFileName('');
    setError(null);
  };

  const handleButtonClick = (type: 'pdf' | 'docx') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'pdf' ? '.pdf' : '.docx';
      fileInputRef.current.click();
    }
  };

  const isBusy = uploadState !== 'idle';

  return (
    <div className="h-full flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300
            ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50 scale-105'
                : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
            }
            ${isBusy ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
          `}
          onClick={() => !isBusy && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept=".pdf,.docx"
          />

          <div className="text-center space-y-4">
            {uploadState === 'idle' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-slate-900">Drop your document here</h3>
                  <p className="text-slate-500">or click to browse files</p>
                  <p className="text-sm text-slate-400">Supports PDF and DOCX files</p>
                </div>
              </>
            )}

            {uploadState === 'uploading' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-slate-900">Uploading...</h3>
                  <p className="text-slate-500 text-sm">{fileName}</p>
                </div>
              </>
            )}

            {uploadState === 'processing' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center animate-pulse">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-slate-900">Document is cooking...</h3>
                  <p className="text-slate-500 text-sm">Processing and creating embeddings</p>
                </div>
              </>
            )}

            {uploadState === 'complete' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-slate-900">Ready to chat!</h3>
                  <p className="text-slate-500 text-sm">Redirecting to chat...</p>
                </div>
              </>
            )}
          </div>

          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <div className="mt-6">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-slate-500 mt-2">{uploadProgress}%</p>
            </div>
          )}
        </div>

        {!isBusy && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleButtonClick('pdf')}
              className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 hover:shadow-md group"
            >
              <FileText className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
              <span className="text-slate-700 group-hover:text-indigo-600 transition-colors">Upload PDF</span>
            </button>

            <button
              onClick={() => handleButtonClick('docx')}
              className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 hover:shadow-md group"
            >
              <FileText className="w-5 h-5 text-slate-600 group-hover:text-purple-600 transition-colors" />
              <span className="text-slate-700 group-hover:text-purple-600 transition-colors">Upload DOCX</span>
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-3 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
