const helper = require('./helper.js');
const Buffer = require('buffer').Buffer;

// Create the chapter editor page
const EditChapterWindow = (props) => {
    console.log(props);

    const publishChapter = (e) => {

    };

    return (
        <div>

            <div className='' style={{ height: 65, width: '100vw', margin: 'auto', border: 'thin ridge', display: 'flex', flexFlow: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: '30px' }}>
                <div className=''>
                    <a className="button is-white" href="/editNovel"><i className="fa-solid fa-arrow-left" style={{ padding: '0 10 0 0' }}></i>Back</a>
                </div>
                <div className=''>
                    <a className="button is-primary" onClick={publishChapter}><i className="fa-solid fa-check" style={{ padding: '0 10 0 0' }}></i>Publish</a>
                </div>
            </div>

            <div style={{ height: 20 }} />

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <textarea name='textArea' rows={15} cols={100} style={{ padding: '3%', borderColor: '#957dad', borderWidth: 'thick' }}></textarea>
            </div>
        </div>
    );
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log('init editChapter');
    console.log(data);

    const chapterID = localStorage.getItem('partchment-editorChapterID');
    //console.log(novelID);
    if (!chapterID) {
        console.log('No Chapter Selected');
        window.location.assign('/create');
        return;
    }

    helper.sendPost('/searchChapterByID', { chapterID, _csrf: data.csrfToken }, (chapterData) => {
        ReactDOM.render(<EditChapterWindow csrf={data.csrfToken} chapter={chapterData.chapter} />,
            document.getElementById('edit-chapter-content')
        );
    });
};

module.exports = {
    init,
}