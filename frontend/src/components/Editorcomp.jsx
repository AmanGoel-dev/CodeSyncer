import React, { useEffect, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { autoCloseTags, javascript } from "@codemirror/lang-javascript";

import { oneDark } from "@codemirror/theme-one-dark";
import { lineNumbers } from "@codemirror/view"; // Add line numbers
import { keymap } from "@codemirror/view"; // Add keymap support
import { defaultKeymap, indentWithTab, insertTab } from "@codemirror/commands"; // Default keybindings for basic functionality
import { closeBrackets } from "@codemirror/autocomplete";
import { Socket } from "socket.io-client";
import { ACTIONS } from "@amangoel-dev/codesyncer";
const Editorcomp = ({ SocketRef }) => {
  const [code, setCode] = useState("// Start coding...");
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);
  const isLocalChange = useRef(true);
  useEffect(() => {
    const onUpdate = EditorView.updateListener.of((update) => {
      if (update.docChanged && isLocalChange.current) {
        // Get updated content
        const updatedCode = update.state.doc.toString();
        if (updatedCode !== code)
          update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            const changesInData = {
              from: fromA,
              to: toA,
              text: inserted.toString(),
            };
            console.log(changesInData);
            SocketRef.current.emit(ACTIONS.CODE_CHANGE, changesInData);
          });
        setCode(updatedCode); // Update the state}
      }
    });
    if (SocketRef.current) {
      SocketRef.current.on(ACTIONS.SYNC_CODE, ({ from, to, text }) => {
        console.log("Received changes: ", { from, to, text });
        isLocalChange.current = false;
        if (editorViewRef.current) {
          editorViewRef.current.dispatch({
            changes: {
              from,
              to: editorViewRef.current.state.doc.length, // this gets the doc length as the length of text and doc differ, as backend was sending the text and frontend is doc, so above line get the length of the text in the insert , and when we se incremental change then it give that length
              insert: text,
            },
          });
        }
        isLocalChange.current = true;
      });
    }

    const startState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(), // Enable line numbers
        keymap.of(defaultKeymap),
        keymap.of(indentWithTab),
        javascript(), // Add JavaScript language support
        oneDark, // Apply dark theme
        // closeBrackets(),
        onUpdate,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });
    editorViewRef.current = view;

    return () => {
      view.destroy();
      if (SocketRef.current) {
        SocketRef.current.off(ACTIONS.SYNC_CODE);
      }
    };
  }, [SocketRef.current]);

  return (
    <div className="h-full">
      {/* Editor container */}
      <div className="h-full overflow-auto  text-lg" ref={editorRef} />
    </div>
  );
};

export default Editorcomp;
