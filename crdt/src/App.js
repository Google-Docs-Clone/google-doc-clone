import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
	Login,
	Register,
	GetDocument,
	Media,
	EditPage,
	Logout,
	Home
} from './pages'


function App() {

	return (
		<BrowserRouter>
			<Logout/>
			<br/>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/document" element={<GetDocument />} />
				<Route path="/media" element={<Media />} />
				<Route path="/edit/:id" element={<EditPage />} />
				<Route path="/home" element={<Home />} />
			</Routes>
	    </BrowserRouter>
	)
	
}

export default App;
