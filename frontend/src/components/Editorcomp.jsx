import React, { useEffect, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { autoCloseTags, javascript } from "@codemirror/lang-javascript";

import { oneDark } from "@codemirror/theme-one-dark";
import { lineNumbers } from "@codemirror/view"; // Add line numbers
import { keymap } from "@codemirror/view"; // Add keymap support
import { defaultKeymap, indentWithTab } from "@codemirror/commands"; // Default keybindings for basic functionality
import { closeBrackets } from "@codemirror/autocomplete";

const Editorcomp = () => {
  const [code, setCode] = useState("// Start coding...");
  const editorRef = useRef(null);

  useEffect(() => {
    const startState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(), // Enable line numbers
        keymap.of(defaultKeymap),
        keymap.of(indentWithTab), // Add default keymap for commands
        javascript(), // Add JavaScript language support
        oneDark, // Apply dark theme
        closeBrackets(),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    return () => {
      view.destroy();
    };
  }, [code]);

  return (
    <div className="h-full">
      {/* Editor container */}
      <div className="h-full overflow-auto  text-lg" ref={editorRef} />
    </div>
  );
};

export default Editorcomp;
