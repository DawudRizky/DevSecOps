import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ProjectList } from "../Projects/ProjectList";
import { UserList } from "../Users/UserList";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          {activeTab === "projects" && <ProjectList />}
          {activeTab === "users" && <UserList />}
        </main>
      </div>
    </div>
  );
}
