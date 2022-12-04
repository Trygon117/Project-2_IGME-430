
const HomeWindow = (props) => {
    return (
        <div>
            <h1>Title</h1>
        </div>
    );
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    console.log(data);

    ReactDOM.render(<HomeWindow csrf={data.csrfToken} />,
        document.getElementById('home-content')
    );

};

module.exports = {
    init,
}