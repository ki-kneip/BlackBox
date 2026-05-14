"use client";

import { useState } from "react";
import { CreateProjectModal } from "./create-project-modal";

export function CreateFirstProject() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-white">Welcome to BlackBox</h1>
      <p className="text-sm text-white/40">Create your first project to get started.</p>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black hover:opacity-90 transition-opacity"
      >
        Create project
      </button>
      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
