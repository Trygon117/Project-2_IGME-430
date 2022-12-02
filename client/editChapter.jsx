//If I ever get around to fixing this use this resource
//https://javascript.info/selection-range#range


const helper = require('./helper.js');

let updateInterval;
let initialLoad = true;

// Create the chapter editor page
const EditChapterWindow = (props) => {
    console.log(props);

    let ctrlDown = false;

    const publishChapter = (e) => {
        console.log('publish!');
        helper.sendPost('/publishChapter', { chapterID: props.chapter._id, novelID: props.chapter.novelID, published: true, _csrf: props.csrf }, (response) => {
            console.log(response);
            if (response.error === 'novel not published') {
                // ask user if they want to publish the novel
            } else {
                // the chapter was published

            }
        });
    };

    const previewChapter = (e) => {
        console.log('preview!');
    };

    // overide keyboard shortcuts
    const interceptKeyDown = (e) => {
        //e.preventDefault();
        //console.log(`${e.key} down`);

        switch (e.key) {
            case 'Control':
                ctrlDown = true;
                break;
            case 'b':
                if (ctrlDown) {
                    e.preventDefault();
                    // bold text
                    console.log('bold');
                    setBold();
                }
                break;
            case 'i':
                if (ctrlDown) {
                    e.preventDefault();
                    // itallicize text
                    setItalic();
                }
                break;
            case 'u':
                if (ctrlDown) {
                    e.preventDefault();
                    // underline text
                    setUnderline();
                }
                break;
            default:
                break;
        }
    };

    const interceptKeyUp = (e) => {
        //e.preventDefault();
        //console.log(`${e.key} up`);

        switch (e.key) {
            case 'Control':
                ctrlDown = false;
                break;
            default:
                //updateChapterContent();
                break;
        }
    }

    const updateChapterContent = (e) => {
        if (initialLoad) return;

        console.log('updating...');

        const editableDocument = document.getElementById('editable-chapter-content');
        const savedSpan = document.getElementById('saved-span');
        savedSpan.innerHTML = 'Unsaved';
        savedSpan.classList.remove('is-success');
        savedSpan.classList.add('is-warning');

        // if this is the first thing being typed, then we need to add the correct styling
        if (editableDocument.innerText.length <= 1) {
            const fontDrop = document.getElementById('font-drop-text');
            const textSizeInput = document.getElementById('text-size');

            const defaultSpan = document.createElement('span');
            defaultSpan.classList.add(`${fontDrop.getAttribute('data-font')}-font-span`);
            defaultSpan.classList.add(`font-size-${textSizeInput.value}-span`);
            // defaultSpan.className = 'default-font-span font-size-default-span';
            defaultSpan.innerText = editableDocument.innerText;
            editableDocument.innerHTML = "";
            editableDocument.appendChild(defaultSpan);

            // set the typing position to the end of the div
            const range = document.createRange();
            const selection = window.getSelection();

            range.setStart(defaultSpan, editableDocument.innerText.length);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
        }

        // clear all invisible characters
        //editableDocument.innerText = editableDocument.innerText.replace('&#8203', '');

        const checkAllChildren = (thisNode) => {
            if (thisNode.hasChildNodes()) {
                thisNode.childNodes.forEach(node => {
                    checkAllChildren(node);
                });
            } else {
                if (thisNode.textContent) {
                    // if it contains a no-space element
                    if (thisNode.textContent.indexOf('\u200B') != -1 ? true : false) {
                        // if this is the node we are currently in

                        // check where we clicked and set the button classes to set wether they should be activated
                        const selection = window.getSelection();

                        // make sure that something is selected
                        if (selection.rangeCount <= 0) {
                            // if nothing is selected then just replace it
                            thisNode.textContent = thisNode.textContent.replace('\u200B', '');
                            return;
                        }

                        // console.log(selection);
                        const range = selection.getRangeAt(0);

                        let rangePosition;
                        // is just a point
                        if (range.startOffset === range.endOffset) {
                            rangePosition = range.startOffset;
                        }

                        const commonAncestor = range.commonAncestorContainer;

                        // the common ancestor element
                        let commonElement = commonAncestor.parentElement;

                        // delete the node
                        thisNode.textContent = thisNode.textContent.replace('\u200B', '');

                        // if the selection's parent element is the same as the node's parent element
                        if (commonElement.isEqualNode(thisNode.parentElement)) {

                            // set the typing position to the where it previously was
                            const newRange = document.createRange();
                            const selection = window.getSelection();

                            if (rangePosition && rangePosition > 0) {
                                newRange.setStart(thisNode, rangePosition - 1);
                            } else {
                                newRange.setStart(thisNode, thisNode.textContent.length);
                            }

                            newRange.collapse(true);

                            selection.removeAllRanges();
                            selection.addRange(newRange);
                        }
                    }
                }
            }
        }

        checkAllChildren(editableDocument);

        //console.log(editableDocument);

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

    const clickChapterContent = (e) => {
        //console.log('clicked');
        // check where we clicked and set the button classes to set wether they should be activated
        const selection = window.getSelection();

        // make sure that something is selected
        if (selection.rangeCount <= 0) {
            return false;
        }
        // console.log(selection);
        const range = selection.getRangeAt(0);

        //console.log(range);

        //console.log(range.startOffset);
        //console.log(range.endOffset);

        // let rangePosition;
        // // is just a point
        // if (range.startOffset === range.endOffset) {
        //     rangePosition = range.startOffset;
        // }

        const commonAncestor = range.commonAncestorContainer;

        // the common ancestor element
        let commonElement = commonAncestor.parentElement;
        //console.log(commonElement);

        // make sure that this function isn't called on any elements other than ones it is intended to
        if (!helper.isDescendent(document.getElementById('textDiv'), commonElement) && !commonElement.isEqualNode(document.getElementById('textDiv'))) {
            return false;
        } else if (commonElement.isEqualNode(document.getElementById('saved-span'))) {
            return false;
        }

        const selectedContents = range.cloneContents();

        //const extractContents = range.extractContents();

        //console.log(extractContents.childNodes.length);

        // if we haven't actually selected anything
        if (selectedContents.childNodes.length === 0) {
            const boldButton = document.getElementById('bold-button');
            const italicButton = document.getElementById('italic-button');
            const underlineButton = document.getElementById('underline-button');

            // update the style buttons depending on the style
            if (commonElement.classList.contains('bold-span')) {
                boldButton.classList.remove('is-outlined');
                boldButton.classList.add('is-dark');
            } else {
                boldButton.classList.add('is-outlined');
                boldButton.classList.remove('is-dark');
            }
            if (commonElement.classList.contains('italic-span')) {
                italicButton.classList.remove('is-outlined');
                italicButton.classList.add('is-dark');
            } else {
                italicButton.classList.add('is-outlined');
                italicButton.classList.remove('is-dark');
            }
            if (commonElement.classList.contains('underline-span')) {
                underlineButton.classList.remove('is-outlined');
                underlineButton.classList.add('is-dark');
            } else {
                underlineButton.classList.add('is-outlined');
                underlineButton.classList.remove('is-dark');
            }


        }
    };

    const updateChapterTitle = async (e) => {
        const chapterTitle = document.getElementById('title-div');

        chapterTitle.spellcheck = false;

        await helper.sendPost('/editChapter', { chapterID: props.chapter._id, title: chapterTitle.innerHTML, _csrf: props.csrf }, (response) => {
            chapterTitle.innerHTML = response.updatedChapter.title;
        });
    };

    const setBold = async () => {

        if (setInlineSpanClass('bold-span')) {
            console.log('updating');
            updateChapterContent();
        }
    };

    const setItalic = () => {

        if (setInlineSpanClass('italic-span')) {
            updateChapterContent();
        }
    };

    const setUnderline = () => {

        if (setInlineSpanClass('underline-span')) {
            updateChapterContent();
        }
    };

    const setFont = (e) => {
        const dropText = document.getElementById('font-drop-text');
        dropText.innerHTML = e.currentTarget.innerHTML;
        dropText.className = `${e.currentTarget.getAttribute('data-font')}-font-span`;
        dropText.setAttribute('data-font', e.currentTarget.getAttribute('data-font'));
    };

    const increaseTextSize = (e) => {
        const textInput = document.getElementById('text-size');
        let newVal = parseInt(textInput.value) + 1;
        if (newVal <= 0) {
            newVal = 1;
        } else if (newVal >= 100) {
            newVal = 100;
        }
        textInput.value = newVal;
    };

    const decreaseTextSize = (e) => {
        const textInput = document.getElementById('text-size');
        let newVal = parseInt(textInput.value) - 1;
        if (newVal <= 0) {
            newVal = 1;
        } else if (newVal >= 100) {
            newVal = 100;
        }
        textInput.value = newVal;
    };

    const updateTextSize = (e) => {
        const textInput = document.getElementById('text-size');
        let newVal = parseInt(textInput.value);
        if (newVal <= 0) {
            newVal = 1;
        } else if (newVal >= 100) {
            newVal = 100;
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

    const setInlineSpanClass = (spanClass) => {
        // console.log('starting styling');
        // console.log(document.getElementById('editable-chapter-content').cloneNode(true));
        const selection = window.getSelection();

        // make sure that something is selected
        if (selection.rangeCount <= 0) {
            return false;
        }

        // console.log(selection);
        const range = selection.getRangeAt(0);

        // console.log('range');
        // console.log(range);

        const commonAncestor = range.commonAncestorContainer;

        // the common ancestor element
        let commonElement = commonAncestor.parentElement;
        let clonedCommonElement = commonElement.cloneNode(true);

        // console.log('commonElement');
        // console.log(commonElement.cloneNode(true));
        // console.log(commonElement);

        // make sure that this function isn't called on any elements other than ones it is intended to
        if (!helper.isDescendent(document.getElementById('textDiv'), commonElement) && !commonElement.isEqualNode(document.getElementById('textDiv'))) {
            return false;
        } else if (commonElement.isEqualNode(document.getElementById('saved-span'))) {
            return false;
        }

        let parentSpanClass = commonElement.classList;
        // console.log('parentSpanClass');
        // console.log(parentSpanClass);

        // gets a copy of the selected text and removes it from html (destructive)
        const extractedContent = range.extractContents();
        // console.log('extractedContent');
        // console.log(extractedContent.cloneNode(true));
        // console.log(extractedContent.cloneNode(true).childNodes);

        // if we didnt select anything
        if (extractedContent.childNodes.length === 0) {
            console.log('no children');
            // if the common element has the spanClass
            if (commonElement.classList.contains(spanClass)) {
                // do nothing
            } else {
                // insert a spanClass span that we are currently typing in
                const newSpan = document.createElement('span');
                newSpan.className = spanClass;

                // add an invisible character because there is a glitch where you cant 
                //set the carrot to the inside of an empty element
                newSpan.innerHTML = '&#8203';

                console.log(newSpan);

                range.insertNode(newSpan);

                // set the typing position to the end of the newSpan
                const newRange = document.createRange();

                newRange.setStart(newSpan, 1);
                newRange.collapse(true);

                selection.removeAllRanges();
                selection.addRange(newRange);

                return;
            }
        }

        // copy an array of the nodes that we selected
        const selectNodes = Array.from(extractedContent.childNodes);
        // console.log('selectNodes');
        // console.log(selectNodes);

        // add the extracted text back so we can get an array with everything in it (including the selected nodes)
        range.insertNode(extractedContent);

        let childNodes;
        let parentIsSpan = false;

        // figure out what we need to remove
        if (commonElement.tagName === 'SPAN') {
            parentIsSpan = true;

            // copy an array of all the values in the document (includes what we extracted)
            childNodes = Array.from(commonElement.childNodes);

            // delete the parent element
            commonElement.remove();
        } else {

            commonElement = document.getElementById('editable-chapter-content');
            clonedCommonElement = commonElement.cloneNode(true);

            // copy an array of all the nodes in the parent element (includes what we extracted)
            childNodes = Array.from(commonElement.childNodes);

            // delete the contents of the parent element
            commonElement.innerHTML = "";
        }

        // console.log('childNodes');
        // console.log(childNodes);

        // Array of nodes to insert at the end
        const nodesToAdd = [];

        // sort the nodes into an object of arrays
        const sortedNodes = sortNodes(childNodes, selectNodes);

        // console.log('sortedNodes');
        // console.log(sortedNodes);

        // add the first node
        sortedNodes.firstNodesToAdd.forEach(node => {
            let thisNode = node;

            if (parentIsSpan) {
                // add spanClass
                if (node.nodeType === 3) { // is textNode
                    thisNode = document.createElement('span');
                    thisNode.classList = parentSpanClass;
                    thisNode.innerText = node.textContent;
                } else if (node.tagName === 'SPAN') {
                    parentSpanClass.forEach(parentSpan => {
                        thisNode.classList.add(parentSpan);
                    })
                } else {
                    console.log('firstNodeToAdd had unhandled nodeType');
                }
            }

            nodesToAdd.unshift(thisNode);
        });

        // check if every child of the parent element had the spanClass
        let allChildrenHaveSpanClass = false;

        // console.log('common child nodes');
        // console.log(commonElement.cloneNode(true).childNodes);

        // console.log('cloned common child nodes');
        // console.log(clonedCommonElement.childNodes);

        for (const child of clonedCommonElement.childNodes) {
            console.log(child);
            if (child.nodeType === 1) { // is an element
                if (child.classList.contains(spanClass)) {
                    allChildrenHaveSpanClass = true;
                } else {
                    allChildrenHaveSpanClass = false;
                    break;
                }
            } else { // if it isn't an element then it can't have the span class
                allChildrenHaveSpanClass = false;
                break;
            }
        }

        // add the selected nodes
        sortedNodes.selectNodesToAdd.forEach(node => {
            let thisNode = node;

            // if the parent element has the spanClass, or if all of the children of the parent element do
            if (clonedCommonElement.classList.contains(spanClass) || allChildrenHaveSpanClass) {
                // remove it, but maintain other classes
                if (node.nodeType === 3) { // is textNode
                    thisNode = document.createElement('span');
                    thisNode.classList = parentSpanClass;
                    thisNode.classList.remove(spanClass);
                    thisNode.innerHTML = node.textContent;
                } else if (node.tagName === 'SPAN') {
                    thisNode.classList.remove(spanClass);
                }
            } else {
                // add the spanClass
                if (node.nodeType === 3) { // is textNode
                    thisNode = document.createElement('span');
                    thisNode.classList = parentSpanClass;
                    thisNode.classList.add(spanClass);
                    thisNode.innerHTML = node.textContent;
                } else if (node.tagName === 'SPAN') {
                    thisNode.classList.add(spanClass);
                }
            }

            nodesToAdd.unshift(thisNode);
        });


        // add the last node
        sortedNodes.lastNodesToAdd.forEach(node => {
            let thisNode = node;

            if (parentIsSpan) {
                // add spanClass
                if (node.nodeType === 3) { // is textNode
                    thisNode = document.createElement('span');
                    thisNode.classList = parentSpanClass;
                    thisNode.innerText = node.textContent;
                } else if (node.tagName === 'SPAN') {
                    parentSpanClass.forEach(parentSpan => {
                        thisNode.classList.add(parentSpan);
                    })
                } else {
                    console.log('lastNodeToAdd had unhandled nodeType');
                }
            }

            nodesToAdd.unshift(thisNode);
        });

        // make it so that nothing is highlighted after
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
                window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
                window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }

        let thisDoc = document.getElementById('editable-chapter-content');

        // insert all the nodes that need to be inserted
        nodesToAdd.forEach(node => {
            range.insertNode(node);
        });

        const currentSpans = thisDoc.querySelectorAll('span');
        let removeSpans = [];

        // get all empty spans
        currentSpans.forEach(span => {
            if (span.innerText === '') {
                removeSpans.push(span);
            }
        });

        // remove all empty spans
        removeSpans.forEach(span => {
            span.remove();
        });

        //  combine spans that are the same and next to eachother
        const cleanedSpans = cleanUpSpans(thisDoc);
        thisDoc.before(cleanedSpans);
        thisDoc.remove();
        thisDoc = document.getElementById('editable-chapter-content');

        // combine text nodes that are next to eachother
        const cleanedTextNodes = cleanUpTextNodes(thisDoc);
        thisDoc.before(cleanedTextNodes);
        thisDoc.remove();
        thisDoc = document.getElementById('editable-chapter-content');

        console.log(thisDoc);
        console.log(thisDoc.cloneNode(true));

        // add the event listeners back
        addEditableContainerEventListeners(thisDoc);

        // console.log('finished styling');
        // console.log(document.getElementById('editable-chapter-content').cloneNode(true));

        return true;
    };

    // helper function to sort nodes
    const sortNodes = (childNodes, selectNodes) => {
        // we need to sort the nodes to add them back in the right order
        const firstNodesToAdd = [];
        const selectNodesToAdd = [];
        const lastNodesToAdd = [];

        childNodes.forEach(childNode => {
            let isSelectedNode = false;

            // iterate through the selected nodes and check if the current child node is a selected node
            selectNodes.forEach(selectNode => {
                // if the node is a selected node sort it
                if (childNode.isEqualNode(selectNode)) {
                    selectNodesToAdd.push(selectNode);
                    //console.log('select node: ');
                    //console.log(selectNode);
                    isSelectedNode = true;
                }
            });

            // if the current node isn't a selected node
            if (!isSelectedNode) {

                // if we have already sorted a selected node
                if (selectNodesToAdd.length === 0) {

                    // add to first half
                    firstNodesToAdd.push(childNode);

                } else { // haven't sorted a selected node

                    // add to second half
                    lastNodesToAdd.push(childNode);
                }
            }
        });

        return { firstNodesToAdd, selectNodesToAdd, lastNodesToAdd }
    }

    // helper function to combine spans that are next to eachother
    const cleanUpSpans = (doc) => {
        let newDoc = doc.cloneNode(true);

        for (const span of newDoc.querySelectorAll('span')) {
            if (span.nextElementSibling === span.nextSibling && span.nextSibling !== null) {
                // the span has an element to its right

                if (span.nextSibling.tagName === 'SPAN') {
                    // the element is a span

                    // if the span doesn't have a class then delete it
                    if (span.classList.length === 0) {
                        const newTextNode = document.createTextNode(span.innerText);
                        span.before(newTextNode);
                        span.remove();

                        newDoc = cleanUpSpans(newDoc);
                        break;
                    }

                    // if the class name is the same as the element next to it, then combine them
                    if (span.className === span.nextSibling.className) {
                        //combine these spans
                        let newSpan = document.createElement('span');
                        newSpan.classList = span.classList;
                        newSpan.innerText = span.innerText + span.nextSibling.innerText;

                        span.before(newSpan);
                        span.nextElementSibling.remove();
                        span.remove();

                        newDoc = cleanUpSpans(newDoc);
                        break;
                    }
                }
            }
        }

        return newDoc;
    };

    const cleanUpTextNodes = (doc) => {
        let newDoc = doc.cloneNode(true);

        for (const node of newDoc.childNodes) {
            if (node.nodeType == 3 && node.nextSibling && node.nextSibling.nodeType === 3) {
                // this node is a textNode, and the next node is a textNode

                //combine these nodes
                let newTextNode = document.createTextNode(node.textContent + node.nextSibling.textContent);

                node.before(newTextNode);
                node.nextSibling.remove();
                node.remove();

                newDoc = cleanUpSpans(newDoc);
                break;
            }
        }

        return newDoc
    }

    const addEditableContainerEventListeners = (doc) => {
        doc.addEventListener('input', updateChapterContent);
        doc.addEventListener('click', clickChapterContent);
        doc.addEventListener('keyDown', interceptKeyDown);
        doc.addEventListener('keyUp', interceptKeyUp);
    };

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
                        <a id='bold-button' className='button is-outlined' onClick={setBold}><i className="fa-solid fa-bold" ></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a id='italic-button' className='button is-outlined' onClick={setItalic}><i className="fa-solid fa-italic"></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a id='underline-button' className='button is-outlined' onClick={setUnderline}><i className="fa-solid fa-underline"></i></a>
                    </span>

                    <span className='dropdown' onClick={(e) => { e.currentTarget.classList.toggle('is-active') }}>
                        <div className="dropdown-trigger">
                            <button className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                                <span id='font-drop-text' className='georgia-font-span' data-font='georgia' style={{ width: '120px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>Georgia</span>
                                <span className="icon is-small">
                                    <i className="fas fa-angle-down" aria-hidden="true"></i>
                                </span>
                            </button>
                        </div>
                        <div id='dropdown-menu' className='dropdown-menu' role={'menu'}>
                            <div className="dropdown-content">
                                <a className="dropdown-item georgia-font-span" data-font='georgia' onClick={setFont}>
                                    Georgia
                                </a>
                                <a className="dropdown-item times-new-roman-font-span" data-font='times-new-roman' onClick={setFont}>
                                    Times New Roman
                                </a>
                                <a className="dropdown-item arial-font-span" data-font='arial' onClick={setFont}>
                                    Arial
                                </a>
                            </div>
                        </div>
                    </span>

                    <span style={{ display: 'flex', border: 'ridge thin' }}>
                        <a className='button is-white' onClick={decreaseTextSize} style={{ height: '38px' }}><i className="fa-solid fa-minus" /></a>
                        <input id="text-size" className='input' type="number" name="text-size" defaultValue='20' min="0" max="100" onBlur={updateTextSize} style={{ width: '70px', height: '38px' }} />
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

            <div id="text-root" style={{ display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', minHeight: '900px', marginBottom: '50px' }}>

                <div id="title-div-container" style={{ width: '720px', margin: 0 }}>
                    <div id='title-div' className='title' contentEditable='true' style={{ marginTop: 20, marginBottom: 20, outline: '0px solid transparent' }} onSelect={(e) => { e.currentTarget.spellcheck = true }} onBlur={updateChapterTitle}></div>
                </div>

                <div id='textDiv' style={{ position: 'relative', display: 'block', width: '720px', minHeight: '900px', paddingBottom: '5px', borderWidth: 'thick', border: 'solid' }}>
                    <span id="saved-span" className='tag is-success' style={{ position: 'absolute', bottom: '5px', right: '10px' }}>Saved</span>
                    <div id='editable-chapter-content' name='textArea' contentEditable='true' style={{ padding: '3%', outline: '0px solid transparent', width: '100%', height: '100%' }} onInput={updateChapterContent} onClick={clickChapterContent} onKeyDown={interceptKeyDown} onKeyUp={interceptKeyUp}></div>
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

    initialLoad = false;
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