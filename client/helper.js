/* Sends post requests to the server using fetch. Will look for various
   entries in the response JSON object, and will handle them appropriately.
*/
const sendPost = async (url, data, handler) => {
    console.log(url);
    //console.log(JSON.stringify(data));
    if (!data._csrf) {
        console.log("Missing CSRF Token, request not sent");
        return;
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    handleResponse(result, data, handler);
};

const sendMultipartPost = async (url, data, handler) => {
    const response = await fetch(url, {
        method: 'POST',
        body: data.formData,
    });

    const result = await response.json();


    handleResponse(result, data, handler);
}

const handleResponse = (result, data, handler) => {
    if (result.error) {
        console.log(`error: ${result.error}`);
    }

    if (result.redirect) {
        window.location = result.redirect;
    }

    if (handler) {
        result.csrfToken = data._csrf;
        handler(result);
    }
}

// https://htmldom.dev/check-if-an-element-is-a-descendant-of-another/
// Check if child is a descendant of parent
const isDescendent = (parent, child) => {
    let node = child.parentNode;
    while (node) {
        if (node === parent) {
            return true;
        }

        // Traverse up to the parent
        node = node.parentNode;
    }

    // Go up until the root but couldn't find the `parent`
    return false;
}

const publishChapter = (mode, data, handler) => {
    const body = {};
    switch (mode) {
        case 'add-last':
            body.chapterID = data.chapter._id;
            body.novelID = data.chapter.novelID;
            body.chapter = data.chapter.chapter;
            body.mode = mode;
            break;
        case 'replace':
        // all do the same
        case 'insert-before':
        // all do the same
        case 'insert-after':
            body.chapterID = data.chapter._id;
            body.novelID = data.chapter.novelID;
            body.chapter = data.chapter.chapter;
            body.mode = mode;
            body.referenceChapter = data.referenceChapter; // litterally just the .chapter
            break;
        case 'unpublish':
            body.chapterID = data.chapter._id;
            body.novelID = data.chapter.novelID;
            body.chapter = data.chapter.chapter;
            body.mode = mode;
            break;
        default:
            handler('No Mode');
            break;

    }
    body._csrf = data._csrf;
    sendPost('/publishChapter', body, handler);
}

module.exports = {
    sendPost,
    sendMultipartPost,
    isDescendent,
    publishChapter,
}