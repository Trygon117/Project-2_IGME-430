
const NotFoundWindow = (props) => {
    return (
        <div style={{ width: '100vw', margin: 'auto' }}>
            <span style={{ margin: 'auto', alignSelf: 'center' }}>
                <h1 className="title">Page Not Found.</h1>
            </span>
        </div>
    );
}


const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log(data);

    ReactDOM.render(<NotFoundWindow csrf={data.csrfToken} />,
        document.getElementById('not-found-content'));

};

module.exports = {
    init,
}