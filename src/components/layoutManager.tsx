import React, { useRef } from "react";
import { useLocalStorage } from "./lsProvider";
import { Plus, Delete, Download, Upload, Edit } from "@icon-park/react";

interface Props {
  className?: string;
  isMobile?: boolean;
  serverHostName: string;
}

export function LayoutManager({ className, isMobile, serverHostName }: Props) {
  const ls = useLocalStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const name = prompt("Enter a name for the new layout:");
    if (name && name.trim()) {
      if (ls.layoutNames.includes(name.trim())) {
        alert("A layout with this name already exists.");
        return;
      }
      ls.addLayout(name.trim());
    }
  };

  const handleRename = () => {
    const currentName = ls.currentLayoutName;
    const newName = prompt(`Rename layout "${currentName}" to:`, currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      const trimmedNewName = newName.trim();
      if (ls.layoutNames.includes(trimmedNewName)) {
        alert(`A layout named "${trimmedNewName}" already exists.`);
        return;
      }
      ls.renameLayout(currentName, trimmedNewName);
    }
  };

  const handleDelete = () => {
    if (ls.layoutNames.length <= 1) {
      alert("Cannot delete the only layout.");
      return;
    }
    if (confirm(`Are you sure you want to delete the layout "${ls.currentLayoutName}"?`)) {
      ls.deleteLayout(ls.currentLayoutName);
    }
  };

  const handleDownload = () => {
    const dataStr = ls.exportSingleLayout(ls.currentLayoutName);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const safeHostName = serverHostName.replace(/[^a-zA-Z0-9-]/g, "-").replace(/^-+/, "").replace(/-+$/, "");
    const exportFileName = `${safeHostName}_${ls.currentLayoutName}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileName);
    linkElement.click();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      fileReader.readAsText(file, "UTF-8");
      fileReader.onload = (event) => {
        if (event.target?.result) {
          let baseName = file.name.replace(/\.json$/i, "");
          let layoutName = baseName;
          const underscoreIdx = baseName.indexOf("_");
          if (underscoreIdx !== -1) {
            layoutName = baseName.substring(underscoreIdx + 1);
          }
          if (!layoutName.trim()) {
            layoutName = "ImportedLayout";
          }

          let finalName = layoutName;
          let counter = 1;
          while (ls.layoutNames.includes(finalName)) {
            finalName = `${layoutName}_${counter}`;
            counter++;
          }

          const success = ls.importSingleLayout(finalName, event.target.result as string);
          if (success) {
            alert(`Layout "${finalName}" imported successfully!`);
          } else {
            alert("Failed to import layout. Please check if the file format is correct.");
          }
        }
      };
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const containerClass = isMobile
    ? "flex flex-col items-stretch space-y-1"
    : "flex items-center space-x-2";

  const selectClass = isMobile
    ? "flex-1 px-2 py-1 bg-white border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
    : "px-2 py-1 bg-green-400 hover:bg-green-500 rounded text-sm border-none focus:outline-none focus:ring-1 focus:ring-green-200 cursor-pointer transition duration-150";

  const buttonClass = isMobile
    ? "flex items-center justify-center p-1.5 bg-white border border-neutral-300 rounded hover:bg-neutral-100 active:bg-neutral-200 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    : "flex items-center justify-center p-1.5 bg-green-400 hover:bg-green-500 rounded transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={`${containerClass} ${className || ""}`}>
      <select
        value={ls.currentLayoutName}
        onChange={(e) => ls.switchLayout(e.target.value)}
        className={selectClass}
      >
        {ls.layoutNames.map((name) => (
          <option key={name} value={name} className="text-neutral-800 bg-white">
            {name}
          </option>
        ))}
      </select>
        
      <div className="flex items-center space-x-1.5">
        <button
          onClick={handleAdd}
          title="Add layout"
          className={buttonClass}
        >
          <Plus size={16} />
        </button>

        <button
          onClick={handleRename}
          title="Rename layout"
          className={buttonClass}
        >
          <Edit size={16} />
        </button>

        <button
          onClick={handleDelete}
          title="Delete layout"
          className={buttonClass}
          disabled={ls.layoutNames.length <= 1}
        >
          <Delete size={16} />
        </button>

        <button
          onClick={handleDownload}
          title="Download current layout"
          className={buttonClass}
        >
          <Download size={16} />
        </button>

        <button
          onClick={triggerUpload}
          title="Upload layout"
          className={buttonClass}
        >
          <Upload size={16} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept=".json"
        className="hidden"
      />
    </div>
  );
}
