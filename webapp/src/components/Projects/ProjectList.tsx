import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Calendar, Users as UsersIcon, Folder } from "lucide-react";
import type { Database } from "../../lib/database.types";
import { ProjectModal } from "./ProjectModal";
import { ProjectDetails } from "./ProjectDetails";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  project_members: { count: number }[];
};

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { profile } = useAuth();
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // VULNERABILITY: BROKEN ACCESS CONTROL
      // Role-based access control menggunakan cookies yang bisa dimanipulasi client-side
      
      // VULNERABILITY: Ambil role dari cookies (client-side, tidak aman!)
      const getCookieValue = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const userRole = getCookieValue('user_role'); // ⚠️ VULNERABILITY: Trust client-side data
      const userId = getCookieValue('user_id');
      
      console.log('🔍 Loading projects with role:', userRole);
      console.log('🔍 User ID:', userId);
      
      // VULNERABILITY: CRITICAL - Access control based on client-side cookie
      // Attacker bisa ubah cookie "user_role" dari "Member" ke "Manager"
      // untuk mendapatkan akses ke semua projects!
      
      if (userRole === 'Manager') {
        // VULNERABILITY: Manager dapat melihat SEMUA projects tanpa filter
        console.log('⚠️ MANAGER MODE: Fetching ALL projects (no filtering)');
        
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            project_members(count)
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log(`✅ Loaded ${data?.length || 0} projects (ALL PROJECTS)`);
        setProjects(data || []);
        
      } else {
        // Member seharusnya hanya lihat projects dimana dia adalah member
        console.log('👤 MEMBER MODE: Fetching only user projects');
        
        if (!userId) {
          console.log('⚠️ No user ID found in cookies');
          setProjects([]);
          return;
        }
        
        // ✅ SEHARUSNYA: Filter berdasarkan project membership
        // Step 1: Get project IDs where user is a member
        const { data: memberProjects, error: memberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', userId);
        
        if (memberError) throw memberError;
        
        // Extract project IDs
        const projectIds = memberProjects?.map((pm) => (pm as { project_id: string }).project_id) || [];
        
        if (projectIds.length === 0) {
          console.log('⚠️ User is not a member of any projects');
          setProjects([]);
          return;
        }
        
        // Step 2: Fetch projects where user is a member WITH member count
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            project_members(count)
          `
          )
          .in('id', projectIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log(`✅ Loaded ${data?.length || 0} projects (USER PROJECTS ONLY)`);
        setProjects(data || []);
      }
      
      // VULNERABILITY SUMMARY:
      // 🔴 Role diambil dari cookies (client-side) bukan server validation
      // 🔴 User bisa manipulasi cookie "user_role" dari "Member" → "Manager"
      // 🔴 Setelah ubah role, user biasa bisa lihat SEMUA projects
      // 🔴 Tidak ada server-side authorization check
      // 🔴 Horizontal privilege escalation vulnerability
      
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Planning: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      "In Progress":
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      Completed:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      "On Hold":
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    };
    return colors[status as keyof typeof colors] || colors["Planning"];
  };

  if (selectedProject) {
    return (
      <ProjectDetails
        projectId={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Projects
        </h2>
        {profile?.role === "Manager" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description || "No description"}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  {project.deadline && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="w-4 h-4" />
                    <span>
                      {project.project_members[0]?.count || 0} members
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}
