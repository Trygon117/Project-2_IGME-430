const helper = require('./helper.js');
const Buffer = require('buffer').Buffer;

// Create the novel editor page
const EditNovelWindow = (props) => {
    console.log(props);
    // turn the cover data into a displayable image
    const buf = Buffer.from(props.novel.cover.data, 'base64');
    const b64String = buf.toString('base64');
    const mimeType = props.novel.coverMime;
    const coverImage = `data:${mimeType};base64,${b64String}`;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    const readableCreatedDate = new Date(props.novel.createdDate).toLocaleDateString(undefined, dateOptions);

    return (
        <div>
            <div style={{ height: 20 }} />

            <div className='columns' style={{ height: 65, width: '100vw', border: 'thin ridge' }}>
                <div className='column is-offset-0'>
                    <a className="button is-white" href="/create"><i className="fa-solid fa-arrow-left" style={{ padding: '0 10 0 0' }}></i>Back</a>
                </div>
                <div className='column is-offset-8'>
                    <button className="button is-link"><i className="fa-solid fa-plus" style={{ padding: '0 10 0 0' }}></i> Create Chapter</button>
                </div>
            </div>

            <div style={{ height: 10 }} />

            <div className="box" style={{ minHeight: '80vh', width: '90vw', margin: 'auto' }}>
                <div className='columns'>
                    <div className='column'>
                        <figure className="image is-2by3" >
                            <img id={`${props.novel.title}-img`} src={coverImage} alt="Placeholder image" />
                        </figure>
                    </div>
                    <div className='column is-three-quarters'>
                        <h1 className="title">{props.novel.title}</h1>
                        <ul>
                            <li>By: {props.novel.author}</li>
                            <li>Description: </li>
                            <li>Chapters: {props.novel.chapters}</li>
                            <li>Created Date: {readableCreatedDate}</li>
                            <li>Published: {props.novel.published}</li>
                            <li>Publication Date: {props.novel.published}</li>
                        </ul>
                    </div>
                </div>

                <hr></hr>

                <div>
                    <h1>Chapters</h1>
                </div>

            </div>
        </div>
    );
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log('init editNovel');
    console.log(data);

    const novelID = localStorage.getItem('partchment-editorNovelID');
    //console.log(novelID);
    if (!novelID) {
        console.log('No Novel Selected');
        window.location.assign('/create');
        return;
    }

    helper.sendPost('/searchNovelByID', { novelID, _csrf: data.csrfToken }, (novelData) => {
        console.log(novelData);

        ReactDOM.render(<EditNovelWindow csrf={data.csrfToken} novel={novelData.novel} />,
            document.getElementById('edit-novel-content')
        );
    });
};

module.exports = {
    init,
}