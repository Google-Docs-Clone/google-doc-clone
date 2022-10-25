import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';

function App() {
    const [value, setValue] = useState('');
    
    const [open, setOpen] = useState(false)

    const api = axios.create({
      baseURL: 'http://localhost:4000/api',
    })


    function handleSubmit(event) {
      const formData = new FormData(event.currentTarget);
      const id = formData.get('id');
      console.log(id);
      api.get(`connect/${id}`);

      setOpen(true);
    }

    if (open) {
        return <ReactQuill theme="snow" value={value} onChange={setValue} />;

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
        )
    }
}

export default App;
