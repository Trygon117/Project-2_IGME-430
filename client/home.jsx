const helper = require('./helper.js');
const Buffer = require('buffer').Buffer;

const HomeWindow = (props) => {

    // the current slide
    let slideIndex = 1;

    const plusSlides = () => {
        showSlides(slideIndex += 1);
    }

    const minusSlides = () => {
        showSlides(slideIndex -= 1);
    }

    const setCurrentSlide = (n) => {
        showSlides(slideIndex = n);
    }

    const showSlides = (n) => {
        let slides = document.getElementsByClassName("slide");

        if (slideIndex.length < 1) {
            return;
        }

        if (slides.length < n) {
            slideIndex = 1;
        }
        if (n < 1) {
            slideIndex = slides.length;
        }
        // set the slides to be hidden
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = 'none';
        }
        // set this slide to be visible
        slides[slideIndex - 1].style.display = 'block';
    }

    return (
        <div style={{ minHeight: '90vh', width: '90vw', margin: 'auto', marginTop: '20px' }}>
            <div className='columns' style={{ minHeight: '340px' }}>

                <div className="column" style={{ maxWidth: '1200px', margin: 'auto' }}>
                    <h1 className="title" style={{ marginLeft: '10vw' }}>Featured Novels</h1>
                    <div id='featured-carousel' style={{ position: 'relative' }}>
                        <div id='carousel-cards'>

                        </div>
                        {/* <!-- Next and previous buttons --> */}
                        <a className="prev" onClick={plusSlides}>&#10094;</a>
                        <a className="next" onClick={minusSlides}>&#10095;</a>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: 'auto' }}>
                <h1 className="title">Novels</h1>
                <div id='novel-cards-container'></div>
            </div>

        </div >
    );
}

const NovelCard = (props) => {
    const novel = props.novel;

    console.log('props');
    console.log(props);

    // turn the cover data into a displayable image
    const buf = Buffer.from(novel.cover.data, 'base64');
    const b64String = buf.toString('base64');
    const mimeType = novel.coverMime;
    const coverImageSrc = `data:${mimeType};base64,${b64String}`;

    const addToLibrary = async (e) => {
        loggedInAsResponse = await fetch('/getLoggedInAs');
        myAccount = await loggedInAsResponse.json();

        const novelID = e.target.getAttribute('data-novel-id');

        console.log('myAccount');
        console.log(myAccount);

        console.log('added novel');
        console.log(novelID);

        await helper.sendPost('/addNovelToLibrary', { userID: Object.values(myAccount)[0]._id, novelID: novelID, _csrf: props.csrf }, (response) => {
            console.log(response);
        });
    };

    return (
        <div id={`${novel.title.replace(/ /g, '_')}-card`} className="columns" style={{ height: 'calc(80vw * .333)', border: 'thin ridge', margin: 'auto', marginBottom: '20px', maxWidth: '1000px', maxHeight: '290px' }}>

            <div id='cover-image-div' className='column is-one-fifth'>
                <figure className='image is-2by3'>
                    <img src={coverImageSrc} />
                </figure>
            </div>

            <div className='column is-four-fifths'>
                <a><h1 className='title'>{novel.title}</h1></a>
                <h2 className='subtitle'>By {novel.author}</h2>
                <p style={{ overflow: 'hidden', textOverflow: 'auto', height: 'calc((80vw * .333) - 150px)' }}>"{novel.abstract}"</p>
            </div>

            <div style={{ position: 'relative' }}>
                <a className='button' data-novel-id={novel._id} style={{ position: 'absolute', bottom: '10px', right: '10px' }} onClick={addToLibrary}>
                    <span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <i className="fa-solid fa-plus" />
                        add to library
                    </span>
                </a>
            </div>
        </div>
    );
}

const loadNovelCards = (novels, csrf) => {
    console.log('novels');
    console.log(novels);

    // load all of the novels
    for (const novel of novels) {
        // create a novel card and add it to the container
        //console.log(novel);

        const cardContainer = document.createElement('div');
        document.getElementById('novel-cards-container').appendChild(cardContainer);

        ReactDOM.render(<NovelCard csrf={csrf} novel={novel} />,
            cardContainer
        );

        const addedCard = document.getElementById(`${novel.title.replace(/ /g, '_')}-card`);
        addedCard.onmouseenter = () => {
            addedCard.style.backgroundColor = '#bbf0de';
        }
        addedCard.onmouseleave = () => {
            addedCard.style.backgroundColor = '#ffffff';
        }
        addedCard.onclick = () => {
            localStorage.setItem('partchment-viewNovelID', novel._id);
            localStorage.setItem('partchment-viewNovelBack', '/home');
            window.location.assign('/viewNovel');
        }
    }
}

