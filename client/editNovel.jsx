const helper = require('./helper.js');
const Buffer = require('buffer').Buffer;

// Create the novel editor page
const EditNovelWindow = (props) => {
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

    const openModal = (e) => {
        const modalType = e.currentTarget.getAttribute('data-modal-type');

        const textarea = document.getElementById("modal-textarea");
        const modal = document.getElementById("modal");
        const saveButton = document.getElementById("modal-save-button");
        const modalTitle = document.getElementById("modal-title");

        switch (modalType) {
            case "abstract":
                textarea.value = novel.abstract;
                textarea.rows = "15";
                saveButton.removeEventListener("click", updateNovelTitle);
                saveButton.addEventListener("click", updateNovelAbstract);
                modalTitle.innerHTML = "Abstract";
                break;
            case "title":
                textarea.value = novel.title;
                textarea.rows = "1";
                saveButton.removeEventListener("click", updateNovelAbstract);
                saveButton.addEventListener("click", updateNovelTitle);
                modalTitle.innerHTML = "Title";
                break;
        }
        modal.classList.add('is-active');
    };

    const closeModal = () => {
        const modal = document.getElementById("modal");
        modal.classList.remove('is-active');
    };

    const closeAllModals = (e) => {
        (document.querySelectorAll('.modal') || []).forEach((modal) => {
            modal.classList.remove('is-active');
        });
    };

    const updateNovelTitle = (e) => {
        const textarea = document.getElementById("modal-textarea");
        const novelTitle = document.getElementById("novel-title");

        console.log("Update title");

        closeModal();

        const loadingSpan = document.createElement('span');
        loadingSpan.classList = "bulma-loader-mixin";

        novelTitle.appendChild(loadingSpan);

        const syncTitle = (response) => {
            if (response.error) {
                console.log(response.error);
            }

            //console.log(response);

            novel.title = response.updatedNovel.title;

            novelTitle.innerHTML = novel.title;
        };


        helper.sendPost('/editNovel', { novelID: novel._id, title: textarea.value, _csrf: props.csrf }, syncTitle);

    };

    const updateNovelAbstract = (e) => {
        const textarea = document.getElementById("modal-textarea");
        const abstractText = document.getElementById("abstract-text");

        closeModal();

        const loadingSpan = document.createElement('span');
        loadingSpan.classList = "bulma-loader-mixin";

        abstractText.appendChild(loadingSpan);

        const syncAbstract = (response) => {
            if (response.error) {
                console.log(response.error);
            }

            //console.log(response);

            novel.abstract = response.updatedNovel.abstract;

            abstractText.innerHTML = novel.abstract;
        };

        helper.sendPost('/editNovel', { novelID: novel._id, abstract: textarea.value, _csrf: props.csrf }, syncAbstract);
    };

    const viewChapters = () => {
        const chaptersButton = document.getElementById('chapters-button');
        const draftsButton = document.getElementById('drafts-button');
        const chapterTitle = document.getElementById('chapter-title');

        chaptersButton.classList.add('is-link');
        draftsButton.classList.remove('is-link');

        chapterTitle.innerHTML = "Chapters";

        loadChapters(props.chapters);
    };

    const viewDrafts = () => {
        const chaptersButton = document.getElementById('chapters-button');
        const draftsButton = document.getElementById('drafts-button');
        const chapterTitle = document.getElementById('chapter-title');

        chaptersButton.classList.remove('is-link');
        draftsButton.classList.add('is-link');

        chapterTitle.innerHTML = "Drafts";

        loadDrafts(props.chapters);
    };

    return (
        <div>

            <div id="modal" className="modal">
                <div className="modal-background" onClick={closeAllModals}></div>
                <div className="modal-card">
                    <header className="modal-card-head">
                        <p id="modal-title" className="modal-card-title"></p>
                        <button className="delete" aria-label="close" onClick={closeModal}></button>
                    </header>
                    <section className="modal-card-body">
                        <textarea id="modal-textarea" className="textarea has-fixed-size" placeholder="Add a description..." rows="10"></textarea>
                    </section>
                    <footer className="modal-card-foot">
                        <button id='modal-save-button' className="button is-success">Save changes</button>
                        <button className="button" onClick={closeModal}>Cancel</button>
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
                            <a onClick={openModal} data-modal-type="title"><i className="fa-solid fa-pencil"></i></a>
                        </span>
                        <h2 className='subtitle'>By: {novel.author}</h2>
                        <span style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                            <h2 className='subtitle' style={{ margin: 0, paddingRight: '10px' }}>Abstract</h2>
                            <a onClick={openModal} data-modal-type="abstract"><i className="fa-solid fa-pencil"></i></a>
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

                <div>
                    <a id='chapters-button' className='button is-link' onClick={viewChapters}>Chapters</a>
                    <a id='drafts-button' className='button' onClick={viewDrafts} style={{ marginLeft: 10 }}>Drafts</a>
                    <h1 id='chapter-title' className='title'>Chapters</h1>

                    <div id='chapters-div'>
                        <table id='chapters-table' className='table is-hoverable' style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: 0, paddingLeft: 10, width: 50 }}><abbr title="Chapter">Chapter</abbr></th>
                                    <th style={{ padding: 0, width: 100 }}><abbr title="Name">Name</abbr></th>
                                    <th style={{ padding: 0, width: 50 }}><abbr title="Views">Views</abbr></th>
                                    <th style={{ padding: 0, width: 50 }}> <abbr title="Delete">Delete</abbr></th>
                                </tr>
                            </thead>
                            <tbody id='chapters-table-body'>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const loadChapters = async (chapters) => {
    const chaptersTableBody = document.getElementById('chapters-table-body');
    const chaptersTable = document.getElementById('chapters-table');

    chaptersTableBody.innerHTML = "";

    Object.keys(chapters).forEach(chapter => {
        if (chapter.includes("chapter")) {
            const chapterRow = document.createElement('tr');
            const chapterNumber = document.createElement('th');
            const chapterTitle = document.createElement('td');
            const chapterViews = document.createElement('td');
            const chapterDelete = document.createElement('td');

            console.log(`chapter ${chapter}`);
            console.log(chapters);

            chapterRow.style.width = '100%';
            chapterRow.addEventListener('click', () => {
                window.localStorage.setItem('partchment-editorChapterID', chapters[chapter]._id);
                window.location.assign('/editChapter');
            });

            chapterNumber.innerHTML = chapter;
            chapterTitle.innerHTML = chapters[chapter].title;
            chapterViews.innerHTML = chapters[chapter].views;

            const deleteButton = document.createElement('a');
            const deleteIcon = document.createElement('i');
            deleteIcon.classList = "fa-solid fa-x";

            deleteButton.appendChild(deleteIcon);
            chapterDelete.appendChild(deleteButton);

            chapterRow.appendChild(chapterNumber);
            chapterRow.appendChild(chapterTitle);
            chapterRow.appendChild(chapterViews);
            chapterRow.appendChild(chapterDelete);
            chaptersTableBody.appendChild(chapterRow);
        }
    });

    console.log(chaptersTable);

    if (chaptersTable.rows.length - 1 === 0) {
        const chapterRow = document.createElement('tr');
        const chapterNumber = document.createElement('th');
        chapterNumber.innerHTML = 'No published Chapters';

        chapterRow.appendChild(chapterNumber);
        chaptersTableBody.appendChild(chapterRow);
    };
};

