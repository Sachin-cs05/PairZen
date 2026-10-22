import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import type { editor as MonacoEditorType, IDisposable, ISelection } from "monaco-editor";

class RelativeSelection {
  start: Y.RelativePosition;
  end: Y.RelativePosition;
  direction: number;

  constructor(start: Y.RelativePosition, end: Y.RelativePosition, direction: number) {
    this.start = start;
    this.end = end;
    this.direction = direction;
  }
}

const createRelativeSelection = (
  editor: MonacoEditorType.IStandaloneCodeEditor,
  monacoModel: MonacoEditorType.ITextModel,
  type: Y.Text
): RelativeSelection | null => {
  const sel = editor.getSelection();
  if (sel !== null) {
    const startPos = sel.getStartPosition();
    const endPos = sel.getEndPosition();
    const start = Y.createRelativePositionFromTypeIndex(type, monacoModel.getOffsetAt(startPos));
    const end = Y.createRelativePositionFromTypeIndex(type, monacoModel.getOffsetAt(endPos));
    return new RelativeSelection(start, end, sel.getDirection());
  }
  return null;
};

const createMonacoSelectionFromRelativeSelection = (
  editor: MonacoEditorType.IStandaloneCodeEditor,
  type: Y.Text,
  relSel: RelativeSelection,
  doc: Y.Doc
): ISelection | null => {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc);
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc);
  if (start !== null && end !== null && start.type === type && end.type === type) {
    const model = editor.getModel();
    if (!model) return null;
    const startPos = model.getPositionAt(start.index);
    const endPos = model.getPositionAt(end.index);
    return {
      selectionStartLineNumber: startPos.lineNumber,
      selectionStartColumn: startPos.column,
      positionLineNumber: endPos.lineNumber,
      positionColumn: endPos.column,
    };
  }
  return null;
};

export class MonacoBinding {
  public doc: Y.Doc;
  public ytext: Y.Text;
  public monacoModel: MonacoEditorType.ITextModel;
  public editors: Set<MonacoEditorType.IStandaloneCodeEditor>;
  public awareness: Awareness | null;

  private _mux: boolean = false;
  private _savedSelections = new Map<MonacoEditorType.IStandaloneCodeEditor, RelativeSelection>();
  private _decorations = new Map<MonacoEditorType.IStandaloneCodeEditor, string[]>();
  private _beforeTransaction: () => void;
  private _rerenderDecorations: () => void;
  private _ytextObserver: (event: Y.YTextEvent) => void;
  private _monacoChangeHandler: IDisposable;
  private _monacoDisposeHandler: IDisposable;
  private _disposables: IDisposable[] = [];

