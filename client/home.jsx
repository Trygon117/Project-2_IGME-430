const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

};

module.exports = {
    init,
}