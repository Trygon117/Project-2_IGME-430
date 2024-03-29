const create = require('./create.jsx');
const editNovel = require('./editNovel.jsx')
const editChapter = require('./editChapter.jsx')
const home = require('./home.jsx');
const library = require('./library.jsx');
const login = require('./login.jsx');
const navbar = require('./navbar.jsx');
const profile = require('./profile.jsx');
const readNovel = require('./readNovel.jsx');
const viewNovel = require('./viewNovel.jsx');
const notFound = require('./notFound.jsx');
const helper = require('./helper.js');

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    if (document.getElementById('navbar') != null) {
        ReactDOM.render(
            <navbar.Navbar csrf={data.csrfToken} />,
            document.getElementById('navbar')
        );

        const passFunctions = {
            renderLoginWindow: login.renderLoginWindow,
            renderSignUpWindow: login.renderSignUpWindow,
        };

        navbar.initializeNavbar(passFunctions, data.csrfToken);
    }

    let page = document.querySelector('header').getAttribute('data-current-page');

    switch (page) {
        case 'create':
            create.init();
            break;
        case 'editNovel':
            editNovel.init();
            break;
        case 'editChapter':
            editChapter.init();
            break;
        case 'home':
            home.init();
            break;
        case 'library':
            library.init();
            break;
        case 'login':
            await login.init();
            if (localStorage.getItem('partchment-LoadSignUp') === 'true') {
                console.log("controller login");
                console.log(data);
                login.renderSignUpWindow({ _csrf: data.csrfToken });
                window.localStorage.setItem('partchment-LoadSignUp', false);
            }
            navbar.updateSelectedPage();
            break;
        case 'profile':
            profile.init();
            break;
        case 'viewNovel':
            viewNovel.init();
            break;
        case 'readNovel':
            readNovel.init();
            break;
        case 'notFound':
            notFound.init();
            break;
        default:
            console.log(`unknown page: ${page}`);
    }
};

window.onload = init;