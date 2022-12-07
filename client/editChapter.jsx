//If I ever get around to fixing this use this resource
//https://javascript.info/selection-range#range
const helper = require('./helper.js');

let updateInterval;
let initialLoad = true;
let modalYesListener;

// Create the chapter editor page
const EditChapterWindow = (props) => {
    console.log('props');
    console.log(props);

    let Chapter = props.chapter;
    let ctrlDown = false;

    const publishChapter = async (e) => {
        const publish = document.getElementById('publish-button').innerText === 'Publish';

        const updatePublishButton = () => {
            const publishButton = document.getElementById('publish-button');
            const publishIcon = document.getElementById('publish-icon');
            const publishText = document.createTextNode('Publish');

            publishButton.innerHTML = '';

            console.log('Chapter');
            console.log(Chapter);
            if (!Chapter.published) {
                publishText.textContent = 'Publish';

                publishButton.classList.remove('is-danger');
                publishButton.classList.add('is-primary');

                publishIcon.className = "fa-solid fa-check";
            } else {
                publishText.textContent = 'Unpublish';

                publishButton.classList.add('is-danger');
                publishButton.classList.remove('is-primary');

                publishIcon.className = "fa-solid fa-x";
            }
            publishButton.appendChild(publishIcon);
            publishButton.appendChild(publishText);
        }

        // check if we want to unpublish the chapter
        if (!publish) {
            const body = {
                chapterID: Chapter._id,
                novelID: Chapter.novelID,
                chapter: Chapter.chapter,
                mode: 'unpublish',
                _csrf: props.csrf
            };
            await helper.sendPost('/publishChapter', body, (unPubResponse) => {
                console.log('unPubResponse');
                console.log(unPubResponse);
                Chapter = unPubResponse.chapter;
                console.log(props);
                updatePublishButton();
            });
            return;
        }

        openModal('publish chapter', (chapterLocation) => {
            console.log(Chapter);
            const body = {
                chapterID: Chapter._id,
                novelID: Chapter.novelID,
                chapter: Chapter.chapter,
                chapterNumber: chapterLocation.chapterNumber,
                mode: chapterLocation.mode,
                referenceChapter: chapterLocation.chapter,
                _csrf: props.csrf
            };
            helper.sendPost('/publishChapter', body, (pubChapterResponse) => {

                console.log('pubChapterResponse');
                console.log(pubChapterResponse);


                if (pubChapterResponse.error === 'novel not published') {
                    // ask user if they want to publish the novel
                    openModal('publish novel', () => {
                        console.log('publish novel');
                        helper.sendPost('/publishNovel', { novelID: Chapter.novelID, published: true, _csrf: props.csrf }, (pubNovelResponse) => {
                            console.log(pubNovelResponse);
                            if (pubNovelResponse.error) {
                                console.log('Could not publish the novel');
                            } else {
                                publishChapter(e);
                            }
                        });
                    });
                } else if (pubChapterResponse.error) {
                    console.log('error publishing');
                    const modal = document.getElementById("modal");
                    modal.classList.remove('is-active');
                } else {
                    console.log('published!');
                    const modal = document.getElementById("modal");
                    modal.classList.remove('is-active');
                    Chapter = pubChapterResponse.chapter;
                    console.log(props);
                    updatePublishButton();
                }
            });
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
            //const fontDrop = document.getElementById('font-drop-text');
            //const textSizeInput = document.getElementById('text-size');

            const defaultSpan = document.createElement('span');
            defaultSpan.classList.add(`georgia-font-span`);
            defaultSpan.classList.add(`font-size-20-span`);
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
            console.log('update content');
            clearInterval(updateInterval);
            updateInterval = null;

            console.log(Chapter);

            await helper.sendPost('/editChapter', { chapterID: Chapter._id, content: editableDocument.innerHTML, _csrf: props.csrf }, (response) => {

                if (response.error) {
                    console.log(response.error);

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
        console.log('update chap title');
        const chapterTitle = document.getElementById('title-div');

        chapterTitle.spellcheck = false;

        console.log(Chapter);

        await helper.sendPost('/editChapter', { chapterID: Chapter._id, title: chapterTitle.innerHTML, _csrf: props.csrf }, (response) => {
            console.log('response');
            console.log(response);
            chapterTitle.innerHTML = response.title;
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
        const newSpanClass = `${e.currentTarget.getAttribute('data-font')}-font-span`;

        const dropText = document.getElementById('font-drop-text');
        dropText.innerHTML = e.currentTarget.innerHTML;
        dropText.className = `${e.currentTarget.getAttribute('data-font')}-font-span`;
        dropText.setAttribute('data-font', e.currentTarget.getAttribute('data-font'));

        console.log('font span class');
        console.log(newSpanClass);

        // if (setInlineSpanClass(newSpanClass)) {
        //     updateChapterContent();
        // }
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

    const openModal = (modalType, handler) => {

        const modalTextArea = document.getElementById("modal-text-area");
        const modal = document.getElementById("modal");
        const yesButton = document.getElementById("modal-yes-button");
        const cancelButton = document.getElementById("modal-cancel-button");
        const modalTitle = document.getElementById("modal-title");

        yesButton.disabled = false;

        switch (modalType) {
            case "publish novel":
                modalTextArea.innerHTML = '';

                const publishNovelExplanation = document.createElement('p');
                const publishNovelQuery = document.createElement('p');

                publishNovelExplanation.innerText = 'This chapter cannot be published because the novel is not published.';
                publishNovelQuery.innerText = 'Would you like to publish the novel ? ';

                modalTextArea.appendChild(publishNovelExplanation);
                modalTextArea.appendChild(publishNovelQuery);

                yesButton.style.visibility = 'visible';
                yesButton.innerText = 'Yes';
                yesButton.removeEventListener('click', modalYesListener);
                modalYesListener = handler;
                yesButton.addEventListener('click', handler);

                cancelButton.innerText = 'Cancel';
                modalTitle.innerText = "Novel Not Published";

                modal.classList.add('is-active');
                break;
            case 'publish chapter':
                // return chapter number and what to do with it
                modalTextArea.innerHTML = '';

                yesButton.disabled = true;

                helper.sendPost('/searchNovelByID', { novelID: Chapter.novelID, _csrf: props.csrf }, (response) => {

                    console.log(response);

                    const publishedChapters = [];

                    Object.keys(response.novel.chapters).forEach(chapter => {
                        if (chapter.includes('chapter-')) {
                            publishedChapters.push(chapter);
                        }
                    });

                    // this is where the magic happens!
                    const pubChapFunDiv = document.createElement('div');
                    pubChapFunDiv.style.border = 'ridge thin';
                    pubChapFunDiv.style.height = '350px';
                    pubChapFunDiv.style.overflowY = 'auto';

                    for (const chapter of publishedChapters) {

                        // chap option container

                        const chapOptionContainer = document.createElement('div');
                        chapOptionContainer.id = 'chap-option-container';
                        chapOptionContainer.setAttribute('data-selected', 'false');


                        // click
                        const chapOptionContainerClicked = () => {
                            let wasSelected = false;
                            if (chapOptionContainer.getAttribute('data-selected') === 'true') {
                                wasSelected = true;
                            }

                            // set every other container as not selected
                            pubChapFunDiv.querySelectorAll('#chap-option-container').forEach(node => {
                                //console.log(node);
                                node.setAttribute('data-selected', 'false');
                            });

                            let childSelected = false;
                            // check to see if any children of this container are selected
                            chapOptionContainer.childNodes.forEach(node => {
                                if (node.getAttribute('data-selected') === 'true') {
                                    childSelected = true;
                                }
                            });


                            // if it wasn't previously selected or a child is selected
                            if (!wasSelected || childSelected) {
                                // set this as selected
                                chapOptionContainer.setAttribute('data-selected', 'true');
                            }



                            //console.log(pubChapFunDiv);
                        };

                        //chapOptionContainer.onclick = chapOptionContainerClicked;


                        //insert before

                        const insertBeforeChap = document.createElement('span');
                        insertBeforeChap.id = 'chap-insert';
                        insertBeforeChap.setAttribute('insert', 'before');


                        const chapInsertBeforeIcon = document.createElement('i');
                        chapInsertBeforeIcon.className = 'fa-solid fa-arrow-up';

                        const chapInsertBeforeText = document.createElement('p');
                        chapInsertBeforeText.innerText = 'insert before';

                        insertBeforeChap.style.border = 'thin ridge';
                        insertBeforeChap.className = 'has-text-grey';

                        insertBeforeChap.style.display = 'flex';
                        insertBeforeChap.style.alignItems = 'center';
                        insertBeforeChap.style.gap = '10px';
                        insertBeforeChap.style.height = '30px';

                        insertBeforeChap.appendChild(chapInsertBeforeIcon);
                        insertBeforeChap.appendChild(chapInsertBeforeText);

                        // hide this
                        insertBeforeChap.style.visibility = 'hidden';
                        insertBeforeChap.style.display = 'none';
                        //insertBeforeChap.hidden = true;

                        const insertBeforeChangeEvent = () => {
                            //     //console.log('before changed');
                            if (insertBeforeChap.getAttribute('data-selected') === 'true') {
                                //console.log('set as selected');
                                // set as selected
                                insertBeforeChap.style.height = '40px';
                                insertBeforeChap.style.backgroundColor = '#62c462';
                                chapInsertBeforeText.style.fontSize = '20px';
                            } else if (chapOptionContainer.getAttribute('data-selected') === 'true') {
                                // set as container selected
                                insertBeforeChap.style.height = '40px';
                                insertBeforeChap.style.backgroundColor = '#ffc9c9';
                                chapInsertBeforeText.style.fontSize = '20px';
                            } else {
                                //console.log('set as unselected');
                                // set as unselected
                                insertBeforeChap.style.height = '30px';
                                insertBeforeChap.style.backgroundColor = '#ffffff';
                                chapInsertBeforeText.style.fontSize = '17px';
                            }
                        };

                        // mouse enter
                        insertBeforeChap.onmouseenter = () => {

                            // set as hovered
                            insertBeforeChap.style.height = '40px';
                            insertBeforeChap.style.backgroundColor = '#bbf0de';
                            insertBeforeChap.style.fontSize = '20px';
                        };

                        // mouse leave
                        insertBeforeChap.onmouseleave = () => {
                            // if this is selected
                            if (insertBeforeChap.getAttribute('data-selected') === 'true') {
                                // set as selected
                                insertBeforeChap.style.height = '40px';
                                insertBeforeChap.style.backgroundColor = '#62c462';
                                chapInsertBeforeText.style.fontSize = '20px';
                            } else if (chapOptionContainer.getAttribute('data-selected') === 'true') {
                                // set as container selected
                                insertBeforeChap.style.height = '40px';
                                insertBeforeChap.style.backgroundColor = '#ffc9c9';
                                chapInsertBeforeText.style.fontSize = '20px';
                            } else {
                                // set as unselected
                                insertBeforeChap.style.height = '30px';
                                insertBeforeChap.style.backgroundColor = '#ffffff';
                                chapInsertBeforeText.style.fontSize = '17px';
                            }
                        };
                        // click
                        insertBeforeChap.onclick = () => {
                            let wasSelected = false;
                            // if this was previously selected
                            if (insertBeforeChap.getAttribute('data-selected') === 'true') {
                                wasSelected = true;
                            }

                            // set everything else as not selected
                            pubChapFunDiv.querySelectorAll('#chap-option').forEach(node => {
                                node.setAttribute('data-selected', 'false');
                            });
                            pubChapFunDiv.querySelectorAll('#chap-insert').forEach(node => {
                                node.setAttribute('data-selected', 'false');
                            });

                            // if it wasn't selected
                            if (!wasSelected) {
                                // set this as selected
                                insertBeforeChap.setAttribute('data-selected', 'true');
                            }

                            chapOptionContainerClicked();

                            console.log('here');

                            callChangeEvents();
                        };

                        //insert after

                        const insertAfterChap = document.createElement('span');
                        insertAfterChap.id = 'chap-insert';
                        insertAfterChap.setAttribute('insert', 'after');

                        const chapInsertAfterIcon = document.createElement('i');
                        chapInsertAfterIcon.className = 'fa-solid fa-arrow-down';

                        const chapInsertAfterText = document.createElement('p');
                        chapInsertAfterText.innerText = 'insert After';

                        insertAfterChap.style.border = 'thin ridge';
                        insertAfterChap.className = 'has-text-grey';

                        insertAfterChap.style.display = 'flex';
                        insertAfterChap.style.alignItems = 'center';
                        insertAfterChap.style.gap = '10px';
                        insertAfterChap.style.height = '30px';

                        insertAfterChap.appendChild(chapInsertAfterIcon);
                        insertAfterChap.appendChild(chapInsertAfterText);

                        // hide this
                        insertAfterChap.style.visibility = 'hidden';
                        insertAfterChap.style.display = 'none';
                        //insertAfterChap.hidden = true;

                        const insertAfterChangeEvent = () => {
                            //console.log('after changed');
                            if (insertAfterChap.getAttribute('data-selected') === 'true') {
                                //console.log('set as selected');
                                // set as selected
                                insertAfterChap.style.height = '40px';
                                insertAfterChap.style.backgroundColor = '#62c462';
                                chapInsertAfterText.style.fontSize = '20px';
                            } else if (chapOptionContainer.getAttribute('data-selected') === 'true') {
                                // set as container selected
                                insertAfterChap.style.height = '40px';
                                insertAfterChap.style.backgroundColor = '#ffc9c9';
                                chapInsertAfterText.style.fontSize = '20px';
                            } else {
                                //console.log('set as unselected');
                                // set as unselected
                                insertAfterChap.style.height = '30px';
                                insertAfterChap.style.backgroundColor = '#ffffff';
                                chapInsertAfterText.style.fontSize = '17px';
                            }
                        };
                        insertAfterChap.onchange = insertAfterChangeEvent;

                        // mouse enter
                        insertAfterChap.onmouseenter = () => {

                            // set as hovered
                            insertAfterChap.style.height = '40px';
                            insertAfterChap.style.backgroundColor = '#bbf0de';
                            insertAfterChap.style.fontSize = '20px';
                        };
                        // mouse leave
                        insertAfterChap.onmouseleave = () => {
                            // if this is selected
                            if (insertAfterChap.getAttribute('data-selected') === 'true') {
                                // set as selected
                                insertAfterChap.style.height = '40px';
                                insertAfterChap.style.backgroundColor = '#62c462';
                                chapInsertAfterText.style.fontSize = '20px';
                            } else if (chapOptionContainer.getAttribute('data-selected') === 'true') {
                                // set as container selected
                                insertAfterChap.style.height = '40px';
                                insertAfterChap.style.backgroundColor = '#ffc9c9';
                                chapInsertAfterText.style.fontSize = '20px';
                            } else {
                                // set as unselected
                                insertAfterChap.style.height = '30px';
                                insertAfterChap.style.backgroundColor = '#ffffff';
                                chapInsertAfterText.style.fontSize = '17px';
                            }
                        };
                        // click
                        insertAfterChap.onclick = () => {
                            //console.log('insert after click');
                            let wasSelected = false;
                            // if this was previously selected
                            if (insertAfterChap.getAttribute('data-selected') === 'true') {
                                wasSelected = true;
                            }

                            // set everything else as not selected
                            pubChapFunDiv.querySelectorAll('#chap-option').forEach(node => {
                                node.setAttribute('data-selected', 'false');
                            });
                            pubChapFunDiv.querySelectorAll('#chap-insert').forEach(node => {
                                node.setAttribute('data-selected', 'false');
                            });

                            // if it wasn't selected
                            if (!wasSelected) {
                                // set this as selected
                                insertAfterChap.setAttribute('data-selected', 'true');
                            }

                            chapOptionContainerClicked();

                            callChangeEvents();
                        };

                        // chap option

                        const chapOption = document.createElement('span');
                        chapOption.id = 'chap-option';

                        const chapInsertIcon = document.createElement('i');
                        const chapOptionText = document.createElement('p');

                        chapOption.style.border = 'thin ridge';
                        chapOption.className = 'has-text-grey';

                        chapOption.style.display = 'flex';
                        chapOption.style.alignItems = 'center';
                        chapOption.style.gap = '10px';
                        chapOption.style.height = '30px';

                        // chapInsertIcon.className = 'fa-solid fa-arrow-left';
                        chapInsertIcon.className = 'fa-solid fa-repeat';

                        chapOptionText.innerText = chapter;
                        chapOptionText.style.fontSize = '17px';


                        const chapOptionChangeEvent = () => {
                            //console.log('option changed');
                            // if this is selected
                            if (chapOption.getAttribute('data-selected') === 'true') {
                                // set as selected
                                chapOption.style.height = '40px';
                                chapOption.style.backgroundColor = '#62c462';
                                chapOptionText.style.fontSize = '20px';
                            } else if (chapOption.parentElement.getAttribute('data-selected') === 'true') {
                                // set as container selected
                                chapOption.style.height = '40px';
                                chapOption.style.backgroundColor = '#ffc9c9';
                                chapOptionText.style.fontSize = '20px';
                            } else {
                                // set as unselected
                                chapOption.style.height = '30px';
                                chapOption.style.backgroundColor = '#ffffff';
                                chapOptionText.style.fontSize = '17px';
                            }
                        }
                        chapOption.onchange = chapOptionChangeEvent;

                        // mouse enter
                        chapOption.onmouseenter = () => {
                            //console.log('mouse enter chap option');

                            // set as hovered
                            chapOption.style.height = '40px';
                            chapOption.style.backgroundColor = '#bbf0de';
                            chapOptionText.style.fontSize = '20px';
                        };
                        // mouse leave
                        chapOption.onmouseleave = () => {
                            //console.log('mouse leave chap option');

                            // if this isn't selected
                            if (chapOption.getAttribute('data-selected') !== 'true') {

                                // this isn't selected, but the container is selected
                                if (chapOptionContainer.getAttribute('data-selected') === 'true') {
                                    //console.log('container selected only');
                                    // set as container selected
                                    chapOption.style.height = '40px';
                                    chapOption.style.backgroundColor = '#ffc9c9';
                                    chapOptionText.style.fontSize = '20px';
                                } else {
                                    //console.log('nothing selected');
                                    // set as unselected
                                    chapOption.style.height = '30px';
                                    chapOption.style.backgroundColor = '#ffffff';
                                    chapOptionText.style.fontSize = '17px';
                                }
                            } else {
                                //console.log('chap option is selected');
                                // set as selected
                                chapOption.style.height = '40px';
                                chapOption.style.backgroundColor = '#62c462';
                                chapOptionText.style.fontSize = '20px';
                            }
                        };
                        // click
                        chapOption.onclick = () => {
                            let wasSelected = false;
                            if (chapOption.getAttribute('data-selected') === 'true') {
                                wasSelected = true;
                            }

                            //console.log(pubChapFunDiv);

                            // set everything as not selected
                            pubChapFunDiv.querySelectorAll('#chap-option').forEach(node => {
                                //console.log(node);
                                node.setAttribute('data-selected', 'false');
                                node.style.height = '30px';
                                node.style.backgroundColor = '#ffffff';
                                node.style.fontSize = '17px';
                            });
                            // hide all chap inserts
                            pubChapFunDiv.querySelectorAll('#chap-insert').forEach(node => {
                                node.setAttribute('data-selected', 'false');
                                // hide theses
                                node.style.visibility = 'hidden';
                                node.style.display = 'none';
                            });

                            // if it wasn't selected before
                            if (!wasSelected) {
                                //console.log('selected');

                                // set this as selected
                                chapOption.setAttribute('data-selected', 'true');

                                // show the inserts corresponding to this chapter
                                insertBeforeChap.style.visibility = 'visible';
                                insertAfterChap.style.visibility = 'visible';
                                insertBeforeChap.style.display = 'flex';
                                insertAfterChap.style.display = 'flex';

                                // set the yes button as selectable
                                yesButton.disabled = false;
                            } else {
                                //console.log('deselected');
                                //console.log(chapOption.getAttribute('data-selected'));
                                // set the yes button as not selectable
                                yesButton.disabled = true;
                            }

                            chapOptionContainerClicked();

                            callChangeEvents();
                        };

                        const callChangeEvents = () => {
                            insertAfterChangeEvent();
                            insertBeforeChangeEvent();
                            chapOptionChangeEvent();
                        }


                        chapOption.appendChild(chapInsertIcon);
                        chapOption.appendChild(chapOptionText);

                        chapOptionContainer.appendChild(insertBeforeChap);
                        chapOptionContainer.appendChild(chapOption);
                        chapOptionContainer.appendChild(insertAfterChap);

                        pubChapFunDiv.appendChild(chapOptionContainer);
                    }

                    console.log(pubChapFunDiv);

                    if (pubChapFunDiv.innerText === '') {
                        const pubChapNoChapters = document.createElement('p');
                        pubChapNoChapters.innerText = 'This is the first chapter!';
                        pubChapFunDiv.appendChild(pubChapNoChapters);
                    }

                    const pubChapAsLatestButton = document.createElement('a');
                    pubChapAsLatestButton.className = 'button is-link';
                    pubChapAsLatestButton.innerText = "Publish As latest Chapter"
                    pubChapAsLatestButton.style.marginBottom = '10px';
                    pubChapAsLatestButton.addEventListener('click', () => {
                        handler({ chapterNumber: publishedChapters.length, mode: 'add-last' });
                    });

                    const pubChapFunExplaination = document.createElement('p');
                    pubChapFunExplaination.innerText = "Or, Choose where to add it: ";
                    pubChapFunExplaination.className = 'subtitle';
                    pubChapFunExplaination.style.marginTop = "10px";

                    modalTextArea.appendChild(pubChapAsLatestButton);
                    modalTextArea.appendChild(pubChapFunExplaination);
                    modalTextArea.appendChild(pubChapFunDiv);

                    yesButton.style.visibility = 'visible';
                    yesButton.innerText = 'Publish';
                    const clickYes = () => {
                        //console.log('clicked yes');
                        // figure out if we clicked a chapter, or if we inserted it before or after a chapter

                        pubChapFunDiv.querySelectorAll('span').forEach(span => {
                            if (span.getAttribute('data-selected') === 'true') {
                                const chapterName = span.parentElement.querySelector('#chap-option').querySelector('p').innerText;
                                // this is the selected span
                                if (span.id === 'chap-option') {
                                    // replace a chapter
                                    handler({ chapter: chapterName, mode: 'replace' });
                                } else if (span.id === 'chap-insert') {
                                    // insert the chapter
                                    if (span.getAttribute('insert') == 'before') {
                                        handler({ chapter: chapterName, mode: 'insert-before' });
                                    } else if (span.getAttribute('insert') == 'after') {
                                        handler({ chapter: chapterName, mode: 'insert-after' });
                                    }
                                }
                            }
                        })

                        //handler({ chapterNumber: publishedChapters.length, mode: 'addLast' });
                    }
                    if (modalYesListener) {
                        yesButton.removeEventListener('click', modalYesListener);
                    }
                    modalYesListener = clickYes;
                    yesButton.addEventListener('click', clickYes);

                    cancelButton.innerText = 'Cancel';

                    modalTitle.innerText = 'Publish Chapter';

                    modal.classList.add('is-active');
                });
                break;
            case "preview":
                modalTextArea.innerHTML = '';

                const previewContent = document.createElement('p');

                previewContent.innerText = Chapter.content;

                modalTextArea.appendChild(previewContent);

                modalTextArea.value = Chapter.content;
                modalTextArea.rows = "1";
                yesButton.style.visibility = 'hidden';
                cancelButton.innerText = 'Cancel';
                modalTitle.innerText = Chapter.title;

                modal.classList.add('is-active');
                break;
            default:
                break;
        }

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

    return (
        <div>

            <div id="modal" className="modal" style={{ zIndex: 1001 }}>
                <div className="modal-background" onClick={closeAllModals}></div>
                <div className="modal-card">
                    <header className="modal-card-head">
                        <p id="modal-title" className="modal-card-title"></p>
                        <button className="delete" aria-label="close" onClick={closeModal}></button>
                    </header>
                    <section className="modal-card-body">
                        <div id='modal-text-area'></div>
                    </section>
                    <footer className="modal-card-foot">
                        <button id='modal-yes-button' className="button is-success" onClick={closeModal}>Yes</button>
                        <button id='modal-cancel-button' className="button" onClick={closeModal}>Cancel</button>
                    </footer>
                </div>
            </div>

            <div id='editor-head' style={{ position: 'sticky', top: '0px', backgroundColor: 'white', border: 'thin ridge', zIndex: 1000 }}>
                <div style={{ height: 65, width: '100vw', display: 'flex', flexFlow: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: '30px' }}>
                    <div>
                        <a className="button is-white" href="/editNovel"><i className="fa-solid fa-arrow-left" style={{ padding: '0 10 0 0' }}></i>Back</a>
                    </div>
                    <div style={{ display: 'flex', flexFlow: 'row', gap: 10 }}>
                        <a id='preview-button' className="button is-link" onClick={previewChapter}><i className="fa-solid fa-eye" style={{ padding: '0 10 0 0' }}></i>Preview</a>
                        <a id='publish-button' className="button is-primary" onClick={publishChapter}><i id='publish-icon' className="fa-solid fa-check" style={{ padding: '0 10 0 0' }}></i>Publish</a>

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

                    {/* <span className='dropdown' onClick={(e) => { e.currentTarget.classList.toggle('is-active') }}>
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
                    </span> */}

                    {/* <span style={{ display: 'flex', border: 'ridge thin' }}>
                        <a className='button is-white' onClick={decreaseTextSize} style={{ height: '38px' }}><i className="fa-solid fa-minus" /></a>
                        <input id="text-size" className='input' type="number" name="text-size" defaultValue='20' min="0" max="100" onBlur={updateTextSize} style={{ width: '70px', height: '38px' }} />
                        <a className='button is-white' onClick={increaseTextSize} style={{ height: '38px' }}><i className="fa-solid fa-plus" /></a>
                    </span> */}

                    {/* <span style={{ textAlign: 'center' }}>
                        <a id='left-align-button' className='button is-dark' onClick={setLeftAlign}><i className="fa-solid fa-align-left"></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a id='center-align-button' className='button is-outlined' onClick={setCenterAlign}><i className="fa-solid fa-align-center"></i></a>
                    </span>

                    <span style={{ textAlign: 'center' }}>
                        <a id='right-align-button' className='button is-outlined' onClick={setRightAlign}><i className="fa-solid fa-align-right"></i></a>
                    </span> */}

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

    const publishButton = document.getElementById('publish-button');
    const publishIcon = document.getElementById('publish-icon');
    const publishText = document.createTextNode('Publish');

    publishButton.innerHTML = '';

    if (chapter.published) {
        publishText.textContent = 'Unpublish';

        publishButton.classList.add('is-danger');
        publishButton.classList.remove('is-primary');

        publishIcon.className = "fa-solid fa-x";
    } else {
        publishText.textContent = 'Publish';

        publishButton.classList.remove('is-danger');
        publishButton.classList.add('is-primary');

        publishIcon.className = "fa-solid fa-check";
    }
    publishButton.appendChild(publishIcon);
    publishButton.appendChild(publishText);

    const chapterContent = document.getElementById('editable-chapter-content');
    chapterContent.innerHTML = chapter.content;

    initialLoad = false;
};

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    // console.log('init editChapter');
    // console.log(data);

    const chapterID = localStorage.getItem('partchment-editorChapterID');
    //console.log(novelID);
    if (!chapterID) {
        console.log('No Chapter Selected');
        window.location.assign('/editNovel');
        return;
    }

    helper.sendPost('/searchChapterByID', { chapterID, _csrf: data.csrfToken }, (chapterData) => {
        console.log('chapterData');
        console.log(chapterData);

        if (chapterData.error === 'No Chapter Found') {
            window.location.assign('/editNovel');
            return;
        }

        ReactDOM.render(<EditChapterWindow csrf={data.csrfToken} chapter={chapterData.chapter} />,
            document.getElementById('edit-chapter-content')
        );
        loadChapterInfo(chapterData.chapter);
    });
};

module.exports = {
    init,
}