import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Plus } from "lucide-react";
import type { Database } from "../../lib/database.types";
import { TaskModal } from "./TaskModal";
import { TaskCard } from "./TaskCard";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

interface TasksProps {
  projectId: string;
}

export function Tasks({ projectId }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel(`tasks:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          profiles:assigned_to(*)
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const tasksByStatus = {
    Todo: tasks.filter((t) => t.status === "Todo"),
    "In Progress": tasks.filter((t) => t.status === "In Progress"),
    Review: tasks.filter((t) => t.status === "Review"),
    Done: tasks.filter((t) => t.status === "Done"),
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
          Tasks
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div
            key={status}
            className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
              {status}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {statusTasks.length}
              </span>
            </h4>
            <div className="space-y-3">
              {statusTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEdit} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            loadTasks();
          }}
        />
      )}
    </div>
  );
}
