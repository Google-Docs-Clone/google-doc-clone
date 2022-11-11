export default function Logout() {


    return (
        <form action="/users/signout" method="post">
        <input type="submit" value="logout"/>
    </form>
    )
}