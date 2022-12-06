const helper = require('./helper.js');
const Buffer = require('buffer').Buffer;
const Modal = require('./modal.jsx');

// Create the novel editor page
const EditNovelWindow = (props) => {
    console.log('edit novel window');
    console.log(props);

    let novel = props.novel;
    let published = "False";
    if (novel.published) published = "True";
    // turn the cover data into a displayable image
    const buf = Buffer.from(novel.cover.data, 'base64');
    const b64String = buf.toString('base64');
    const mimeType = novel.coverMime;
    const coverImage = `data:${mimeType};base64,${b64String}`;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    const readableCreatedDate = new Date(novel.createdDate).toLocaleDateString(undefined, dateOptions);

    const createChapter = (e) => {
        helper.sendPost('/createChapter', { novelID: novel._id, _csrf: props.csrf }, (response) => {
            console.log(response);
            window.localStorage.setItem('partchment-editorChapterID', response.createdChapter._id);
            window.location.assign('/editChapter');
        });
    };

    const updateNovelTitle = (e) => {
        const novelTitle = document.getElementById("novel-title");

        console.log("Update title");

        Modal.openModal({ modalType: 'title', title: novel.title }, (modalResponse) => {
            const loadingSpan = document.createElement('span');
            loadingSpan.classList = "bulma-loader-mixin";

            novelTitle.appendChild(loadingSpan);


            helper.sendPost('/editNovel', { novelID: novel._id, title: modalResponse.title, _csrf: props.csrf }, (response) => {
                console.log(response);

                if (response.error) {
                    console.log(response.error);
                }

                // update the local novel data
                novel.title = response.title;

                novelTitle.innerHTML = novel.title;
            });
        });
    };

    const updateNovelAbstract = (e) => {
        const textarea = document.getElementById("modal-textarea");
        const abstractText = document.getElementById("abstract-text");

        Modal.openModal({ modalType: 'abstract', abstract: novel.abstract }, (modalResponse) => {

            const loadingSpan = document.createElement('span');
            loadingSpan.classList = "bulma-loader-mixin";

            abstractText.appendChild(loadingSpan);

            helper.sendPost('/editNovel', { novelID: novel._id, abstract: modalResponse.abstract, _csrf: props.csrf }, (response) => {
                //console.log(response);

                if (response.error) {
                    console.log(response.error);
                }

                // update the local novel data
                novel.abstract = response.abstract;

                abstractText.innerHTML = novel.abstract;
            });
        });
    };

    const viewChapters = () => {
        const chaptersButtonLi = document.getElementById('chapters-button-li');
        const draftsButtonLi = document.getElementById('drafts-button-li');

        chaptersButtonLi.classList.add('is-active');
        draftsButtonLi.classList.remove('is-active');

        loadChapters(props.chapters, props.csrf);
    };

    const viewDrafts = () => {
        const chaptersButtonLi = document.getElementById('chapters-button-li');
        const draftsButtonLi = document.getElementById('drafts-button-li');

        draftsButtonLi.classList.add('is-active');
        chaptersButtonLi.classList.remove('is-active');

        loadDrafts(props.chapters, props.csrf);
    };

    return (
        <div>

            <div id="modal" className="modal">
                <div className="modal-background" onClick={Modal.closeAllModals}></div>
                <div className="modal-card">
                    <header className="modal-card-head">
                        <p id="modal-title" className="modal-card-title"></p>
                        <button className="delete" aria-label="close" onClick={Modal.closeModal}></button>
                    </header>
                    <section id='modal-card-body' className="modal-card-body">

                    </section>
                    <footer className="modal-card-foot">
                        <button id='modal-save-button' className="button is-success" onClick={Modal.closeModal}>Save changes</button>
                        <button className="button" onClick={Modal.closeModal}>Cancel</button>
                    </footer>
                </div>
            </div>

            <div className="box" style={{ minHeight: '80vh', width: '100vw', margin: 'auto', padding: 0 }}>

                <div className='' style={{ height: 65, width: '100vw', margin: 'auto', border: 'thin ridge', display: 'flex', flexFlow: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: '30px' }}>
                    <div className=''>
                        <a className="button is-white" href="/create"><i className="fa-solid fa-arrow-left" style={{ padding: '0 10 0 0' }}></i>Back</a>
                    </div>
                    <div className=''>
                        <button className="button is-link" onClick={createChapter}><i className="fa-solid fa-plus" style={{ padding: '0 10 0 0' }}></i> Create Chapter</button>
                    </div>
                </div>

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
                            <a onClick={updateNovelTitle} data-modal-type="title"><i className="fa-solid fa-pencil"></i></a>
                        </span>
                        <h2 className='subtitle'>By: {novel.author}</h2>
                        <span style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                            <h2 className='subtitle' style={{ margin: 0, paddingRight: '10px' }}>Abstract</h2>
                            <a onClick={updateNovelAbstract} data-modal-type="abstract"><i className="fa-solid fa-pencil"></i></a>
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
                        <li>Published: {published}</li>
                        <li>Publication Date: {novel.published}</li>
                    </ul>
                </div>

                <hr></hr>

                <div style={{ marginLeft: '20px', marginRight: '20px' }}>

                    <div className='tabs is-toggle'>
                        <ul>
                            <li id='chapters-button-li' className='is-active'><a id='chapters-button' onClick={viewChapters}>Chapters</a></li>
                            <li id='drafts-button-li'><a id='drafts-button' onClick={viewDrafts} >Drafts</a></li>
                        </ul>
                    </div>



                    <div id='chapters-heading' className='columns' style={{ width: '100%', cursor: 'hand', display: 'flex', justifyContent: 'space-between', borderBottom: 'thick solid' }}>
                        <span id='chapter-number' className='column has-text-weight-bold' style={{ textAlign: 'center' }}>
                            Chapter
                        </span>
                        <span id='chapter-title' className='column is-three-fifths has-text-weight-bold'>
                            Title
                        </span>
                        <span id='chapter-views' className='column has-text-weight-bold' style={{ textAlign: 'center' }}>
                            Views
                        </span>
                        <span id='chapter-publish' className='column has-text-weight-bold' style={{ textAlign: 'center' }}>
                            Publish
                        </span>
                        <span id='chapter-publish' className='column has-text-weight-bold' style={{ textAlign: 'center' }}>
                            Delete
                        </span>
                    </div>
                    <div id='chapters-div' style={{ width: '100%', display: 'flex', flexFlow: 'column', gap: '20px' }}>

                    </div>
                </div>
            </div>
        </div>
    );
};

