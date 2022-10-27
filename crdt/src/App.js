import React, { useState, useCallback } from 'react';
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import 'quill/dist/quill.snow.css'
import axios from 'axios'
import { fromUint8Array, toUint8Array } from 'js-base64'


function App() {
	
	Quill.register('modules/cursors', QuillCursors)

    const [open, setOpen] = useState(false)
	const [id, setId] = useState('')

	function handleSubmit(e) {
		const formData = new FormData(e.currentTarget);
		const id = formData.get('id');
		setId(id)
		
		setOpen(true);
  	}

	const wrapperRef = useCallback((wrapper) => {
		const api = axios.create({
			baseURL: 'http://209.94.59.0:4000/api',
		})

		if (wrapper == null) return;
		wrapper.innerHTML = '';

		const ydoc = new Y.Doc()
		const ytext = ydoc.getText(id)
		const editorContainer = document.createElement('div')
		wrapper.append(editorContainer);

		const editor = new Quill(editorContainer, {
			modules: {
			cursors: true,
			toolbar: [
				['bold', 'italic', 'underline'],
			],
			history: {
				userOnly: true
			}
			},
			placeholder: 'Start collaborating...',
			theme: 'snow' // or 'bubble'
		})
		
		const binding = new QuillBinding(ytext, editor)
		
		
		var eventSource = new EventSource(`http://209.94.59.0:4000/api/connect/${id}`)

		eventSource.addEventListener('sync', (e) => {
			let data = JSON.parse(e.data)
			if (data.updates === undefined || data.updates.length === 0) {
				return
			}
			console.log(data.updates)
			console.log(toUint8Array(data.updates))
			Y.applyUpdate(ydoc, toUint8Array(data.updates))
			console.log('done')
		});
		eventSource.addEventListener('update', (e) => {
			let data = JSON.parse(e.data)
			if (data.id !== ydoc.clientID){
				Y.applyUpdate(ydoc, toUint8Array(data.updates))
			}
		});

		editor.on('text-change', function(delta, oldContents, source) {
			if(source !== "user") {
                return
            }
			let payload = {
				id: ydoc.clientID,
				update: fromUint8Array(Y.encodeStateAsUpdate(ydoc))
			}
			console.log(payload)
			api.post(`/op/${id}`, payload).then((response) => {
				console.log(response)
			})
		})
	},
	[id],
	)

	if (open) {
		return <div ref={wrapperRef}/>
	}else{
		return (
			<form onSubmit={handleSubmit} >
					<label>
						Document Id:
						<input type="text" name="id" />
					</label>
					<br/>
					<input type="submit" value="Open"/>
				</form>
		);
	}
	
}

export default App;
