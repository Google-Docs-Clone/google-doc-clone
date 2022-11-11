export default function Login() {
    return (
        <form action="/users/login" method="post">
            <label for="email">email:</label>
            <input type="text" id="email" name="email"/><br/>
            <label for="password">password:</label>
            <input type="text" id="password" name="password"/><br/>
            <input type="submit" value="Submit"/>
        </form>
    )
}