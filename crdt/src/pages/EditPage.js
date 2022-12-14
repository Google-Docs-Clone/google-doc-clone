import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import 'quill/dist/quill.snow.css'
import axios from 'axios'

export default function EditPage() {
	
    Quill.register('modules/cursors', QuillCursors)

	let url = window.location.href.split('/').filter(n => n)
	//console.log(url)
	let id = url[url.length-1]


	const wrapperRef = useCallback((wrapper) => {
		const api = axios.create({
			baseURL: 'http://krg.cse356.compas.cs.stonybrook.edu/api',
			withCredentials: true 
		})

		if (wrapper == null) return;
		wrapper.innerHTML = '';
		var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

		const ydoc = new Y.Doc()
		const ytext = ydoc.getText('quill')
		const editorContainer = document.createElement('div')
		wrapper.append(editorContainer);

		const editor = new Quill(editorContainer, {
			modules: {
			cursors: {
				hideDelayMs: 0,
      			hideSpeedMs: 0,
				selectionChangeSource: null,
				transformOnTextChange: true,
			},
			toolbar: [
				['bold', 'italic', 'underline'],
				['image']
			],
			history: {
				userOnly: true
			}
			},
			placeholder: 'Start collaborating...',
			theme: 'snow' // or 'bubble'
		})
		
		const binding = new QuillBinding(ytext, editor)
		
		var eventSource = new EventSource(`http://krg.cse356.compas.cs.stonybrook.edu/api/connect/${id}`, { withCredentials: true })
		console.log(eventSource)

		eventSource.addEventListener('sync', (e) => {
			let data = JSON.parse(e.data)
			//console.log(data)
			if (data.update === undefined || data.update.length === 0) {
				return
			}
			Y.applyUpdate(ydoc, new Uint8Array(data.update))
			console.log("on sync: ", ytext.toString())
		});
		eventSource.addEventListener('update', (e) => {
			let data = JSON.parse(e.data)
			
			Y.applyUpdate(ydoc, new Uint8Array(data.update))
			console.log("on update: ", ytext.toString())
		});
		eventSource.addEventListener('presence', (e) => {
			let data = JSON.parse(e.data)
			const cursors = editor.getModule('cursors');
			if (data.cursor.index === undefined && data.cursor.length === undefined){
				cursors.removeCursor(data.id)
			}else{
				if (data.cursor.index === null && data.cursor.length === null){
					return
				}
				cursors.createCursor(data.id, data.id, "#000000")
				cursors.moveCursor(data.id, data.cursor)
			}
		})

		ydoc.on('update', (update, origin, doc) => {
			//console.log(update)
			if(origin === binding) {
				let payload = ({
					update: Array.from(update)
				})
				
				api.post(`/op/${id}`, payload).then((response) => {
					//console.log(response)
				})
				console.log("after send: ", ytext.toString())
			}
		})

		editor.on('selection-change', function(range, oldRange, source) {
			//console.log(editor.getModule('cursors'))
			if (source !== null) {
				api.post(`/presence/${id}`, range).then((res) => {

				})
			}
		})
	},
	[id],
	)


	return <div ref={wrapperRef}/>
	
}