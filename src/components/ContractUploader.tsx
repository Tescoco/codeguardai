"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UploadResponse {
  analysisId: string;
  message: string;
  status: string;
  duplicate?: boolean;
}

export default function ContractUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".sol")) {
        setError("Please upload a .sol file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        setError("File size must be less than 10MB");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("contract", file);

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        const result: UploadResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Upload failed");
        }

        // Redirect to analysis page
        router.push(`/analysis/${result.analysisId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Smart Contract Security Audit
        </h1>
        <p className="text-lg text-gray-600">
          Upload your Solidity contract for comprehensive security analysis
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Uploading and starting analysis...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-xl font-medium text-gray-900">
                Drop your .sol file here
              </p>
              <p className="text-gray-600 mt-2">
                or{" "}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                  browse to upload
                  <input
                    type="file"
                    className="hidden"
                    accept=".sol"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Maximum file size: 10MB</p>
              <p>Supported format: .sol (Solidity)</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          What we analyze:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900">
              Security Vulnerabilities
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Reentrancy, access control, integer overflow, and more
            </p>
          </div>
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900">Gas Optimization</h3>
            <p className="text-sm text-gray-600 mt-1">
              Identify opportunities to reduce gas costs
            </p>
          </div>
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900">Best Practices</h3>
            <p className="text-sm text-gray-600 mt-1">
              Code quality and security best practices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
