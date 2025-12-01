import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  FolderKanban,
  CheckSquare,
  MessageSquare,
  FileText,
  Clock,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type TimelineEvent = Database["public"]["Tables"]["timeline_events"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
};

interface TimelineProps {
  projectId: string;
}

export function Timeline({ projectId }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();

    const channel = supabase
      .channel(`timeline:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "timeline_events",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("timeline_events")
        .select(
          `
          *,
          profiles(*)
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    const icons = {
      project: FolderKanban,
      task: CheckSquare,
      message: MessageSquare,
      file: FileText,
    };
    return icons[type as keyof typeof icons] || Clock;
  };

  const getEventColor = (type: string) => {
    const colors = {
      project:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      task: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      message:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
      file: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    };
    return colors[type as keyof typeof colors] || colors["project"];
  };

  const getEventDescription = (event: TimelineEvent) => {
    const { event_type, event_action, event_data } = event;
    const data = event_data as any;

    switch (event_type) {
      case "project":
        if (event_action === "created")
          return `created the project "${data.name}"`;
        if (event_action === "updated") return `updated the project`;
        return `${event_action} the project`;

      case "task":
        if (event_action === "created") return `created task "${data.title}"`;
        if (event_action === "completed")
          return `completed task "${data.title}"`;
        if (event_action === "updated")
          return `updated task "${data.title}" to ${data.status}`;
        if (event_action === "deleted") return `deleted task "${data.title}"`;
        return `${event_action} a task`;

      case "message":
        return `sent a message: "${data.content}${
          data.content?.length > 50 ? "..." : ""
        }"`;

      case "file":
        if (event_action === "uploaded")
          return `uploaded file "${data.file_name}"`;
        return `${event_action} a file`;

      default:
        return `${event_action} ${event_type}`;
    }
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
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Activity Timeline
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.event_type);
            const colorClass = getEventColor(event.event_type);

            return (
              <div key={event.id} className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {event.profiles.full_name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {getEventDescription(event)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
