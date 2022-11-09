// ... add imports and fill in the code
import * as Y from 'yjs'
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
import * as base64 from "byte-base64"


class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
};

exports.CRDT = class {
  
	ydoc: any;
	cb: any;
	ytext: any;
	isLocal: boolean;

	constructor(cb: (update: string, isLocal: Boolean) => void) {
		this.ydoc = new Y.Doc();
		this.cb = cb;
		this.ytext = this.ydoc.getText('test');
		this.isLocal = false;
		this.ydoc.on('update', (update: Uint8Array) => {
			let updateJSON = JSON.stringify({
				id: this.ydoc.clientID,
				update: base64.bytesToBase64(update),
			})
			this.cb(updateJSON, this.isLocal );
		});
		['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
	}

	update(update: string) {
		//console.log(update);
		this.isLocal = false;
		let data = JSON.parse(update);
		if (data === undefined || data.length == 0 || data == null) {
			return;
		}

		if (data.id !== this.ydoc.clientID){
			Y.applyUpdate(this.ydoc, base64.base64ToBytes(data.updates));
		}

		//this.cb(update, false);
	}

	insert(index: number, content: string, format: CRDTFormat) {
		this.isLocal = true;
		this.ytext.insert(index, content, format);
	}

	delete(index: number, length: number) {
		this.isLocal = true;
		this.ytext.delete(index, length);
	}

	toHTML() {
		let cfg = {};
		let converter = new QuillDeltaToHtmlConverter(this.ytext.toDelta(), cfg);
		let html = converter.convert(); 
		return html;
	}
};
