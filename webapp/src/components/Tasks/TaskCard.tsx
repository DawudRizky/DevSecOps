import { Calendar, AlertCircle } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    const colors = {
      Low: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      Medium:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      High: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      Urgent: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    return colors[priority as keyof typeof colors] || colors["Medium"];
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className="bg-white dark:bg-gray-700 p-4 rounded-2xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-medium text-gray-900 dark:text-white line-clamp-2">
          {task.title}
        </h5>
        <span
          className={`px-2 py-1 text-xs rounded ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.profiles && (
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
              {task.profiles.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {task.profiles.full_name}
          </span>
        </div>
      )}

      {task.due_date && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>{new Date(task.due_date).toLocaleDateString()}</span>
          {new Date(task.due_date) < new Date() && task.status !== "Done" && (
            <AlertCircle className="w-3 h-3 text-red-500 ml-1" />
          )}
        </div>
      )}
    </div>
  );
}