  constructor(
    ytext: Y.Text,
    monacoModel: MonacoEditorType.ITextModel,
    editors: Set<MonacoEditorType.IStandaloneCodeEditor> = new Set(),
    awareness: Awareness | null = null
  ) {
    this.doc = ytext.doc as Y.Doc;
    this.ytext = ytext;
    this.monacoModel = monacoModel;
    this.editors = editors;
    this.awareness = awareness;

    const mutex = (f: () => void) => {
      if (!this._mux) {
        this._mux = true;
        try {
          f();
        } finally {
          this._mux = false;
        }
      }
    };

    this._beforeTransaction = () => {
      mutex(() => {
        this._savedSelections = new Map();
        editors.forEach((editor) => {
          if (editor.getModel() === monacoModel) {
            const rsel = createRelativeSelection(editor, monacoModel, ytext);
            if (rsel !== null) {
              this._savedSelections.set(editor, rsel);
            }
          }
        });
      });
    };
    this.doc.on("beforeAllTransactions", this._beforeTransaction);

    this._rerenderDecorations = () => {
      editors.forEach((editor) => {
        if (awareness && editor.getModel() === monacoModel) {
          const currentDecorations = this._decorations.get(editor) || [];
          const newDecorations: MonacoEditorType.IModelDeltaDecoration[] = [];

          awareness.getStates().forEach((state, clientID) => {
            if (
              clientID !== this.doc.clientID &&
              state.selection != null &&
              state.selection.anchor != null &&
              state.selection.head != null
            ) {
              const anchorAbs = Y.createAbsolutePositionFromRelativePosition(
                state.selection.anchor,
                this.doc
              );
              const headAbs = Y.createAbsolutePositionFromRelativePosition(
                state.selection.head,
                this.doc
              );

              if (
                anchorAbs !== null &&
                headAbs !== null &&
                anchorAbs.type === ytext &&
                headAbs.type === ytext
              ) {
                let startPos: { lineNumber: number; column: number };
                let endPos: { lineNumber: number; column: number };
                let afterContentClassName: string | null = null;
                let beforeContentClassName: string | null = null;

                if (anchorAbs.index < headAbs.index) {
                  startPos = monacoModel.getPositionAt(anchorAbs.index);
                  endPos = monacoModel.getPositionAt(headAbs.index);
                  afterContentClassName = `yRemoteSelectionHead yRemoteSelectionHead-${clientID}`;
                } else {
                  startPos = monacoModel.getPositionAt(headAbs.index);
                  endPos = monacoModel.getPositionAt(anchorAbs.index);
                  beforeContentClassName = `yRemoteSelectionHead yRemoteSelectionHead-${clientID}`;
                }

                newDecorations.push({
                  range: {
                    startLineNumber: startPos.lineNumber,
                    startColumn: startPos.column,
                    endLineNumber: endPos.lineNumber,
                    endColumn: endPos.column,
                  },
                  options: {
                    className: `yRemoteSelection yRemoteSelection-${clientID}`,
                    afterContentClassName: afterContentClassName || undefined,
                    beforeContentClassName: beforeContentClassName || undefined,
                  },
                });
              }
            }
          });

          this._decorations.set(editor, editor.deltaDecorations(currentDecorations, newDecorations));
        } else {
          this._decorations.delete(editor);
        }
      });
    };

    this._ytextObserver = (event: Y.YTextEvent) => {
      mutex(() => {
        let index = 0;
        event.delta.forEach((op) => {
          if (op.retain !== undefined) {
            index += op.retain;
          } else if (op.insert !== undefined) {
            const pos = monacoModel.getPositionAt(index);
            const range = {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: pos.lineNumber,
              endColumn: pos.column,
            };
            const insert = op.insert as string;
            monacoModel.applyEdits([{ range, text: insert }]);
            index += insert.length;
          } else if (op.delete !== undefined) {
            const pos = monacoModel.getPositionAt(index);
            const endPos = monacoModel.getPositionAt(index + op.delete);
            const range = {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            };
            monacoModel.applyEdits([{ range, text: "" }]);
          }
        });

        this._savedSelections.forEach((rsel, editor) => {
          const sel = createMonacoSelectionFromRelativeSelection(
            editor,
            ytext,
            rsel,
            this.doc
          );
          if (sel !== null) {
            editor.setSelection(sel);
          }
        });
      });
      this._rerenderDecorations();
    };
    ytext.observe(this._ytextObserver);

    // Initial sync
    const ytextValue = ytext.toString();
    if (monacoModel.getValue() !== ytextValue) {
      monacoModel.setValue(ytextValue);
    }

    // Outgoing edits
    this._monacoChangeHandler = monacoModel.onDidChangeContent((event) => {
      mutex(() => {
        this.doc.transact(() => {
          event.changes
            .sort((c1, c2) => c2.rangeOffset - c1.rangeOffset)
            .forEach((change) => {
              ytext.delete(change.rangeOffset, change.rangeLength);
              ytext.insert(change.rangeOffset, change.text);
            });
        }, this);
      });
    });

    this._monacoDisposeHandler = monacoModel.onWillDispose(() => {
      this.destroy();
    });

    if (awareness) {
      editors.forEach((editor) => {
        const disposable = editor.onDidChangeCursorSelection(() => {
          if (editor.getModel() === monacoModel) {
            const sel = editor.getSelection();
            if (!sel) return;

            let anchor = monacoModel.getOffsetAt(sel.getStartPosition());
            let head = monacoModel.getOffsetAt(sel.getEndPosition());

            // RTL selection check (1 = RTL, 0 = LTR)
            if (sel.getDirection() === 1) {
              const tmp = anchor;
              anchor = head;
              head = tmp;
            }

            awareness.setLocalStateField("selection", {
              anchor: Y.createRelativePositionFromTypeIndex(ytext, anchor),
              head: Y.createRelativePositionFromTypeIndex(ytext, head),
            });
          }
        });
        this._disposables.push(disposable);
        awareness.on("change", this._rerenderDecorations);
      });
    }
  }

  destroy() {
    this._monacoChangeHandler.dispose();
    this._monacoDisposeHandler.dispose();
    this._disposables.forEach((d) => d.dispose());
    this.ytext.unobserve(this._ytextObserver);
    this.doc.off("beforeAllTransactions", this._beforeTransaction);
    if (this.awareness) {
      this.awareness.off("change", this._rerenderDecorations);
    }
  }
}