const loadDrafts = async (chapters) => {
    const chaptersTableBody = document.getElementById('chapters-table-body');

    chaptersTableBody.innerHTML = "";


    Object.keys(chapters).forEach(chapter => {
        if (chapter.includes("draft")) {
            const chapterRow = document.createElement('tr');
            const chapterNumber = document.createElement('th');
            const chapterTitle = document.createElement('td');
            const chapterViews = document.createElement('td');
            const chapterDelete = document.createElement('td');

            console.log(`chapter ${chapter}`);
            console.log(chapters);

            chapterRow.style.width = '100%';
            chapterRow.addEventListener('click', () => {
                window.localStorage.setItem('partchment-editorChapterID', chapters[chapter]._id);
                window.location.assign('/editChapter');
            });

            chapterNumber.innerHTML = chapter;
            chapterTitle.innerHTML = chapters[chapter].title;
            chapterViews.innerHTML = chapters[chapter].views;

            const deleteButton = document.createElement('a');
            const deleteIcon = document.createElement('i');
            deleteIcon.classList = "fa-solid fa-x";

            deleteButton.appendChild(deleteIcon);
            chapterDelete.appendChild(deleteButton);

            chapterRow.appendChild(chapterNumber);
            chapterRow.appendChild(chapterTitle);
            chapterRow.appendChild(chapterViews);
            chapterRow.appendChild(chapterDelete);
            chaptersTableBody.appendChild(chapterRow);
        }
    });
};

const getChapters = async (novel, _csrf, handler) => {
    console.log(novel);

    const chapterIDs = novel.chapters;
    console.log(chapterIDs);

    const chapters = {};

    Object.keys(chapterIDs).forEach((chapter) => {
        helper.sendPost('/searchChapterByID', { chapterID: chapterIDs[chapter], _csrf }, (response) => {
            console.log('response');
            console.log(response);
            chapters[chapter] = response.chapter;
        });
    });
    handler(chapters);
    return chapters;
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

        await getChapters(novelData.novel, data.csrfToken, (chapters) => {
            ReactDOM.render(<EditNovelWindow csrf={data.csrfToken} novel={novelData.novel} chapters={chapters} />,
                document.getElementById('edit-novel-content')
            );

            loadChapters(chapters);
        });
    });
};

module.exports = {
    init,
}