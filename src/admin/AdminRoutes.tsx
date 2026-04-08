import React from "react";
import { Routes, Route } from "react-router-dom";
import WorkshopList from "./WorkshopList";
import WorkshopNew from "./WorkshopNew";
import WorkshopDetail from "./WorkshopDetail";
import GroupNew from "./GroupNew";
import GroupDetail from "./GroupDetail";
import ProjectList from "./ProjectList";
import ProjectDetail from "./ProjectDetail";
import ToolsOverview from "./ToolsOverview";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WorkshopList />} />
      <Route path="/workshops" element={<WorkshopList listOnly />} />
      <Route path="/workshops/new" element={<WorkshopNew />} />
      <Route path="/workshops/:workshopId" element={<WorkshopDetail />} />
      <Route path="/workshops/:workshopId/groups/new" element={<GroupNew />} />
      <Route path="/workshops/:workshopId/groups/:groupId" element={<GroupDetail />} />
      <Route path="/projects" element={<ProjectList />} />
      <Route path="/projects/:projectId" element={<ProjectDetail />} />
      <Route path="/tools" element={<ToolsOverview />} />
    </Routes>
  );
}
