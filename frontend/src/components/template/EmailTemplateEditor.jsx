import { Bold, Code2, Italic, Link2, List, ListOrdered, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const EMPTY_CONTENT = "<p><br></p>";

const isBlankHtml = (value = "") => {
  const stripped = value
    .replace(/<br\s*\/?>(\s*)/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length === 0;
};

const normalizeHtml = (value = "") => {
  if (!value || isBlankHtml(value)) return "";
  return value;
};

function ToolbarButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function EmailTemplateEditor({ value = "", onChange, variables = [], error }) {
  const editorRef = useRef(null);
  const [showHtml, setShowHtml] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextHtml = value || EMPTY_CONTENT;
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [value]);

  const emitChange = () => {
    const html = normalizeHtml(editorRef.current?.innerHTML || "");
    onChange(html);
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command, commandValue = null) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const insertHtml = (html) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    emitChange();
  };

  const insertVariable = (variable) => {
    insertHtml(`<span>${variable}</span>`);
  };

  const insertLink = () => {
    const url = window.prompt("Nhập đường dẫn liên kết");
    if (!url) return;
    runCommand("createLink", url.trim());
  };

  const clearFormatting = () => {
    runCommand("removeFormat");
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    insertHtml(html || text.replace(/\n/g, "<br>"));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton icon={Bold} label="Đậm" onClick={() => runCommand("bold")} />
            <ToolbarButton icon={Italic} label="Nghiêng" onClick={() => runCommand("italic")} />
            <ToolbarButton icon={List} label="Bullet" onClick={() => runCommand("insertUnorderedList")} />
            <ToolbarButton icon={ListOrdered} label="Đánh số" onClick={() => runCommand("insertOrderedList")} />
            <ToolbarButton icon={Link2} label="Chèn link" onClick={insertLink} />
            <ToolbarButton icon={X} label="Bỏ format" onClick={clearFormatting} />
          </div>

          <button
            type="button"
            onClick={() => setShowHtml((prev) => !prev)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-sky-200 bg-white px-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showHtml ? "Ẩn mã HTML" : "Mã HTML nâng cao"}
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[260px] w-full rounded-b-xl bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none focus:ring-2 focus:ring-sky-100 [&_a]:text-sky-700 [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc"
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          data-placeholder="Nhập nội dung mẫu email..."
        />
      </div>

      {variables.length > 0 ? (
        <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-sky-800">Chèn biến dữ liệu vào nội dung</p>
            <p className="text-xs text-sky-700">Bấm biến để chèn vào vị trí con trỏ trong nội dung mẫu.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {variables.map((variable) => (
              <button
                type="button"
                key={variable}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertVariable(variable)}
                className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {showHtml ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <label className="mb-2 block text-sm font-semibold text-slate-600">Mã HTML nâng cao</label>
          <textarea
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            rows={10}
            className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-xs text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="Dành cho người biết HTML. Người dùng thường có thể bỏ qua phần này."
          />
        </div>
      ) : null}
    </div>
  );
}
