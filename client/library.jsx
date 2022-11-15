const navbar = require('./navbar.jsx');

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    ReactDOM.render(
        <navbar.Navbar csrf={data.csrfToken} />,
        document.getElementById('navbar')
    );

    const passFunctions = {

    }
    navbar.initializeNavbar(passFunctions, data.csrfToken);
};

module.exports = {
    init,
}