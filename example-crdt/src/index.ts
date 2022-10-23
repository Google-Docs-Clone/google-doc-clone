// ... add imports and fill in the code
import * as Y from 'yjs'
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;


class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
};

exports.CRDT = class {
  // ...
  
  ydoc: any;
  cb: any;

  constructor(cb: (update: string, isLocal: Boolean) => void) {
    // ...
    this.ydoc = new Y.Doc();
    this.cb = cb;
    ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
  }

  update(update: string) {
    // ...
    console.log(update);
    let update = this.toHTML().replace('<p>', '').replace('</p>', '');
    this.cb(update, false);
  }

  insert(index: number, content: string, format: CRDTFormat) {
    const ytext = this.ydoc.getText('test');
    ytext.insert(index, content, format);
    let update = this.toHTML().replace('<p>', '').replace('</p>', '');
    this.cb(update, true);
  }

  delete(index: number, length: number) {
    const ytext = this.ydoc.getText('test');
    ytext.delete(index, length);
    let update = this.toHTML().replace('<p>', '').replace('</p>', '');
    this.cb(update, true);
  }

  toHTML() {
    const ytext = this.ydoc.getText('test');
    let cfg = {};
    let converter = new QuillDeltaToHtmlConverter(ytext.toDelta(), cfg);
    let html = converter.convert(); 
    return html;
  }
};
