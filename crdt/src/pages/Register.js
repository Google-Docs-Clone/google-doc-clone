
export default function Register(){

    return (
        
        <form action="/users/signup" method="post">
            <label for="name">username:</label>
            <input type="text" id="name" name="name"/><br/>
            <label for="email">email:</label>
            <input type="text" id="email" name="email"/><br/>
            <label for="password">password:</label>
            <input type="text" id="password" name="password"/><br/>
            <input type="submit" value="Submit"/>
        </form>
    )
}