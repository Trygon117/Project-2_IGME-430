const helper = require('./helper.js');

const MyNovels = (props) => {
    console.log(props);
    return (
        <div>
            <div className="box" style={{ minHeight: '100vh' }}>
                <h1 className="title">My Novels:</h1>
                <hr></hr>
                <div className="columns is-centered">
                    <div id="novel-cards" className="coulumn">

                    </div>
                </div>
            </div>
        </div>
    );
};

const NovelCard = (props) => {
    return (
        <div className="card" style={{ width: 200 }}>
            <div className="card-image">
                <figure className="image is-2by3">
                    <img src="assets/1080x1920" alt="Placeholder image" />
                </figure>
            </div>
            <div className="card-content">

            </div>
        </div>
    );
};

const EmptyCard = (props) => {
    const hoverOnCard = (e) => {
        e.currentTarget.style.width = 250;
    };
    const hoverOffCard = (e) => {
        e.currentTarget.style.width = 200;
    };
    const clickCard = (e) => {
        CreateNovel(props);
    };
    return (
        <div className="card" style={{ width: 200 }} onMouseEnter={hoverOnCard} onMouseLeave={hoverOffCard} onClick={clickCard}>
            <div className="card-image">
                <figure className="image is-2by3">
                    <img src="/assets/img/AddCard.png" alt="Placeholder image" />
                </figure>
            </div>
        </div>
    );
};

// Open the Novel Creation Page
const CreateNovel = (props) => {
    const NewNovel = (props) => {
        const setFileInfo = async (e) => {
            const file = e.currentTarget.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const uploadedImage = reader.result;
                document.querySelector("#coverPreview").src = uploadedImage;
                document.querySelector("#fileName").innerHTML = file.name;
            });
            reader.readAsDataURL(file);
        };

        return (
            <form id="createNovelForm"
                name="createNovelForm"
                onSubmit={handleCreateNovel}
                action="/createNovel"
                method='POST'
                className='mainForm box'
            >
                <div className='title'>
                    <h1>Create A New Novel!</h1>
                </div>

                <div className="field">
                    <label className='label' htmlFor='title'>Title: </label>
                    <div className='control has-icons-left'>
                        <input className='input' id="title" type="text" name='title' placeholder='Title' />
                        <span className="icon is-small is-left">
                            <i className="fa-solid fa-book"></i>
                        </span>
                    </div>
                </div>

                <div className="field">
                    <label className='label'>Book Cover: </label>
                    <div className="">
                        <div className="file is-boxed has-name is-info">
                            <label className="file-label">
                                <input className="file-input" id="cover" type="file" name="cover" onChange={setFileInfo} />
                                <span className="file-cta">
                                    <span className="file-icon">
                                        <i className="fas fa-upload"></i>
                                    </span>
                                    <span className="file-label">
                                        Choose a file…
                                    </span>
                                </span>
                                <span id="fileName" className="file-name">
                                    Use a 2:3 aspect ratio
                                </span>
                            </label>
                        </div>

                        <div className="" style={{ width: 200 }} >
                            <figure className="image is-2by3">
                                <img id="coverPreview" src="/assets/img/1080x1920.png" alt="Placeholder image" />
                            </figure>
                        </div>
                    </div>
                </div>

                <input id='_csrf' type='hidden' name='_csrf' value={props.csrf} />

                <span id="create-novel-error-span" className='has-text-danger'></span>

                <div className='control is-pulled-right'>
                    <input className='formSubmit button is-link' type='submit' value='Create' />
                </div>
            </form >
        );
    }

    ReactDOM.render(<NewNovel csrf={props.csrf} />,
        document.getElementById('create-content')
    );
};

handleCreateNovel = (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const coverUpload = document.getElementById('cover');
    const error = document.getElementById('create-novel-error-span');
    const _csrf = e.target.querySelector('#_csrf').value;

    if (!title) {
        error.innerHTML = "Title is required!";
        return;
    }

    const file = coverUpload.files[0];

    if (!file || file === undefined) {
        error.innerHTML = "Cover is required!";
        return;
    }

    const formData = new FormData(document.querySelector("#createNovelForm"));
    // formData.append("title", title);
    // formData.append("cover", file);
    // formData.append("_csrf", _csrf);

    helper.sendMultipartPost('/createNovel', formData, createdNovel);


    // const reader = new FileReader();
    // reader.addEventListener('load', () => {
    //     const fileData = reader.result;
    //     //console.log(fileData);

    //     const novelData = {
    //         title,
    //         cover: {
    //             name: file.name,
    //             data: fileData,
    //         },
    //         _csrf,
    //     };

    //     console.log(novelData);

    //     helper.sendPost('/createNovel', novelData, createdNovel);
    // });
    // try {
    //     reader.readAsDataURL(file);
    // } catch (err) {
    //     error.innerHTML = "An error occurred!";
    //     return;
    // }
};

const createdNovel = (response) => {
    console.log('got response');
    console.log(response);
};

const init = async (novels = []) => {
    const response = await fetch('/getToken');
    const data = await response.json();

    ReactDOM.render(<MyNovels csrf={data.csrfToken} />,
        document.getElementById('create-content')
    );
    novels.forEach(novel => {
        ReactDOM.render(<NovelCard csrf={data.csrfToken} novel={novel} />,
            document.getElementById('novel-cards')
        );
    });
    ReactDOM.render(<EmptyCard csrf={data.csrfToken} />,
        document.getElementById('novel-cards')
    );
};

module.exports = {
    init,
}