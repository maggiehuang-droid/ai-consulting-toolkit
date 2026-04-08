import React from "react";
import { Routes, Route } from "react-router-dom";
import WorkshopList from "./WorkshopList";
import WorkshopNew from "./WorkshopNew";
import WorkshopDetail from "./WorkshopDetail";
import GroupNew from "./GroupNew";
import GroupDetail from "./GroupDetail";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WorkshopList />} />
      <Route path="/workshops" element={<WorkshopList listOnly />} />
      <Route path="/workshops/new" element={<WorkshopNew />} />
      <Route path="/workshops/:workshopId" element={<WorkshopDetail />} />
      <Route path="/workshops/:workshopId/groups/new" element={<GroupNew />} />
      <Route path="/workshops/:workshopId/groups/:groupId" element={<GroupDetail />} />
    </Routes>
  );
}
