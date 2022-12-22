const helper = require('./helper.js');

let saveEvent;

const Modal = (props) => {
    return (
        <div id="modal" className="modal" style={{ zIndex: 1001 }}>
            <div className="modal-background" onClick={closeAllModals}></div>
            <div className="modal-card">
                <header className="modal-card-head">
                    <p id="modal-title" className="modal-card-title"></p>
                    <button className="delete" aria-label="close" onClick={closeModal}></button>
                </header>

                <section id='modal-card-body' className="modal-card-body"></section>

                <footer className="modal-card-foot">
                    <button id='modal-save-button' className="button is-success" onClick={closeModal}>Save changes</button>
                    <button className="button" onClick={closeModal}>Cancel</button>
                </footer>
            </div>
        </div>
    );
}

// open the specified modal
const openModal = (data, handler) => {
    console.log('data');
    console.log(data);

    const modalContainer = document.getElementById('modal-container');

    ReactDOM.render(<Modal />,
        modalContainer
    );

    const modalType = data.modalType;

    const modal = document.getElementById("modal");

    // things to alter
    const modalBody = document.getElementById('modal-card-body');

    modalBody.innerHTML = "";

    const saveButton = document.getElementById("modal-save-button");
    saveButton.disabled = false;
    saveButton.innerHTML = 'Save Changes';
    saveButton.className = 'button is-success';

    const modalTitle = document.getElementById("modal-title");

    const bodyContainerDiv = document.createElement('div');

    switch (modalType) {

        case "abstract":
            modalTitle.innerHTML = "Abstract";

            // load the modal Body
            ReactDOM.render(<EditAbstractModalBody value={data.abstract} />,
                bodyContainerDiv
            );

            saveButton.removeEventListener("click", saveEvent);
            const abstractHandle = () => {
                handler({ abstract: document.getElementById('modal-textarea').value });
            }
            saveEvent = abstractHandle;
            saveButton.addEventListener("click", abstractHandle);
            saveButton.innerText = 'Update Abstract';
            break;

        case "title":
            modalTitle.innerHTML = "Title";

            // load the modal Body
            ReactDOM.render(<EditNovelTitleModalBody value={data.title} />,
                bodyContainerDiv
            );

            saveButton.removeEventListener("click", saveEvent);
            const titleHandle = () => {
                handler({ title: document.getElementById('modal-textarea').value });
            }
            saveEvent = titleHandle;
            saveButton.addEventListener("click", titleHandle);
            saveButton.innerText = 'Update Title';
            break;

        case "publishNovel":
            modalTitle.innerText = "Novel Not Published";

            // load the modal Body
            ReactDOM.render(<PublishNovelModalBody value={data.novel} />,
                bodyContainerDiv
            );

            saveButton.style.visibility = 'visible';
            saveButton.innerText = 'Yes';
            saveButton.removeEventListener('click', saveEvent);
            saveEvent = handler;
            saveButton.addEventListener('click', handler);
            saveButton.innerText = 'Publish Novel';
            break;

        case "publishChapter":
            modalTitle.innerHTML = "Publish Chapter";

            // load the modal Body
            ReactDOM.render(<PublishChapterModalBody chapter={data.chapter} _csrf={data.csrf} handler={handler} />,
                bodyContainerDiv
            );

            console.log('info:');
            console.log(data);

            fillPublishModal(data.chapter, data.csrf);

            saveButton.removeEventListener("click", saveEvent);
            const publishChapterHandler = () => {
                console.log('save changes clicked');

                document.getElementById('modal-chapter-div').querySelectorAll('span').forEach(span => {

                    if (span.getAttribute('data-selected') === 'true') {
                        // change this to get the reference chapter id
                        const referenceChapter = span.parentElement.querySelector('#chap-option').querySelector('p').innerText;
                        // this is the selected span
                        if (span.id === 'chap-option') {
                            // replace a chapter
                            helper.publishChapter('replace', { chapter: data.chapter, referenceChapter, _csrf: data.csrf }, (response) => {
                                handler(response);
                            });
                            return;
                        } else if (span.id === 'chap-insert') {
                            // insert the chapter
                            if (span.getAttribute('data-insert') == 'before') {
                                helper.publishChapter('insert-before', { chapter: data.chapter, referenceChapter, _csrf: data.csrf }, (response) => {
                                    handler(response);
                                });
                                return;
                            } else if (span.getAttribute('data-insert') == 'after') {
                                helper.publishChapter('insert-after', { chapter: data.chapter, referenceChapter, _csrf: data.csrf }, (response) => {
                                    handler(response);
                                });
                                return;
                            }
                        }
                    }
                });
            }
            saveEvent = publishChapterHandler;
            saveButton.addEventListener("click", publishChapterHandler);
            saveButton.innerText = 'Publish Chapter';
            break;

        case "deleteChapter":
            modalTitle.innerHTML = "Delete Chapter";

            modalBody.innerText = "Are You Sure you want to delete this chapter?"

            saveButton.removeEventListener("click", saveEvent);
            const deleteHandler = () => {
                saveButton.innerText = 'Save';
                saveButton.className = 'button is-primary';
                handler();
            }
            saveEvent = deleteHandler;
            saveButton.addEventListener("click", deleteHandler);
            saveButton.innerText = 'Delete Chapter';
            saveButton.className = 'button is-danger';
            break;

        case "changePassword":
            modalTitle.innerHTML = "Change Password";

            ReactDOM.render(<ChangePasswordModalForm />,
                bodyContainerDiv
            );

            saveButton.disabled = true;
            saveButton.removeEventListener("click", saveEvent);
            const changePasswordHandler = () => {
                const oldPass = document.getElementById('oldPass');
                const newPass1 = document.getElementById('newPass1');
                const newPass2 = document.getElementById('newPass2');
                handler({ oldPass: oldPass.value, newPass1: newPass1.value, newPass2: newPass2.value });
            }
            saveEvent = changePasswordHandler;
            saveButton.addEventListener("click", changePasswordHandler);
            saveButton.innerText = 'Change Password';
            break;
        default:
            console.log('no specified modal type');
            return;
    }

    modalBody.appendChild(bodyContainerDiv);

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

// gets all of the chapters that exist for this novel and adds them to the modal body
const fillPublishModal = (Chapter, csrf) => {

    helper.sendPost('/searchNovelByID', { novelID: Chapter.novelID, _csrf: csrf }, (response) => {

        console.log('novel response');
        console.log(response);

        const publishedChapters = [];

        Object.keys(response.novel.chapters).forEach(chapter => {
            if (chapter.includes('chapter-')) {
                publishedChapters.push(chapter);
            }
        });

        // where the chapters will be loaded
        const modalChapterDiv = document.getElementById('modal-chapter-div');
        const yesButton = document.getElementById('modal-save-button');

        const ModalChapter = (props) => {
            // Contianer
            const clickContainer = (e) => {
                //console.log('click container');
                //callClickContainer(e.target);
            }

            const callClickContainer = (container) => {
                // console.log('callClickContainer');

                // check if it was previously selected
                let wasSelected = container.getAttribute('data-selected') === 'true';

                // set every other container as not selected
                modalChapterDiv.querySelectorAll('#chap-option-container').forEach(node => {
                    //console.log(node);
                    node.setAttribute('data-selected', 'false');
                });

                let childSelected = false;
                // check to see if any children of this container are selected
                container.childNodes.forEach(node => {
                    if (node.getAttribute('data-selected') === 'true') {
                        childSelected = true;
                    }
                });


                // if it wasn't previously selected or a child is selected
                if (!wasSelected || childSelected) {
                    // set this as selected
                    container.setAttribute('data-selected', 'true');
                }
            }


            const clickInsert = (e) => {
                // console.log('click insert');

                // if this was previously selected
                let wasSelected = e.currentTarget.getAttribute('data-selected') === 'true';

                // set everything else as not selected
                modalChapterDiv.querySelectorAll('#chap-option').forEach(node => {
                    node.setAttribute('data-selected', 'false');
                });
                modalChapterDiv.querySelectorAll('#chap-insert').forEach(node => {
                    node.setAttribute('data-selected', 'false');
                });

                // if it wasn't selected
                if (!wasSelected) {
                    // set this as selected
                    e.currentTarget.setAttribute('data-selected', 'true');
                }

                callClickContainer(e.currentTarget.parentElement);

                UpdateSisterElements(e.currentTarget.parentElement);
            }
            const enter = (e) => {
                // console.log('enter');

                // set as hovered
                e.currentTarget.style.height = '40px';
                e.currentTarget.style.backgroundColor = '#c2f542'; // bright green
                e.currentTarget.querySelector('p').style.fontSize = '20px';
            }
            const leave = (e) => {
                // console.log('leave');

                // if this is selected
                if (e.currentTarget.getAttribute('data-selected') === 'true') {
                    // set as selected
                    e.currentTarget.style.height = '40px';
                    e.currentTarget.style.backgroundColor = '#62c462'; // dark green
                    e.currentTarget.querySelector('p').style.fontSize = '20px';
                } else if (e.target.parentElement.getAttribute('data-selected') === 'true') {
                    // set as container selected
                    e.currentTarget.style.height = '40px';
                    e.currentTarget.style.backgroundColor = '#42cbf5'; // sky blue
                    e.currentTarget.querySelector('p').style.fontSize = '20px';
                } else {
                    // set as unselected
                    e.currentTarget.style.height = '30px';
                    e.currentTarget.style.backgroundColor = '#bbf0de'; // blue-green
                    e.currentTarget.querySelector('p').style.fontSize = '17px';
                }
            }

            const updateElement = (element) => {
                // console.log('update element');

                if (element.getAttribute('data-selected') === 'true') {
                    // set as selected
                    element.style.height = '40px';
                    element.style.backgroundColor = '#62c462'; // dark green
                    element.querySelector('p').style.fontSize = '20px';
                } else if (element.parentElement.getAttribute('data-selected') === 'true') {
                    // set as container selected
                    element.style.height = '40px';
                    element.style.backgroundColor = '#42cbf5'; // sky blue
                    element.querySelector('p').style.fontSize = '20px';
                } else {
                    // set as unselected
                    element.style.height = '30px';
                    element.style.backgroundColor = '#bbf0de'; // blue-green
                    element.querySelector('p').style.fontSize = '17px';
                }
            };

            const clickChap = (e) => {
                // console.log('click chap');

                let wasSelected = e.currentTarget.getAttribute('data-selected') === 'true';

                // set everything as not selected
                modalChapterDiv.querySelectorAll('#chap-option').forEach(node => {
                    //console.log(node);
                    node.setAttribute('data-selected', 'false');
                    node.style.height = '30px';
                    node.style.backgroundColor = '#bbf0de'; // blue -green 
                    node.style.fontSize = '17px';
                });
                // hide all chap inserts
                modalChapterDiv.querySelectorAll('#chap-insert').forEach(node => {
                    node.setAttribute('data-selected', 'false');
                    // hide theses
                    node.style.visibility = 'hidden';
                    node.style.display = 'none';
                });

                // if it wasn't selected before
                if (!wasSelected) {

                    // set this as selected
                    e.currentTarget.setAttribute('data-selected', 'true');

                    const inserts = e.currentTarget.parentElement.querySelectorAll('#chap-insert');

                    // set the cooresponding inserts as visible
                    inserts.forEach(insert => {
                        insert.style.visibility = 'visible';
                        insert.style.display = 'flex';
                    });

                    // set the yes button as selectable
                    yesButton.disabled = false;
                } else {
                    yesButton.disabled = true;
                }

                callClickContainer(e.currentTarget.parentElement);

                UpdateSisterElements(e.currentTarget.parentElement);
            }

            const UpdateSisterElements = (parent) => {
                // console.log('update sister elements');
                parent.querySelectorAll('span').forEach(span => {
                    // console.log(span);
                    updateElement(span);
                });
            }


            return (
                <div id='chap-option-Container' data-selected='false' onClick={clickContainer}>
                    <span id='chap-insert' className='has-text-grey' data-selected='false' data-insert='before' style={{ visibility: 'hidden', display: 'none', height: '30px', gap: '10px', alignItems: 'center', border: 'thin ridge', backgroundColor: '#bbf0de' }} onClick={clickInsert} onMouseEnter={enter} onMouseLeave={leave}>
                        <i className='fa-solid fa-arrow-up' style={{ userSelect: 'none' }} />
                        <p style={{ userSelect: 'none' }}>insert before</p>
                    </span>

                    <span id='chap-option' className='has-text-grey' data-selected='false' style={{ border: 'thin ridge', display: 'flex', alignItems: 'center', gap: '10px', height: '30px', backgroundColor: '#bbf0de' }} onClick={clickChap} onMouseEnter={enter} onMouseLeave={leave}>
                        <i className='fa-solid fa-repeat' style={{ userSelect: 'none' }}></i>
                        <p style={{ fontSize: '17px', userSelect: 'none' }}>{props.chapter}</p>
                    </span>

                    <span id='chap-insert' className='has-text-grey' data-selected='false' data-insert='after' style={{ visibility: 'hidden', display: 'none', height: '30px', gap: '10px', alignItems: 'center', border: 'thin ridge', backgroundColor: '#bbf0de' }} onClick={clickInsert} onMouseEnter={enter} onMouseLeave={leave}>
                        <i className='fa-solid fa-arrow-down' style={{ userSelect: 'none' }} />
                        <p style={{ userSelect: 'none' }}>insert after</p>
                    </span>
                </div>
            );
        }

        for (const chapter of publishedChapters) {

            const thisDiv = document.createElement('div');

            ReactDOM.render(<ModalChapter chapter={chapter} />,
                thisDiv
            );

            modalChapterDiv.appendChild(thisDiv);
        }

        console.log(modalChapterDiv);

        if (modalChapterDiv.innerText === '') {
            const pubChapNoChapters = document.createElement('p');
            pubChapNoChapters.innerText = 'This is the first chapter!';
            modalChapterDiv.appendChild(pubChapNoChapters);
        }
    });
}

const ChangePasswordModalForm = (props) => {

    const checkNewPasswords = () => {
        const saveButton = document.getElementById("modal-save-button");

        const newPass1 = document.getElementById('newPass1');
        const newPass2 = document.getElementById('newPass2');

        const changePassErrorSpan = document.getElementById('change-pass-error-span');

        if (newPass1.value != newPass2.value && newPass2.value !== '') {
            changePassErrorSpan.innerText = 'New Passwords Must Match';
            saveButton.disabled = true;
        } else {
            changePassErrorSpan.innerText = '';
            saveButton.disabled = false;
        }
    }

    return (
        <div>
            <div className='title'>
                <h1>Change Password</h1>
            </div>

            <div className="field">
                <label className='label' htmlFor='oldPass'>Password: </label>
                <div className='control has-icons-left'>
                    <input id='oldPass' className='input' type='password' name='oldPass' placeholder=' Old Password' />
                    <span className="icon is-small is-left">
                        <i className="fa-solid fa-lock"></i>
                    </span>
                </div>
            </div>

            <div className="field">
                <label className='label' htmlFor='newPass1'>New Password: </label>
                <div className='control has-icons-left'>
                    <input id='newPass1' className='input' type='password' name='newPass1' placeholder='Enter New Password' />
                    <span className="icon is-small is-left">
                        <i className="fa-solid fa-lock"></i>
                    </span>
                </div>
            </div >

            <div className="field">
                <label className='label' htmlFor='newPass2'>New Password: </label>
                <div className='control has-icons-left'>
                    <input id='newPass2' className='input' type='password' name='newPass2' placeholder='Retype Password' onInput={checkNewPasswords} />
                    <span className="icon is-small is-left">
                        <i className="fa-solid fa-lock"></i>
                    </span>
                </div>
            </div >

            <span id="change-pass-error-span" className='has-text-danger'></span>

        </div >
    );
}

// the modal body to edit the novel abstract
const EditAbstractModalBody = (props) => {
    return (
        <textarea id="modal-textarea" className="textarea has-fixed-size" placeholder="Add a description..." rows="15" defaultValue={props.value}></textarea>
    )
};

// the modal body to edit the novel title
const EditNovelTitleModalBody = (props) => {
    return (
        <textarea id="modal-textarea" className="textarea has-fixed-size" placeholder="Add a description..." rows="1" defaultValue={props.value}></textarea>
    )
};

const PublishNovelModalBody = (props) => {
    return (
        <div>
            <p>Would you like to publish the novel?</p>
        </div>
    );
};

const NovelNotPublishedModalBody = (props) => {
    return (
        <div>
            <p>This chapter cannot be published because the novel is not published.</p>
            <p>Would you like to publish the novel?</p>
        </div>
    );
};

// the modal body to publish a chapter
const PublishChapterModalBody = (props) => {
    const publishAsLatest = () => {
        console.log('publish as latest');
        console.log(props);
        helper.publishChapter('add-last', { chapterID: props.chapter._id, novelID: props.chapter.novelID, _csrf: props._csrf }, (publishedChapter) => {
            console.log(publishedChapter);
            if (publishedChapter.error === 'Novel Not Published') {
                const bodyContainerDiv = document.createElement('div');
                const modalBody = document.getElementById('modal-card-body');
                modalBody.innerHTML = '';

                ReactDOM.render(<NovelNotPublishedModalBody />,
                    bodyContainerDiv
                );

                modalBody.appendChild(bodyContainerDiv);

                const saveButton = document.getElementById("modal-save-button");
                saveButton.removeEventListener("click", saveEvent);
                const chapterPublishedHandler = () => {
                    helper.publishNovel({ novelID: props.chapter.novelID, _csrf: props._csrf }, (publishedNovel) => {
                        console.log(publishedNovel);

                        if (publishedNovel.error) {
                            console.log(publishedNovel.error);
                            props.handler({ error: 'Couldnt publish novel' });
                        }

                        helper.publishChapter('add-last', { chapterID: props.chapter._id, novelID: props.chapter.novelID, _csrf: props._csrf }, (republishedChapter) => {
                            console.log(republishedChapter);
                            props.handler(republishedChapter);
                        });
                    });
                }
                saveEvent = chapterPublishedHandler;
                saveButton.addEventListener("click", chapterPublishedHandler);
                saveButton.innerText = 'Publish Novel';
            } else if (publishedChapter.error) {
                props.handler({ error: 'Couldnt publish chapter' });
            } else {
                props.handler(publishedChapter);
            }
        });
    }

    return (
        <div>
            <a className='button is-link' onClick={publishAsLatest}>Publish As Latest Chapter</a>
            <p className='subtitle'>Or, Choose where to add it:</p>
            <div id='modal-chapter-div' style={{ border: 'thin ridge', minHeight: '400px', overflowY: 'auto' }}>

            </div>
        </div >
    );
}

module.exports = {
    openModal,
    closeModal,
    closeAllModals,
}