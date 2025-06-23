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
const Editorcomp = ({ SocketRef, codechange }) => {
  const coderef = useRef("");
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);
  const isLocalChange = useRef(true);
  useEffect(() => {
    const onUpdate = EditorView.updateListener.of((update) => {
      if (update.docChanged && isLocalChange.current) {
        // Get updated content
        const updatedCode = update.state.doc.toString();
        console.log(updatedCode);
        if (updatedCode !== coderef.current) {
          update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
            const changesInData = {
              from: fromA,
              to: toA,
              text: inserted.toString(),
            };
            console.log(changesInData);
            SocketRef.current.emit(ACTIONS.CODE_CHANGE, changesInData);
          });
          coderef.current = updatedCode; // Update the state}
          codechange(coderef.current);
        }
      }
    });
    if (SocketRef.current) {
      SocketRef.current.on(ACTIONS.SYNC_CODE, (data) => {
        if (!editorViewRef.current) return;
        if (data.fullSync) {
          // Initial full doc sync (when a user joins)
          isLocalChange.current = false;
          const { code } = data;
          editorViewRef.current.dispatch({
            changes: {
              from: 0,
              to: editorViewRef.current.state.doc.length,
              insert: code,
            },
          });
          coderef.current = code;
          codechange(code);
          isLocalChange.current = true;
        } else {
          const { from, to, text } = data;
          isLocalChange.current = false;
          editorViewRef.current.dispatch({
            changes: {
              from,
              to,
              insert: text,
            },
          });
          // Apply to coderef
          const currentCode = coderef.current;
          coderef.current =
            currentCode.slice(0, from) + text + currentCode.slice(to);
          codechange(coderef.current);
          isLocalChange.current = true;
        }
      });
    }

    const startState = EditorState.create({
      doc: coderef.current,
      extensions: [
        lineNumbers(), // Enable line numbers
        keymap.of(defaultKeymap),
        keymap.of(indentWithTab),
        javascript(), // Add JavaScript language support
        oneDark, // Apply dark theme
        closeBrackets(),
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