const ChapterRow = (props) => {
    // console.log('ChapterRow');
    // console.log(props);

    const openChapter = () => {
        window.localStorage.setItem('partchment-editorChapterID', props.chapters[props.chapter]._id);
        window.location.assign('/editChapter');
    }
    const mouseEnter = () => {
        const row = document.getElementById(`${props.chapter}-row`);
        row.style.backgroundColor = '#bbf0de';
    }
    const mouseLeave = () => {
        const row = document.getElementById(`${props.chapter}-row`);
        row.style.backgroundColor = '#ffffff';
    }
    const publishChapter = () => {
        console.log('publish chapter');
        console.log(props);

        // if it is already published
        if (props.chapters[props.chapter].published) {
            helper.publishChapter('unpublish', { chapter: props.chapters[props.chapter], _csrf: props.csrf }, (response) => {

                // reload the page
                window.location = '/editNovel';

            });

        } else {

            Modal.openModal({ modalType: 'publishChapter', chapter: props.chapters[props.chapter], csrf: props.csrf }, (response) => {
                console.log('modal response');
                console.log(response);
                helper.publishChapter(response.mode, { chapter: response.chapter, referenceChapter: response.referenceChapter, _csrf: props.csrf }, (publishResponse) => {

                    //console.log(publishResponse);
                    // reload the page
                    window.location = '/editNovel';

                });

            });

        }
    }
    const deleteChapter = () => {
        Modal.openModal({ modalType: 'deleteChapter', chapter: props.chapters[props.chapter], csrf: props.csrf }, (response) => {
            helper.sendPost('/deleteChapter', { chapterID: props.chapters[props.chapter]._id, _csrf: props.csrf }, (response) => {
                console.log(response);
            });
        });
    }
    let pButtonIconClass = 'fa-solid fa-check';
    let pButtonClass = 'button is-outline';
    if (props.chapters[props.chapter].published) {
        pButtonIconClass = 'fa-solid fa-minus';
        pButtonClass = 'button is-warning';
    }
    return (
        <div id={`${props.chapter}-row`} className='columns' style={{ width: '100%', cursor: 'hand', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            <span id='chapter-number' className='column' style={{ textAlign: 'center' }} onClick={openChapter}>
                {props.chapter}
            </span>
            <span id='chapter-title' className='column is-three-fifths' onClick={openChapter}>
                {props.chapters[props.chapter].title}
            </span>
            <span id='chapter-views' className='column' style={{ textAlign: 'center' }} onClick={openChapter}>
                {props.chapters[props.chapter].views}
            </span>
            <span id='chapter-publish' className='column' style={{ textAlign: 'center' }}>
                <a id='publish-button' className={pButtonClass} onClick={publishChapter}><i id='publish-icon' className={pButtonIconClass}></i></a>
            </span>
            <span id='chapter-publish' className='column' style={{ textAlign: 'center' }}>
                <a id='delete-button' className='button is-danger' onClick={deleteChapter}><i id='delete-icon' className='fa-solid fa-x'></i></a>
            </span>
        </div>
    )
}

const loadChapters = async (chapters, csrf) => {
    // console.log('load chapters');
    // console.log(csrf);

    const chaptersDiv = document.getElementById('chapters-div');

    chaptersDiv.innerHTML = '';

    Object.keys(chapters).forEach(chapter => {
        if (chapter.includes('chapter')) {

            const divRow = document.createElement('div');

            // load a chapter row
            ReactDOM.render(<ChapterRow chapter={chapter} chapters={chapters} csrf={csrf} />,
                divRow
            );

            chaptersDiv.appendChild(divRow);
        }
    });

    if (chaptersDiv.innerHTML === '') {
        const divRow = document.createElement('div');
        divRow.innerText = 'No Published Chapters';

        chaptersDiv.appendChild(divRow);
    };
};

const loadDrafts = async (chapters, csrf) => {
    // console.log('load drafts');
    // console.log(csrf);
    const chaptersDiv = document.getElementById('chapters-div');

    chaptersDiv.innerHTML = '';

    Object.keys(chapters).forEach(chapter => {
        if (chapter.includes("draft")) {

            const divRow = document.createElement('div');

            // load a chapter row
            ReactDOM.render(<ChapterRow chapter={chapter} chapters={chapters} csrf={csrf} />,
                divRow
            );

            chaptersDiv.appendChild(divRow);

        }
    });

    if (chaptersDiv.innerHTML === '') {
        console.log('empty');
        const divRow = document.createElement('div');
        divRow.innerText = 'No Drafts';

        chaptersDiv.appendChild(divRow);
    };
};

const getChapters = async (novel, _csrf, handler) => {
    console.log('get chapters');
    //console.log(novel);

    if (novel.chapters && Object.keys(novel.chapters).length !== 0) {
        const chapterIDs = novel.chapters;
        console.log('chapterIDs');
        console.log(chapterIDs);

        const chapters = {};

        for (let i = 0; i < Object.keys(chapterIDs).length; i++) {
            const thisChapterID = Object.keys(chapterIDs)[i];
            //console.log('thisChapterID');
            //console.log(thisChapterID);

            await helper.sendPost('/searchChapterByID', { chapterID: chapterIDs[thisChapterID], _csrf }, (response) => {
                //console.log(`${thisChapterID} response`);
                //console.log(response);
                // check if the next index is out of bounds
                chapters[thisChapterID] = response.chapter;
                if (i + 1 >= Object.keys(chapterIDs).length) {
                    handler(chapters);
                    return chapters;
                }
            });
        }

    } else {
        handler({});
    }
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



    helper.sendPost('/searchNovelByID', { novelID, _csrf: data.csrfToken }, async (novelData) => {
        console.log(novelData);
        if (novelData.error === 'No Novel Found') {
            window.location.assign('/create');
        }
        await getChapters(novelData.novel, data.csrfToken, (chapters) => {
            console.log('chapters');
            console.log(chapters);
            ReactDOM.render(<EditNovelWindow csrf={data.csrfToken} novel={novelData.novel} chapters={chapters} />,
                document.getElementById('edit-novel-content')
            );

            loadChapters(chapters, data.csrfToken);
        });
    });
};

module.exports = {
    init,
}