import { useState} from 'react';
import axios from 'axios'

export default function GetDocument() {

    const api = axios.create({
        baseURL: 'http://nix.cse356.compas.cs.stonybrook.edu',
    })

    const [res, setRes] = useState('')

    const handleGetList = () => {
        api.get('/collection/list', { withCredentials: true }).then((response) => {
            console.log(response)
            setRes(JSON.stringify(response.data))
        })
    }

    const handleClear = () => {
        setRes('')
    }

    return (
        <>
        <form action="/collection/create" method="post">
            <label for="name">Create document name:</label>
            <input type="text" id="name" name="name"/><br/>
            <input type="submit" value="Submit"/>
        </form>

        <form action="/collection/delete" method="post">
            <label for="id">Delete document id:</label>
            <input type="text" id="id" name="id"/><br/>
            <input type="submit" value="Submit"/>
        </form>
        <br/>
        <button onClick={handleGetList}>
            get list
        </button>
        <br/>
        {res}
        <button onClick={handleClear}>
            clear response
        </button>
        </>
    )
}