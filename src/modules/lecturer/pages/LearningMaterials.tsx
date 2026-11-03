import React, { useState } from "react";
import { Plus, FileText, Download, Eye, EyeOff, CheckCircle2, UploadCloud, X, FileArchive, FileCode } from "lucide-react";
import { lecturerApi, LearningMaterialItem } from "../services/lecturerApi";

export default function LearningMaterials() {
  const [materials, setMaterials] = useState<LearningMaterialItem[]>(lecturerApi.getMaterials());
  const assignments = lecturerApi.getAssignments();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    assignmentId: assignments[0]?.id || "",
    unitCode: assignments[0]?.unitId || "CSC 301",
    title: "",
    description: "",
    topic: "",
    fileName: "",
    fileSize: "2.1 MB",
    mimeType: "application/pdf",
    published: true,
  });

  const filteredMaterials = materials.filter((m) => {
    if (selectedUnit !== "ALL" && m.unitCode !== selectedUnit) return false;
    return true;
  });

  const handleTogglePublish = (id: string) => {
    const updated = lecturerApi.toggleMaterialPublish(id);
    if (updated) {
      setMaterials(materials.map((m) => (m.id === id ? { ...updated } : m)));
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.fileName.trim()) return;

    const newMat = lecturerApi.uploadMaterial({
      assignmentId: form.assignmentId,
      unitCode: form.unitCode,
      title: form.title.trim(),
      description: form.description.trim(),
      topic: form.topic.trim(),
      fileName: form.fileName.trim(),
      fileSize: form.fileSize,
      mimeType: form.mimeType,
      published: form.published,
      publishedAt: form.published ? new Date().toISOString().split("T")[0] : undefined,
    });

    setMaterials([newMat, ...materials]);
    setShowUploadModal(false);
    setForm({
      ...form,
      title: "",
      description: "",
      topic: "",
      fileName: "",
    });
    setSuccessMsg("Learning material successfully uploaded to student portal library.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const simulateDownload = (item: LearningMaterialItem) => {
    // Increment download count
    const updated = materials.map((m) =>
      m.id === item.id ? { ...m, downloadCount: m.downloadCount + 1 } : m
    );
    setMaterials(updated);

    // Trigger fake text download
    const blob = new Blob([`HI-TECH College Academic Material\nUnit: ${item.unitCode}\nTitle: ${item.title}\nTopic: ${item.topic}\n\nContents verified by Faculty.`], {
      type: item.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DIGITAL COURSEWARE &amp; RESOURCES</span>
          <h1>Learning Materials Repository</h1>
          <p>Distribute lecture slides, laboratory worksheets, code templates, and reference materials.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowUploadModal(true)}
        >
          <UploadCloud size={16} />
          Upload New Material
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex items-center gap-2 border-b pb-3 text-xs">
        <span className="font-semibold text-slate-500 mr-2">Filter by Unit:</span>
        <button
          onClick={() => setSelectedUnit("ALL")}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            selectedUnit === "ALL" ? "bg-[#153b70] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Units ({materials.length})
        </button>
        {assignments.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedUnit(a.unitId)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              selectedUnit === a.unitId ? "bg-[#153b70] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {a.unitId}
          </button>
        ))}
      </div>

      {/* MATERIALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMaterials.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-blue-300 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {item.fileName.endsWith(".zip") ? (
                    <FileArchive size={20} />
                  ) : item.fileName.endsWith(".pdf") ? (
                    <FileText size={20} />
                  ) : (
                    <FileCode size={20} />
                  )}
                </div>
                <div>
                  <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    {item.unitCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h3>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  item.published
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.published ? "Published" : "Draft (Hidden)"}
              </span>
            </div>

            <p className="text-xs text-slate-600">{item.description}</p>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{item.fileName}</span>
                <span>· {item.fileSize}</span>
              </div>
              <span className="font-bold text-blue-700">{item.downloadCount} Student Downloads</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => handleTogglePublish(item.id)}
                className="secondary-button text-xs py-1"
              >
                {item.published ? <EyeOff size={13} /> : <Eye size={13} />}
                {item.published ? "Unpublish" : "Publish to Portal"}
              </button>

              <button
                onClick={() => simulateDownload(item)}
                className="primary-button text-xs py-1"
              >
                <Download size={13} /> Download File
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Upload Learning Material</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course Unit</label>
                <select
                  value={form.assignmentId}
                  onChange={(e) => {
                    const sel = assignments.find((a) => a.id === e.target.value);
                    setForm({
                      ...form,
                      assignmentId: e.target.value,
                      unitCode: sel ? sel.unitId : "",
                    });
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.unitId}: {a.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resource Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Lecture Notes 05: Red-Black Trees Insertion"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curriculum Topic</label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g. Balanced Search Trees"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Student Instructions</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide context or guidance on how students should use this material..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">File Name &amp; Extension</label>
                  <input
                    type="text"
                    value={form.fileName}
                    onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                    placeholder="e.g. CSC301_Module5_Notes.pdf"
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">File Size</label>
                  <input
                    type="text"
                    value={form.fileSize}
                    onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
                    placeholder="e.g. 3.4 MB"
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  Publish immediately to student portal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <UploadCloud size={14} /> Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
