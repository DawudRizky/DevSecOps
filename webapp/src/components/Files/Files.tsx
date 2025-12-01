import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Upload, Download, FileText, Trash2, Eye } from "lucide-react";
import type { Database } from "../../lib/database.types";

type FileRecord = Database["public"]["Tables"]["files"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
};

interface FilesProps {
  projectId: string;
}

export function Files({ projectId }: FilesProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("files")
        .select(
          `
          *,
          profiles(*)
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ MITIGASI #1: Tambahkan file type validation
    // const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.png', '.txt', '.md', '.docx'];
    // const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    // if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
    //   alert('File type not allowed');
    //   return;
    // }
    //
    // ✅ MITIGASI #2: Validasi MIME type (lebih reliable daripada extension)
    // const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    // if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    //   alert('Invalid file type');
    //   return;
    // }
    //
    // ✅ MITIGASI #3: Limit file size
    // const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    // if (file.size > MAX_FILE_SIZE) {
    //   alert('File size exceeds 10MB limit');
    //   return;
    // }

    setUploading(true);

    try {
      // VULNERABILITY: No file type validation - allows any file extension
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const reader = new FileReader();
      reader.onload = async (event) => {
        // File content read as base64
        const base64 = event.target?.result as string;

        // Direct database insertion without content validation
        await supabase.from("files").insert({
          project_id: projectId,
          uploaded_by: user!.id,
          file_name: file.name,
          file_url: base64, // Storing file content in database
          file_size: file.size,
          file_type: file.type,
        });

        await supabase.from("timeline_events").insert({
          project_id: projectId,
          user_id: user!.id,
          event_type: "file",
          event_action: "uploaded",
          event_data: { file_name: file.name },
        });

        console.log(`✅ File uploaded successfully: ${file.name}`);
        loadFiles();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };



  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await supabase.from("files").delete().eq("id", fileId);

      loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // VULNERABILITY: CRITICAL - "View" function that executes file content
  // 
  // 🔴 MASALAH KEAMANAN:
  // Fungsi ini mengeksekusi file content menggunakan eval() 
  // yang memungkinkan Remote Code Execution (RCE) dan Cross-Site Scripting (XSS)
  //
  // ✅ MITIGASI YANG BENAR:
  // 1. JANGAN GUNAKAN eval() - Ganti dengan syntax highlighter library
  //    Contoh: react-syntax-highlighter, prismjs, monaco-editor
  // 2. Escape HTML entities atau gunakan sandboxed iframe
  // 3. Implementasi file type whitelist - Hanya izinkan extension tertentu
  // 4. Validasi MIME type - Jangan hanya cek extension
  // 5. Set Content Security Policy (CSP) headers - Block inline scripts
  //
  const handleViewFile = async (file: FileRecord) => {
    console.log(`👁️ Opening file for preview: ${file.file_name}`);
    
    try {
      const base64Content = file.file_url;
      const fileExt = file.file_name.split('.').pop()?.toLowerCase() || '';
      
      console.log(`📄 File type: ${fileExt}`);
      
      // Handle image files - show image directly
      const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
      if (imageExtensions.includes(fileExt)) {
        console.log(`🖼️ Image file detected, showing preview...`);
        setPreviewFile(file);
        setPreviewContent(''); // Empty content for images
        return;
      }
      
      // VULNERABILITY: Extract file content from base64 for non-image files
      let fileContent: string;
      
      if (base64Content.startsWith('data:')) {
        const base64Data = base64Content.split(',')[1];
        fileContent = atob(base64Data);
      } else {
        fileContent = base64Content;
      }
      
      console.log(`📏 Content size: ${fileContent.length} characters`);
      
      // Show preview modal with content
      setPreviewFile(file);
      setPreviewContent(fileContent);
      
      // 🔴 VULNERABLE - Auto-execute code files in background
      const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'htm'];
      if (codeExtensions.includes(fileExt)) {
        console.log(`⚡ Code file detected, executing in background...`);
        setTimeout(() => {
          try {
            // 🔴 VULNERABLE - Executes code automatically
            eval(fileContent);
            console.log(`✅ Code executed successfully`);
          } catch (execError) {
            console.log(`⚠️ Execution error:`, execError);
          }
        }, 500);
      }
      
      // ✅ SECURE VERSION - Uncomment to fix (comment out the eval block above)
      // Just show the preview without executing anything
      
    } catch (error) {
      console.error(`❌ Error viewing file:`, error);
      alert(`Error viewing file: ${error}`);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewContent("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {previewFile.file_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {previewFile.file_type} • {formatFileSize(previewFile.file_size)}
                </p>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              {/* Check if it's an image file */}
              {previewFile && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(
                previewFile.file_name.split('.').pop()?.toLowerCase() || ''
              ) ? (
                <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
                  <img 
                    src={previewFile.file_url} 
                    alt={previewFile.file_name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <>
                  <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-800 dark:text-gray-200">{previewContent}</code>
                  </pre>
                  {previewFile && ['js', 'jsx', 'ts', 'tsx', 'html', 'htm'].includes(
                    previewFile.file_name.split('.').pop()?.toLowerCase() || ''
                  ) && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        ⚠️ <strong>Security Warning:</strong> This file is being executed automatically in the background (vulnerable version).
                        Check console for execution logs.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
              <a
                href={previewFile.file_url}
                download={previewFile.file_name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Download
              </a>
              <button
                onClick={closePreview}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Files
        </h3>
        <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{uploading ? "Uploading..." : "Upload File"}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No files uploaded yet
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {file.file_name}
                  </p>
                  <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{file.profiles.full_name}</span>
                    <span>•</span>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* VULNERABILITY: View button that executes file content */}
                <button
                  onClick={() => handleViewFile(file)}
                  className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition"
                  title="View file"
                >
                  <Eye className="w-5 h-5" />
                </button>
                
                <a
                  href={file.file_url}
                  download={file.file_name}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                  title="Download file"
                >
                  <Download className="w-5 h-5" />
                </a>
                
                {file.uploaded_by === user!.id && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
