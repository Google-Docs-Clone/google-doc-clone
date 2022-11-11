import axios from "axios"
import { useEffect, useState } from "react"

export default function Home() {

    
    const [data, setData] = useState(null)


    useEffect(()=> {
        const api = axios.create({
            baseURL: 'http://localhost:4000/',
            withCredentials: true 
        })
    
        api.get('/collection/list').then(response => {
            const list = response.data.map((d) => {
                let editLink = 'http://localhost:4000/edit/' + d.id;
                return <div key={d.id} >
                    <a href={editLink} >{d.id}</a>  name: {d.name} 
                    <form action="/collection/delete" method="post">
                    <input type="hidden" name="id" value={d.id}/>
                        <input type="submit" value="delete"/>
                    </form>  
                    </div>
            })
            setData(list)
        })
    },[])

    
    return (
        <>
        {data}
        <br/>
        <form action="/collection/create" method="post">
            <label for="name">Create document name:</label>
            <input type="text" id="name" name="name"/><br/>
            <input type="submit" value="Submit"/>
        </form>
        </>
    )

    
}