const FeaturedCard = (props) => {
    const novel = props.novel;

    // turn the cover data into a displayable image
    const buf = Buffer.from(novel.cover.data, 'base64');
    const b64String = buf.toString('base64');
    const mimeType = novel.coverMime;
    const coverImageSrc = `data:${mimeType};base64,${b64String}`;

    const addToLibrary = async (e) => {
        loggedInAsResponse = await fetch('/getLoggedInAs');
        myAccount = await loggedInAsResponse.json();

        const novelID = e.target.getAttribute('data-novel-id');

        console.log('myAccount');
        console.log(myAccount);

        console.log('added novel');
        console.log(novelID);

        await helper.sendPost('/addNovelToLibrary', { userID: Object.values(myAccount)[0]._id, novelID: novelID, _csrf: props.csrf }, (response) => {
            console.log(response);
        });
    };

    return (
        <div id={`${novel.title.replace(/ /g, '_')}-featured-card`} className="columns" style={{ height: 'calc(70vw * .315)', border: 'thin ridge', margin: 'auto', maxWidth: '1200px', maxHeight: '290px' }}>

            <div id='cover-image-div' className='column'>
                <figure className='image is-2by3'>
                    <img src={coverImageSrc} />
                </figure>
            </div>

            <div className='column is-four-fifths' style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
                <a><h1 className='title'>{novel.title}</h1></a>
                <h2 className='subtitle'>By {novel.author}</h2>
                <p style={{ display: 'flex', overflow: 'hidden', textOverflow: 'ellipsis', height: 'calc((70vw * .315) - 150px)' }}>"{novel.abstract}"</p>
            </div>

            <div style={{ position: 'relative' }}>
                <a className='button' data-novel-id={novel._id} style={{ position: 'absolute', bottom: '10px', right: '10px' }} onClick={addToLibrary}>
                    <span style={{ gap: '10px', alignItems: 'center' }}>
                        <i className="fa-solid fa-plus" />
                        add to library
                    </span>
                </a>
            </div>
        </div>
    );
}

const loadFeaturedNovelCards = (novels, csrf) => {
    console.log('featured novels');
    console.log(novels);

    // load all of the novels
    for (let i = 0; i < Object.keys(novels).length; i++) {
        // create a novel card and add it to the carousel
        const novel = Object.values(novels)[i];

        console.log('featured novel');
        console.log(novel);

        const cardContainer = document.createElement('div');
        cardContainer.className = `item-${i + 1} slide`;
        if (i === 0) {
            cardContainer.style.display = 'block';
        } else {
            cardContainer.style.display = 'none';
        }


        document.getElementById('carousel-cards').appendChild(cardContainer);

        ReactDOM.render(<FeaturedCard csrf={csrf} novel={novel} />,
            cardContainer
        );

        const addedCard = document.getElementById(`${novel.title.replace(/ /g, '_')}-featured-card`);
        addedCard.onmouseenter = () => {
            addedCard.style.backgroundColor = '#bbf0de';
        }
        addedCard.onmouseleave = () => {
            addedCard.style.backgroundColor = '#ffffff';
        }
        addedCard.onclick = () => {
            localStorage.setItem('partchment-viewNovelID', novel._id);
            localStorage.setItem('partchment-viewNovelBack', '/home');
            window.location.assign('/viewNovel');
        }
    }
}



const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log(data);

    console.log('here');

    ReactDOM.render(<HomeWindow csrf={data.csrfToken} />,
        document.getElementById('home-content')
    );

    console.log('im here');

    const allNovelsResponse = await fetch('/getAllNovels', { method: 'GET', });

    const allNovels = await allNovelsResponse.json();

    // the featured novels
    const featuredNovels = allNovels;

    console.log('allNovels');
    console.log(allNovels);

    loadNovelCards(allNovels, data.csrfToken);


    loadFeaturedNovelCards(featuredNovels, data.csrfToken);

    console.log(document.getElementById('home-content'));

};

module.exports = {
    init,
}