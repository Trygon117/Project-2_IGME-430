const helper = require('./helper.js');

const handleDomo = (e) => {
    e.preventDefault();
    helper.hideError();

    const name = e.target.querySelector('#domoName').value;
    const age = e.target.querySelector('#domoAge').value;
    const obsession = e.target.querySelector('#domoObsession').value;
    const _csrf = e.target.querySelector('#_csrf').value;

    if (!name || !age || !obsession) {
        helper.handleError('All fields are required');
        return false;
    }

    helper.sendPost(e.target.action, { name, age, obsession, _csrf }, loadDomosFromServer);

    return false;
};

const DomoForm = (props) => {
    return (
        <form id="domoForm"
            onSubmit={handleDomo}
            name='domoForm'
            action="/maker"
            method='POST'
            className='domoForm'
        >
            <label htmlFor='name'>Name: </label>
            <input id="domoName" type="text" name='name' placeholder='Domo Name' />
            <label htmlFor='obsession'>Obsession: </label>
            <input id='domoObsession' type="text" name='obsession' placeholder='Domo Obsession' />
            <label htmlFor='age'>Age: </label>
            <input id='domoAge' type='number' min='0' name='age' />
            <input id='_csrf' type='hidden' name='_csrf' value={props.csrf} />
            <input className='makeDomoSubmit' type='submit' value='Make Domo' />
        </form>
    );
};

const DomoList = (props) => {
    if (props.domos.length === 0) {
        return (
            <div className='domoList'>
                <h3 className='emptyDomo'>No Domos Yet!</h3>
            </div>
        );
    }

    const domoNodes = props.domos.map(domo => {
        const deleteThisDomo = () => {
            const _csrf = props.csrf;
            helper.sendPost('/deleteDomo', { _id: domo._id, _csrf }, loadDomosFromServer);
        }

        return (
            <div key={domo._id} className='domo'>
                <img src='/assets/img/domoface.jpeg' alt='domoface' className='domoFace' />
                <h3 className='domoName'>Name: {domo.name}</h3>
                <h3 className='domoAge'>Age: {domo.age}</h3>
                <h3 className='domoObsession'>Obsession: {domo.obsession}</h3>
                <button className='domoDelete' onClick={deleteThisDomo}>X</button>
            </div>
        );
    });

    return (
        <div className='domoList'>
            {domoNodes}
        </div>
    );
}

const loadDomosFromServer = async (props) => {
    const response = await fetch('/getDomos');
    const data = await response.json();
    ReactDOM.render(
        <DomoList domos={data.domos} csrf={props.csrfToken} />,
        document.getElementById('domos')
    );
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    ReactDOM.render(
        <DomoForm csrf={data.csrfToken} />,
        document.getElementById('makeDomo')
    );

    ReactDOM.render(
        <DomoList domos={[]} csrf={data.csrfToken} />,
        document.getElementById('domos')
    );

    loadDomosFromServer(data);
}

window.onload = init;