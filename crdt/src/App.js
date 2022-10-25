import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function App() {
    const [value, setValue] = useState('');
    
    const [open, setOpen]= useState(false)

    function handleSubmit(event) {
      const formData = new FormData(event.currentTarget);
      console.log(formData.get('id'));

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
