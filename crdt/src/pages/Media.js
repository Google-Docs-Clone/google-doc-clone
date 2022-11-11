export default function Media() {

    const handleGetMedia = () => {

    }

    return (
        <>
        <form action="/media/upload" method="post" encType="multipart/form-data">
            <input type='file' name="file"></input>
            <input type="submit"></input>
        </form>

        {/* <form onSubmit={handleGetMedia}>
            <label for="mediaid">mediaid:</label>
            <input type="text" id="mediaid" name="mediaid"/><br/>
            <input type="submit" value="Submit"/>
        </form> */}
        </>
    )
}