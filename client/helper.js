/* Sends post requests to the server using fetch. Will look for various
   entries in the response JSON object, and will handle them appropriately.
*/
const sendPost = async (url, data, handler) => {
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
        console.log(result.error);
        //return;
    }

    if (result.redirect) {
        window.location = result.redirect;
    }

    if (handler) {
        result.csrfToken = data._csrf;
        handler(result);
    }
}

module.exports = {
    sendPost,
    sendMultipartPost,
}