import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { UserPlus, X } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"] & {
  profiles: Profile;
};

interface ProjectMembersProps {
  projectId: string;
}

export function ProjectMembers({ projectId }: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadMembers();
    checkIfManager();
  }, [projectId]);

  const checkIfManager = async () => {
    const { data } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user!.id)
      .maybeSingle();

    setIsManager(data?.role === "Manager");
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("project_members")
        .select(
          `
          *,
          profiles(*)
        `
        )
        .eq("project_id", projectId);

      if (error) throw error;
      setMembers(data || []);

      const { data: users } = await supabase.from("profiles").select("*");

      setAllUsers(users || []);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId: string, role: "Manager" | "Member") => {
    try {
      await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: userId,
        role,
      });

      await supabase.from("timeline_events").insert({
        project_id: projectId,
        user_id: user!.id,
        event_type: "project",
        event_action: "updated",
        event_data: { action: "added_member" },
      });

      loadMembers();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await supabase.from("project_members").delete().eq("id", memberId);

      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const availableUsers = allUsers.filter(
    (user) => !members.some((m) => m.user_id === user.id)
  );

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
          Team Members
        </h3>
        {isManager && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {member.profiles.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {member.profiles.full_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {member.profiles.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-xs rounded-2xl ${
                  member.role === "Manager"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                }`}
              >
                {member.role}
              </span>
              {isManager && member.user_id !== user!.id && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 rounded-2xl"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Team Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.full_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addMember(user.id, "Member")}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    >
                      Add as Member
                    </button>
                    <button
                      onClick={() => addMember(user.id, "Manager")}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-xl"
                    >
                      Add as Manager
                    </button>
                  </div>
                </div>
              ))}
              {availableUsers.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No available users to add
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
