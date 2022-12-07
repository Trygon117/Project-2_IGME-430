const helper = require('./helper.js');
const Buffer = require('buffer').Buffer;

const LibraryWindow = (props) => {
    return (
        <div id='shelves'>

        </div>
    );
}

const NovelCard = (props) => {
    novel = props.novel;
    console.log('novel');
    console.log(novel);

    // turn the cover data into a displayable image
    const buf = Buffer.from(props.novel.cover, 'base64');
    const b64String = buf.toString('base64');
    const mimeType = props.novel.coverMime;
    const coverImage = `data:${mimeType};base64,${b64String}`;

    const leftOffset = 150 * (props.n);
    console.log(leftOffset);

    const hoverOnCard = (e) => {
        const cardTitle = document.getElementById(`${props.novel.title}-title`);
        cardTitle.classList.add('is-size-4');
        cardTitle.classList.remove('is-size-5');
        e.currentTarget.style.width = 200;

        const novelCards = document.querySelectorAll('.novel-card');

        for (const card of novelCards) {
            if (card.getAttribute('data-card-number') > props.n) {
                card.style.left = (card.getAttribute('data-card-number') * 150) + 50;
            }
        }
    };
    const hoverOffCard = (e) => {
        const cardTitle = document.getElementById(`${props.novel.title}-title`);
        cardTitle.classList.add('is-size-5');
        cardTitle.classList.remove('is-size-4');
        e.currentTarget.style.width = 150;

        const novelCards = document.querySelectorAll('.novel-card');

        for (const card of novelCards) {
            if (card.getAttribute('data-card-number') > props.n) {
                card.style.left = (card.getAttribute('data-card-number') * 150);
            }
        }
    };
    const clickCard = (e) => {
        console.log(`Card clicked: ${e.currentTarget}`);
        //console.log(props);

        const novelID = e.currentTarget.getAttribute('data-card-id');

        localStorage.setItem('partchment-viewNovelID', novelID);
        localStorage.setItem('partchment-viewNovelBack', '/library');
        window.location.assign('/viewNovel');
    };

    return (
        <div className='novel-card' data-card-number={props.n} data-card-id={props.novel._id} style={{ width: 150, position: 'absolute', bottom: '0px', left: `${leftOffset}px` }} onMouseEnter={hoverOnCard} onMouseLeave={hoverOffCard} onClick={clickCard}>
            <div className="card" >
                <div className="card-image">
                    <figure className="image is-2by3">
                        <img id={`${props.novel.title}-img`} src={coverImage} alt="Placeholder image" />
                    </figure>
                </div>
            </div>
            <h1 id={`${props.novel.title}-title`} className='is-size-5 has-text-left has-text-grey-dark' style={{ overflow: "hidden", textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.novel.title}</h1>
            <h2 className='is-size-6 has-text-left has-text-grey'>{novel.author}</h2>
        </div>
    );
}

const loadShelf = (shelf) => {
    const shelves = document.getElementById('shelves');

    const newShelfTitle = document.createElement('h1');
    newShelfTitle.innerText = shelf.title;
    newShelfTitle.className = 'title';
    newShelfTitle.style.paddingBottom = "0px";
    newShelfTitle.style.marginBottom = "0px";

    const newShelf = document.createElement('div');
    newShelf.style.display = 'flex';
    newShelf.style.flexFlow = 'no-wrap';
    newShelf.style.gap = '10px';
    newShelf.style.overflowX = 'auto';

    newShelf.style.paddingLeft = '10px';
    newShelf.style.paddingRight = '10px';
    newShelf.style.paddingTop = '5px';
    newShelf.style.paddingBottom = '20px'

    newShelf.style.borderBottom = 'thick solid'

    newShelf.style.position = 'relative';
    newShelf.style.height = '400px';

    let i = 0;

    for (const novel of Object.values(shelf)) {
        if (novel._id) {
            const novelCardContainer = document.createElement('div');
            novelCardContainer.style.position = 'relative';

            ReactDOM.render(<NovelCard novel={novel} n={i} />,
                novelCardContainer
            );

            newShelf.appendChild(novelCardContainer);

            i++;
        }
    }

    shelves.appendChild(newShelfTitle);
    shelves.appendChild(newShelf);
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    libraryReponse = await fetch('/getMyLibrary');
    myLibrary = await libraryReponse.json();

    console.log(myLibrary);

    ReactDOM.render(<LibraryWindow csrf={data.csrfToken} />,
        document.getElementById('library-content')
    );

    for (const shelf of myLibrary) {
        loadShelf(shelf);
    }

};

module.exports = {
    init,
}