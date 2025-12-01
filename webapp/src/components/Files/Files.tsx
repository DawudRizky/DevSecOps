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
  // Fungsi ini mengeksekusi file content menggunakan eval() dan document.write()
  // yang memungkinkan Remote Code Execution (RCE) dan Cross-Site Scripting (XSS)
  //
  // ✅ MITIGASI YANG BENAR:
  // 1. JANGAN GUNAKAN eval() - Ganti dengan syntax highlighter library
  //    Contoh: react-syntax-highlighter, prismjs, monaco-editor
  // 2. JANGAN GUNAKAN document.write() - Escape HTML entities atau gunakan sandboxed iframe
  // 3. Implementasi file type whitelist - Hanya izinkan extension tertentu
  // 4. Validasi MIME type - Jangan hanya cek extension
  // 5. Set Content Security Policy (CSP) headers - Block inline scripts
  // 6. Backend file scanning - Detect malicious patterns sebelum disimpan
  //
  // 📖 Detail lengkap ada di: FILE_UPLOAD_RCE_MITIGATION.md
  //
  const handleViewFile = async (file: FileRecord) => {
    console.log(`👁️ Opening file for preview: ${file.file_name}`);
    
    try {
      // VULNERABILITY: Extract file content from base64
      const base64Content = file.file_url;
      let fileContent: string;
      
      if (base64Content.startsWith('data:')) {
        // VULNERABILITY: Decode base64 to get actual file content
        const base64Data = base64Content.split(',')[1];
        fileContent = atob(base64Data);
      } else {
        fileContent = base64Content;
      }
      
      const fileExt = file.file_name.split('.').pop()?.toLowerCase() || '';
      
      console.log(`📄 File type: ${fileExt}`);
      console.log(`📏 Content size: ${fileContent.length} characters`);
      
      // VULNERABILITY: CRITICAL - "Preview rendering" that actually executes the file
      console.log(`🎨 Rendering file preview for ${file.file_name}...`);
      
      // VULNERABILITY: Execute file content based on type
      switch (fileExt) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx': {
          console.log(`⚡ Rendering JavaScript preview...`);
          // VULNERABILITY: Show content first, then execute
          const confirmed = confirm(
            `📄 JavaScript File Preview: ${file.file_name}\n\n` +
            `Content:\n${fileContent}\n\n` +
            `⚠️ Click OK to render this JavaScript file (will execute the code)`
          );
          
          if (confirmed) {
            // VULNERABILITY: CRITICAL - Direct execution when "viewing" JS files
            //
            // ✅ SOLUSI AMAN:
            // import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
            // 
            // <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
            //   {fileContent}
            // </SyntaxHighlighter>
            //
            // Ini akan display code dengan syntax highlighting tanpa execute
            //
            try {
              eval(fileContent);
            } catch (execError) {
              console.log(`⚠️`, execError);
            }
          }
          break;
        }
          
        case 'html':
        case 'htm': {
          console.log(`🌐 Rendering HTML preview...`);
          // VULNERABILITY: Show HTML content first
          const confirmed = confirm(
            `🌐 HTML File Preview: ${file.file_name}\n\n` +
            `Content (first 500 chars):\n${fileContent.substring(0, 500)}...\n\n` +
            `⚠️ Click OK to open HTML in new window (will execute any scripts)`
          );
          
          if (confirmed) {
            // VULNERABILITY: CRITICAL - Create and execute HTML in new window
            //
            // ✅ SOLUSI AMAN #1 - Escape HTML:
            // const escapedHtml = fileContent
            //   .replace(/&/g, '&amp;')
            //   .replace(/</g, '&lt;')
            //   .replace(/>/g, '&gt;');
            // Tampilkan escapedHtml dalam <pre> atau syntax highlighter
            //
            // ✅ SOLUSI AMAN #2 - Sandboxed iframe:
            // const blob = new Blob([fileContent], { type: 'text/html' });
            // const blobUrl = URL.createObjectURL(blob);
            // <iframe src={blobUrl} sandbox="allow-same-origin" />
            // CATATAN: Jangan tambahkan "allow-scripts" di sandbox!
            //
            const previewWindow = window.open('', '_blank');
            if (previewWindow) {
              // VULNERABILITY: Write and execute HTML content directly
              previewWindow.document.write(fileContent); // ⚠️ XSS - Executes scripts in HTML
              previewWindow.document.close();
              console.log(`✅ HTML preview opened in new window`);
            }
          }
          break;
        }
          
        case 'py': {
          console.log(`🐍 Simulating Python file preview...`);
          // VULNERABILITY: Python execution simulation - show full content
          const confirmed = confirm(
            `🐍 Python File Preview: ${file.file_name}\n\n` +
            `Content:\n${fileContent}\n\n` +
            `⚠️ Click OK to simulate Python execution`
          );
          
          if (confirmed) {
            // VULNERABILITY: Simulate Python execution effects
            if (fileContent.includes('import') || fileContent.includes('subprocess')) {
              console.log(`🐍 Python imports detected - simulating execution environment...`);
              try {
                // VULNERABILITY: Trigger any embedded JavaScript in Python comments
                const jsInComments = fileContent.match(/#.*eval\((.*?)\)/g);
                if (jsInComments) {
                  console.log(`⚠️ Embedded code found in Python comments, executing...`);
                  eval(jsInComments[0].replace(/#.*eval\(/g, '').replace(/\)$/g, ''));
                }
              } catch (e) {
                console.log(`Python simulation completed`);
              }
            }
            alert(`Python execution simulated for: ${file.file_name}`);
          }
          break;
        }
          
        case 'sh':
        case 'bash':
        case 'bat':
        case 'ps1': {
          console.log(`⚡ Rendering shell script preview...`);
          // VULNERABILITY: Shell script preview that triggers embedded code
          const confirmed = confirm(
            `⚡ Shell Script Preview: ${file.file_name}\n\n` +
            `Content:\n${fileContent}\n\n` +
            `⚠️ Click OK to execute embedded scripts (if any)`
          );
          
          if (confirmed) {
            // VULNERABILITY: Execute any JavaScript embedded in shell comments
            const jsInShell = fileContent.match(/#.*<script>(.*?)<\/script>/gs);
            if (jsInShell) {
              console.log(`⚠️ Embedded script found in shell file, executing for preview...`);
              jsInShell.forEach(script => {
                const scriptContent = script.replace(/#.*<script>/g, '').replace(/<\/script>/g, '');
                try {
                  eval(scriptContent); // ⚠️ Execute embedded JS from shell scripts
                } catch (e) {
                  console.log(`Shell preview completed`);
                }
              });
            }
            alert(`Shell script preview completed: ${file.file_name}`);
          }
          break;
        }
          
        case 'php': {
          console.log(`🌐 Rendering PHP preview...`);
          // VULNERABILITY: PHP file preview
          const confirmed = confirm(
            `🌐 PHP File Preview: ${file.file_name}\n\n` +
            `Content:\n${fileContent}\n\n` +
            `⚠️ Click OK to execute embedded scripts (if any)`
          );
          
          if (confirmed) {
            // VULNERABILITY: Execute embedded JavaScript in PHP comments
            const jsInPhp = fileContent.match(/\/\/.*<script>(.*?)<\/script>/gs);
            if (jsInPhp) {
              jsInPhp.forEach(script => {
                const scriptContent = script.replace(/\/\/.*<script>/g, '').replace(/<\/script>/g, '');
                try {
                  eval(scriptContent); // ⚠️ Execute embedded JS
                } catch (e) {
                  console.log(`PHP preview completed`);
                }
              });
            }
            alert(`PHP preview completed: ${file.file_name}`);
          }
          break;
        }
          
        case 'txt':
        case 'md':
        case 'json': {
          console.log(`📝 Rendering text preview...`);
          // VULNERABILITY: Even "safe" text files can contain executable code
          const hasCode = fileContent.includes('function') || fileContent.includes('eval(') || fileContent.includes('alert(');
          
          const confirmed = confirm(
            `📝 Text File Preview: ${file.file_name}\n\n` +
            `Content:\n${fileContent}\n\n` +
            (hasCode ? `⚠️ Executable code detected! Click OK to execute.` : `Click OK to close.`)
          );
          
          if (confirmed && hasCode) {
            // VULNERABILITY: Check if text file contains code and execute it
            console.log(`⚠️ Executable code detected in text file, running preview...`);
            try {
              eval(fileContent); // ⚠️ Execute code found in "text" files
            } catch (e) {
              console.log(`Text preview completed`);
            }
          }
          break;
        }
          
        default: {
          console.log(`📄 Rendering generic file preview...`);
          const hasCode = fileContent.match(/function|const|var|let|alert|eval|document/);
          
          // VULNERABILITY: CRITICAL - Default handler tries to execute anything
          const confirmed = confirm(
            `📄 File Preview: ${file.file_name}\n` +
            `Type: ${file.file_type}\n\n` +
            `Content:\n${fileContent.substring(0, 500)}${fileContent.length > 500 ? '...' : ''}\n\n` +
            (hasCode ? `⚠️ Code patterns detected! Click OK to execute.` : `Click OK to close.`)
          );
          
          if (confirmed && hasCode) {
            // VULNERABILITY: Try to execute unknown file types if they contain code
            console.log(`⚠️ Code patterns detected, attempting preview render...`);
            try {
              eval(fileContent); // ⚠️ Execute any file that looks like code
              console.log(`✅ Preview rendered successfully`);
            } catch (e) {
              console.log(`Preview completed with warnings`);
            }
          }
          break;
        }
      }
      
      console.log(`✅ File preview completed: ${file.file_name}`);
      
    } catch (error) {
      console.error(`❌ Error viewing file:`, error);
      alert(`Error viewing file: ${error}`);
    }
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
