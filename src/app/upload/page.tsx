"use client";

import React, { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRunAnalysis } from "@/api-client"
import { UploadCloud, File as FileIcon, AlertCircle, Loader2, CheckCircle, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { formatBytes } from "@/lib/utils"
import { useUser } from "@clerk/react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const runAnalysis = useRunAnalysis()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoaded, router])

  if (!isLoaded || !user) {
    return null
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive"
      })
      return
    }
    
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf']
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV, Excel, or PDF file.",
        variant: "destructive"
      })
      return
    }

    setFile(selectedFile)
  }

  const handleUploadAndAnalyze = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(10)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const interval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 90))
      }, 500)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const uploadedFile = await response.json()
      
      toast({
        title: "File uploaded successfully",
        description: "Starting analysis...",
      })

      runAnalysis.mutate({
        data: {
          fileId: uploadedFile.id
        } as any
      }, {
        onSuccess: (analysis) => {
          toast({
            title: "Analysis started",
            description: "Redirecting to results...",
          })
          router.push(`/analysis/${analysis.id}`)
        },
        onError: () => {
          toast({
            title: "Analysis failed",
            description: "An error occurred while starting the analysis.",
            variant: "destructive"
          })
          setIsUploading(false)
        }
      })
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive"
      })
      setIsUploading(false)
    }
  }

  return (
    <AppLayout title="Upload & Analyze">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dataset Upload</CardTitle>
            <CardDescription>Upload your transaction dataset for analysis. Supports CSV, Excel, and PDF up to 10MB.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/10'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <UploadCloud className={`mb-4 h-12 w-12 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="mb-2 text-lg font-semibold">
                    Drag and drop your file here
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    or click below to browse your files
                  </p>
                  
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    disabled={isUploading}
                  />
                  <Button asChild disabled={isUploading}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Select File
                    </label>
                  </Button>
                </>
              ) : (
                <div className="w-full max-w-md flex flex-col items-center justify-center py-2">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                    <FileIcon className="h-10 w-10" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-foreground truncate max-w-full px-4">
                    {file.name}
                  </h3>
                  <p className="mb-6 text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setFile(null)} disabled={isUploading}>
                      Remove File
                    </Button>
                    <input
                      type="file"
                      id="file-upload-replace"
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      disabled={isUploading}
                    />
                    <Button asChild variant="secondary" size="sm" disabled={isUploading}>
                      <label htmlFor="file-upload-replace" className="cursor-pointer">
                        Change File
                      </label>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Uploading and preparing analysis...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/20 border-t pt-6 flex justify-end">
            <Button 
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
              disabled={!file || isUploading}
              onClick={handleUploadAndAnalyze}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Analysis'
              )}
            </Button>
          </CardFooter>
        </Card>

        {file && !isUploading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" /> Dataset Preview
              </CardTitle>
              <CardDescription>First few rows of the uploaded file</CardDescription>
            </CardHeader>
            <CardContent className="overflow-auto max-h-64 p-0">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead>Transaction_ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs text-muted-foreground">TRX-{1000 + i}</TableCell>
                      <TableCell>2023-10-{i.toString().padStart(2, '0')}</TableCell>
                      <TableCell className="text-right font-medium">${(Math.random() * 1000).toFixed(2)}</TableCell>
                      <TableCell>Merchant {String.fromCharCode(64 + i)}</TableCell>
                      <TableCell>New York, NY</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
