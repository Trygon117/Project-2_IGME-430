const helper = require('./helper.js');

let updateInterval;

// Create the chapter editor page
const EditChapterWindow = (props) => {
    console.log(props);

    const publishChapter = (e) => {

    };

    const previewChapter = (e) => {

    };

    const updateChapterContent = (e) => {
        const editableDocument = document.getElementById('editable-chapter-content');
        const savedSpan = document.getElementById('saved-span');
        savedSpan.innerHTML = 'Unsaved';
        savedSpan.classList.remove('is-success');
        savedSpan.classList.add('is-warning');

        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }

        updateInterval = setInterval(async () => {
            clearInterval(updateInterval);
            updateInterval = null;

            await helper.sendPost('/editChapter', { chapterID: props.chapter._id, content: editableDocument.innerHTML, _csrf: props.csrf }, (response) => {

                if (response.error) {
                    console.log(reponse.error);

                    savedSpan.innerHTML = 'Error';
                    savedSpan.classList.remove('is-warning');
                    savedSpan.classList.remove('is-success');
                    savedSpan.classList.add('is-error');
                } else {
                    savedSpan.innerHTML = 'Saved';
                    savedSpan.classList.remove('is-warning');
                    savedSpan.classList.remove('is-error');
                    savedSpan.classList.add('is-success');
                }
            });
        }, 1000);
    };

    const updateChapterTitle = async (e) => {
        const chapterTitle = document.getElementById('title-div');

        chapterTitle.spellcheck = false;

        await helper.sendPost('/editChapter', { chapterID: props.chapter._id, title: chapterTitle.innerHTML, _csrf: props.csrf }, (response) => {
            chapterTitle.innerHTML = response.updatedChapter.title;
        });
    };

    // code derrived from:
    // https://stackoverflow.com/questions/63364212/bold-unbold-selected-text-using-window-getselection
    const setBold = async (e) => {
        e.currentTarget.classList.toggle('is-outlined');
        e.currentTarget.classList.toggle('is-dark');

        //const initialContent = document.getElementById('editable-chapter-content').cloneNode(true);

        const selection = await window.getSelection();
        const range = selection.getRangeAt(0);
        const parentString = range.commonAncestorContainer.parentElement.innerText;

        const selectedText = range.extractContents(); // gets a copy of the text and removes it from html (destructive)

        // console.log('selection');
        // console.log(selection);
        console.log('range:');
        console.log(range);

        // console.log('start container');
        // console.log(range.startContainer);

        // console.log('end container');
        // console.log(range.endContainer);

        // console.log('selected text');
        // console.log(selectedText);

        // console.log('html in range');
        // console.log(selectedText.childNodes);

        // console.log('common ancestor');
        // console.log(range.commonAncestorContainer.parentElement);

        // console.log('parentString');
        // console.log(parentString);


        // the common ancestor's element
        const commonElement = range.commonAncestorContainer.parentElement;

        // create an array of nodes in the range that contain tags
        const selectedNodes = [];

        selectedText.childNodes.forEach(node => {
            if (node.tagName) {
                console.log('adding node');
                selectedNodes.push(node);
            }
        });
        console.log('selected Nodes');
        console.log(selectedNodes);

        // if the commonAncestor element is a span
        if (commonElement.tagName === 'SPAN') {
            // if the commonAncestor is already a bold span
            if (commonElement.classList.contains('bold-span')) {
                // there is a selected element (Meaning we are crossin through a span)
                if (selectedNodes.length !== 0) {
                    console.log('In span that is a bold span, and crossing at least one other span');
                    // unbold the text in the span, but make sure that you dont mess up the other span

                    // copy it to be safe
                    const selectNodes = Array.from(selectedText.childNodes);
                    console.log('select nodes');
                    console.log(selectNodes);

                    // add the extracted text back so I can get all of the elements in one array
                    range.insertNode(selectedText);

                    // make a copy so it wont disappear when we delete the parent element
                    const childNodes = Array.from(range.startContainer.childNodes);
                    console.log('child nodes');
                    console.log(childNodes);

                    // delete the parent span
                    commonElement.remove();

                    const firstHalfNodesToAdd = [];

                    const selectNodesToAdd = [];

                    const secondHalfNodesToAdd = [];

                    // iterate through all of the child nodes
                    for (let i = 0; i < childNodes.length; i++) {
                        let goNext = false;

                        // iterate through the selected child nodes
                        for (let k = 0; k < selectNodes.length; k++) {
                            // if the node is a selected node
                            if (childNodes[i].isEqualNode(selectNodes[k])) {
                                selectNodesToAdd.unshift(selectNodes[k]);
                                goNext = true;
                            }
                        }

                        if (goNext) continue;


                        // if the select nodes has any items
                        if (selectNodesToAdd.length === 0) {
                            // add to first half
                            if (childNodes[i].tagName === 'SPAN') {
                                console.log(childNodes[i]);
                                // make a new span node with the correct classes
                                const newSpan = document.createElement('span');
                                newSpan.classList.add(childNodes[i].classList);
                                newSpan.innerText = childNodes[i].innerHTML;
                                firstHalfNodesToAdd.push(newSpan);
                            } else {
                                // make a new unstyalized span
                                const newText = document.createTextNode(childNodes[i].textContent);
                                firstHalfNodesToAdd.push(newText);
                            }
                        } else {
                            // add to second half
                            if (childNodes[i].tagName === 'SPAN') {
                                console.log(childNodes[i]);
                                // make a new span node with the correct classes
                                const newSpan = document.createElement('span');
                                newSpan.classList.add(childNodes[i].classList);
                                newSpan.innerText = childNodes[i].innerHTML;
                                secondHalfNodesToAdd.push(newSpan);
                            } else {
                                // make a new unstyalized span
                                const newText = document.createTextNode(childNodes[i].textContent);
                                secondHalfNodesToAdd.push(newText);
                            }
                        }
                    }

                    const firstHalfSpan = document.createElement('span');
                    firstHalfSpan.classList.add('bold-span');
                    firstHalfNodesToAdd.forEach(node => {
                        firstHalfSpan.appendChild(node);
                    });



                    const secondHalfSpan = document.createElement('span');
                    secondHalfSpan.classList.add('bold-span');
                    secondHalfNodesToAdd.forEach(node => {
                        secondHalfSpan.appendChild(node);
                    });



                    range.insertNode(secondHalfSpan);

                    selectNodesToAdd.forEach(node => {
                        console.log('inserting node!');
                        console.log(node);
                        range.insertNode(node);
                    });

                    range.insertNode(firstHalfSpan);


                } else {
                    console.log('In span that is a bold span, and not crossing another span');
                    // unbold the text in the span, but make sure that the rest of the text in the span stays bold

                    // get and delete the bold span
                    const commonElementHalves = parentString.split(selectedText.textContent);
                    console.log(commonElementHalves);

                    commonElement.remove();
                    // make a new bold span with the first half of the span's content
                    const firstHalf = document.createElement('span');
                    firstHalf.classList.add('bold-span');
                    firstHalf.innerText = commonElementHalves[0];

                    console.log(firstHalf.innerText);

                    // make a text node with the unbolded text
                    const newText = document.createTextNode(selectedText.textContent);  // create a new text node 

                    console.log(selectedText.textContent);

                    // make another new bold span with the second half of the span's content
                    const secondHalf = document.createElement('span');
                    secondHalf.classList.add('bold-span');
                    secondHalf.innerText = commonElementHalves[1];

                    console.log(secondHalf.innerText);


                    range.insertNode(secondHalf);                                          // replace the destroyed text with this new span
                    range.insertNode(newText);                                          // replace the destroyed text with this new span
                    range.insertNode(firstHalf);                                          // replace the destroyed text with this new span

                }

            } else {
                // there is a selected element (Meaning we are crossin through a span)
                if (selectedNodes.length !== 0) {
                    console.log('In span, but not in bold span, and crossing at least 1 other span');
                    // make new spans to keep the other spans over the text it is attatched to

                    const nodesToAdd = [];

                    selectedText.childNodes.forEach(node => {
                        let newNode;
                        // make a new node
                        if (node.tagName === 'SPAN') {
                            // make a new span node with the correct class
                            const newSpan = document.createElement('span');
                            newSpan.classList.add(node.classList);
                            newSpan.innerText = node.innerHTML;
                            newNode = newSpan;
                        } else {
                            // make a new unstyalized span
                            const newSpan = document.createElement('span');
                            newSpan.innerText = node.textContent;
                            newNode = newSpan;
                        }

                        nodesToAdd.unshift(newNode);
                    });

                    nodesToAdd.forEach(node => {
                        node.classList.add('bold-span');
                        range.insertNode(node);
                    });

                } else {
                    console.log('In span, but not in bold span, and not crossing another span');
                    // add a bold span inside of the parent span
                    const newSpan = document.createElement('span'); // create a new span
                    newSpan.classList = 'bold-span';                // make the span a bold span
                    newSpan.innerText = selectedText.textContent;   // set the inner text of the new span- this removes the <span> tags 
                    range.insertNode(newSpan);                      // replace the destroyed text with this new span
                }
            }

        } else {

            // there is a selected element (Meaning we are crossin through a span)
            if (selectedNodes.length !== 0) {
                console.log('parent is not span, but crossing through span');
                // unbold the text but make sure that all the other spans remain consistent


            } else {
                console.log('parent is not span, and not crossing another span');
                // make the text bold
                const newSpan = document.createElement('span'); // create a new span
                newSpan.classList = 'bold-span';                // make the span a bold span
                newSpan.innerText = selectedText.textContent;   // set the inner text of the new span- this removes the <span> tags 
                range.insertNode(newSpan);                      // replace the destroyed text with this new span
            }
        }

        console.log(document.getElementById('editable-chapter-content'));

    };

    const setItalic = (e) => {
        e.currentTarget.classList.toggle('is-outlined');
        e.currentTarget.classList.toggle('is-dark');

        const selection = window.getSelection();

        const range = selection.getRangeAt(0);

        let selectedParent = range.commonAncestorContainer.parentElement;

        let mainParent = selectedParent;
        // if this text is all already bold
        if (selectedParent.classList.contains("italic-span")) {
            var text = document.createTextNode(selectedParent.textContent);
            mainParent = selectedParent.parentElement;
            mainParent.insertBefore(text, selectedParent);
            mainParent.removeChild(selectedParent);
            mainParent.normalize();
        }
        else {
            // there is hidden html in the selected text
            if (selectedParent.innerHTML !== selectedParent.innerText) {

            }
            const span = document.createElement("span");
            span.classList.toggle("italic-span");
            // take out the contents, and add it to the span
            span.appendChild(range.extractContents());
            //selection.surroundContents(span);
            // add in the add the new span back
            range.insertNode(span);
            mainParent.normalize();
        }

        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.range) {  // IE?
            document.range.empty();
        }
    };

    const setUnderline = (e) => {
        e.currentTarget.classList.toggle('is-outlined');
        e.currentTarget.classList.toggle('is-dark');

        const selection = window.getSelection();

        const range = selection.getRangeAt(0);

        let selectedParent = range.commonAncestorContainer.parentElement;

        let mainParent = selectedParent;
        // if this text is all already bold
        if (selectedParent.classList.contains("underline-span")) {
            var text = document.createTextNode(selectedParent.textContent);
            mainParent = selectedParent.parentElement;
            mainParent.insertBefore(text, selectedParent);
            mainParent.removeChild(selectedParent);
            mainParent.normalize();
        }
        else {
            // there is hidden html in the selected text
            if (selectedParent.innerHTML !== selectedParent.innerText) {

            }
            const span = document.createElement("span");
            span.classList.toggle("underline-span");
            // take out the contents, and add it to the span
            span.appendChild(range.extractContents());
            //selection.surroundContents(span);
            // add in the add the new span back
            range.insertNode(span);
            mainParent.normalize();
        }

        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.range) {  // IE?
            document.range.empty();
        }
    };

    const setFont = (e) => {
        const dropText = document.getElementById('font-drop-text');
        dropText.innerHTML = e.currentTarget.innerHTML;
        dropText.style.fontFamily = e.currentTarget.getAttribute('data-font');
    };

    const increaseTextSize = (e) => {
        const textInput = document.getElementById('text-size');
        let newVal = parseInt(textInput.value) + 1;
        if (newVal <= 0) {
            newVal = 1;
        } else if (newVal >= 200) {
            newVal = 200;
        }
        textInput.value = newVal;
    };

    const decreaseTextSize = (e) => {
        const textInput = document.getElementById('text-size');
        let newVal = parseInt(textInput.value) - 1;
        if (newVal <= 0) {
            newVal = 1;
        } else if (newVal >= 200) {
            newVal = 200;
        }
        textInput.value = newVal;
    };

    const updateTextSize = (e) => {
        const textInput = document.getElementById('text-size');
        let newVal = parseInt(textInput.value);
        if (newVal <= 0) {
            newVal = 1;
        } else if (newVal >= 200) {
            newVal = 200;
        }
        textInput.value = newVal;
    };

    const setLeftAlign = (e) => {
        const leftAlignButton = document.getElementById('left-align-button');
        const centerAlignButton = document.getElementById('center-align-button');
        const rightAlignButton = document.getElementById('right-align-button');

        leftAlignButton.classList.add('is-dark');
        leftAlignButton.classList.remove('is-outlined');

        centerAlignButton.classList.remove('is-dark');
        centerAlignButton.classList.add('is-outlined');

        rightAlignButton.classList.remove('is-dark');
        rightAlignButton.classList.add('is-outlined');
    }

    const setCenterAlign = (e) => {
        const leftAlignButton = document.getElementById('left-align-button');
        const centerAlignButton = document.getElementById('center-align-button');
        const rightAlignButton = document.getElementById('right-align-button');

        leftAlignButton.classList.remove('is-dark');
        leftAlignButton.classList.add('is-outlined');

        centerAlignButton.classList.add('is-dark');
        centerAlignButton.classList.remove('is-outlined');

        rightAlignButton.classList.remove('is-dark');
        rightAlignButton.classList.add('is-outlined');
    }

    const setRightAlign = (e) => {
        const leftAlignButton = document.getElementById('left-align-button');
        const centerAlignButton = document.getElementById('center-align-button');
        const rightAlignButton = document.getElementById('right-align-button');

        leftAlignButton.classList.remove('is-dark');
        leftAlignButton.classList.add('is-outlined');

        centerAlignButton.classList.remove('is-dark');
        centerAlignButton.classList.add('is-outlined');

        rightAlignButton.classList.add('is-dark');
        rightAlignButton.classList.remove('is-outlined');
    }

    return (
        <div>

            <div id='editor-head' style={{ position: 'sticky', top: '0px', backgroundColor: 'white', border: 'thin ridge', zIndex: 1000 }}>
                <div style={{ height: 65, width: '100vw', display: 'flex', flexFlow: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: '30px' }}>
                    <div>
                        <a className="button is-white" href="/editNovel"><i className="fa-solid fa-arrow-left" style={{ padding: '0 10 0 0' }}></i>Back</a>
                    </div>
                    <div style={{ display: 'flex', flexFlow: 'row', gap: 10 }}>
                        <a className="button is-link" onClick={previewChapter}><i className="fa-solid fa-eye" style={{ padding: '0 10 0 0' }}></i>Preview</a>
                        <a className="button is-primary" onClick={publishChapter}><i className="fa-solid fa-check" style={{ padding: '0 10 0 0' }}></i>Publish</a>

                    </div>
                </div>

                <div id='editor-controls' style={{ height: 40, width: '100vw', display: 'flex', flexFlow: 'row', justifyContent: 'center', gap: '15px', margin: '0px 10px 10px 10px' }}>

                    <span style={{ textAlign: 'center' }}>
                        <a className='button is-outlined' onClick={setBold}><i className="fa-solid fa-bold" ></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a className='button is-outlined' onClick={setItalic}><i className="fa-solid fa-italic"></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a className='button is-outlined' onClick={setUnderline}><i className="fa-solid fa-underline"></i></a>
                    </span>

                    <span className='dropdown' onClick={(e) => { e.currentTarget.classList.toggle('is-active') }}>
                        <div className="dropdown-trigger">
                            <button className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                                <span id='font-drop-text' style={{ width: '120px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>Selected Font</span>
                                <span className="icon is-small">
                                    <i className="fas fa-angle-down" aria-hidden="true"></i>
                                </span>
                            </button>
                        </div>
                        <div className='dropdown-menu' id='dropdown-menu' role={'menu'}>
                            <div className="dropdown-content">
                                <a className="dropdown-item" style={{ fontFamily: 'Georgia' }} data-font='Georgia' onClick={setFont}>
                                    Georgia
                                </a>
                                <a className="dropdown-item" style={{ fontFamily: 'Times New Roman' }} data-font='Times New Roman' onClick={setFont}>
                                    Times New Roman
                                </a>
                            </div>
                        </div>
                    </span>

                    <span style={{ display: 'flex', border: 'ridge thin' }}>
                        <a className='button is-white' onClick={decreaseTextSize} style={{ height: '38px' }}><i className="fa-solid fa-minus" /></a>
                        <input id="text-size" className='input' type="number" name="text-size" defaultValue='20' min="0" max="200" onBlur={updateTextSize} style={{ width: '70px', height: '38px' }} />
                        <a className='button is-white' onClick={increaseTextSize} style={{ height: '38px' }}><i className="fa-solid fa-plus" /></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a id='left-align-button' className='button is-dark' onClick={setLeftAlign}><i className="fa-solid fa-align-left"></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a id='center-align-button' className='button is-outlined' onClick={setCenterAlign}><i className="fa-solid fa-align-center"></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a id='right-align-button' className='button is-outlined' onClick={setRightAlign}><i className="fa-solid fa-align-right"></i></a>
                    </span>

                </div>
            </div>

            <div style={{ display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', minHeight: '900px', marginBottom: '50px' }}>

                <div style={{ width: '720px', margin: 0 }}>
                    <div id='title-div' className='title' contentEditable='true' style={{ marginTop: 20, marginBottom: 20, outline: '0px solid transparent' }} onSelect={(e) => { e.currentTarget.spellcheck = true }} onBlur={updateChapterTitle}></div>
                </div>

                <div id='textDiv' style={{ position: 'relative', display: 'block', width: '720px', minHeight: '900px', paddingBottom: '5px', borderWidth: 'thick', border: 'solid' }}>
                    <span id="saved-span" className='tag is-success' style={{ position: 'absolute', bottom: '5px', right: '10px' }}>Saved</span>
                    <div id='editable-chapter-content' name='textArea' contentEditable='true' style={{ padding: '3%', outline: '0px solid transparent', width: '100%', height: '100%' }} onInput={updateChapterContent}></div>
                </div>

            </div>

        </div>
    );
}

const loadChapterInfo = (chapter) => {
    const chapterTitle = document.getElementById('title-div');
    chapterTitle.innerHTML = chapter.title;

    const chapterContent = document.getElementById('editable-chapter-content');
    chapterContent.innerHTML = chapter.content;
};

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
        loadChapterInfo(chapterData.chapter);
    });
};

module.exports = {
    init,
}