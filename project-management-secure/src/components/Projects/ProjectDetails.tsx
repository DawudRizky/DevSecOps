import { useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  CheckSquare,
  FileText,
  Clock,
} from "lucide-react";
import { Tasks } from "../Tasks/Tasks";
import { Chat } from "../Chat/Chat";
import { Files } from "../Files/Files";
import { Timeline } from "../Timeline/Timeline";
import { ProjectMembers } from "./ProjectMembers";

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetails({ projectId, onBack }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState<
    "tasks" | "chat" | "files" | "timeline" | "members"
  >("tasks");

  const tabs = [
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "files", label: "Files", icon: FileText },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "members", label: "Members", icon: FileText },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Projects</span>
        </button>

        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as never)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "tasks" && <Tasks projectId={projectId} />}
        {activeTab === "chat" && <Chat projectId={projectId} />}
        {activeTab === "files" && <Files projectId={projectId} />}
        {activeTab === "timeline" && <Timeline projectId={projectId} />}
        {activeTab === "members" && <ProjectMembers projectId={projectId} />}
      </div>
    </div>
  );
}
