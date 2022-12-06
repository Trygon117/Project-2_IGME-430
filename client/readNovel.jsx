const helper = require('./helper.js');

const ReadNovelWindow = (props) => {
    return (
        <div style={{ marginLeft: '20px', marginRight: '20px', marginTop: '20px' }}>
            <div id='chapter-content' style={{ border: 'solid thick', minHeight: '80vh', padding: '20px', maxWidth: '1000px', margin: 'auto' }}>

            </div>
        </div>
    );
}

const Chapter = (props) => {
    const nextChapter = () => {
        const nextNumber = props.chapterNumber + 1;
        helper.sendPost('/setChapterNumber', { novelID: props.novelID, chapterNumber: nextNumber, _csrf: props.csrf }, (response) => {
            if (response.error === 'There are no more chapters' || response.error === 'You cannot view a chapter with a negative index') {
                console.log(response.error);
            } else if (response.error) {
                console.log(response.error);
            } else {
                loadChapter(props.csrf)
            }
        });
    }
    const previousChapter = () => {
        const nextNumber = props.chapterNumber - 1;
        helper.sendPost('/setChapterNumber', { novelID: props.novelID, chapterNumber: nextNumber, _csrf: props.csrf }, (response) => {
            if (response.error === 'There are no more chapters' || response.error === 'You cannot view a chapter with a negative index') {
                console.log(response.error);
            } else if (response.error) {
                console.log(response.error);
            } else {
                loadChapter(props.csrf)
            }
        });
    }
    return (
        <div style={{ minHeight: '80vh', position: 'relative' }}>
            <h1 className='title is-size-2'>Chapter {props.chapterNumber}: {props.title}</h1>

            <div id='chapter-content-div' style={{ paddingBottom: '80px' }}></div>

            <div id='changeChapter' style={{ display: 'flex', width: '100%', justifyContent: 'center', textAlign: 'center', position: 'absolute', bottom: '10px' }}>
                <span className='previousChapter' onClick={previousChapter}>&#10094;</span>
                <h2 style={{ fontWeight: 'bold' }}>~-~  End Chapter  ~-~</h2>
                <span className='nextChapter' onClick={nextChapter}>&#10095;</span>
            </div>
        </div>
    );
}

const loadChapter = (csrf) => {
    const novelID = localStorage.getItem('partchment-readNovel');
    helper.sendPost('/getChapterNumber', { novelID, _csrf: csrf }, (chapterNumber) => {
        console.log(chapterNumber);
        helper.sendPost('/searchChapterNumber', { novelID, chapterNumber, _csrf: csrf }, (chapterResponse) => {
            console.log(chapterResponse);
            const chapterContent = document.getElementById('chapter-content');
            chapterContent.innerHTML = '';

            const chapterContainer = document.createElement('div');

            ReactDOM.render(<Chapter chapterNumber={chapterNumber} title={chapterResponse.title} novelID={chapterResponse.novelID} csrf={csrf} />,
                chapterContainer);

            chapterContent.appendChild(chapterContainer);

            document.getElementById('chapter-content-div').innerHTML = chapterResponse.content;


        });
    });
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log(data);

    ReactDOM.render(<ReadNovelWindow csrf={data.csrfToken} />,
        document.getElementById('read-novel-content'));

    loadChapter(data.csrfToken);

};

module.exports = {
    init,
}