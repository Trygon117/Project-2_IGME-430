const helper = require('./helper.js');
const Buffer = require('buffer').Buffer;

const NovelWindow = (props) => {
    const novel = props.novel;

    console.log('novel');
    console.log(novel);

    // turn the cover data into a displayable image
    const buf = Buffer.from(novel.cover.data, 'base64');
    const b64String = buf.toString('base64');
    const mimeType = novel.coverMime;
    const coverImage = `data:${mimeType};base64,${b64String}`;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    const readableCreatedDate = new Date(novel.createdDate).toLocaleDateString(undefined, dateOptions);

    const addToLibrary = async (e) => {

        const novelID = novel._id;
        //e.currentTarget.getAttribute('data-novel-id');

        console.log('added novel');
        console.log(novelID);

        const libraryButton = document.getElementById('library-button');

        if (libraryButton.getAttribute('data-add-remove') == 'add') {
            await helper.sendPost('/addNovelToLibrary', { novelID: novelID, _csrf: props.csrf }, (response) => {
                console.log(response);
                loadButtons(novelID);
            });
        } else {
            await helper.sendPost('/removeNovelFromLibrary', { novelID: novelID, _csrf: props.csrf }, (response) => {
                console.log(response);
                loadButtons(novelID);
            });
        }
    };

    const goBack = () => {
        const location = localStorage.getItem('partchment-viewNovelBack');
        if (location) {
            window.location = location;
        } else {
            window.location = '/';
        }
    }

    const startReading = async (e) => {
        console.log('start reading');
        localStorage.setItem('partchment-readNovel', novel._id);
        window.location = '/readNovel';
    }

    return (
        <div>

            <div className='' style={{ height: 65, width: '100vw', margin: 'auto', border: 'thin ridge', display: 'flex', flexFlow: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: '30px' }}>
                <div className=''>
                    <a className="button is-white" onClick={goBack}><i className="fa-solid fa-arrow-left" style={{ padding: '0 10 0 0' }}></i>Back</a>
                </div>
            </div>

            <div className="box" style={{ width: '100vw', margin: 'auto', padding: 0 }}>
                <div style={{ height: 20 }} />

                <div className='columns' style={{ width: '95vw', margin: 'auto' }}>

                    <div className='column' style={{ maxWidth: '300px', margin: 'auto' }}>
                        <figure className="image is-2by3" >
                            <img id={`${novel.title}-img`} src={coverImage} alt="Placeholder image" />
                        </figure>
                    </div>

                    <div className='column is-three-quarters' style={{ height: '34.35vw', minHeight: "250px", display: 'flex', flexFlow: 'column' }}>

                        <span style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                            <h1 id="novel-title" className="title" style={{ margin: 0, paddingRight: '10px' }}>{novel.title}</h1>
                        </span>

                        <h2 className='subtitle'>By: {novel.author}</h2>

                        <span style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                            <h2 className='subtitle' style={{ margin: 0, paddingRight: '10px' }}>Abstract</h2>
                        </span>

                        <div id="abstract-text" style={{ height: '100%', width: '100%', minHeight: '100px' }}>
                            {novel.abstract}
                        </div>

                    </div>

                </div>

                <div className='box'>
                    <ul>
                        <li>Published Chapters: {novel.publishedChapterCount}</li>
                        <li>Unpublished Chapters: {novel.totalChapterCount - novel.publishedChapterCount}</li>
                        <li>Created Date: {readableCreatedDate}</li>
                        <li>Published: {novel.published.toString()}</li>
                    </ul>
                </div>

                <div style={{ paddingBottom: '20px', display: 'flex', justifyContent: 'space-evenly', position: 'relative' }}>
                    <a id='library-button' className='button is-outline' data-add-remove='add' onClick={addToLibrary}>
                        <span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><i className="fa-solid fa-plus" />add to library</span>
                    </a>
                    <a className='button is-link' data-novel-id={novel._id} onClick={startReading}>
                        <span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><i className="fa-solid fa-book-open-reader" />Start Reading</span>
                    </a>
                </div>


            </div>
        </div>
    );
}

const loadButtons = async (novelID) => {

    libraryReponse = await fetch('/getMyLibrary');
    myLibrary = await libraryReponse.json();

    console.log('myLibrary');
    console.log(myLibrary);

    let novelInLibrary = false;

    // check if the novel is in this array
    for (const id of Object.keys(myLibrary[0])) {
        //console.log(id);
        if (id.toString() === novelID) {
            novelInLibrary = true;
        }
    }

    const libraryButton = document.getElementById('library-button');
    libraryButton.innerHTML = '';

    const buttonSpan = document.createElement('span');
    buttonSpan.style.display = 'flex';
    buttonSpan.style.gap = '10px';
    buttonSpan.style.alignItems = 'center';

    if (novelInLibrary) {
        // set add to library button to remove from library
        const minusIcon = document.createElement('i');
        minusIcon.className = 'fa-solid fa-minus';
        const libraryText = document.createTextNode('remove from library');
        buttonSpan.appendChild(minusIcon);
        buttonSpan.appendChild(libraryText);

        libraryButton.classList.remove('is-outlined');
        libraryButton.classList.add('is-danger');
        libraryButton.setAttribute('data-add-remove', 'remove');

    } else {
        // set button to add to library
        const plusIcon = document.createElement('i');
        plusIcon.className = 'fa-solid fa-plus';
        const libraryText = document.createTextNode('add to library');
        buttonSpan.appendChild(plusIcon);
        buttonSpan.appendChild(libraryText);

        libraryButton.classList.add('is-outlined');
        libraryButton.classList.remove('is-danger');
        libraryButton.setAttribute('data-add-remove', 'add');

    }

    libraryButton.appendChild(buttonSpan);

}


const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log(data);

    novelID = localStorage.getItem('partchment-viewNovelID');

    console.log('novelID');
    console.log(novelID);

    if (!novelID) {
        window.location = '/';
    }

    helper.sendPost('/searchNovelByID', { _csrf: data.csrfToken, novelID }, (response) => {
        //console.log(response);

        ReactDOM.render(<NovelWindow novel={response.novel} csrf={data.csrfToken} />,
            document.getElementById('view-novel-content'));

        loadButtons(novelID);
    });
};

module.exports = {
    init,
}