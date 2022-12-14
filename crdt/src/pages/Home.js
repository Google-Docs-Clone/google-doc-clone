import axios from "axios"
import { useEffect, useState } from "react"

export default function Home() {

    
    const [data, setData] = useState(null)


    useEffect(()=> {
        const api = axios.create({
            baseURL: 'http://krg.cse356.compas.cs.stonybrook.edu',
            withCredentials: true 
        })
    
        api.get('/collection/list').then(response => {
            console.log(response.data)
            const list = response.data.map((d) => {
                let editLink = 'http://krg.cse356.compas.cs.stonybrook.edu/edit/' + d.id;
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
        <br/>
        <form action="/index/search" method="get">
            <label for="name">Query:</label>
            <input type="text" id="q" name="q"/><br/>
            <input type="submit" value="Submit"/>
        </form>
        </>
    )

    
}