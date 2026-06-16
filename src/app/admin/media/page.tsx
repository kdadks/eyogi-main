/**
 * Media Library Page
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { FileUploader } from '@/components/admin/FileUploader'

export default function MediaPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleUpload = async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setUploadedFiles([...uploadedFiles, ...data.data])
      }
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Media Library</h1>
        <p className="text-slate-600 mt-1">Upload and manage media files</p>
      </div>

      <div className="bg-white p-8 rounded-lg border border-slate-200">
        <FileUploader onUpload={handleUpload} />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Uploaded Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="p-4 border border-slate-200 rounded-lg">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-40 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
